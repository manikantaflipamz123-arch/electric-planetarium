import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from './appStore';

export const useProductStore = create(
    persist(
        (set, get) => ({
            products: [
                {
                    id: 'prod_demo',
                    vendorId: 'v1',
                    name: 'Premium Wireless Headphones',
                    price: 199.99,
                    taxRate: 18,
                    isGstInclusive: false,
                    hsn: '85183000',
                    quantity: 50,
                    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
                    createdAt: new Date().toISOString()
                }
            ],

            addProduct: (vendorId, productData) => {
                const newProduct = {
                    id: `p_${generateId()}`,
                    vendorId,
                    ...productData,
                    createdAt: new Date().toISOString()
                };
                set({ products: [...get().products, newProduct] });
            },

            updateProduct: (id, productData) => {
                set({
                    products: get().products.map(p =>
                        p.id === id ? { ...p, ...productData } : p
                    )
                });
            },

            deleteProduct: (id) => {
                set({
                    products: get().products.filter(p => p.id !== id)
                });
            },

            decrementInventory: (id, amount) => {
                set({
                    products: get().products.map(p =>
                        p.id === id ? { ...p, quantity: Math.max(0, p.quantity - amount) } : p
                    )
                });
            }
        }),
        {
            name: 'shoplivedeals-product-storage',
        }
    )
);
