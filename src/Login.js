import React from 'react';
import './css/login.css';

function Login() {
    return (
        <div id="login-container">
            <header className="App-header">
                <button id="login-btn" onClick={() => window.location.href = '/auth/login'}>Login</button>
            </header>
        </div>
    );
}

export default Login;
