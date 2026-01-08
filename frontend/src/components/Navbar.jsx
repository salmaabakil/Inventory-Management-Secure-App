import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

export default function Navbar() {
    const auth = useAuth();

    // Helper to decode Access Token
    function parseJwt(token) {
        if (!token) return {};
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }

    const getRoles = (auth) => {
        try {
            const decoded = parseJwt(auth.user?.access_token);
            const realmRoles = decoded?.realm_access?.roles || [];
            const resourceAccess = decoded?.resource_access || {};
            const clientRoles = Object.values(resourceAccess).flatMap(r => r.roles || []);
            return [...realmRoles, ...clientRoles];
        } catch (e) {
            return [];
        }
    };

    const roles = getRoles(auth);

    // Debug logic for the user
    console.log("All Detected Roles (Access Token):", roles);

    const isAdmin = roles.some(r => r.toUpperCase() === 'ADMIN');
    const userRole = isAdmin ? 'ADMIN' : 'CLIENT';

    return (
        <nav className="navbar">
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>SecureShop</div>
            <div className="nav-links">
                <Link to="/products">Produits</Link>
                <Link to="/orders">Commandes</Link>
                <span style={{ marginLeft: '2rem', color: '#94a3b8' }}>
                    {auth.user?.profile.preferred_username} ({userRole})
                </span>
                <button
                    className="btn btn-danger"
                    style={{ marginLeft: '1rem' }}
                    onClick={() => auth.signoutRedirect()}
                >
                    Déconnexion
                </button>
            </div>
        </nav>
    );
}
