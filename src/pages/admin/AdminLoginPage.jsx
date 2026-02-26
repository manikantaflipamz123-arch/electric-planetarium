import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const loginAsAdmin = useAppStore(state => state.loginAsAdmin);
    const currentUser = useAppStore(state => state.currentUser);

    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Auto-redirect if already logged in
    useEffect(() => {
        if (currentUser?.role === 'admin') {
            navigate('/admin', { replace: true });
        }
    }, [currentUser, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok) {
                loginAsAdmin();
                navigate('/admin');
            } else {
                setError(data.message || "Invalid administrator password.");
            }
        } catch (err) {
            setError("Network error. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '6rem 0', maxWidth: '450px', flex: 1 }}>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-primary-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                    <ShieldCheck size={32} />
                </div>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Admin Gateway</h1>
                <p className="text-muted">Enter master passphrase to access platform controls.</p>
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
                        <label className="input-label">Master Password</label>
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
                            autoFocus
                        />
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Prototype Hint: <code>admin123</code>
                    </p>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', background: 'var(--color-primary-dark)' }} disabled={isLoading}>
                        {isLoading ? 'Authenticating...' : (
                            <>Unlock Dashboard <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} /></>
                        )}
                    </button>
                </form>
            </div>

            <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)' }}>
                Not an admin? <Link to="/" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Return Home</Link>
            </p>
        </div>
    );
};

export default AdminLoginPage;
