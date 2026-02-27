import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import { useProductStore } from '../store/productStore';
import { useVendorStore } from '../store/vendorStore';
import { useAppStore } from '../store/appStore';
import { CreditCard, CheckCircle, Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { load } from '@cashfreepayments/cashfree-js';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const cart = useOrderStore(state => state.cart);
    const placeOrder = useOrderStore(state => state.placeOrder);
    const currentUser = useAppStore(state => state.currentUser);

    // We need direct access to the products to check live stock
    const products = useProductStore(state => state.products);
    const fetchProducts = useProductStore(state => state.fetchProducts);

    // Fetch fresh inventory for the checkout protection checks
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [checkoutError, setCheckoutError] = useState(null);

    // Initialize Cashfree
    const [cashfree, setCashfree] = useState(null);
    useEffect(() => {
        const initSDK = async () => {
            const cf = await load({
                mode: "sandbox" // Change to "production" when going live
            });
            setCashfree(cf);
        };
        initSDK();
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zip: '',
        cardNumber: '',
        expiry: '',
        cvc: ''
    });

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    let addedTaxes = 0;
    cart.forEach(item => {
        const liveProduct = products.find(p => p.id === item.product.id) || item.product;
        // Default to 18% if taxRate is missing on older data
        const rate = liveProduct.taxRate !== undefined ? liveProduct.taxRate / 100 : 0.18;
        if (!liveProduct.isGstInclusive) {
            addedTaxes += liveProduct.price * item.quantity * rate;
        }
    });
    const finalTotal = cartTotal + addedTaxes;

    useEffect(() => {
        if (cart.length === 0 && !successData) {
            navigate('/cart');
        }
    }, [cart, navigate, successData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setCheckoutError(null);
    };

    const handleCheckout = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setCheckoutError(null);

        // Pre-flight check: Verify all items have sufficient stock BEFORE simulated payment
        for (const cartItem of cart) {
            const liveProduct = products.find(p => p.id === cartItem.product.id);
            const liveQty = liveProduct ? Number(liveProduct.quantity) : 0;
            const cartQty = Number(cartItem.quantity) || 0;

            if (!liveProduct || liveQty < cartQty) {
                setIsProcessing(false);
                setCheckoutError(`Sorry! "${cartItem.product.name}" only has ${liveQty} units left in stock.`);
                return;
            }
        }

        try {
            // Initialize Secure Checkout Session
            const checkoutData = await placeOrder({
                id: currentUser?.id || 'guest',
                name: formData.name,
                email: formData.email,
                address: fullAddress,
                phone: formData.phone,
                zip: formData.zip
            });

            if (!cashfree) {
                setCheckoutError("Payment SDK is still loading. Please try again in a moment.");
                setIsProcessing(false);
                return;
            }

            // Trigger Cashfree Modal Overlay
            let checkoutOptions = {
                paymentSessionId: checkoutData.payment_session_id,
                redirectTarget: "_modal"
            };

            cashfree.checkout(checkoutOptions).then(async (result) => {
                if (result.error) {
                    console.error("Cashfree Payment Error or User Closed Popup:", result.error);
                    setCheckoutError(result.error.message || "Payment cancelled or failed.");
                    setIsProcessing(false);
                }

                if (result.paymentDetails) {
                    console.log("Payment Confirmed in UI:", result.paymentDetails.paymentMessage);
                    // For local development, we manually simulate the webhook trigger since our localhost is not public
                    // In production, cashfree servers hit the /api/webhook directly. We do this to immediately sync the UI state.
                    try {
                        await fetch('/api/checkout?action=webhook', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-webhook-signature': 'SIMULATION_BYPASS'
                            },
                            body: JSON.stringify({
                                data: { order: { order_id: checkoutData.order_id } }
                            })
                        });

                        useOrderStore.setState({ cart: [] });
                        setSuccessData(checkoutData.orders);
                    } catch (err) {
                        setCheckoutError("Payment succeeded but order confirmation failed. Please check status.");
                    } finally {
                        setIsProcessing(false);
                    }
                }
            });

        } catch (err) {
            setCheckoutError(err.message || 'Failed to process transaction. Please try again.');
            setIsProcessing(false);
        }
    };

    if (successData) {
        const orderSubtotal = successData.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

        // Dynamically calculate the paid tax so it matches precisely what was shown
        const paidTax = successData.reduce((sum, order) => {
            const items = order.items || [{ productId: order.productId, total: order.total }];
            let accumulatedTax = 0;

            items.forEach(item => {
                const liveProduct = products.find(p => p.id === item.productId) || {};
                const rate = liveProduct.taxRate !== undefined ? liveProduct.taxRate / 100 : 0.18;
                const itemTotal = item.total || 0;

                if (!liveProduct.isGstInclusive) {
                    accumulatedTax += (itemTotal * rate);
                }
            });

            return sum + accumulatedTax;
        }, 0);

        const paidTotal = orderSubtotal + paidTax;

        return (
            <div className="container" style={{ padding: '6rem 0', maxWidth: '600px', textAlign: 'center', flex: 1 }}>
                <div className="card" style={{ padding: '4rem 2rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                        <CheckCircle size={40} />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Payment Successful!</h2>
                    <p className="text-muted" style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>
                        Thank you for your purchase. Your order has been placed.
                    </p>

                    <div style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Order Details</h3>
                        {successData.map(order => (
                            <div key={order.id} style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Order #{order.id}</span>
                                </div>
                                {(() => {
                                    const items = order.items || [{ productName: order.productName, quantity: order.quantity, total: order.total }];
                                    return items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                            <span>{item.quantity}x {item.productName}</span>
                                            <span style={{ fontWeight: 600 }}>₹{(item.total || 0).toFixed(2)}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontWeight: 700 }}>
                            <span>Total Paid</span>
                            <span style={{ color: 'var(--color-primary-dark)' }}>₹{paidTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <button onClick={() => navigate('/')} className="btn btn-primary" style={{ padding: '0.875rem 2rem' }}>
                        Return to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '4rem 0', maxWidth: '1000px', flex: 1 }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Checkout</h1>

            {checkoutError && (
                <div style={{ background: 'var(--color-danger)15', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertTriangle size={20} />
                    <span style={{ fontWeight: 500 }}>{checkoutError}</span>
                </div>
            )}

            <div className="md-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>

                {/* Checkout Form */}
                <div className="card" style={{ padding: '2rem' }}>
                    <form id="checkout-form" onSubmit={handleCheckout}>

                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            Shipping Information
                        </h3>

                        <div className="md-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="input-label">Full Name *</label>
                                <input type="text" name="name" required className="input-field" value={formData.name} onChange={handleChange} />
                            </div>

                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="input-label">Email Address *</label>
                                <input type="email" name="email" required className="input-field" value={formData.email} onChange={handleChange} />
                            </div>

                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="input-label">Phone Number *</label>
                                <input type="tel" name="phone" required className="input-field" value={formData.phone} onChange={handleChange} placeholder="Required for shipping updates" />
                            </div>

                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="input-label">Street Address *</label>
                                <input type="text" name="address" required className="input-field" value={formData.address} onChange={handleChange} />
                            </div>

                            <div className="input-group">
                                <label className="input-label">City *</label>
                                <input type="text" name="city" required className="input-field" value={formData.city} onChange={handleChange} />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Zip / Postal Code *</label>
                                <input type="text" name="zip" required className="input-field" value={formData.zip} onChange={handleChange} />
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', marginTop: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CreditCard size={20} className="text-muted" /> Payment Details
                        </h3>

                        <div className="md-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="input-label">Card Number *</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" name="cardNumber" required className="input-field" placeholder="0000 0000 0000 0000" maxLength="19" value={formData.cardNumber} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
                                    <CreditCard size={18} className="text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Expiry (MM/YY) *</label>
                                <input type="text" name="expiry" required className="input-field" placeholder="12/25" maxLength="5" value={formData.expiry} onChange={handleChange} />
                            </div>

                            <div className="input-group">
                                <label className="input-label">CVC *</label>
                                <input type="text" name="cvc" required className="input-field" placeholder="123" maxLength="4" value={formData.cvc} onChange={handleChange} />
                            </div>
                        </div>

                    </form>
                </div>

                {/* Order Summary Sidebar */}
                <div>
                    <div className="card" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Order Summary</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            {cart.map((item, idx) => {
                                const liveProduct = products.find(p => p.id === item.product.id);
                                const isOutOfStock = !liveProduct || liveProduct.quantity < item.quantity;

                                return (
                                    <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', opacity: isOutOfStock ? 0.6 : 1 }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: `url(${item.product.image}) center/cover`, border: '1px solid var(--border-color)', flexShrink: 0 }}></div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.2, marginBottom: '0.25rem', color: isOutOfStock ? 'var(--color-danger)' : 'inherit' }}>
                                                {item.product.name}
                                            </p>
                                            <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                Qty: {item.quantity} {isOutOfStock && <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>(Unavailable)</span>}
                                            </p>
                                        </div>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>₹{(item.product.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>Subtotal</span>
                            <span>₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                            <span>Estimated Tax (Added)</span>
                            <span>{addedTaxes > 0 ? `₹${addedTaxes.toFixed(2)}` : 'Calculated in items'}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Total</span>
                            <span style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--color-primary-dark)' }}>₹{finalTotal.toFixed(2)}</span>
                        </div>

                        <button
                            form="checkout-form"
                            type="submit"
                            className="btn btn-primary"
                            disabled={isProcessing || cart.some(item => {
                                const live = products.find(p => p.id === item.product.id);
                                const liveQty = live ? Number(live.quantity) : 0;
                                const cartQty = Number(item.quantity) || 0;
                                return !live || liveQty < cartQty;
                            })}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                fontSize: '1.125rem',
                                justifyContent: 'center',
                                marginBottom: '1rem',
                                opacity: isProcessing ? 0.7 : 1
                            }}
                        >
                            {isProcessing ? 'Processing Transaction...' : `Pay ₹${finalTotal.toFixed(2)}`}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            <Lock size={12} /> Secure encrypted checkout
                            <ShieldCheck size={14} style={{ marginLeft: '0.25rem', color: 'var(--color-success)' }} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CheckoutPage;
