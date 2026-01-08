import { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import axios from 'axios';

export default function Products() {
    const auth = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        quantity: ''
    });

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
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:9090/api/products', {
                headers: { Authorization: `Bearer ${auth.user.access_token}` }
            });
            setProducts(res.data);
        } catch (err) {
            console.error("Error fetching products", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Supprimer ce produit ?")) return;
        try {
            await axios.delete(`http://localhost:9090/api/products/${id}`, {
                headers: { Authorization: `Bearer ${auth.user.access_token}` }
            });
            fetchProducts();
        } catch (err) {
            alert("Erreur: Vous n'avez probablement pas les droits ADMIN");
        }
    }

    const handleOrder = async (product) => {
        if (!confirm(`Commander 1x ${product.name} ?`)) return;
        try {
            await axios.post('http://localhost:9090/api/orders',
                [{ productId: product.id, quantity: 1 }],
                { headers: { Authorization: `Bearer ${auth.user.access_token}` } }
            );
            alert("Commande effectuée avec succès !");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la commande.");
        }
    }

    // Open Modal
    const openModal = () => {
        setFormData({ name: '', description: '', price: '', quantity: '' });
        setShowModal(true);
    };

    // Handle Input Change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Submit New Product
    const handleSaveProduct = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.price || !formData.quantity) {
            alert("Veuillez remplir les champs obligatoires");
            return;
        }

        const newProduct = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            quantity: parseInt(formData.quantity)
        };

        try {
            await axios.post('http://localhost:9090/api/products', newProduct, {
                headers: { Authorization: `Bearer ${auth.user.access_token}` }
            });
            alert("Produit ajouté avec succès !");
            setShowModal(false);
            fetchProducts();
        } catch (err) {
            console.error("Erreur lors de l'ajout", err);
            alert("Erreur lors de l'ajout du produit.");
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Catalogue Produits</h2>
                {isAdmin && <button className="btn" onClick={openModal}>Ajouter un Produit</button>}
            </div>

            <div className="grid">
                {products.map(p => (
                    <div key={p.id} className="card">
                        <h3>{p.name}</h3>
                        <p>{p.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                            <span style={{ fontSize: '1.2rem', color: 'var(--success-color)' }}>{p.price} €</span>
                            <span>Stock: {p.quantity}</span>
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                            {isAdmin && (
                                <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Supprimer</button>
                            )}
                            {!isAdmin && (
                                <button className="btn" onClick={() => handleOrder(p)}>Commander</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL OVERLAY */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="card" style={{ width: '450px', margin: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Nouveau Produit</h3>
                        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            <div className="form-group">
                                <label>Nom du produit</label>
                                <input
                                    type="text" name="name" placeholder="Ex: iPhone 15"
                                    value={formData.name} onChange={handleChange} required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description" placeholder="Description du produit"
                                    value={formData.description} onChange={handleChange}
                                    style={{
                                        width: '100%', padding: '0.5rem', borderRadius: '0.25rem',
                                        border: '1px solid var(--text-muted)',
                                        backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', minHeight: '80px', fontFamily: 'inherit'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Prix (€)</label>
                                    <input
                                        type="number" name="price" placeholder="0.00" step="0.01"
                                        value={formData.price} onChange={handleChange} required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Quantité</label>
                                    <input
                                        type="number" name="quantity" placeholder="0"
                                        value={formData.quantity} onChange={handleChange} required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)}
                                    style={{
                                        background: 'transparent', color: 'var(--text-muted)',
                                        border: '1px solid var(--text-muted)', padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.3s'
                                    }}
                                    onMouseOver={(e) => { e.target.style.color = 'white'; e.target.style.borderColor = 'white'; }}
                                    onMouseOut={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.borderColor = 'var(--text-muted)'; }}
                                >
                                    Annuler
                                </button>
                                <button type="submit" className="btn">
                                    Sauvegarder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
