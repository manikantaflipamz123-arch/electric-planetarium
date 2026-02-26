import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendorStore } from '../../store/vendorStore';
import { useOrderStore } from '../../store/orderStore';
import { useProductStore } from '../../store/productStore';
import { useAppStore } from '../../store/appStore';
import { Eye, CheckCircle, XCircle, FileText, BadgeDollarSign, Download } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const currentUser = useAppStore(state => state.currentUser);
    const fetchAdminApplications = useVendorStore(state => state.fetchAdminApplications);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'admin') {
            navigate('/admin/login');
        } else {
            fetchAdminApplications();
        }
    }, [currentUser, navigate, fetchAdminApplications]);

    const applications = useVendorStore(state => state.applications);
    const vendors = useVendorStore(state => state.vendors);
    const platformCommissionRate = useVendorStore(state => state.platformCommissionRate);
    const updatePlatformCommission = useVendorStore(state => state.updatePlatformCommission);
    const approveApplication = useVendorStore(state => state.approveApplication);
    const rejectApplication = useVendorStore(state => state.rejectApplication);

    const orders = useOrderStore(state => state.orders);
    const products = useProductStore(state => state.products);

    const [activeTab, setActiveTab] = useState('applications');

    // Global Ledger Summary Calculations
    const approvedVendorIds = vendors.map(v => v.id);
    const validOrders = orders.filter(o => approvedVendorIds.includes(o.vendorId));
    const globalGrossSales = validOrders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
    const globalPlatformFee = globalGrossSales * (platformCommissionRate / 100);
    const globalPlatformGst = globalPlatformFee * 0.18;

    const handleApprove = (e, id) => {
        e.stopPropagation();
        approveApplication(id);
    };

    const handleReject = (e, id) => {
        e.stopPropagation();
        rejectApplication(id);
    };

    const handleExportCsv = () => {
        let csvContent = "Store/Vendor,GST Number,Bank Name,Bank Account,Total Orders,Gross Sales,Platform Fee (" + platformCommissionRate + "%),GST on Fee (18%),Net Sales (Pre-Tax),Product GST Collected,Seller Payout (Final)\n";

        vendors.forEach(vendor => {
            const vendorOrders = orders.filter(o => o.vendorId === vendor.id);
            const grossSales = vendorOrders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

            let baseSales = 0;
            let productGstCollected = 0;

            vendorOrders.forEach(order => {
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

            const platformFee = grossSales * (platformCommissionRate / 100);
            const platformFeeGst = platformFee * 0.18;
            const totalPlatformDeduction = platformFee + platformFeeGst;
            const finalPayout = (baseSales + productGstCollected) - totalPlatformDeduction;

            csvContent += `"${vendor.storeName}","${vendor.gstNumber || 'N/A'}","${vendor.bankName || 'N/A'}","${vendor.bankAccount || 'N/A'}",${vendorOrders.length},${grossSales.toFixed(2)},${platformFee.toFixed(2)},${platformFeeGst.toFixed(2)},${baseSales.toFixed(2)},${productGstCollected.toFixed(2)},${finalPayout.toFixed(2)}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `platform_tax_ledger_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Vendor Applications</h2>
                    <p className="text-muted">Review and manage incoming seller accounts.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1rem 1.5rem', minWidth: '150px' }}>
                        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Pending</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                            {applications.filter(a => a.status === 'PENDING').length}
                        </p>
                    </div>
                    <div className="card" style={{ padding: '1rem 1.5rem', minWidth: '150px' }}>
                        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Approved</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
                            {vendors.length}
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <button
                    onClick={() => setActiveTab('applications')}
                    className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <FileText size={18} /> Applications
                </button>
                <button
                    onClick={() => setActiveTab('ledger')}
                    className={`btn ${activeTab === 'ledger' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <BadgeDollarSign size={18} /> Seller Ledger
                </button>
            </div>

            {activeTab === 'applications' && (
                <div className="card">
                    {applications.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <p>No applications found.</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Store Details</th>
                                    <th>GST Number</th>
                                    <th>Submitted On</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr
                                        key={app.id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/admin/seller/${app.id}`)}
                                        className="hover-bg-subtle"
                                    >
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{app.storeName}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{app.email || 'No email provided'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {app.id}</div>
                                        </td>
                                        <td><span style={{ fontFamily: 'monospace' }}>{app.gstNumber}</span></td>
                                        <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                                        <td>
                                            {app.status === 'PENDING' && <span className="badge badge-warning">Pending</span>}
                                            {app.status === 'APPROVED' && <span className="badge badge-success">Approved</span>}
                                            {app.status === 'REJECTED' && <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>Rejected</span>}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ padding: '0.25rem', color: 'var(--text-muted)' }}
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                {app.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={(e) => handleApprove(e, app.id)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)' }}
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={20} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleReject(e, app.id)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                                            title="Reject"
                                                        >
                                                            <XCircle size={20} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {activeTab === 'ledger' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Global Profit Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '0.5rem' }}>
                        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-success)' }}>
                            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--color-success)' }}>Net Platform Profit</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-color)' }}>₹{globalPlatformFee.toFixed(2)}</h3>
                        </div>
                        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-danger)' }}>
                            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--color-danger)' }}>GST Payable (Liability)</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-color)' }}>₹{globalPlatformGst.toFixed(2)}</h3>
                        </div>
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Gross Merchandise Value (GMV)</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-color)' }}>₹{globalGrossSales.toFixed(2)}</h3>
                        </div>
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Total Handled Orders</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-color)' }}>{validOrders.length}</h3>
                        </div>
                    </div>

                    {/* Global Commission Setting */}
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>Platform Settings & Reports</h3>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Set global commissions or export the master tax ledger.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <label style={{ fontWeight: 500 }}>Commission Rate (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={platformCommissionRate}
                                onChange={(e) => updatePlatformCommission(Number(e.target.value))}
                                className="input-field"
                                style={{ width: '80px', padding: '0.5rem' }}
                            />
                            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>
                            <button
                                onClick={handleExportCsv}
                                className="btn btn-outline"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            >
                                <Download size={16} /> Export CSV Ledger
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        {vendors.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <p>No approved sellers yet.</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Store / Vendor</th>
                                        <th>GST Number</th>
                                        <th>Orders</th>
                                        <th>Total Sales (Gross)</th>
                                        <th>Platform Fee ({platformCommissionRate}%)</th>
                                        <th>GST on Fee (18%)</th>
                                        <th>Net Sales (Pre-Tax)</th>
                                        <th>Product GST Collected</th>
                                        <th>Seller Payout (Final)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vendors.map(vendor => {
                                        // Find all orders for this specific vendor
                                        const vendorOrders = orders.filter(o => o.vendorId === vendor.id);

                                        // Calculate Gross Sales (the raw sticker price sum)
                                        const grossSales = vendorOrders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

                                        // We need to calculate how much of that gross is actually tax (if inclusive) vs added tax
                                        let baseSales = 0;
                                        let productGstCollected = 0;

                                        vendorOrders.forEach(order => {
                                            const items = order.items || [{ productId: order.productId, total: order.total }];

                                            items.forEach(item => {
                                                const liveProduct = products.find(p => p.id === item.productId) || {};
                                                const rate = liveProduct.taxRate !== undefined ? liveProduct.taxRate / 100 : 0.18;
                                                const itemTotal = item.total || 0;

                                                if (liveProduct.isGstInclusive) {
                                                    // Formula: Base = MRP / (1 + Rate)
                                                    const base = itemTotal / (1 + rate);
                                                    baseSales += base;
                                                    productGstCollected += (itemTotal - base);
                                                } else {
                                                    baseSales += itemTotal;
                                                    productGstCollected += itemTotal * rate;
                                                }
                                            });
                                        });

                                        // Calculate Platform Commission cut (based on Gross sales)
                                        const platformFee = grossSales * (platformCommissionRate / 100);

                                        // Calculate 18% GST specifically ON the platform fee itself
                                        const platformFeeGst = platformFee * 0.18;

                                        // Total deduction the platform takes from the seller
                                        const totalPlatformDeduction = platformFee + platformFeeGst;

                                        // Final Net Seller Payout calculation: 
                                        // For inclusive: Gross - Platform Deductions
                                        // For exclusive: Gross + Added Tax - Platform Deductions
                                        // We can standardise this: BaseSales + ProductGstCollected - Platform Deductions
                                        const finalPayout = (baseSales + productGstCollected) - totalPlatformDeduction;

                                        return (
                                            <tr key={vendor.id}>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{vendor.storeName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{vendor.bankName} - {vendor.bankAccount}</div>
                                                </td>
                                                <td><span style={{ fontFamily: 'monospace' }}>{vendor.gstNumber}</span></td>
                                                <td>{vendorOrders.length}</td>
                                                <td style={{ fontWeight: 600 }}>
                                                    ₹{grossSales.toFixed(2)}
                                                </td>
                                                <td style={{ color: 'var(--color-danger)' }}>
                                                    -₹{platformFee.toFixed(2)}
                                                </td>
                                                <td style={{ color: 'var(--color-danger)' }}>
                                                    -₹{platformFeeGst.toFixed(2)}
                                                </td>
                                                <td style={{ color: 'var(--text-muted)' }}>
                                                    ₹{baseSales.toFixed(2)}
                                                </td>
                                                <td style={{ color: 'var(--text-muted)' }}>
                                                    +₹{productGstCollected.toFixed(2)}
                                                </td>
                                                <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                                                    ₹{finalPayout.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
