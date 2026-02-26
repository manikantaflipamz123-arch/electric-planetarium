import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../../store/productStore';
import { useAppStore } from '../../store/appStore';
import { Package, Pencil, Trash2, Check, X, Download, Maximize2, Copy, Link } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const InventoryPage = () => {
    const navigate = useNavigate();
    const currentUser = useAppStore(state => state.currentUser);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'vendor') {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    // Use fetchProducts when component mounts
    const fetchProducts = useProductStore(state => state.fetchProducts);

    useEffect(() => {
        if (currentUser && currentUser.role === 'vendor') {
            // Using ID from the appStore which was hydrated by login
            fetchProducts(currentUser.vendorProfileId || currentUser.id);
        }
    }, [currentUser, fetchProducts]);

    const products = useProductStore(state => state.products).filter(p => true); // Data is already filtered by API based on vendorId
    const updateProduct = useProductStore(state => state.updateProduct);
    const deleteProduct = useProductStore(state => state.deleteProduct);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', price: 0, quantity: 0, taxRate: 18, isGstInclusive: false, hsn: '' });
    const [selectedQrProduct, setSelectedQrProduct] = useState(null);
    const [copiedLink, setCopiedLink] = useState(null);

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id);
            } catch (error) {
                alert(`Error deleting product: ${error.message}`);
            }
        }
    };

    const handleEditStart = (product) => {
        setEditingId(product.id);
        setEditForm({
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            taxRate: product.taxRate !== undefined ? product.taxRate : 18,
            isGstInclusive: product.isGstInclusive || false,
            hsn: product.hsn || ''
        });
    };

    const handleEditSave = async (id) => {
        try {
            await updateProduct(id, {
                name: editForm.name,
                price: Number(editForm.price),
                quantity: Number(editForm.quantity),
                taxRate: Number(editForm.taxRate),
                isGstInclusive: editForm.isGstInclusive,
                hsn: editForm.hsn
            });
            setEditingId(null);
        } catch (error) {
            alert(`Error updating product: ${error.message}`);
        }
    };

    const handleDownloadQR = (product) => {
        // Find the hidden large SVG
        const svg = document.getElementById(`qr-large-${product.id}`);
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.download = `QR_${product.name}.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handleCopyLink = (product) => {
        const link = `${window.location.origin}/cart?quickadd=${btoa(JSON.stringify({ n: product.name }))}`;
        navigator.clipboard.writeText(link);
        setCopiedLink(product.id);
        setTimeout(() => setCopiedLink(null), 2000);
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Inventory Management</h2>
                    <p className="text-muted">Manage your available live-commerce products.</p>
                </div>
                <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Package size={20} className="text-muted" />
                    <span style={{ fontWeight: 600 }}>{products.length} Products Active</span>
                </div>
            </div>

            <div className="card">
                {products.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>You have not added any products yet.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Image</th>
                                <th>Product Details</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Tax / HSN</th>
                                <th>QR Code</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const isEditing = editingId === product.id;

                                return (
                                    <tr key={product.id}>
                                        <td>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: `url(${product.image}) center/cover`, border: '1px solid var(--border-color)' }}></div>
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    className="input-field"
                                                    style={{ marginBottom: '0.25rem', padding: '0.25rem 0.5rem' }}
                                                    value={editForm.name}
                                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                />
                                            ) : (
                                                <div style={{ fontWeight: 500 }}>{product.name}</div>
                                            )}
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {product.id}</div>
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    style={{ width: '80px', padding: '0.25rem 0.5rem' }}
                                                    value={editForm.price}
                                                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                                />
                                            ) : (
                                                <span style={{ fontWeight: 500 }}>₹{product.price ? product.price.toFixed(2) : '0.00'}</span>
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    style={{ width: '80px', padding: '0.25rem 0.5rem' }}
                                                    value={editForm.quantity}
                                                    onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                                                />
                                            ) : (
                                                <span className={product.quantity === 0 ? "badge badge-danger" : product.quantity < 10 ? "badge badge-warning" : "badge"} style={product.quantity >= 10 ? { background: 'var(--bg-subtle)' } : {}}>
                                                    {product.quantity === 0 ? "Out of Stock" : `${product.quantity} units`}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                                        <input
                                                            type="number"
                                                            className="input-field"
                                                            style={{ width: '60px', padding: '0.25rem' }}
                                                            value={editForm.taxRate}
                                                            onChange={e => setEditForm({ ...editForm, taxRate: e.target.value })}
                                                            placeholder="Tax %"
                                                        />
                                                        <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={editForm.isGstInclusive}
                                                                onChange={e => setEditForm({ ...editForm, isGstInclusive: e.target.checked })}
                                                            /> Inc.
                                                        </label>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        style={{ width: '100px', padding: '0.25rem' }}
                                                        value={editForm.hsn}
                                                        onChange={e => setEditForm({ ...editForm, hsn: e.target.value })}
                                                        placeholder="HSN"
                                                    />
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                                                    <span>{product.taxRate !== undefined ? product.taxRate : 18}% Tax {product.isGstInclusive ? '(Inc.)' : '(Exc.)'}</span>
                                                    {product.hsn && <span className="text-muted">HSN: {product.hsn}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div
                                                    onClick={() => setSelectedQrProduct(product)}
                                                    style={{ background: 'white', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer', position: 'relative' }}
                                                    title="Click to enlarge QR Code"
                                                    onMouseEnter={(e) => { e.currentTarget.lastChild.style.opacity = '1'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.lastChild.style.opacity = '0'; }}
                                                >
                                                    <QRCodeSVG
                                                        id={`qr-small-${product.id}`}
                                                        value={`${window.location.origin}/cart?quickadd=${btoa(JSON.stringify({ n: product.name }))}`}
                                                        size={40}
                                                        level="L"
                                                    />
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', opacity: 0, transition: 'opacity 0.2s', borderRadius: '3px' }}>
                                                        <Maximize2 size={24} color="var(--color-primary-dark)" />
                                                    </div>
                                                </div>

                                                {/* Hidden High-Res QR for Downloader */}
                                                <div style={{ display: 'none' }}>
                                                    <QRCodeSVG
                                                        id={`qr-large-${product.id}`}
                                                        value={`${window.location.origin}/cart?quickadd=${btoa(JSON.stringify({ n: product.name }))}`}
                                                        size={300}
                                                        level="L"
                                                    />
                                                </div>

                                                <button
                                                    onClick={() => handleCopyLink(product)}
                                                    className="btn btn-ghost"
                                                    style={{ padding: '0.25rem', color: copiedLink === product.id ? 'var(--color-success)' : 'var(--color-primary-dark)' }}
                                                    title={copiedLink === product.id ? "Copied!" : "Copy Direct Link"}
                                                >
                                                    {copiedLink === product.id ? <Check size={18} /> : <Link size={18} />}
                                                </button>

                                                <button
                                                    onClick={() => handleDownloadQR(product)}
                                                    className="btn btn-ghost"
                                                    style={{ padding: '0.25rem', color: 'var(--color-primary-dark)' }}
                                                    title="Download Large QR Code"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={() => handleEditSave(product.id)} className="btn btn-primary" style={{ padding: '0.375rem 0.5rem' }} title="Save">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="btn btn-ghost" style={{ padding: '0.375rem 0.5rem', color: 'var(--text-muted)' }} title="Cancel">
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditStart(product)}
                                                            className="btn btn-ghost"
                                                            style={{ padding: '0.5rem', color: 'var(--text-muted)' }}
                                                            title="Edit Product"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="btn btn-ghost"
                                                            style={{ padding: '0.5rem', color: 'var(--color-danger)' }}
                                                            title="Delete Product"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* QR Code Modal Popup */}
            {selectedQrProduct && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="card" style={{ padding: '2.5rem', textAlign: 'center', width: '400px', maxWidth: '90%', margin: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>{selectedQrProduct.name}</h3>

                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                            <QRCodeSVG
                                value={`${window.location.origin}/cart?quickadd=${btoa(JSON.stringify({ n: selectedQrProduct.name }))}`}
                                size={250}
                                level="L"
                            />
                        </div>

                        <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '0.875rem' }}>
                            Show this exact code during your live stream for instant customer checkouts!
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setSelectedQrProduct(null)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Close</button>
                            <button onClick={() => handleCopyLink(selectedQrProduct)} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: copiedLink === selectedQrProduct.id ? 'var(--color-success)' : undefined, borderColor: copiedLink === selectedQrProduct.id ? 'var(--color-success)' : undefined }}>
                                {copiedLink === selectedQrProduct.id ? <Check size={18} /> : <Link size={18} />}
                                {copiedLink === selectedQrProduct.id ? 'Copied' : 'Copy Link'}
                            </button>
                            <button onClick={() => { handleDownloadQR(selectedQrProduct); }} className="btn btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Download size={18} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
