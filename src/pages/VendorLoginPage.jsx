import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVendorStore } from '../store/vendorStore';
import { useAppStore } from '../store/appStore';
import { Store, ArrowRight, AlertTriangle } from 'lucide-react';

const VendorLoginPage = () => {
    const navigate = useNavigate();
    const vendors = useVendorStore(state => state.vendors);
    const loginAsVendor = useAppStore(state => state.loginAsVendor);
    const currentUser = useAppStore(state => state.currentUser);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Auto-redirect if already logged in
    useEffect(() => {
        if (currentUser?.role === 'vendor') {
            navigate('/vendor/dashboard', { replace: true });
        }
    }, [currentUser, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Invalid credentials');
                return;
            }

            // Successfully logged in (Cookie is set by backend)
            // Update the global Zustand store so the frontend "knows" we are logged in
            loginAsVendor({
                id: data.user.id,
                email: data.user.email,
                role: 'vendor', // Hardcode role for vendor dashboard routing
                storeName: data.vendorProfile ? data.vendorProfile.storeName : 'Vendor',
                platformCommissionRate: data.vendorProfile ? data.vendorProfile.platformCommissionRate : 15.0,
                vendorProfileId: data.vendorProfile ? data.vendorProfile.id : null
            });

            navigate('/vendor/dashboard');

        } catch (err) {
            setError('Network error. Please try again.');
        }
    };

    const handleDemoLogin = () => {
        // Fallback to default demo vendor injected by appStore
        loginAsVendor();
        navigate('/vendor/dashboard');
    };

    return (
        <div className="container" style={{ padding: '6rem 0', maxWidth: '450px', flex: 1 }}>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-primary)15', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <Store size={32} />
                </div>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Vendor Login</h1>
                <p className="text-muted">Enter your registered email and password to access your dashboard.</p>
            </div>

            {error && (
                <div style={{ background: 'var(--color-danger)15', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    {error}
                </div>
            )}

            <div className="card" style={{ padding: '2rem' }}>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Email Address</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="vendor@example.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                            }}
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
                        Login to Dashboard <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                    </button>
                </form>

                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Just want to look around?</p>
                    <button onClick={handleDemoLogin} className="btn btn-outline" style={{ width: '100%' }}>
                        Use Demo Account
                    </button>
                </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)' }}>
                Don't have an account? <Link to="/onboarding" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Apply to Sell</Link>
            </p>
        </div>
    );
};

export default VendorLoginPage;
