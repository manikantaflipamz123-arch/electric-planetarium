import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useVendorStore = create(
    persist(
        (set, get) => ({
            applications: [],
            vendors: [],
            platformCommissionRate: 10, // Default 10% commission

            updatePlatformCommission: (newRate) => {
                set({ platformCommissionRate: newRate });
            },

            fetchAdminApplications: async () => {
                try {
                    const res = await fetch('/api/admin/applications');
                    if (res.ok) {
                        const data = await res.json();
                        set({
                            applications: data.applications,
                            vendors: data.applications.filter(a => a.status === 'APPROVED')
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch admin applications:", error);
                }
            },

            approveApplication: async (id) => {
                try {
                    const res = await fetch('/api/admin/approve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ vendorId: id })
                    });
                    if (res.ok) {
                        await get().fetchAdminApplications();
                    } else {
                        const errorData = await res.json();
                        console.error("Approval failed:", errorData.message);
                    }
                } catch (error) {
                    console.error("Failed to approve application:", error);
                }
            },

            rejectApplication: async (id, reason = '') => {
                try {
                    const res = await fetch('/api/admin/reject', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ vendorId: id, reason })
                    });
                    if (res.ok) {
                        await get().fetchAdminApplications();
                    } else {
                        const errorData = await res.json();
                        console.error("Rejection failed:", errorData.message);
                    }
                } catch (error) {
                    console.error("Failed to reject application:", error);
                }
            },

            updateVendorSettings: (vendorId, settings) => {
                set({
                    vendors: get().vendors.map(v =>
                        v.id === vendorId ? { ...v, ...settings } : v
                    )
                });
            }
        }),
        {
            name: 'shoplivedeals-vendor-storage',
        }
    )
);
