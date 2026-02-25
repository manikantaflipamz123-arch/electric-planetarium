import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from './appStore';

export const useOrderStore = create(
    persist(
        (set, get) => ({
            cart: [],
            orders: [
                {
                    id: '10001001',
                    vendorId: 'v1',
                    customerId: 'c1',
                    customerName: 'Demo Customer',
                    address: '123 Test St, Tech City, IN',
                    items: [
                        {
                            productId: 'prod_demo',
                            productName: 'Premium Wireless Headphones',
                            price: 199.99,
                            quantity: 1,
                            total: 199.99
                        }
                    ],
                    totalAmount: 199.99,
                    status: 'Placed', // Placed, Shipped, Delivered
                    trackingNumber: null,
                    courierPartner: null,
                    createdAt: new Date().toISOString()
                }
            ],

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
            placeOrder: (customerDetails) => {
                const { cart, orders } = get();

                // Group cart items by vendorId so one checkout creates exactly one order per vendor
                const groupedByVendor = cart.reduce((acc, item) => {
                    const vId = item.product.vendorId;
                    if (!acc[vId]) acc[vId] = [];
                    acc[vId].push(item);
                    return acc;
                }, {});

                const newOrders = Object.keys(groupedByVendor).map(vendorId => {
                    const vendorItems = groupedByVendor[vendorId];
                    const totalAmount = vendorItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

                    return {
                        id: `${Math.floor(10000000 + Math.random() * 90000000)}`,
                        vendorId: vendorId,
                        customerId: customerDetails.id || 'guest',
                        customerName: customerDetails.name,
                        address: customerDetails.address,
                        phone: customerDetails.phone,
                        zip: customerDetails.zip,
                        items: vendorItems.map(item => ({
                            productId: item.product.id,
                            productName: item.product.name,
                            price: item.product.price,
                            quantity: item.quantity,
                            total: item.product.price * item.quantity
                        })),
                        totalAmount: totalAmount,
                        status: 'Placed',
                        trackingNumber: null,
                        courierPartner: null,
                        createdAt: new Date().toISOString()
                    };
                });

                set({
                    orders: [...orders, ...newOrders],
                    cart: [] // Clear cart after placing order
                });

                return newOrders;
            },

            updateOrderStatus: (orderId, status, trackingData = {}) => {
                set({
                    orders: get().orders.map(order =>
                        order.id === orderId
                            ? {
                                ...order,
                                status,
                                trackingNumber: trackingData.trackingNumber || order.trackingNumber,
                                courierPartner: trackingData.courierPartner || order.courierPartner
                            }
                            : order
                    )
                });
            }
        }),
        {
            name: 'shoplivedeals-order-storage',
        }
    )
);
