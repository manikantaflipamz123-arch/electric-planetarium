import { create } from 'zustand';

export const useProductStore = create((set, get) => ({
    products: [],
    isLoading: false,
    error: null,

    fetchProducts: async (vendorProfileId = null) => {
        set({ isLoading: true, error: null });
        try {
            const url = vendorProfileId ? `/api/products?vendorId=${vendorProfileId}` : '/api/products';
            const response = await fetch(url);
            const data = await response.json();
            if (response.ok) {
                // Map DB stockQuantity back to quantity for frontend consistency
                const mappedProducts = (data.products || []).map(p => ({
                    ...p,
                    quantity: p.stockQuantity !== undefined ? p.stockQuantity : p.quantity
                }));
                set({ products: mappedProducts, isLoading: false });
            } else {
                set({ error: data.message || 'Failed to fetch products', isLoading: false });
            }
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    addProduct: async (vendorId, productData) => {
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            const data = await response.json();
            if (response.ok) {
                const newProduct = { ...data.product, quantity: data.product.stockQuantity };
                set({ products: [newProduct, ...get().products] });
                return newProduct;
            } else {
                throw new Error(data.message || 'Failed to add product');
            }
        } catch (error) {
            console.error('Add product error:', error);
            throw error;
        }
    },

    updateProduct: async (id, productData) => {
        try {
            const response = await fetch(`/api/products?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            const data = await response.json();
            if (response.ok) {
                const updatedProduct = { ...data.product, quantity: data.product.stockQuantity };
                set({
                    products: get().products.map(p =>
                        p.id === id ? updatedProduct : p
                    )
                });
            } else {
                throw new Error(data.message || 'Failed to update product');
            }
        } catch (error) {
            console.error('Update product error:', error);
            throw error;
        }
    },

    deleteProduct: async (id) => {
        try {
            const response = await fetch(`/api/products?id=${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                set({
                    products: get().products.filter(p => p.id !== id)
                });
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Delete product error:', error);
            throw error;
        }
    },

    decrementInventory: async (id, amount) => {
        set({
            products: get().products.map(p =>
                p.id === id ? { ...p, quantity: Math.max(0, p.quantity - amount) } : p
            )
        });
    }
}));
