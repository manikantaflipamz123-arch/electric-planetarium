import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from './appStore';

export const useOrderStore = create(
    persist(
        (set, get) => ({
            cart: [],
            orders: [],
            isLoading: false,
            error: null,

            // Fetch orders from the backend for the logged-in vendor
            fetchOrders: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/orders');
                    const data = await response.json();

                    if (response.ok) {
                        set({ orders: data.orders || [], isLoading: false });
                    } else {
                        set({ error: data.message || 'Failed to fetch orders', isLoading: false });
                    }
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                }
            },

            // Cart Actions
            addToCart: (product, addedQuantity = 1) => {
                const { cart } = get();
                const existingItem = cart.find(item => item.product.id === product.id);
                const safeCount = Math.max(1, parseInt(addedQuantity, 10) || 1);

                if (existingItem) {
                    set({
                        cart: cart.map(item =>
                            item.product.id === product.id
                                ? { ...item, quantity: item.quantity + safeCount }
                                : item
                        )
                    });
                } else {
                    set({ cart: [...cart, { product, quantity: safeCount }] });
                }
            },

            updateCartQuantity: (productId, quantity) => {
                const numericQuantity = parseInt(quantity, 10) || 0;

                if (numericQuantity <= 0) {
                    get().removeFromCart(productId);
                    return;
                }
                set({
                    cart: get().cart.map(item =>
                        item.product.id === productId ? { ...item, quantity: numericQuantity } : item
                    )
                });
            },

            removeFromCart: (productId) => {
                set({ cart: get().cart.filter(item => item.product.id !== productId) });
            },

            clearCart: () => set({ cart: [] }),

            // Order Actions
            placeOrder: async (customerDetails) => {
                const { cart } = get();

                try {
                    const response = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            customerDetails,
                            cartItems: cart
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Failed to place order');
                    }

                    // Order was placed successfully to DB
                    // Because this is usually called by the customer, we clear their cart
                    set({
                        cart: []
                    });

                    // Return the generated orders list for the Checkout Success screen
                    return data.orders;

                } catch (error) {
                    console.error('Failed to place order:', error);
                    throw error;
                }
            },

            updateOrderStatus: async (orderId, status, trackingData = {}) => {
                try {
                    const safeStatus = typeof status === 'string' ? status.toUpperCase() : status;
                    const response = await fetch(`/api/orders?id=${orderId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            status: safeStatus,
                            trackingNumber: trackingData.trackingNumber || undefined,
                            courierPartner: trackingData.courierPartner || undefined
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Failed to update order status');
                    }

                    // Locally update the active orders array for instant UI feedback
                    set({
                        orders: get().orders.map(order =>
                            order.id === orderId
                                ? { ...order, ...data.order }
                                : order
                        )
                    });

                } catch (error) {
                    console.error('Failed to update order status:', error);
                    alert('Error updating order status. Please try again.');
                }
            }
        }),
        {
            name: 'shoplivedeals-order-storage',
            // Only persist the cart, not the orders, as orders should be fetched fresh from DB
            partialize: (state) => ({ cart: state.cart }),
        }
    )
);
