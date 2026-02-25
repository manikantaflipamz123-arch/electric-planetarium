import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import StatusPage from './pages/StatusPage';
import VendorLoginPage from './pages/VendorLoginPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import ReadyToScanPage from './pages/ReadyToScanPage';

// Admin Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import SellerDetailsPage from './pages/admin/SellerDetailsPage';

// Vendor Dashboards
import VendorDashboard from './pages/vendor/VendorDashboard';
import AddProductPage from './pages/vendor/AddProductPage';
import InventoryPage from './pages/vendor/InventoryPage';
import OrdersPage from './pages/vendor/OrdersPage';
import ShippingPage from './pages/vendor/ShippingPage';
import AnalyticsPage from './pages/vendor/AnalyticsPage';
import SettingsPage from './pages/vendor/SettingsPage';


import { useEffect, useState } from 'react';
import { useAppStore } from './store/appStore';

function App() {
    const loginAsVendor = useAppStore(state => state.loginAsVendor);
    const logout = useAppStore(state => state.logout);
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.user.role === 'VENDOR') {
                        loginAsVendor({
                            id: data.user.id,
                            email: data.user.email,
                            role: 'vendor',
                            storeName: data.vendorProfile?.storeName || 'Vendor',
                            platformCommissionRate: data.vendorProfile?.platformCommissionRate || 15.0
                        });
                    }
                } else {
                    // Cookie is invalid or missing, ensure local state is cleared
                    logout();
                }
            } catch (err) {
                console.error("Session verification failed:", err);
            } finally {
                setIsVerifying(false);
            }
        };
        verifySession();
    }, [loginAsVendor, logout]);

    if (isVerifying) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes with Main Header/Footer */}
                <Route element={<MainLayout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/status" element={<StatusPage />} />
                    <Route path="/login" element={<VendorLoginPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/scan" element={<ReadyToScanPage />} />
                </Route>

                {/* Dashboard Routes with Sidebar */}
                <Route element={<DashboardLayout />}>

                    {/* Admin Routes */}
                    <Route path="/admin">
                        <Route index element={<AdminDashboard />} />
                        <Route path="login" element={<AdminLoginPage />} />
                        <Route path="seller/:id" element={<SellerDetailsPage />} />
                    </Route>

                    {/* Vendor Routes */}
                    <Route path="/vendor">
                        <Route index element={<Navigate to="/vendor/dashboard" replace />} />
                        <Route path="dashboard" element={<VendorDashboard />} />
                        <Route path="add-product" element={<AddProductPage />} />
                        <Route path="inventory" element={<InventoryPage />} />
                        <Route path="orders" element={<OrdersPage />} />
                        <Route path="shipping" element={<ShippingPage />} />
                        <Route path="analytics" element={<AnalyticsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                    </Route>

                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
