import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from './appStore';

export const useVendorStore = create(
    persist(
        (set, get) => ({
            applications: [
                {
                    id: 'app_1',
                    storeName: 'Electro World',
                    gstNumber: '29GGGGG1314R9Z6',
                    bankAccount: '1234567890',
                    ifscCode: 'HDFC0001234',
                    bankName: 'HDFC Bank',
                    status: 'pending',
                    submittedAt: new Date().toISOString()
                }
            ],
            vendors: [],
            platformCommissionRate: 10, // Default 10% commission

            updatePlatformCommission: (newRate) => {
                set({ platformCommissionRate: newRate });
            },

            submitApplication: (data) => {
                const newApp = {
                    id: `app_${generateId()}`,
                    ...data,
                    status: 'pending',
                    submittedAt: new Date().toISOString()
                };
                set({ applications: [...get().applications, newApp] });
            },

            approveApplication: (id) => {
                const { applications, vendors } = get();
                const app = applications.find(a => a.id === id);

                if (app) {
                    const newVendor = {
                        id: `v_${generateId()}`,
                        ...app,
                        approvedAt: new Date().toISOString()
                    };

                    set({
                        applications: applications.map(a =>
                            a.id === id ? { ...a, status: 'approved' } : a
                        ),
                        vendors: [...vendors, newVendor]
                    });
                }
            },

            rejectApplication: (id, reason = '') => {
                set({
                    applications: get().applications.map(a =>
                        a.id === id ? { ...a, status: 'rejected', rejectionReason: reason } : a
                    )
                });
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
