import { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import axios from 'axios';

export default function Orders() {
    const auth = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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
    const isAdmin = roles.some(r => r.toUpperCase() === 'ADMIN');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            // ADMIN calls /api/orders (all), CLIENT calls /api/orders/my-orders
            const endpoint = isAdmin
                ? 'http://localhost:9090/api/orders'
                : 'http://localhost:9090/api/orders/my-orders';

            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${auth.user.access_token}` }
            });
            setOrders(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.patch(`http://localhost:9090/api/orders/${id}/status`, status, {
                headers: {
                    Authorization: `Bearer ${auth.user.access_token}`,
                    'Content-Type': 'text/plain'
                }
            });
            fetchOrders();
        } catch (err) {
            alert("Erreur lors de la mise à jour");
        }
    }

    if (loading) return <div>Chargement...</div>;

    return (
        <div>
            <h2>{isAdmin ? 'Gestion des Commandes (Admin)' : 'Mes Commandes'}</h2>
            {orders.length === 0 && <p>Aucune commande passée.</p>}

            <div className="grid">
                {orders.map(order => (
                    <div key={order.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>Commande #{order.id}</strong>
                            <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: order.status === 'APPROVED' ? 'green' : order.status === 'REJECTED' ? 'red' : 'orange'
                            }}>
                                {order.status}
                            </span>
                        </div>
                        {isAdmin && <p>User ID: {order.userId}</p>}
                        <p>Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                        <p>Total: <strong style={{ color: 'var(--success-color)' }}>{order.totalAmount} €</strong></p>

                        <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                        <ul>
                            {order.items.map((item, idx) => (
                                <li key={idx}>Produit ID {item.productId} x {item.quantity}</li>
                            ))}
                        </ul>

                        {isAdmin && (
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button className="btn" style={{ backgroundColor: 'green' }} onClick={() => updateStatus(order.id, 'APPROVED')}>Approuver</button>
                                <button className="btn btn-danger" onClick={() => updateStatus(order.id, 'REJECTED')}>Rejeter</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
