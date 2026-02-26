import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Shared utilities
export const generateId = () => Math.random().toString(36).substring(2, 9);

// Mock Users
const MOCK_USERS = {
    admin: { id: 'a1', role: 'admin', name: 'SuperAdmin' },
    vendor: { id: 'v1', role: 'vendor', name: 'DemoVendor' },
    customer: { id: 'c1', role: 'customer', name: 'Guest' }
};

export const useAppStore = create(
    persist(
        (set) => ({
            currentUser: null,

            loginAsAdmin: () => set({ currentUser: MOCK_USERS.admin }),
            loginAsVendor: (customVendor = null) => {
                if (customVendor) {
                    set({ currentUser: { id: customVendor.id, role: 'vendor', name: customVendor.storeName || customVendor.name, email: customVendor.email, phone: customVendor.phone, address: customVendor.address, city: customVendor.city, zip: customVendor.zip, storeName: customVendor.storeName, vendorProfileId: customVendor.vendorProfileId } });
                } else {
                    set({ currentUser: MOCK_USERS.vendor });
                }
            },
            loginAsCustomer: () => set({ currentUser: MOCK_USERS.customer }),
            logout: () => set({ currentUser: null }),
        }),
        {
            name: 'shoplivedeals-app-storage',
        }
    )
);
