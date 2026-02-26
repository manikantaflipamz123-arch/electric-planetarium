import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { useAppStore } from '../../store/appStore';
import { Package, Truck } from 'lucide-react';

const OrdersPage = () => {
    const navigate = useNavigate();
    const currentUser = useAppStore(state => state.currentUser);

    const fetchOrders = useOrderStore(state => state.fetchOrders);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'vendor') {
            navigate('/login');
        } else {
            fetchOrders();
        }
    }, [currentUser, navigate, fetchOrders]);

    const orders = useOrderStore(state => state.orders);
    const updateOrderStatus = useOrderStore(state => state.updateOrderStatus);

    const [filter, setFilter] = useState('All');

    const filteredOrders = filter === 'All'
        ? orders
        : orders.filter(o => (o.status || '').toUpperCase() === filter.toUpperCase());

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Order Management</h2>
                    <p className="text-muted">View all orders placed by customers.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    {['All', 'Placed', 'Shipped', 'Delivered'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                background: filter === status ? 'var(--color-primary-light)' : 'transparent',
                                color: filter === status ? 'var(--color-primary-dark)' : 'var(--text-muted)',
                                fontWeight: filter === status ? 600 : 500,
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)'
                            }}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card">
                {filteredOrders.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>No orders found for the selected filter.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Product</th>
                                <th>Detailed View</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td style={{ fontFamily: 'monospace' }}>{order.id}</td>
                                    <td>
                                        {(() => {
                                            const items = order.items || [{ productName: order.productName, quantity: order.quantity, total: order.total }];
                                            const totalAmount = order.totalAmount || order.total || 0;
                                            return (
                                                <>
                                                    <div style={{ fontWeight: 500 }}>
                                                        {items.length === 1 ? items[0].productName : `${items.length} Items (Multiple Products)`}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {items.length === 1 ? `Qty: ${items[0].quantity} | ` : ''}Total: ₹{totalAmount.toFixed(2)}
                                                    </div>
                                                    {items.length > 1 && (
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                            {items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.875rem' }}>{order.customerName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.address}</div>
                                    </td>
                                    <td>
                                        {order.status === 'PLACED' && <span className="badge badge-warning">Placed</span>}
                                        {order.status === 'SHIPPED' && <span className="badge badge-primary">Shipped</span>}
                                        {order.status === 'DELIVERED' && <span className="badge badge-success">Delivered</span>}
                                        {order.trackingNumber && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                {order.courierPartner ? (
                                                    <span>Trk ({order.courierPartner}): <span style={{ fontFamily: 'monospace' }}>{order.trackingNumber}</span></span>
                                                ) : (
                                                    <span>Trk: <span style={{ fontFamily: 'monospace' }}>{order.trackingNumber}</span></span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {order.status === 'PLACED' && (
                                            <button
                                                onClick={() => navigate('/vendor/shipping')}
                                                className="btn btn-primary"
                                                style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                                            >
                                                <Truck size={14} /> Go to Shipping
                                            </button>
                                        )}
                                        {order.status === 'SHIPPED' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'Delivered', order.trackingNumber)}
                                                className="btn btn-outline"
                                                style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                                            >
                                                Mark Delivered
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;
