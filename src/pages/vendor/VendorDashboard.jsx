import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { useProductStore } from '../../store/productStore';
import { useAppStore } from '../../store/appStore';
import { useVendorStore } from '../../store/vendorStore';
import { IndianRupee, ShoppingBag, Package, TrendingUp, Wallet } from 'lucide-react';

const VendorDashboard = () => {
    const navigate = useNavigate();
    const currentUser = useAppStore(state => state.currentUser);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'vendor') {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    const fetchProducts = useProductStore(state => state.fetchProducts);

    useEffect(() => {
        if (currentUser && currentUser.role === 'vendor') {
            fetchProducts(currentUser.vendorProfileId || currentUser.id);
        }
    }, [currentUser, fetchProducts]);

    const products = useProductStore(state => state.products);
    const orders = useOrderStore(state => state.orders).filter(o => o.vendorId === currentUser?.id);
    const platformCommissionRate = useVendorStore(state => state.platformCommissionRate);

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

    // Calculate Net Earnings based on Inclusive/Exclusive GST
    let baseSales = 0;
    let productGstCollected = 0;

    orders.forEach(order => {
        const items = order.items || [{ productId: order.productId, total: order.total }];

        items.forEach(item => {
            const liveProduct = products.find(p => p.id === item.productId) || {};
            const rate = liveProduct.taxRate !== undefined ? liveProduct.taxRate / 100 : 0.18;
            const itemTotal = item.total || 0;

            if (liveProduct.isGstInclusive) {
                const base = itemTotal / (1 + rate);
                baseSales += base;
                productGstCollected += (itemTotal - base);
            } else {
                baseSales += itemTotal;
                productGstCollected += itemTotal * rate;
            }
        });
    });

    const platformFee = totalRevenue * (platformCommissionRate / 100);
    const platformFeeGst = platformFee * 0.18;
    const totalPlatformDeduction = platformFee + platformFeeGst;

    const netEarnings = (baseSales + productGstCollected) - totalPlatformDeduction;

    // Calculate real today's earnings
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaysOrdersList = orders.filter(o => new Date(o.createdAt) >= todayStart);
    const todaysRevenue = todaysOrdersList.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    const stats = [
        { title: 'Gross Revenue', value: `₹${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'var(--color-primary)' },
        { title: 'Net Earnings', value: `₹${netEarnings.toFixed(2)}`, icon: Wallet, color: 'var(--color-success)' },
        { title: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'var(--color-warning)' },
        { title: 'Active Products', value: products.length, icon: Package, color: 'var(--color-primary-dark)' }
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Welcome back, {currentUser?.name}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {stats.map((stat, index) => (
                    <div key={index} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{stat.title}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.125rem' }}>Recent Orders</h3>
                </div>

                {recentOrders.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No orders yet.
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Product</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map(order => (
                                <tr key={order.id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{order.id}</td>
                                    <td>{order.items ? (order.items.length === 1 ? order.items[0].productName : `${order.items.length} Items`) : order.productName}</td>
                                    <td>{order.customerName}</td>
                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        {order.status === 'Placed' && <span className="badge badge-warning">Placed</span>}
                                        {order.status === 'Shipped' && <span className="badge badge-primary">Shipped</span>}
                                        {order.status === 'Delivered' && <span className="badge badge-success">Delivered</span>}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>₹{(order.totalAmount || order.total || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default VendorDashboard;
