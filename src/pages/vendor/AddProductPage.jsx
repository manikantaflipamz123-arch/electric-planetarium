import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../../store/productStore';
import { useAppStore } from '../../store/appStore';
import { QRCodeSVG } from 'qrcode.react';
import { ImagePlus, Download, CheckCircle, Copy, Check } from 'lucide-react';

const AddProductPage = () => {
    const navigate = useNavigate();
    const currentUser = useAppStore(state => state.currentUser);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'vendor') {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    const addProduct = useProductStore(state => state.addProduct);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [copied, setCopied] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        quantity: '',
        taxRate: '18',
        isGstInclusive: false,
        hsn: '',
        image: ''
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality to ensure it stays well under Vercel's 4.5MB limit
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setFormData({ ...formData, image: dataUrl });
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            await addProduct(currentUser.vendorProfileId || currentUser.id, {
                name: formData.name,
                price: parseFloat(formData.price),
                quantity: parseInt(formData.quantity, 10),
                taxRate: parseFloat(formData.taxRate) || 0,
                isGstInclusive: formData.isGstInclusive,
                hsn: formData.hsn,
                image: formData.image || ''
            });
            setSuccess(true);
        } catch (error) {
            setSubmitError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Construct a checkout URL payload that would ideally point to a hosted checkout routing in production
    // We'll simulate its format with base64 encoding to demonstrate an EDITABLE target logic in reality.
    const previewData = btoa(JSON.stringify({ n: formData.name, p: formData.price }));
    const qrTarget = `${window.location.origin}/cart?quickadd=${previewData}`;

    const downloadQR = () => {
        const svg = document.getElementById('product-qr');
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `QR_${formData.name.replace(/\s+/g, '_')}.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const copyDirectLink = () => {
        navigator.clipboard.writeText(qrTarget);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (success) {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '4rem 0' }}>
                <div className="card" style={{ padding: '3rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                        <CheckCircle size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Product Created Successfully!</h2>
                    <p className="text-muted" style={{ marginBottom: '2rem' }}>
                        Your product is now ready for live selling.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button onClick={() => navigate('/vendor/inventory')} className="btn btn-primary">
                            View Inventory
                        </button>
                        <button onClick={copyDirectLink} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
                            {copied ? 'Copied!' : 'Copy Direct Link'}
                        </button>
                        <button onClick={() => { setSuccess(false); setFormData({ name: '', price: '', quantity: '', taxRate: '18', isGstInclusive: false, hsn: '', image: '' }); }} className="btn btn-outline">
                            Add Another Product
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Add New Product</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div className="card" style={{ padding: '2rem' }}>
                    <form id="product-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label">Product Image</label>

                            <div style={{
                                border: '2px dashed var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                padding: '2rem',
                                textAlign: 'center',
                                position: 'relative',
                                background: formData.image ? `url(${formData.image}) center/cover` : 'transparent',
                                height: '200px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                                />
                                {!formData.image && (
                                    <>
                                        <ImagePlus size={32} className="text-muted" style={{ marginBottom: '1rem' }} />
                                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Click or drag a product photo here</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {submitError && (
                            <div style={{ padding: '1rem', background: 'var(--color-danger)', color: 'white', borderRadius: '4px', marginBottom: '1.5rem' }}>
                                {submitError}
                            </div>
                        )}
                        <div className="input-group">
                            <label className="input-label">Product Name *</label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="input-field"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Product title"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Price (₹) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="price"
                                    required
                                    className="input-field"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Initial Quantity *</label>
                                <input
                                    type="number"
                                    min="1"
                                    name="quantity"
                                    required
                                    className="input-field"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="100"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                            <div className="input-group">
                                <label className="input-label">Tax Rate (%) *</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="taxRate"
                                        required
                                        className="input-field"
                                        value={formData.taxRate}
                                        onChange={handleChange}
                                        placeholder="18"
                                        style={{ flex: 1 }}
                                    />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                                        <input
                                            type="checkbox"
                                            name="isGstInclusive"
                                            checked={formData.isGstInclusive}
                                            onChange={handleChange}
                                            style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                                        />
                                        Price is GST Inclusive
                                    </label>
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">HSN Number</label>
                                <input
                                    type="text"
                                    name="hsn"
                                    className="input-field"
                                    value={formData.hsn}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
                            {isSubmitting ? 'Saving...' : 'Save Product & Generate Live QR'}
                        </button>
                    </form>
                </div>

                {/* QR Preview Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Live Checkout QR</h3>

                        <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'inline-block', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                            <QRCodeSVG
                                id="product-qr"
                                value={qrTarget}
                                size={200}
                                level="M"
                                includeMargin={true}
                            />
                        </div>

                        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            Hold this up to the camera during your live stream. Customers can scan to buy instantly.
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                            <button
                                type="button"
                                onClick={copyDirectLink}
                                className="btn btn-outline"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderColor: copied ? 'var(--color-success)' : undefined, color: copied ? 'var(--color-success)' : undefined }}
                                disabled={!formData.name}
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'Copied to Clipboard' : 'Copy Direct Link'}
                            </button>

                            <button
                                type="button"
                                onClick={downloadQR}
                                className="btn btn-outline"
                                style={{ width: '100%' }}
                                disabled={!formData.name}
                            >
                                <Download size={18} /> Download High-Res QR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProductPage;
