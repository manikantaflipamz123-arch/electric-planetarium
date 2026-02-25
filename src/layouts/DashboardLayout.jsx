import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import {
    LayoutDashboard,
    PackagePlus,
    Box,
    ClipboardList,
    Truck,
    BarChart,
    Settings,
    LogOut,
    Store
} from 'lucide-react';
import logo from '../assets/logo.png';

const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const logout = useAppStore(state => state.logout);
    const isAdmin = location.pathname.startsWith('/admin');

    const handleLogout = () => {
        logout();
        if (isAdmin) {
            navigate('/admin/login');
        } else {
            navigate('/login');
        }
    };

    const vendorLinks = [
        { name: 'Dashboard', path: '/vendor/dashboard', icon: LayoutDashboard },
        { name: 'Add Product', path: '/vendor/add-product', icon: PackagePlus },
        { name: 'Inventory', path: '/vendor/inventory', icon: Box },
        { name: 'Orders', path: '/vendor/orders', icon: ClipboardList },
        { name: 'Shipping', path: '/vendor/shipping', icon: Truck },
        { name: 'Analytics', path: '/vendor/analytics', icon: BarChart },
        { name: 'Settings', path: '/vendor/settings', icon: Settings },
    ];

    const adminLinks = [
        { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    ];

    const links = isAdmin ? adminLinks : vendorLinks;

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={logo} alt="ShopLiveDeals" style={{ height: '32px', width: 'auto', borderRadius: '4px' }} />
                        <span style={{ fontSize: '1rem', fontWeight: 600 }}>ShopLiveDeals {isAdmin ? 'Admin' : 'Vendor'}</span>
                    </Link>
                </div>

                <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--color-primary-dark)' : 'var(--text-muted)',
                                    background: isActive ? 'var(--color-primary-light)' : 'transparent',
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '0.875rem',
                                    transition: 'all var(--transition-fast)'
                                }}
                            >
                                <Icon size={18} />
                                {link.name}
                            </Link>
                        )
                    })}
                </nav>

                <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
                    <button onClick={handleLogout} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        color: 'var(--color-danger)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                    }}>
                        <LogOut size={18} />
                        Logout / Exit
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Replace with contextual title later if needed */}
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                            {links.find(l => l.path === location.pathname)?.name || 'Dashboard'}
                        </h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {!isAdmin && (
                            <Link to="/" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}>
                                <Store size={14} /> View Storefront
                            </Link>
                        )}
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                            {isAdmin ? 'AD' : 'VN'}
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
