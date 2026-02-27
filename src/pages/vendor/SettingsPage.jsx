import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { useVendorStore } from '../../store/vendorStore';
import { Settings as SettingsIcon, Bell, MapPin, User, CheckCircle } from 'lucide-react';

const SettingsPage = () => {
    const navigate = useNavigate();
    const currentUser = useAppStore(state => state.currentUser);
    const updateVendorSettings = useVendorStore(state => state.updateVendorSettings);
    // Temporary hack to update current user session display
    const loginAsVendor = useAppStore(state => state.loginAsVendor);

    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [profileData, setProfileData] = useState({
        storeName: currentUser?.storeName || currentUser?.name || '',
        email: currentUser?.email || `${currentUser?.id}@vendor.shoplivedeals.com`,
        phone: currentUser?.phone || '',
        address: currentUser?.address || '',
        city: currentUser?.city || '',
        zip: currentUser?.zip || ''
    });

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'vendor') {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    const handleChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
        setSaved(false);
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate API call
        setTimeout(() => {
            // Update the persistent vendor record
            updateVendorSettings(currentUser.id, profileData);

            // Update the active session so it reflects immediately
            loginAsVendor({ ...currentUser, ...profileData });

            setIsSaving(false);
            setSaved(true);

            setTimeout(() => setSaved(false), 3000);
        }, 800);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Store Settings</h2>

            {saved && (
                <div style={{ background: 'var(--color-success)15', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500 }}>
                    <CheckCircle size={20} />
                    Profile & Address Details Saved Successfully!
                </div>
            )}

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                <form className="card" style={{ padding: '2rem' }} onSubmit={handleSaveProfile}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                            <User size={20} className="text-muted" /> Public Store Profile
                        </h3>
                    </div>

                    <div className="md-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label">Public Store Name</label>
                            <input type="text" name="storeName" className="input-field" value={profileData.storeName} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Support Email Address</label>
                            <input type="email" name="email" className="input-field" value={profileData.email} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Support Phone Number</label>
                            <input type="tel" name="phone" className="input-field" value={profileData.phone} onChange={handleChange} placeholder="e.g. +91 9876543210" required />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <MapPin size={20} className="text-muted" /> Return Address (For Shipping Labels)
                    </h3>
                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.5rem', marginTop: '-1rem' }}>This address will be printed on all generated PDF shipping labels for undelivered returns.</p>

                    <div className="md-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label">Street Address</label>
                            <input type="text" name="address" className="input-field" value={profileData.address} onChange={handleChange} placeholder="Building, Street Name, Area" required />
                        </div>

                        <div className="input-group">
                            <label className="input-label">City / District</label>
                            <input type="text" name="city" className="input-field" value={profileData.city} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <label className="input-label">PIN / ZIP Code</label>
                            <input type="text" name="zip" className="input-field" value={profileData.zip} onChange={handleChange} required />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={isSaving}>
                        {isSaving ? 'Saving Changes...' : 'Save Profile & Address Details'}
                    </button>
                </form>

                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <Bell size={20} className="text-muted" /> Notification Preferences
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked />
                            <span>Email me when a new order is placed</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked />
                            <span>Email me daily sales reports</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" />
                            <span>SMS alerts for low inventory</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
