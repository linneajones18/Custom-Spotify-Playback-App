import React, { useState, useEffect } from 'react';

const track = {
    name: "",
    album: {
        images: [
            { url: "" }
        ]
    },
    artists: [
        { name: "" }
    ]
}

function WebPlayback(props) {

    const [player, setPlayer] = useState(undefined);
    const [is_paused, setPaused] = useState(false);
    const [is_active, setActive] = useState(false);
    const [current_track, setTrack] = useState(track);


    useEffect(() => {

        // Load the Spotify Web Playback SDK
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);

        // Execute once the SDK has loaded
        window.onSpotifyWebPlaybackSDKReady = () => {

            const player = new window.Spotify.Player({
                name: 'Web Playback SDK',

                getOAuthToken: cb => {
                    cb(props.token);
                },

                volume: 0.5
            });

            // Store the player instance
            setPlayer(player);

            // Listen for the player becoming ready
            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
            });

            // Listen for the player going offline
            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            // Listen for changes in playback
            player.addListener('player_state_changed', state => {
                console.log('Playback state changed:', state);
            });

            player.addListener('player_state_changed', ( state => {

                if (!state) {
                    return;
                }

                setTrack(state.track_window.current_track);
                setPaused(state.paused);


                player.getCurrentState().then( state => { 
                    (!state)? setActive(false) : setActive(true) 
                });

            }));


            // Connect to Spotify
            player.connect();
        };

        // Cleanup when the component unmounts
        return () => {
            if (player) {
                player.disconnect();
            }

            window.onSpotifyWebPlaybackSDKReady = null;
            script.remove();
        };

    }, []);

    return (
        <>
            <div className="container">
                <div className="main-wrapper">
                    <img src={current_track.album.images[0].url} 
                        className="now-playing__cover" alt="" />

                    <div className="now-playing__side">
                        <div className="now-playing__name">{
                                    current_track.name
                                    }
                        </div>

                        <div className="now-playing__artist">{
                                    current_track.artists[0].name
                        }</div>
                    </div>
                    <button className="btn-spotify" onClick={() => { player.previousTrack() }} >
                        &lt;&lt;
                    </button>

                    <button className="btn-spotify" onClick={() => { player.togglePlay() }} >
                        { is_paused ? "PLAY" : "PAUSE" }
                    </button>

                    <button className="btn-spotify" onClick={() => { player.nextTrack() }} >
                        &gt;&gt;
                    </button>

                </div>
            </div>
        </>
    )
}

export default WebPlayback;