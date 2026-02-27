import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import logo from '../assets/logo.png';
import { useOrderStore } from '../store/orderStore';

const MainLayout = () => {
    const cart = useOrderStore(state => state.cart);
    const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <header style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border-color)',
                position: 'sticky',
                top: 0,
                zIndex: 50
            }}>
                <div className="container flex items-center justify-between main-header-content" style={{ height: '72px' }}>
                    <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={logo} alt="ShopLiveDeals Logo" style={{ height: '36px', width: 'auto', borderRadius: '6px' }} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>ShopLiveDeals</span>
                    </Link>

                    <nav className="flex items-center gap-6 main-nav-container">
                        <Link to="/status" className="text-muted" style={{ textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>Check Status</Link>
                        <Link to="/onboarding" className="text-muted" style={{ textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>Start Selling</Link>
                        <Link to="/login" className="text-muted desktop-only" style={{ textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>Vendor Login</Link>
                        <Link to="/admin/login" className="text-muted desktop-only" style={{ textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>Admin Login</Link>
                        <div className="desktop-only" style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>
                        <Link to="/cart" className="btn btn-ghost" style={{ position: 'relative' }}>
                            <ShoppingCart size={20} />
                            {cartItemCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    background: 'var(--color-danger)',
                                    color: 'white',
                                    fontSize: '0.625rem',
                                    fontWeight: 'bold',
                                    padding: '2px 6px',
                                    borderRadius: '999px'
                                }}>{cartItemCount}</span>
                            )}
                        </Link>
                    </nav>
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Outlet />
            </main>

            <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', padding: '3rem 0' }}>
                <div className="container flex items-center justify-between text-muted" style={{ fontSize: '0.875rem' }}>
                    <p>&copy; {new Date().getFullYear()} ShopLiveDeals SaaS. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Terms</a>
                        <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy</a>
                        <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
