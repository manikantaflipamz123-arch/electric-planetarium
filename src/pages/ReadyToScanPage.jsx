import { useNavigate } from 'react-router-dom';
import { Camera, ShoppingCart, ArrowLeft, QrCode } from 'lucide-react';
import { useOrderStore } from '../store/orderStore';

const ReadyToScanPage = () => {
    const navigate = useNavigate();
    const cart = useOrderStore(state => state.cart);
    const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <div className="container" style={{ padding: '6rem 0', maxWidth: '600px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="card" style={{ padding: '4rem 2rem' }}>
                <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 2rem' }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--color-primary-light)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid var(--color-primary-light)', zIndex: 10 }}>
                        <QrCode size={48} color="var(--color-primary-dark)" />
                    </div>
                </div>

                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 700 }}>Ready for next item</h2>
                <p className="text-muted" style={{ fontSize: '1.125rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                    Minimize this browser window and open your phone's <strong>Camera App</strong> to scan the next product QR code on the live stream.
                </p>

                <div style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShoppingCart size={24} className="text-muted" />
                        <div style={{ textAlign: 'left' }}>
                            <p style={{ fontWeight: 600, margin: 0 }}>Current Cart</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>{cartItemCount} item(s) secured</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/cart')} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                        View Cart
                    </button>
                </div>

                <style>
                    {`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: .5; transform: scale(1.1); }
                    }
                    `}
                </style>
            </div>
        </div>
    );
};

export default ReadyToScanPage;
