import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVendorStore } from '../../store/vendorStore';
import { useAppStore } from '../../store/appStore';
import { ArrowLeft, CheckCircle, XCircle, Store, FileText, Building2, AlertTriangle } from 'lucide-react';

const SellerDetailsPage = () => {
    const { id } = useParams();
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
    const approveApplication = useVendorStore(state => state.approveApplication);
    const rejectApplication = useVendorStore(state => state.rejectApplication);

    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const application = applications.find(a => a.id === id);

    if (!application) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Application Not Found</h2>
                <button className="btn btn-outline" onClick={() => navigate('/admin')}>Return to Dashboard</button>
            </div>
        );
    }

    const handleApprove = () => {
        approveApplication(id);
    };

    const handleRejectClick = () => {
        setIsRejecting(true);
    };

    const handleConfirmReject = () => {
        if (!rejectionReason.trim()) return;
        rejectApplication(id, rejectionReason.trim());
        setIsRejecting(false);
    };

    const handleCancelReject = () => {
        setIsRejecting(false);
        setRejectionReason('');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button
                onClick={() => navigate('/admin')}
                className="btn btn-ghost"
                style={{ marginBottom: '2rem', padding: '0.5rem 0' }}
            >
                <ArrowLeft size={18} /> Back to Applications
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {application.storeName}
                        {application.status === 'PENDING' && <span className="badge badge-warning">Pending</span>}
                        {application.status === 'APPROVED' && <span className="badge badge-success">Approved</span>}
                        {application.status === 'REJECTED' && <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>Rejected</span>}
                    </h2>
                    <p className="text-muted">Application ID: {application.id}</p>
                </div>

                {application.status === 'PENDING' && !isRejecting && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={handleRejectClick} className="btn btn-outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                            <XCircle size={18} /> Reject
                        </button>
                        <button onClick={handleApprove} className="btn" style={{ background: 'var(--color-success)', color: 'white' }}>
                            <CheckCircle size={18} /> Approve Vendor
                        </button>
                    </div>
                )}
            </div>

            {isRejecting && (
                <div className="card" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '4px solid var(--color-danger)' }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={18} /> Provide Rejection Reason
                    </h3>
                    <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>This reason will be shown to the applicant so they can correct their submission.</p>
                    <textarea
                        className="input-field"
                        rows="3"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="E.g., The GST number provided is invalid..."
                        style={{ width: '100%', marginBottom: '1rem' }}
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={handleConfirmReject} disabled={!rejectionReason.trim()} className="btn" style={{ background: 'var(--color-danger)', color: 'white' }}>Confirm Rejection</button>
                        <button onClick={handleCancelReject} className="btn btn-ghost">Cancel</button>
                    </div>
                </div>
            )}

            {application.status === 'REJECTED' && application.rejectionReason && (
                <div className="card" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '4px solid var(--color-danger)', background: 'var(--color-danger)05' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--color-danger)' }}>Rejection Reason</h3>
                    <p>{application.rejectionReason}</p>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Business Info */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <Store size={20} className="text-muted" /> Business Details
                    </h3>

                    <div className="md-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Store Name</p>
                            <p style={{ fontWeight: 500, fontSize: '1.125rem' }}>{application.storeName}</p>
                        </div>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Submitted On</p>
                            <p style={{ fontWeight: 500 }}>{new Date(application.submittedAt).toLocaleString()}</p>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email Address</p>
                            <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'inline-block' }}>
                                {application.email || 'No email provided'}
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>GST Number</p>
                            <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', border: '1px solid var(--border-color)', display: 'inline-block' }}>
                                {application.gstNumber}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Info */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <Building2 size={20} className="text-muted" /> Bank Information
                    </h3>

                    <div className="md-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Bank Name</p>
                            <p style={{ fontWeight: 500, fontSize: '1.125rem' }}>{application.bankName}</p>
                        </div>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Account Number</p>
                            <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', border: '1px solid var(--border-color)', display: 'inline-block' }}>
                                {application.bankAccount}
                            </div>
                        </div>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>IFSC Code</p>
                            <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', border: '1px solid var(--border-color)', display: 'inline-block' }}>
                                {application.ifscCode}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDetailsPage;
