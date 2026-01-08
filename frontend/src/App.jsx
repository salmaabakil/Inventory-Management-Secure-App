import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import Navbar from './components/Navbar';
import Products from './pages/Products';
import Orders from './pages/Orders';

function App() {
    const auth = useAuth();

    if (auth.isLoading) {
        return <div className="container">Loading authentication...</div>;
    }

    if (auth.error) {
        return <div className="container">Oops... {auth.error.message}</div>;
    }

    if (!auth.isAuthenticated) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
                <h1>Bienvenue sur Secure Ecommerce</h1>
                <p>Veuillez vous connecter pour accéder au catalogue.</p>
                <button className="btn" onClick={() => auth.signinRedirect()}>Se connecter avec Keycloak</button>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Navbar />
            <div className="container">
                <Routes>
                    <Route path="/" element={<Navigate to="/products" />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/orders" element={<Orders />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
