const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

const port = 5000

dotenv.config()

var spotify_client_id = process.env.SPOTIFY_CLIENT_ID
var spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET

let access_token = null;

var app = express();

app.use(express.static(path.join(__dirname, '../build')));

app.get('/auth/callback', async (req, res) => {

    const code = req.query.code;

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(
                    spotify_client_id + ':' + spotify_client_secret
                ).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code: code,
                redirect_uri: 'http://127.0.0.1:3000/auth/callback',
                grant_type: 'authorization_code'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Spotify token error:', data);
            return res.status(response.status).json(data);
        }
        access_token = data.access_token;

        access_token = data.access_token;

        res.redirect('/');
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('Authentication failed');
    }
});

app.get('/auth/login', (req, res) => {

    var scope = "streaming \
                user-read-email \
                user-read-private"

    var state = generateRandomString(16);

    var auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: spotify_client_id,
    scope: scope,
    redirect_uri: "http://127.0.0.1:3000/auth/callback",
    state: state
    })

    res.redirect('https://accounts.spotify.com/authorize/?' + auth_query_parameters.toString());
})

app.listen(port, () => {
  console.log(`Listening at http://127.0.0.1:${port}`)
})

var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.get('/auth/token', (req, res) => {
  res.json(
     {
        access_token: access_token
     })
})


