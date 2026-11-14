import React, { useState, useEffect, useRef } from 'react';
import './css/styles.css';
import { getPaletteSync } from 'colorthief';

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

const images = require.context(
    '../public/record-photos',
    false,
    /\.(png|jpe?g|gif|webp)$/
);

const recordPhotos = images.keys().map(images);

function loadImg(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.crossOrigin = "Anonymous";

        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image at url: ${url}`))

        img.src = url;
    });
}   

function WebPlayback(props) {

    const [player, setPlayer] = useState(undefined);
    const [is_paused, setPaused] = useState(false);
    const [is_active, setActive] = useState(false);
    const [current_track, setTrack] = useState(track);

    const [palette, setPalette] = useState([]);
    const record = useRef(null);
    const playerRef = useRef(null);
    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        const initializePlayer = () => {
            const spotifyPlayer = new window.Spotify.Player({
                name: 'Spotify Display',
                getOAuthToken: cb => {
                    cb(props.token);
                },
                volume: 0.5
            });

            // Save the actual instance
            playerRef.current = spotifyPlayer;
            setPlayer(spotifyPlayer);

            spotifyPlayer.addListener('ready', ({ device_id }) => {

                fetch('https://api.spotify.com/v1/me/player', {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${props.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        device_ids: [device_id],
                        play: false
                    })
                })
                .catch(error => console.error('Transfer error:', error));
            });

            spotifyPlayer.addListener('not_ready', ({ device_id }) => {
                console.log('Device disconnected:', device_id);
            });

            spotifyPlayer.addListener('initialization_error', ({ message }) => {
                console.error('Initialization error:', message);
            });

            spotifyPlayer.addListener('authentication_error', ({ message }) => {
                console.error('Authentication error:', message);
            });

            spotifyPlayer.addListener('account_error', ({ message }) => {
                console.error('Account error:', message);
            });

            spotifyPlayer.addListener('playback_error', ({ message }) => {
                console.error('Playback error:', message);
            });

            spotifyPlayer.addListener('player_state_changed', (state) => {
                if (!state) {
                    setActive(false);
                    return;
                }

                if (record.current) {
                    record.current.classList.toggle('playing', !state.paused);
                }

                setTrack(state.track_window.current_track);
                setPaused(state.paused);
                setActive(true);
            });

            spotifyPlayer.connect();
        };

        window.onSpotifyWebPlaybackSDKReady = initializePlayer;

        document.body.appendChild(script);

        return () => {
            window.onSpotifyWebPlaybackSDKReady = null;

            if (playerRef.current) {
                playerRef.current.disconnect();
                playerRef.current = null;
            }

            script.remove();
        };
    }, [props.token]);

    useEffect(() => {

        async function getColors() {
            try {
                const albumImg = await loadImg(current_track.album.images[0].url);
                const palette = getPaletteSync(albumImg, { colorCount: 2 });
                setPalette(palette);
            } catch(error) {
                console.error(error);
            }
        }

        if(current_track.album.images[0].url) {
            getColors();
        }
        else {
            console.log("No available image url");
        }
    }, [current_track]);

    useEffect(() => {
        if (current_track) {
            setImageIndex(prevIndex => (prevIndex + 1) % recordPhotos.length);
        }
    }, [current_track?.id]);

    
    if(is_active) {
        return (
            <>
                {/* style had to be in-line here to use backgroundimage - everything else is in styles.css */}
                <div id="playback-container" 
                    style= {{backgroundImage: `url(${current_track?.album?.images?.[0]?.url || `radial-gradient(${palette[1]} 25%, ${palette[0]})`})`}}                 
                >   <div id="background-blur">
                        <div id="player-container">
                            <div id="custom-record-graphic" ref={record}>
                                <img id="record-disc" src='/record2.svg' alt="record disc"/>
                                <img id="record-image" src={recordPhotos[imageIndex]} alt="Linnea and Aidan"/>
                            </div>

                            <div id="button-container">
                                <button className="playback-btn" onClick={() => { player.previousTrack() }} >
                                    <p>⏮</p>
                                </button>

                                <button className="playback-btn" onClick={() => {playerRef.current?.togglePlay().catch(error => console.error("Toggle error ", error))}} >
                                    <p>{ is_paused ? "▶" : "⏸" }</p>
                                </button>

                                <button className="playback-btn" onClick={() => { player.nextTrack() }} >
                                    <p>⏭</p>
                                </button>
                            </div>
                        </div>  
                    </div>

                </div>
            </>
        )
    }

    else {
        return (
            <div id="waiting-container">
            <h1>Connect your device, honey.</h1>
            </div>
        )
    }
}

export default WebPlayback;