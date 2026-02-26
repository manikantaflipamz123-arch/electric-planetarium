import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

const StatusPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        const query = searchQuery.trim();

        if (!query) return;

        setIsLoading(true);
        setSearchResult(null);
        setHasSearched(false);

        try {
            const response = await fetch(`/api/vendor?action=status&query=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResult(data.application);
            } else {
                setSearchResult(null);
            }
        } catch (error) {
            console.error("Status fetch error:", error);
            setSearchResult(null);
        } finally {
            setIsLoading(false);
            setHasSearched(true);
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 0', maxWidth: '600px', flex: 1 }}>

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Check Application Status</h1>
                <p className="text-muted" style={{ fontSize: '1.125rem' }}>
                    Enter your Application ID or GST Number to track your onboarding progress.
                </p>
            </div>

            <div className="card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. app_12345 or 22AAAAA0000A1Z5"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: '2.75rem' }}
                                required
                            />
                            <Search size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 2rem' }} disabled={isLoading}>
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            {hasSearched && (
                <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                    {!searchResult ? (
                        <div>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-subtle)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Search size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Application Found</h3>
                            <p className="text-muted">We couldn't find an application matching that ID or GST number. Please check your spelling and try again.</p>
                        </div>
                    ) : (
                        <div>
                            {searchResult.status === 'PENDING' && (
                                <>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-warning)20', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                        <Clock size={32} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Application Under Review</h3>
                                    <p className="text-muted" style={{ marginBottom: '2rem' }}>Your store <strong>{searchResult.storeName}</strong> is currently being reviewed by our moderation team. We will update this status soon.</p>
                                </>
                            )}

                            {searchResult.status === 'APPROVED' && (
                                <>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Application Approved!</h3>
                                    <p className="text-muted" style={{ marginBottom: '2rem' }}>Congratulations! Your store setup is complete. You can now log in to your Vendor Dashboard.</p>
                                    <Link to="/login" className="btn btn-primary">
                                        Go to Login <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                                    </Link>
                                </>
                            )}

                            {searchResult.status === 'REJECTED' && (
                                <>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                        <XCircle size={32} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Application Rejected</h3>
                                    <p className="text-muted" style={{ marginBottom: '2rem' }}>Unfortunately, your application for <strong>{searchResult.storeName}</strong> was not approved at this time.</p>

                                    {searchResult.rejectionReason && (
                                        <div style={{ background: 'var(--color-danger)10', borderLeft: '4px solid var(--color-danger)', padding: '1.5rem', borderRadius: '0 var(--radius-md) var(--radius-md) 0', textAlign: 'left', marginBottom: '2rem' }}>
                                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-danger)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason for Rejection</h4>
                                            <p style={{ color: 'var(--text-color)', lineHeight: 1.5 }}>{searchResult.rejectionReason}</p>
                                        </div>
                                    )}

                                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>You may submit a new application once you have resolved these issues.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default StatusPage;
