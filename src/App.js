import React, { useState, useEffect } from 'react';
import WebPlayback from './WebPlayback';
import Login from './Login'

function App() {

  const [token, setToken] = useState('');

  useEffect(() => {

    async function getToken() {
      try {
        const response = await fetch('/auth/token');
        const json = await response.json();
        setToken(json.access_token);
      } catch(error) {
        console.error("Error retrieving Spotify token.", error);
      }
    }

    getToken();

  }, []);

  // displays the login page if not logged in, otherwise displays webplayback page
  return (
    <>
        { !token ? <Login/> : <WebPlayback token={token} /> }
    </>
  );
}

export default App;
