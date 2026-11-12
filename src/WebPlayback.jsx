import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
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
            player.addListener('player_state_changed', ( state => {
                // console.log('Playback state changed:', state);
                console.log("Paused:", state.paused);   
                if (!state) {
                    return;
                }

 
                if(!state.paused) {
                    console.log("hello there");
                    record.current.classList.add('playing');
                }
                else {
                    record.current.classList.remove('playing');
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

    // get random colors for background gradient


    var paletteString = "";
    palette.forEach(color => {
        paletteString += color + ", ";
    });

    paletteString = paletteString.slice(0, -2);
    

    return (
        <>
            {/* style had to be in-line here to use backgroundimage - everything else is in styles.css */}
            <div id="root-container" 
                // style={{backgroundImage: `radial-gradient(${palette[1]} 25%, ${palette[0]})`}}
                style= {{backgroundImage: `url(${current_track?.album?.images?.[0]?.url || `radial-gradient(${palette[1]} 25%, ${palette[0]})`})`}}                 
            >   <div id="background-blur">
                    <div id="player-container">
                        <div id="custom-record-graphic" ref={record}>
                            <img id="record-disc" src='/record2.svg' alt="record disc"/>
                            <img id="record-image" src='/us.jpg' alt="Linnea and Aidan"/>
                        </div>

                        <div id="button-container">
                            <button className="traverse btn" onClick={() => { player.previousTrack() }} >
                                <p>⏮</p>
                            </button>

                            <button id="play-pause-button" className='btn' onClick={() => { player.togglePlay() }} >
                                <p>{ is_paused ? "▶" : "⏸" }</p>
                            </button>

                            <button className="traverse btn" onClick={() => { player.nextTrack() }} >
                                <p>⏭</p>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </>
    )
}

export default WebPlayback;