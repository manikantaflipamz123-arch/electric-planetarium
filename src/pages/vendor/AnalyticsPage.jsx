import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { useProductStore } from '../../store/productStore';
import { useVendorStore } from '../../store/vendorStore';
import { useAppStore } from '../../store/appStore';
import { TrendingUp, Download, PieChart, Activity, Wallet, FileText } from 'lucide-react';

const AnalyticsPage = () => {
    const navigate = useNavigate();
    const currentUser = useAppStore(state => state.currentUser);

    const fetchProducts = useProductStore(state => state.fetchProducts);
    const fetchOrders = useOrderStore(state => state.fetchOrders);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'vendor') {
            navigate('/login');
        } else {
            fetchProducts(currentUser.vendorProfileId || currentUser.id);
            fetchOrders();
        }
    }, [currentUser, navigate, fetchProducts, fetchOrders]);

    const orders = useOrderStore(state => state.orders);
    const products = useProductStore(state => state.products);
    const platformCommissionRate = useVendorStore(state => state.platformCommissionRate);

    const [timeframe, setTimeframe] = useState('All Time'); // All Time, Today, Week, Month, Year

    // Filter orders based on timeframe
    const now = new Date();
    const filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        if (timeframe === 'Today') {
            return orderDate.toDateString() === now.toDateString();
        }
        if (timeframe === 'Week') {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            return orderDate >= weekAgo;
        }
        if (timeframe === 'Month') {
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            return orderDate >= monthAgo;
        }
        if (timeframe === 'Year') {
            const yearAgo = new Date();
            yearAgo.setFullYear(now.getFullYear() - 1);
            return orderDate >= yearAgo;
        }
        return true;
    });

    // Calculate detailed breakdown
    const grossRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
    const totalOrdersCount = filteredOrders.length;

    let baseSales = 0;
    let inclusiveGstExtracted = 0;
    let exclusiveGstAdded = 0;

    filteredOrders.forEach(order => {
        const items = order.items || [{ productId: order.productId, total: order.total }];

        items.forEach(item => {
            const liveProduct = products.find(p => p.id === item.productId) || {};
            const rate = liveProduct.taxRate !== undefined ? liveProduct.taxRate / 100 : 0.18;
            const itemTotal = item.total || 0;

            if (liveProduct.isGstInclusive) {
                const base = itemTotal / (1 + rate);
                baseSales += base;
                inclusiveGstExtracted += (itemTotal - base);
            } else {
                baseSales += itemTotal;
                exclusiveGstAdded += itemTotal * rate;
            }
        });
    });

    const totalProductGstCollected = inclusiveGstExtracted + exclusiveGstAdded;

    const platformFee = grossRevenue * (platformCommissionRate / 100);
    const platformFeeGst = platformFee * 0.18;
    const totalPlatformDeduction = platformFee + platformFeeGst;

    const netEarnings = (baseSales + totalProductGstCollected) - totalPlatformDeduction;

    const handleDownloadReport = () => {
        const BOM = "\uFEFF"; // Byte Order Mark to assist Excel with UTF-8
        const storeName = currentUser?.storeName || 'Vendor';
        let csvContent = BOM + `${storeName} Financial Report - ${timeframe}\n\n`;
        csvContent += "Date,Order ID,Product,Tax Type,Gross,Base,Product Tax Rate,Product Tax Amt,Comm Fee Rate,Comm Fee Amt,Comm Tax Rate,Comm Tax Amt,Net Payout\n";

        filteredOrders.forEach(order => {
            const items = order.items || [{ productId: order.productId, productName: order.productName, total: order.total }];

            items.forEach(item => {
                const liveProduct = products.find(p => p.id === item.productId) || {};
                const rate = liveProduct.taxRate !== undefined ? liveProduct.taxRate / 100 : 0.18;
                const itemTotal = item.total || 0;

                let base = 0;
                let tax = 0;
                let taxType = liveProduct.isGstInclusive ? 'Inclusive' : 'Exclusive';

                if (liveProduct.isGstInclusive) {
                    base = itemTotal / (1 + rate);
                    tax = itemTotal - base;
                } else {
                    base = itemTotal;
                    tax = itemTotal * rate;
                }

                const fee = itemTotal * (platformCommissionRate / 100);
                const feeTax = fee * 0.18;
                const net = (base + tax) - (fee + feeTax);

                // Enclose string fields in quotes to prevent comma issues
                const date = new Date(order.createdAt).toLocaleDateString();
                csvContent += `"${date}","${order.id}","${item.productName}","${taxType}",${itemTotal.toFixed(2)},${base.toFixed(2)},"${rate * 100}%",${tax.toFixed(2)},"${platformCommissionRate}%",${fee.toFixed(2)},"18%",${feeTax.toFixed(2)},${net.toFixed(2)}\n`;
            });
        });

        // Add summary row at the bottom
        csvContent += `\n"TOTALS","","","",${grossRevenue.toFixed(2)},${baseSales.toFixed(2)},"",${totalProductGstCollected.toFixed(2)},"",${platformFee.toFixed(2)},"",${platformFeeGst.toFixed(2)},${netEarnings.toFixed(2)}\n`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);

        // Clean store name for the filename (remove spaces and special chars)
        const safeStoreName = storeName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute("download", `${safeStoreName}_ledger_${timeframe.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Analytics & Tax Reports</h2>
                    <p className="text-muted">Track granular financial metrics and export tax-ready statements.</p>
                </div>
                <button
                    onClick={handleDownloadReport}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Download size={18} /> Export {timeframe} CSV
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: 'fit-content', marginBottom: '2rem' }}>
                {['All Time', 'Today', 'Week', 'Month', 'Year'].map(period => (
                    <button
                        key={period}
                        onClick={() => setTimeframe(period)}
                        style={{
                            padding: '0.5rem 1.5rem',
                            border: 'none',
                            background: timeframe === period ? 'var(--color-primary-light)' : 'transparent',
                            color: timeframe === period ? 'var(--color-primary-dark)' : 'var(--text-muted)',
                            fontWeight: timeframe === period ? 600 : 500,
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)'
                        }}
                    >
                        {period}
                    </button>
                ))}
            </div>

            {/* Quick Stats Row */}
            <div className="md-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Activity size={24} />
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Gross Revenue</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>₹{grossRevenue.toFixed(2)}</p>
                </div>

                <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-success)30', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Wallet size={24} />
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Net Payout</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>₹{netEarnings.toFixed(2)}</p>
                </div>

                <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-warning)30', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <PieChart size={24} />
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Orders</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalOrdersCount}</p>
                </div>
            </div>

            {/* Detailed Financial Breakdown */}
            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <FileText size={20} className="text-muted" />
                    <h3 style={{ fontSize: '1.25rem' }}>{timeframe} Tax & Ledger Breakdown</h3>
                </div>

                <div className="md-grid-1" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) auto', gap: '1rem', rowGap: '1rem', alignItems: 'center', letterSpacing: '0.01em' }}>

                    <span className="text-muted">Gross Sales (Paid by Buyers)</span>
                    <span style={{ fontWeight: 600 }}>₹{grossRevenue.toFixed(2)}</span>

                    <span className="text-muted">Base Product Sales</span>
                    <span>₹{baseSales.toFixed(2)}</span>

                    <span className="text-muted">GST Included in MRP (Extracted)</span>
                    <span>+ ₹{inclusiveGstExtracted.toFixed(2)}</span>

                    <span className="text-muted">Exclusive GST Added at Checkout</span>
                    <span>+ ₹{exclusiveGstAdded.toFixed(2)}</span>

                    <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

                    <span className="text-muted">Total Gross & Tax Realized</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>₹{(baseSales + totalProductGstCollected).toFixed(2)}</span>

                    <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

                    <span className="text-muted">Platform Commission Deduction ({platformCommissionRate}%)</span>
                    <span style={{ color: 'var(--color-danger)' }}>- ₹{platformFee.toFixed(2)}</span>

                    <span className="text-muted">GST on Platform Services (18%)</span>
                    <span style={{ color: 'var(--color-danger)' }}>- ₹{platformFeeGst.toFixed(2)}</span>

                    <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--border-color)', margin: '1rem 0' }}></div>

                    <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Net Account Payout</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>₹{netEarnings.toFixed(2)}</span>

                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
