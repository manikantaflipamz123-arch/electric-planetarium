import { query } from '../utils/db.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) return res.status(401).json({ message: 'No authentication cookie found' });

        const tokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
        if (!tokenMatch) return res.status(401).json({ message: 'No auth_token found in cookies' });

        const token = tokenMatch[1];
        const jwtSecret = process.env.JWT_SECRET || 'fallback_development_secret_key_12345';
        const decoded = jwt.verify(token, jwtSecret);

        if (decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden. Administrator access required.' });
        }

        const { vendorId } = req.body;
        if (!vendorId) return res.status(400).json({ message: 'vendorId is required' });

        const checkVendor = await query('SELECT id, status FROM "VendorProfile" WHERE id = $1', [vendorId]);
        if (checkVendor.rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });

        if (checkVendor.rows[0].status === 'APPROVED') {
            return res.status(400).json({ message: 'Vendor is already approved' });
        }

        await query('UPDATE "VendorProfile" SET status = $1, "rejectionReason" = null WHERE id = $2', ['APPROVED', vendorId]);

        return res.status(200).json({ message: 'Vendor successfully approved' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        console.error('Approve Vendor Error:', error);
        return res.status(500).json({ message: 'Internal server error while approving vendor' });
    }
}
