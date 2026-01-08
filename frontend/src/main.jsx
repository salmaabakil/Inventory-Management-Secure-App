import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from 'react-oidc-context'

const oidcConfig = {
    authority: "http://localhost:8080/realms/ecommerce",
    client_id: "frontend",
    redirect_uri: window.location.origin,
    onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider {...oidcConfig}>
            <App />
        </AuthProvider>
    </React.StrictMode>,
)
