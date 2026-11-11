import React, { useState, useEffect } from 'react';
import './styles.css';

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

    // get random colors for background gradient
    // return getHexColorFromUrl(imageUrl, targetX, targetY);

    const albumURL = current_track.album.images[0];
    const albumImg = new Image();
    albumImg.src = albumURL;

    albumImg.onload = () => {
        const width = albumImg.width;
        const height = albumImg.height;
    }

    const pixels = [];

    // get 5 random pixels
    const pixel1 = toHex(ctx.getImageData(canvas.width / 4, canvas.height / 4, 1, 1).data);
    const pixel2 = toHex(ctx.getImageData(canvas.width / 4, canvas.height / 4 * 3, 1, 1).data);
    const pixel3 = toHex(ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data);
    const pixel4 = toHex(ctx.getImageData(canvas.width / 4 * 3, canvas.height / 4, 1, 1).data);
    const pixel5 = toHex(ctx.getImageData(canvas.width / 4 * 3, canvas.height / 4 * 3, 1, 1).data);

    return (
        <>
            {/* style had to be in-line here to use backgroundimage - everything else is in styles.css */}
            <div id="player-container" style={{backgroundImage: `radialGradient(${pixel1}, ${pixel2}, ${pixel3}, ${pixel4}, ${pixel5})`}}>
                <div className="record">
                    <img src='/record.svg' alt="record disc"/>
                    <img src='/us.jpg' alt="Linnea and Aidan"/>
                </div>

                <div id="button-container">
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

            {/* <div className="container">
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

                </div>
            </div> */}
        </>
    )
}

export default WebPlayback;