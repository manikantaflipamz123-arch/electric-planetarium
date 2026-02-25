import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { useAppStore } from '../../store/appStore';
import { Truck, Download, MapPin, Search } from 'lucide-react';
import logo from '../../assets/logo.png';

const ShippingPage = () => {
    const navigate = useNavigate();
    const currentUser = useAppStore(state => state.currentUser);

    const [logoBase64, setLogoBase64] = useState('');

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'vendor') {
            navigate('/login');
        } else {
            // Load and convert logo to base64 for PDF embedding
            fetch(logo)
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => setLogoBase64(reader.result);
                    reader.readAsDataURL(blob);
                });
        }
    }, [currentUser, navigate]);

    const orders = useOrderStore(state => state.orders).filter(o => o.vendorId === currentUser?.id && o.status === 'Placed');
    const updateOrderStatus = useOrderStore(state => state.updateOrderStatus);

    const [searchTerm, setSearchTerm] = useState('');
    const [trackingInput, setTrackingInput] = useState({});
    const [courierInput, setCourierInput] = useState({});

    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleTrackingChange = (id, value) => {
        setTrackingInput(prev => ({ ...prev, [id]: value }));
    };

    const handleCourierChange = (id, value) => {
        setCourierInput(prev => ({ ...prev, [id]: value }));
    };

    const handleMarkShipped = (id) => {
        const tracking = trackingInput[id];
        const courier = courierInput[id];
        if (!tracking || !courier) {
            alert('Please enter both a Courier Partner and Tracking Number before marking as shipped.');
            return;
        }
        updateOrderStatus(id, 'Shipped', { trackingNumber: tracking, courierPartner: courier });

        // Cleanup local state
        const newTracking = { ...trackingInput };
        delete newTracking[id];
        setTrackingInput(newTracking);

        const newCourier = { ...courierInput };
        delete newCourier[id];
        setCourierInput(newCourier);
    };

    const handleGenerateShippingLabel = (order) => {
        // Create an invisible iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;

        const labelHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
                    .label-container { width: 4in; min-height: 6in; border: 2px solid #000; box-sizing: border-box; position: relative; display: flex; flex-direction: column; }
                    
                    /* Header Section */
                    .header { display: flex; justify-content: space-between; align-items: flex-start; padding: 15px; border-bottom: 2px solid #000; background-color: #f9f9f9; }
                    .brand { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase; }
                    .brand-logo { max-height: 28px; width: auto; border-radius: 4px; }
                    .brand span { color: #6366f1; }
                    .date-carrier { text-align: right; font-size: 11px; color: #333; }
                    
                    /* Routing & Barcode Section */
                    .routing { padding: 15px; border-bottom: 2px solid #000; text-align: center; }
                    .routing-code { font-size: 28px; font-weight: bold; font-family: monospace; letter-spacing: 4px; margin-bottom: 10px; }
                    .barcode { display: inline-block; padding: 10px 20px; border: 1px solid #ccc; font-family: monospace; letter-spacing: 2px; font-size: 14px; background: #fff; }

                    /* Ship To Section (Customer) */
                    .ship-to { padding: 15px; border-bottom: 2px solid #000; flex: 1; }
                    .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #666; margin: 0 0 8px 0; }
                    .customer-name { font-size: 20px; font-weight: bold; margin: 0 0 5px 0; }
                    .customer-address { font-size: 14px; line-height: 1.4; white-space: pre-wrap; margin-bottom: 5px; }
                    .customer-contact { font-size: 13px; font-weight: 500; }
                    
                    /* Order Details Section */
                    .order-info { padding: 15px; border-bottom: 2px solid #000; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; }
                    .order-info-item { display: flex; flex-direction: column; }
                    .order-info-label { font-size: 9px; color: #666; text-transform: uppercase; }
                    .order-info-val { font-weight: bold; font-size: 13px; }
                    
                    /* Return Address Section (Seller) */
                    .return-address { padding: 15px; font-size: 11px; line-height: 1.4; background-color: #fafafa; }
                    .seller-name { font-weight: bold; font-size: 12px; margin-bottom: 2px; }

                    /* Footer */
                    .footer { text-align: center; font-size: 9px; padding: 10px; border-top: 1px dashed #ccc; color: #555; }
                    
                    @media print {
                        body { padding: 0; display: flex; justify-content: center; }
                        .label-container { border: none; }
                    }
                </style>
            </head>
            <body>
                <div class="label-container">
                    <!-- Top Branding & Date -->
                    <div class="header">
                        <div class="brand">
                            ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="ShopLiveDeals Logo" />` : ''}
                            ShopLive<span>Deals</span>
                        </div>
                        <div class="date-carrier">
                            Date: ${new Date().toLocaleDateString()}<br/>
                            <strong>STANDARD SHIPPING</strong>
                        </div>
                    </div>

                    <!-- Scannable Area -->
                    <div class="routing">
                        <div class="routing-code">SLD-${order.id.substring(0, 4).toUpperCase()}</div>
                        <div class="barcode">*${order.id}*</div>
                    </div>
                    
                    <!-- Customer Information -->
                    <div class="ship-to">
                        <h2 class="section-title">Deliver To:</h2>
                        <div class="customer-name">${order.customerName}</div>
                        <!-- In a real app, address, city, and zip would be separate fields. Assuming 'address' holds the full string here -->
                        <div class="customer-address">${order.address}</div>
                        <div class="customer-contact">
                            ZIP/PIN: ${order.zip || 'N/A'}<br/>
                            Phone: ${order.phone || 'N/A'}
                        </div>
                    </div>

                    <!-- Order Summary -->
                    <div class="order-info">
                        <div class="order-info-item">
                            <span class="order-info-label">Order ID</span>
                            <span class="order-info-val">${order.id}</span>
                        </div>
                        <div class="order-info-item" style="text-align: right;">
                            <span class="order-info-label">Order Value</span>
                            <span class="order-info-val">₹${(order.totalAmount || order.total || 0).toFixed(2)}</span>
                        </div>
                        <div class="order-info-item" style="grid-column: 1 / -1;">
                            <span class="order-info-label">Contents</span>
                            <span class="order-info-val">${order.items ? order.items.map(i => i.productName + ' (Qty: ' + i.quantity + ')').join('<br/>') : order.productName + ' (Qty: ' + order.quantity + ')'}</span>
                        </div>
                    </div>

                    <!-- Return Details (Seller) -->
                    <div class="return-address">
                        <h2 class="section-title">Return Address (If Undelivered):</h2>
                        <div class="seller-name">${currentUser?.storeName || currentUser?.name || 'ShopLiveDeals Vendor'}</div>
                        <div>${currentUser?.address || 'Vendor Registered Address'}</div>
                        <div>${currentUser?.city || 'City'}, ${currentUser?.zip || 'PIN'}</div>
                        <div style="margin-top: 4px;">
                            <strong>Ph:</strong> ${currentUser?.phone || 'N/A'} | <strong>Email:</strong> ${currentUser?.email || 'support@shoplivedeals.com'}
                        </div>
                    </div>
                    
                    <div class="footer">
                        Please do not accept if the package seal is broken or tampered with.
                    </div>
                </div>
            </body>
            </html>
        `;

        doc.open();
        doc.write(labelHtml);
        doc.close();

        // Focus and print the iframe context, then remove it
        iframe.contentWindow.focus();
        setTimeout(() => {
            iframe.contentWindow.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Shipping & Fulfillment</h2>
                    <p className="text-muted">Generate shipping details and update tracking for pending orders.</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, padding: '0.5rem 1rem' }}>
                    <Search size={18} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search by Order ID or Customer Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {filteredOrders.length === 0 ? (
                    <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Truck size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>You have no pending orders requiring shipment.</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="card" style={{ padding: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div>
                                        <span className="badge badge-warning" style={{ marginBottom: '0.5rem' }}>Pending Shipment</span>
                                        <h3 style={{ fontSize: '1.125rem' }}>Order {order.id}</h3>
                                    </div>
                                    <button
                                        onClick={() => handleGenerateShippingLabel(order)}
                                        className="btn btn-outline"
                                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', height: 'fit-content' }}
                                    >
                                        <Download size={14} /> Print PDF Label
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                    <div>
                                        <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Customer Info</p>
                                        <p style={{ fontWeight: 500 }}>{order.customerName}</p>
                                        <p style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.25rem', marginTop: '0.5rem' }}>
                                            <MapPin size={14} className="text-muted" style={{ marginTop: '2px' }} />
                                            {order.address}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Product Info</p>
                                        {(() => {
                                            const items = order.items || [{ productName: order.productName, quantity: order.quantity, total: order.total }];
                                            const totalAmount = order.totalAmount || order.total || 0;
                                            return (
                                                <>
                                                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                                        {items.map((i, idx) => (
                                                            <div key={idx} style={{ marginBottom: '2px' }}>
                                                                {i.productName} <span className="text-muted" style={{ fontWeight: 'normal' }}>(Qty: {i.quantity})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 600 }}>Total: ₹{totalAmount.toFixed(2)}</p>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="input-label">Courier Partner *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Delhivery, BlueDart"
                                            className="input-field"
                                            value={courierInput[order.id] || ''}
                                            onChange={(e) => handleCourierChange(order.id, e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group" style={{ flex: 1.5, marginBottom: 0 }}>
                                        <label className="input-label">Tracking Number *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. DEL123456789"
                                            className="input-field"
                                            value={trackingInput[order.id] || ''}
                                            onChange={(e) => handleTrackingChange(order.id, e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleMarkShipped(order.id)}
                                        className="btn btn-primary"
                                        disabled={!trackingInput[order.id] || !courierInput[order.id]}
                                        style={{ height: '42px' }}
                                    >
                                        <Truck size={18} /> Mark as Shipped
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ShippingPage;
