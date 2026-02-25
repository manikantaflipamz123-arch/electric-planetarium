import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { ArrowRight, Video, Zap, Package, Truck, TrendingUp, CheckCircle, Smartphone } from 'lucide-react';
import { Helmet } from 'react-helmet';

const LandingPage = () => {
    const loginAsVendor = useAppStore(state => state.loginAsVendor);
    const navigate = useNavigate();

    const handleDemoVendor = () => {
        loginAsVendor();
        navigate('/vendor/dashboard');
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Helmet>
                <title>ShopLiveDeals | 10x Your Live Selling Revenue</title>
                <meta name="description" content="Automate your live-stream sales. Generate instant QR codes, manage inventory, and automate shipping labels without any manual entry. Built for power sellers." />
            </Helmet>

            {/* Hero Section */}
            <section style={{
                padding: '10vw 5vw',
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-subtle) 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Abstract Background Elements */}
                <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw', background: 'var(--color-primary)', opacity: 0.1, filter: 'blur(80px)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '40vw', height: '40vw', background: 'var(--color-success)', opacity: 0.1, filter: 'blur(80px)', borderRadius: '50%' }}></div>

                <div className="container" style={{ maxWidth: '900px', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--color-primary-dark)',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        marginBottom: '2rem',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                        <TrendingUp size={16} /> Stop manually confirming orders. Start scaling.
                    </div>

                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                        Sell seamlessly on Live Streams. <br />
                        <span style={{ color: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', backgroundImage: 'linear-gradient(90deg, var(--color-primary), #a855f7)' }}>10x Your Revenue.</span>
                    </h1>

                    <p style={{ fontSize: 'clamp(1.125rem, 2vw, 1.25rem)', color: 'var(--text-muted)', marginBottom: '3rem', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto 3rem auto' }}>
                        No more unread DMs or manual shipping labels. ShopLiveDeals automates your entire live-selling workflow from instant QR-code purchases to automated PDF shipping labels.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/onboarding" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem', borderRadius: 'var(--radius-full)' }}>
                            Start Selling Today <ArrowRight size={20} />
                        </Link>
                        <button onClick={handleDemoVendor} className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem', background: 'white', borderRadius: 'var(--radius-full)' }}>
                            View Seller Demo
                        </button>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'flex', gap: '2rem', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="var(--color-success)" /> Zero Setup Fees</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="var(--color-success)" /> Automated Waybills</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="var(--color-success)" /> Pay-As-You-Go Commission</span>
                    </div>
                </div>
            </section>

            {/* How It Works (Value Prop) */}
            <section style={{ padding: '8vw 5vw', background: 'white' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 5rem auto' }}>
                        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>How ShopLiveDeals works</h2>
                        <p className="text-muted" style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>Turn your livestream audience into paying customers in three simple steps without ever leaving your camera.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                        {/* Step 1 */}
                        <div style={{ position: 'relative', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '1.5rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '1rem', background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
                                1
                            </div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 700 }}>Flash the QR Code</h3>
                            <p className="text-muted" style={{ lineHeight: 1.6 }}>Generate a unique QR code for your product instantly. Flash it on your YouTube or Instagram Live. Your viewers just point their camera to buy.</p>
                        </div>

                        {/* Step 2 */}
                        <div style={{ position: 'relative', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '1.5rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '1rem', background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
                                2
                            </div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 700 }}>Instant Checkout</h3>
                            <p className="text-muted" style={{ lineHeight: 1.6 }}>Customers check out in seconds via their mobile phones. Inventory automatically syncs and prevents overselling while you keep streaming.</p>
                        </div>

                        {/* Step 3 */}
                        <div style={{ position: 'relative', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px -20px rgba(99,102,241,0.2)' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '1rem', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
                                3
                            </div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 700 }}>Automated Labels</h3>
                            <p className="text-muted" style={{ lineHeight: 1.6 }}>No more handwriting addresses. We automatically generate professional, scannable PDF shipping labels with the customer's exact details.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Feature Grid */}
            <section style={{ padding: '8vw 5vw', background: 'var(--bg-surface)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        {[
                            { icon: Smartphone, title: 'Mobile-First Design', desc: 'Optimized for high-speed mobile checkouts so your social-media audience converts instantly.' },
                            { icon: Zap, title: 'Real-time Sync', desc: 'Your inventory updates instantly across all platforms preventing embarrassing out-of-stock purchases.' },
                            { icon: TrendingUp, title: 'Built for Scale', desc: 'Whether you process 10 or 10,000 orders a day, our dashboard keeps your fulfillment organized.' },
                            { icon: Truck, title: 'Professional Fulfillment', desc: 'Instantly download routing-ready PDF shipping labels compliant with all major Indian logistics carriers.' }
                        ].map((feature, i) => (
                            <div key={i} className="card" style={{ padding: '2rem', transition: 'transform 0.2s ease', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                    <feature.icon size={24} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>{feature.title}</h3>
                                <p className="text-muted" style={{ lineHeight: 1.6 }}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '8vw 5vw', background: 'var(--color-primary-dark)', color: 'white', textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: '700px' }}>
                    <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Ready to dominate live commerce?</h2>
                    <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', marginBottom: '3rem', lineHeight: 1.6 }}>
                        Join hundreds of sellers scaling their businesses with ShopLiveDeals. Setup takes less than 2 minutes.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/onboarding" className="btn" style={{ padding: '1rem 3rem', fontSize: '1.125rem', borderRadius: 'var(--radius-full)', background: 'white', color: 'var(--color-primary-dark)', fontWeight: 700 }}>
                            Apply as a Seller
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
