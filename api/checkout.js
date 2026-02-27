import { query } from './_utils/db.js';
import crypto from 'crypto';

export default async function handler(req, res) {
    const { method } = req;
    const action = req.query.action;
    
    // Auto-migrate Enum (Soft migration for Serverless environment)
    try {
        await query(`ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT'`);
    } catch (e) {
        // Ignore if already exists or fails
    }

    if (method === 'POST' && action === 'create') {
        const { customerDetails, cartItems } = req.body;
        if (!customerDetails || !cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Invalid order payload' });
        }

        try {
            await query('BEGIN');

            let totalGross = 0;
            const vendorSplits = {};
            const groupedByVendor = {};

            // 1. Calculate totals securely based on fresh DB product data & Lock rows
            for (const item of cartItems) {
                // FOR UPDATE locks the rows until COMMIT or ROLLBACK to prevent race conditions
                const liveProductRes = await query(`SELECT * FROM "Product" WHERE id = $1 FOR UPDATE`, [item.product.id]);
                const liveProduct = liveProductRes.rows[0];

                if (!liveProduct || liveProduct.stockQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for "${item.product.name}". Only ${liveProduct?.stockQuantity || 0} left.`);
                }

                // Decrement stock immediately (locked)
                await query(`
                    UPDATE "Product" SET "stockQuantity" = "stockQuantity" - $1, "updatedAt" = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [item.quantity, liveProduct.id]);

                const itemTotalGross = liveProduct.price * item.quantity;
                const rate = liveProduct.taxRate / 100;
                let buyerPaidTax = 0;

                if (!liveProduct.isGstInclusive) {
                    buyerPaidTax = itemTotalGross * rate;
                }

                totalGross += (itemTotalGross + buyerPaidTax);

                const vendorResult = await query('SELECT "platformCommissionRate" FROM "VendorProfile" WHERE id = $1', [liveProduct.vendorId]);
                const platformCommissionRate = vendorResult.rows[0]?.platformCommissionRate || 15;

                const platformFee = itemTotalGross * (platformCommissionRate / 100);
                const platformFeeGst = platformFee * 0.18;
                const totalPlatformDeduction = platformFee + platformFeeGst;

                const finalVendorPayout = liveProduct.isGstInclusive 
                    ? (itemTotalGross - totalPlatformDeduction) 
                    : ((itemTotalGross + buyerPaidTax) - totalPlatformDeduction);

                if (!vendorSplits[liveProduct.vendorId]) vendorSplits[liveProduct.vendorId] = 0;
                vendorSplits[liveProduct.vendorId] += finalVendorPayout;

                if (!groupedByVendor[liveProduct.vendorId]) groupedByVendor[liveProduct.vendorId] = { total: 0, items: [] };
                groupedByVendor[liveProduct.vendorId].total += (itemTotalGross + buyerPaidTax);
                groupedByVendor[liveProduct.vendorId].items.push({
                    productId: liveProduct.id,
                    productName: liveProduct.name, // Send back for UI
                    priceAtSale: liveProduct.price,
                    quantity: item.quantity,
                    total: itemTotalGross
                });
            }

            const checkoutSessionId = `cf_session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const frontendOrdersList = [];

            // 2. Create PENDING Database Orders
            for (const vendorId of Object.keys(groupedByVendor)) {
                const vData = groupedByVendor[vendorId];
                const orderId = Math.floor(100000000 + Math.random() * 900000000).toString();

                await query(`
                    INSERT INTO "Order" (id, "vendorId", "customerId", "customerName", "customerEmail", address, phone, zip, "totalAmount", status, "trackingNumber", "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING_PAYMENT', $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [
                    orderId,
                    vendorId,
                    customerDetails.id || null,
                    customerDetails.name || 'Guest',
                    customerDetails.email || '',
                    customerDetails.address || '',
                    customerDetails.phone || '',
                    customerDetails.zip || '',
                    vData.total,
                    checkoutSessionId // Temporarily stash session ID here to link multiple vendor orders to a single checkout
                ]);

                const itemsResponse = [];
                for (const item of vData.items) {
                    await query(`
                        INSERT INTO "OrderItem" (id, "orderId", "productId", "priceAtSale", quantity, total)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                        orderId,
                        item.productId,
                        item.priceAtSale,
                        item.quantity,
                        item.total
                    ]);

                    itemsResponse.push(item);
                }

                frontendOrdersList.push({
                    id: orderId,
                    vendorId,
                    customerName: customerDetails.name || 'Guest',
                    totalAmount: vData.total,
                    status: 'PENDING_PAYMENT',
                    items: itemsResponse
                });
            }

            await query('COMMIT');

            // 3. Construct Cashfree Payload cleanly on server
            const splitTags = Object.keys(vendorSplits).map(vendorId => ({
                vendor_id: vendorId,
                amount: Number(vendorSplits[vendorId].toFixed(2)),
                percentage: null 
            }));

            const cashfreePayload = {
                order_id: checkoutSessionId,
                order_amount: totalGross.toFixed(2),
                order_currency: "INR",
                customer_details: {
                    customer_id: customerDetails.id || "guest_123",
                    customer_email: customerDetails.email || "guest@example.com",
                    customer_phone: customerDetails.phone || "9999999999"
                },
                order_meta: {
                    notify_url: "https://your-api.shoplivedeals.com/api/checkout?action=webhook"
                },
                order_splits: splitTags
            };

            return res.status(200).json({
                message: 'Checkout Session Initialized',
                payment_session_id: checkoutSessionId,
                cashfree_payload: cashfreePayload,
                orders: frontendOrdersList // Used by UI to show confirmation
            });

        } catch (err) {
            await query('ROLLBACK');
            return res.status(400).json({ message: err.message });
        }
    }

    if (method === 'POST' && action === 'webhook') {
        try {
            const rawBody = JSON.stringify(req.body); 
            const signature = req.headers['x-webhook-signature'];
            const secret = process.env.CASHFREE_SECRET_KEY || 'test_secret';

            const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
            
            // Validate cryptographic signature from header, but allow SIMULATION_BYPASS for local demo
            if (signature !== expectedSignature && signature !== 'SIMULATION_BYPASS') {
                return res.status(401).json({ message: 'Unauthorized webhook signature' });
            }

            const { data } = req.body;
            if (data && data.order && data.order.order_id) {
                const checkoutSessionId = data.order.order_id;
                
                // Flip all PENDING orders tied to this checkout ID to PLACED
                await query(`
                    UPDATE "Order" 
                    SET status = 'PLACED', "trackingNumber" = NULL, "updatedAt" = CURRENT_TIMESTAMP
                    WHERE "trackingNumber" = $1 AND status = 'PENDING_PAYMENT'
                `, [checkoutSessionId]);

                return res.status(200).json({ message: 'Webhook processed successfully' });
            }

            return res.status(400).json({ message: 'Invalid payload structure' });
        } catch (err) {
            return res.status(500).json({ message: 'Webhook error: ' + err.message });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
