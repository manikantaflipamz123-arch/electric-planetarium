import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendorStore } from '../store/vendorStore';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        storeName: '',
        gstNumber: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        password: '',
        email: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeName: formData.storeName,
                    gstNumber: formData.gstNumber,
                    accountNumber: formData.accountNumber, // Map to DB bankAccount
                    bankAccount: formData.accountNumber,   // Safety mapping
                    ifscCode: formData.ifscCode,
                    bankName: formData.bankName,
                    password: formData.password,
                    email: formData.email
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }


            setIsSubmitting(false);
            setSuccess(true);
        } catch (err) {
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="container" style={{ padding: '6rem 0', maxWidth: '600px', textAlign: 'center' }}>
                <div className="card" style={{ padding: '3rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', fontSize: '2rem' }}>
                        ✓
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Application Submitted!</h2>
                    <p className="text-muted" style={{ marginBottom: '2rem' }}>
                        Thank you for applying to ShopLiveDeals. Our team will review your application and get back to you shortly. You can check your application status anytime using your GST number.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button onClick={() => navigate('/status')} className="btn btn-primary" style={{ width: '100%' }}>
                            Check Application Status
                        </button>
                        <button onClick={() => navigate('/')} className="btn btn-outline" style={{ width: '100%' }}>
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '4rem 0', maxWidth: '600px' }}>
            <div className="card" style={{ padding: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Become a Seller</h2>
                <p className="text-muted" style={{ marginBottom: '2rem' }}>Fill out the form below to start your journey with ShopLiveDeals.</p>

                {error && (
                    <div style={{ padding: '1rem', background: 'var(--color-danger)', color: 'white', borderRadius: '4px', marginBottom: '2rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Business Details</h3>

                        <div className="input-group">
                            <label className="input-label">Store / Company Name *</label>
                            <input
                                type="text"
                                name="storeName"
                                required
                                className="input-field"
                                placeholder="e.g. Acme Electronics"
                                onChange={handleChange}
                                value={formData.storeName}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="input-field"
                                placeholder="vendor@example.com"
                                onChange={handleChange}
                                value={formData.email}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Create a Dashboard Password *</label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="input-field"
                                placeholder="Strong password"
                                onChange={handleChange}
                                value={formData.password}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">GST Number *</label>
                            <input
                                type="text"
                                name="gstNumber"
                                required
                                className="input-field"
                                placeholder="22AAAAA0000A1Z5"
                                onChange={handleChange}
                                value={formData.gstNumber}
                            />
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '1rem' }}>Bank Details</h3>

                        <div className="input-group">
                            <label className="input-label">Bank Name *</label>
                            <input
                                type="text"
                                name="bankName"
                                required
                                className="input-field"
                                placeholder="HDFC Bank"
                                onChange={handleChange}
                                value={formData.bankName}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Account Number *</label>
                                <input
                                    type="text"
                                    name="accountNumber"
                                    required
                                    className="input-field"
                                    placeholder="000000000000"
                                    onChange={handleChange}
                                    value={formData.accountNumber}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">IFSC Code *</label>
                                <input
                                    type="text"
                                    name="ifscCode"
                                    required
                                    className="input-field"
                                    placeholder="HDFC0001234"
                                    onChange={handleChange}
                                    value={formData.ifscCode}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                        style={{ width: '100%', marginTop: '1rem', padding: '0.875rem', fontSize: '1rem' }}
                    >
                        {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingPage;
