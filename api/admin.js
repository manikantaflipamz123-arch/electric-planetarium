import { query } from './_utils/db.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    const { action } = req.query;

    if (!action) {
        return res.status(400).json({ message: 'Missing admin action' });
    }

    try {
        // Admin Login does not require a pre-existing token
        if (action === 'login' && req.method === 'POST') {
            const { password } = req.body;
            if (password !== 'admin123') return res.status(401).json({ message: 'Invalid administrator password.' });

            const jwtSecret = process.env.JWT_SECRET || 'super-secret-development-key-change-in-prod';
            const token = jwt.sign({ role: 'ADMIN' }, jwtSecret, { expiresIn: '1d' });

            const isProduction = process.env.NODE_ENV === 'production';
            const cookieString = `auth_token=${token}; HttpOnly; Path=/; Max-Age=${1 * 24 * 60 * 60}; SameSite=Strict${isProduction ? '; Secure' : ''}`;
            res.setHeader('Set-Cookie', cookieString);

            return res.status(200).json({ message: 'Admin authentication successful', user: { role: 'admin' } });
        }

        // All other routes require an ADMIN token
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) return res.status(401).json({ message: 'No authentication cookie found' });

        const tokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
        if (!tokenMatch) return res.status(401).json({ message: 'No auth_token found in cookies' });

        const jwtSecret = process.env.JWT_SECRET || 'super-secret-development-key-change-in-prod';
        const decoded = jwt.verify(tokenMatch[1], jwtSecret);

        if (decoded.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden. Administrator access required.' });

        if (action === 'applications' && req.method === 'GET') {
            const result = await query(`
                SELECT vp.id, vp."storeName", vp."gstNumber", vp."bankName", vp."bankAccount", vp."ifscCode", vp.status, vp."rejectionReason", vp."platformCommissionRate", u.email, u."createdAt" as "submittedAt"
                FROM "VendorProfile" vp JOIN "User" u ON vp."userId" = u.id ORDER BY u."createdAt" DESC
            `);
            return res.status(200).json({ applications: result.rows });
        }

        if (action === 'orders' && req.method === 'GET') {
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
                GROUP BY o.id
                ORDER BY o."createdAt" DESC
            `);
            return res.status(200).json({ orders: result.rows });
        }

        if (action === 'approve' && req.method === 'POST') {
            const { vendorId } = req.body;
            if (!vendorId) return res.status(400).json({ message: 'vendorId is required' });

            const checkVendor = await query('SELECT id, status FROM "VendorProfile" WHERE id = $1', [vendorId]);
            if (checkVendor.rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
            if (checkVendor.rows[0].status === 'APPROVED') return res.status(400).json({ message: 'Vendor is already approved' });

            await query('UPDATE "VendorProfile" SET status = $1, "rejectionReason" = null WHERE id = $2', ['APPROVED', vendorId]);
            return res.status(200).json({ message: 'Vendor successfully approved' });
        }

        if (action === 'reject' && req.method === 'POST') {
            const { vendorId, reason } = req.body;
            if (!vendorId || !reason) return res.status(400).json({ message: 'vendorId and reason are required' });

            const checkVendor = await query('SELECT id, status FROM "VendorProfile" WHERE id = $1', [vendorId]);
            if (checkVendor.rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });

            await query('UPDATE "VendorProfile" SET status = $1, "rejectionReason" = $2 WHERE id = $3', ['REJECTED', reason, vendorId]);
            return res.status(200).json({ message: 'Vendor successfully rejected' });
        }

        return res.status(405).json({ message: 'Method Not Allowed or Invalid Action' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        console.error(`Admin Error [${action}]:`, error);
        return res.status(500).json({ message: `Internal server error during ${action}` });
    }
}
