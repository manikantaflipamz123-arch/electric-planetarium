import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import { useProductStore } from '../store/productStore';
import { ShoppingCart, Trash2, ArrowRight, ScanLine, AlertCircle } from 'lucide-react';

const CartPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const cart = useOrderStore(state => state.cart);
    const addToCart = useOrderStore(state => state.addToCart);
    const updateQuantity = useOrderStore(state => state.updateCartQuantity);
    const removeFromCart = useOrderStore(state => state.removeFromCart);
    const products = useProductStore(state => state.products);
    const fetchProducts = useProductStore(state => state.fetchProducts);
    const isLoading = useProductStore(state => state.isLoading);

    // Fetch fresh global products so the QR code can find its matching target by name
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // Calculate taxes to show to the user
    // If inclusive, the tax is extracted from the price (doesn't increase total)
    // If exclusive, the tax is added ON TOP of the price (increases total)
    let addedTaxes = 0;
    let inclusiveTaxes = 0;

    cart.forEach((item) => {
        const liveProduct = products.find(p => p.id === item.product.id) || item.product;
        const rate = liveProduct.taxRate !== undefined ? liveProduct.taxRate / 100 : 0.18;
        const itemGross = liveProduct.price * item.quantity;

        if (liveProduct.isGstInclusive) {
            // Formula: Tax = (MRP * Rate) / (1 + Rate)
            inclusiveTaxes += (itemGross * rate) / (1 + rate);
        } else {
            // Formula: Tax = Price * Rate
            addedTaxes += itemGross * rate;
        }
    });

    const finalTotal = cartTotal + addedTaxes;

    // Look for items in the cart that are now out of stock or have insufficient quantity
    const hasInsufficientStock = cart.some(item => {
        const liveProduct = products.find(p => p.id === item.product.id);
        const liveQty = liveProduct ? Number(liveProduct.quantity) : 0;
        const cartQty = Number(item.quantity) || 0;
        return !liveProduct || liveQty < cartQty;
    });

    const hasProcessedQR = useRef(false);

    // Handle real QR Scan quick-add via query params
    useEffect(() => {
        // Wait until products have loaded from DB before attempting to match QR payload
        if (isLoading || products.length === 0) return;

        const params = new URLSearchParams(location.search);
        const quickadd = params.get('quickadd');

        if (quickadd && hasProcessedQR.current !== quickadd) {
            hasProcessedQR.current = quickadd;
            try {
                const decoded = JSON.parse(atob(quickadd));
                const targetName = String(decoded.n).toLowerCase().trim();
                const product = products.find(p => String(p.name).toLowerCase().trim() === targetName);

                if (product) {
                    // Check if they already have some in cart to validate total requested quantity using fresh state
                    const currentCart = useOrderStore.getState().cart;
                    const existingCartItem = currentCart.find(item => item.product.id === product.id);

                    const liveProductQty = Number(product.quantity) || 0;
                    const currentCartQty = existingCartItem ? Number(existingCartItem.quantity) : 0;

                    console.log(`[QR-DEBUG] Attempting to add:`, product.name);
                    console.log(`[QR-DEBUG] Available live stock limit:`, liveProductQty);
                    console.log(`[QR-DEBUG] Current amount inside cart:`, currentCartQty);

                    if (liveProductQty > currentCartQty) {
                        addToCart(product, 1);
                        navigate('/cart', { replace: true });
                    } else {
                        setTimeout(() => alert(`Sorry, "${product.name}" is out of stock or you have reached the limit!`), 100);
                        navigate('/cart', { replace: true });
                    }
                } else {
                    console.error("[QR-DEBUG] Product not found in database for search term:", targetName);
                }
            } catch (e) {
                console.error("Invalid QR target data", e);
            }
        }
    }, [location.search, products, addToCart, navigate, isLoading]);

    const handleUpdateQuantity = (productId, newQuantity, maxAvailable) => {
        if (newQuantity > maxAvailable) {
            alert("You cannot add more than the available stock.");
            return;
        }
        updateQuantity(productId, newQuantity);
    };

    return (
        <div className="container" style={{ padding: '4rem 0', maxWidth: '1000px', flex: 1 }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ShoppingCart size={32} /> Your Cart
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {cart.length === 0 ? (
                    <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--text-muted)' }}>
                            <ShoppingCart size={40} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Your cart is empty</h2>
                        <p className="text-muted" style={{ marginBottom: '2rem' }}>
                            Scan a seller's live QR code or browse products to add them here.
                        </p>
                    </div>
                ) : (
                    <div className="md-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>

                        {/* Cart Items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {hasInsufficientStock && (
                                <div style={{ background: 'var(--color-danger)15', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <AlertCircle size={20} />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        One or more items in your cart have sold out or do not have enough stock. Please adjust your quantities.
                                    </span>
                                </div>
                            )}

                            {cart.map((item) => {
                                const liveProduct = products.find(p => p.id === item.product.id) || item.product;
                                const maxAvailable = liveProduct ? Number(liveProduct.quantity) : 0;
                                const cartQty = Number(item.quantity) || 0;
                                const isOversold = cartQty > maxAvailable;

                                return (
                                    <div key={item.product.id} className="card" style={{ display: 'flex', padding: '1rem', gap: '1.5rem', alignItems: 'center', opacity: isOversold ? 0.7 : 1, border: isOversold ? '1px solid var(--color-danger)' : undefined }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: `url(${item.product.image}) center/cover`, border: '1px solid var(--border-color)' }}></div>

                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', color: isOversold ? 'var(--color-danger)' : 'inherit' }}>{item.product.name}</h3>
                                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>₹{item.product.price.toFixed(2)} each</p>

                                            {isOversold && (
                                                <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem' }}>
                                                    {maxAvailable === 0 ? "Out of stock!" : `Only ${maxAvailable} remaining!`}
                                                </p>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: isOversold ? 'var(--color-danger)10' : 'transparent' }}>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.product.id, cartQty - 1, maxAvailable)}
                                                    style={{ padding: '0.5rem 0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', borderRight: '1px solid var(--border-color)' }}
                                                >-</button>
                                                <span style={{ padding: '0 1rem', fontWeight: 500, color: isOversold ? 'var(--color-danger)' : 'inherit' }}>{cartQty}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.product.id, cartQty + 1, maxAvailable)}
                                                    disabled={cartQty >= maxAvailable}
                                                    style={{ padding: '0.5rem 0.75rem', background: 'transparent', border: 'none', cursor: cartQty >= maxAvailable ? 'not-allowed' : 'pointer', borderLeft: '1px solid var(--border-color)', opacity: cartQty >= maxAvailable ? 0.5 : 1 }}
                                                >+</button>
                                            </div>

                                            <p style={{ fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>
                                                ₹{(item.product.price * item.quantity).toFixed(2)}
                                            </p>

                                            <button
                                                onClick={() => removeFromCart(item.product.id)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.5rem', color: 'var(--color-danger)' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Summary */}
                        <div className="card" style={{ padding: '2rem', height: 'fit-content', position: 'sticky', top: '100px' }}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Order Summary</h3>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                <span>₹{cartTotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                                <span>Taxes</span>
                                <div style={{ textAlign: 'right' }}>
                                    {addedTaxes > 0 && <div>+ ₹{addedTaxes.toFixed(2)} (Exclusive)</div>}
                                    {inclusiveTaxes > 0 && <div style={{ fontSize: '0.75rem' }}>Includes ₹{inclusiveTaxes.toFixed(2)} GST</div>}
                                    {addedTaxes === 0 && inclusiveTaxes === 0 && <div>Calculated at checkout</div>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Estimated Total</span>
                                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>₹{finalTotal.toFixed(2)}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button
                                    onClick={() => navigate('/scan')}
                                    className="btn btn-outline"
                                    style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', justifyContent: 'center' }}
                                >
                                    Keep Scanning (Leave Cart)
                                </button>

                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="btn btn-primary"
                                    disabled={hasInsufficientStock}
                                    style={{ width: '100%', padding: '0.875rem', fontSize: '1.125rem', justifyContent: 'center', opacity: hasInsufficientStock ? 0.6 : 1, cursor: hasInsufficientStock ? 'not-allowed' : 'pointer' }}
                                >
                                    Proceed to Checkout <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;
