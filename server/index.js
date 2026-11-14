
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const PORT = process.env.PORT || 5000;

const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI ||
    'http://127.0.0.1:3000/auth/callback';

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;

// Supabase connection
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            persistSession: false
        }
    }
);

let access_token = null;
let token_expiration = 0;

const app = express();

app.use(express.static(path.join(__dirname, '../build')));


// Get a valid Spotify access token
async function getValidAccessToken() {

    // Reuse existing token if it hasn't expired
    if (access_token && Date.now() < token_expiration - 60000) {
        return access_token;
    }

    // Retrieve refresh token from Supabase
    const { data, error } = await supabase
        .from('spotify_tokens')
        .select('refresh_token')
        .eq('id', 1)
        .single();

    if (error || !data) {
        console.error('Could not retrieve refresh token:', error);
        throw new Error('No saved Spotify refresh token');
    }

    const response = await fetch(
        'https://accounts.spotify.com/api/token',
        {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(
                    spotify_client_id + ':' + spotify_client_secret
                ).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: data.refresh_token
            })
        }
    );

    const newData = await response.json();

    if (!response.ok) {
        console.error('Spotify refresh error:', newData);
        throw new Error('Could not refresh Spotify access token');
    }

    access_token = newData.access_token;

    token_expiration = Date.now() + (newData.expires_in * 1000);

    // Spotify may return a replacement refresh token
    if (newData.refresh_token) {
        const { error: updateError } = await supabase
            .from('spotify_tokens')
            .update({
                refresh_token: newData.refresh_token,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1);

        if (updateError) {
            console.error('Could not update refresh token:', updateError);
            throw new Error('Could not save replacement refresh token');
        }
    }

    return access_token;
}


// Spotify callback
app.get('/auth/callback', async (req, res) => {

    const code = req.query.code;

    try {
        const response = await fetch(
            'https://accounts.spotify.com/api/token',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(
                        spotify_client_id + ':' + spotify_client_secret
                    ).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    grant_type: 'authorization_code'
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Spotify token error:', data);
            return res.status(response.status).json(data);
        }

        access_token = data.access_token;

        token_expiration = Date.now() + (data.expires_in * 1000);

        // Save refresh token in Supabase
        const { error } = await supabase
            .from('spotify_tokens')
            .upsert({
                id: 1,
                refresh_token: data.refresh_token,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Supabase save error:', error);
            return res.status(500).send('Could not save Spotify refresh token');
        }

        console.log('Spotify refresh token saved successfully');

        res.redirect('/');

    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('Authentication failed');
    }
});


// Spotify login
app.get('/auth/login', (req, res) => {

    const scope = "streaming user-read-email user-read-private";

    const state = generateRandomString(16);

    const auth_query_parameters = new URLSearchParams({
        response_type: "code",
        client_id: spotify_client_id,
        scope: scope,
        redirect_uri: REDIRECT_URI,
        state: state
    });

    res.redirect(
        'https://accounts.spotify.com/authorize/?' +
        auth_query_parameters.toString()
    );
});


// Generate random state
function generateRandomString(length) {
    let text = '';
    const possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(
            Math.floor(Math.random() * possible.length)
        );
    }

    return text;
}


// Get access token for React
app.get('/auth/token', async (req, res) => {

    try {
        const token = await getValidAccessToken();

        res.json({
            access_token: token
        });

    } catch (error) {
        console.error('Token retrieval error:', error);

        res.status(401).json({
            error: 'Could not retrieve Spotify access token'
        });
    }
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
});
