import { query } from './_utils/db.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    const { method } = req;

    try {
        if (method === 'POST') {
            // POST /api/orders (Public/Customer Endpoint - Places an order)
            const { customerDetails, cartItems } = req.body;

            if (!customerDetails || !cartItems || cartItems.length === 0) {
                return res.status(400).json({ message: 'Invalid order payload' });
            }

            // Group cart items by vendorId
            const groupedByVendor = cartItems.reduce((acc, item) => {
                const vId = item.product.vendorId;
                if (!acc[vId]) acc[vId] = [];
                acc[vId].push(item);
                return acc;
            }, {});

            const newOrdersResponse = [];

            await query('BEGIN');

            for (const vendorId of Object.keys(groupedByVendor)) {
                const vendorItems = groupedByVendor[vendorId];
                const totalAmount = vendorItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

                const orderId = Math.floor(100000000 + Math.random() * 900000000).toString();

                // Generate Order
                await query(`
                    INSERT INTO "Order" (id, "vendorId", "customerId", "customerName", "customerEmail", address, phone, zip, "totalAmount", status, "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PLACED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [
                    orderId,
                    vendorId,
                    customerDetails.id || null,
                    customerDetails.name || 'Guest',
                    customerDetails.email || '',
                    customerDetails.address || '',
                    customerDetails.phone || '',
                    customerDetails.zip || '',
                    totalAmount
                ]);

                const itemsResponse = [];

                for (const item of vendorItems) {
                    const orderItemId = uuidv4();
                    const itemTotal = item.product.price * item.quantity;

                    // Decrement Inventory using Row-Level Lock (FOR UPDATE) or simple atomic decrement
                    const updateRes = await query(`
                        UPDATE "Product" 
                        SET "stockQuantity" = "stockQuantity" - $1, "updatedAt" = CURRENT_TIMESTAMP
                        WHERE id = $2 AND "stockQuantity" >= $1
                        RETURNING *
                    `, [item.quantity, item.product.id]);

                    if (updateRes.rows.length === 0) {
                        throw new Error(`Insufficient stock for product ${item.product.name} or product not found`);
                    }

                    // Insert OrderItem
                    await query(`
                        INSERT INTO "OrderItem" (id, "orderId", "productId", "priceAtSale", quantity, total)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        orderItemId,
                        orderId,
                        item.product.id,
                        item.product.price,
                        item.quantity,
                        itemTotal
                    ]);

                    itemsResponse.push({
                        productId: item.product.id,
                        productName: item.product.name,
                        price: item.product.price,
                        quantity: item.quantity,
                        total: itemTotal
                    });
                }

                newOrdersResponse.push({
                    id: orderId,
                    vendorId,
                    customerName: customerDetails.name || 'Guest',
                    address: customerDetails.address || '',
                    phone: customerDetails.phone || '',
                    zip: customerDetails.zip || '',
                    totalAmount,
                    status: 'PLACED',
                    items: itemsResponse,
                    createdAt: new Date().toISOString()
                });
            }

            await query('COMMIT');

            return res.status(201).json({
                message: 'Order placed successfully',
                orders: newOrdersResponse
            });
        }

        // ==========================================
        // VENDOR PROTECTED ROUTES (GET, PUT)
        // ==========================================
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) return res.status(401).json({ message: 'No authentication cookie found' });

        const tokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
        if (!tokenMatch) return res.status(401).json({ message: 'No auth_token found in cookies' });

        const token = tokenMatch[1];
        const jwtSecret = process.env.JWT_SECRET || 'super-secret-development-key-change-in-prod';
        const decoded = jwt.verify(token, jwtSecret);

        if (decoded.role !== 'VENDOR') {
            return res.status(403).json({ message: 'Forbidden. Vendor access required.' });
        }

        const vendorResult = await query('SELECT id FROM "VendorProfile" WHERE "userId" = $1 AND status = \'APPROVED\'', [decoded.userId]);
        if (vendorResult.rows.length === 0) {
            return res.status(403).json({ message: 'Forbidden. Active Vendor Profile required.' });
        }
        const vendorProfileId = vendorResult.rows[0].id;

        if (method === 'GET') {
            // GET /api/orders (Vendor endpoint)
            const result = await query(`
                SELECT 
                    o.*,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'productId', oi."productId",
                                'productName', p.name,
                                'priceAtSale', oi."priceAtSale",
                                'quantity', oi.quantity,
                                'total', oi.total
                            )
                        ) FILTER (WHERE oi.id IS NOT NULL), '[]'
                    ) as items
                FROM "Order" o
                LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
                LEFT JOIN "Product" p ON oi."productId" = p.id
                WHERE o."vendorId" = $1
                GROUP BY o.id
                ORDER BY o."createdAt" DESC
            `, [vendorProfileId]);

            return res.status(200).json({ orders: result.rows });
        }

        if (method === 'PUT') {
            // PUT /api/orders (Vendor endpoint to update Tracking/Status)
            const { id } = req.query; // Order ID
            const { status, trackingNumber, courierPartner } = req.body;

            if (!id) return res.status(400).json({ message: 'Order ID is required' });

            const checkResult = await query('SELECT id FROM "Order" WHERE id = $1 AND "vendorId" = $2', [id, vendorProfileId]);
            if (checkResult.rows.length === 0) return res.status(404).json({ message: 'Order not found or unauthorized' });

            const updateResult = await query(`
                UPDATE "Order"
                SET status = COALESCE($1, status),
                    "trackingNumber" = COALESCE($2, "trackingNumber"),
                    "courierPartner" = COALESCE($3, "courierPartner"),
                    "updatedAt" = CURRENT_TIMESTAMP
                WHERE id = $4 AND "vendorId" = $5
                RETURNING *
            `, [
                status,
                trackingNumber,
                courierPartner,
                id,
                vendorProfileId
            ]);

            return res.status(200).json({ order: updateResult.rows[0] });
        }

        return res.status(405).json({ message: 'Method Not Allowed' });

    } catch (error) {
        // Rollback transaction if we are in POST and an error occurs
        if (method === 'POST') {
            await query('ROLLBACK');
        }

        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        console.error('Orders API Error:', error);
        return res.status(500).json({ message: error.message || 'Internal server error processing orders' });
    }
}
