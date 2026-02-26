import { query } from '../utils/db.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Authenticate the Admin First
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) {
            return res.status(401).json({ message: 'No authentication cookie found' });
        }

        const tokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
        if (!tokenMatch) {
            return res.status(401).json({ message: 'No auth_token found in cookies' });
        }

        const token = tokenMatch[1];
        const jwtSecret = process.env.JWT_SECRET || 'fallback_development_secret_key_12345';

        const decoded = jwt.verify(token, jwtSecret);

        // Ensure they are an ADMIN
        if (decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden. Administrator access required.' });
        }

        // Fetch all Vendor Profiles and join their user email for the Admin table
        const result = await query(`
            SELECT 
                vp.id,
                vp."storeName",
                vp."gstNumber",
                vp."bankName",
                vp."bankAccount",
                vp."ifscCode",
                vp.status,
                vp."rejectionReason",
                vp."platformCommissionRate",
                u.email,
                u."createdAt" as "submittedAt"
            FROM "VendorProfile" vp
            JOIN "User" u ON vp."userId" = u.id
            ORDER BY u."createdAt" DESC
        `);

        return res.status(200).json({ applications: result.rows });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        console.error('Fetch Applications Error:', error);
        return res.status(500).json({ message: 'Internal server error while fetching applications' });
    }
}
