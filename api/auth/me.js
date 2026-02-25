import jwt from 'jsonwebtoken';
import { query } from '../utils/db.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // 1. Extract cookie
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) {
            return res.status(401).json({ message: 'No session cookie found' });
        }

        const cookies = Object.fromEntries(
            cookieHeader.split('; ').map(c => {
                const [key, ...v] = c.split('=');
                return [key, decodeURIComponent(v.join('='))];
            })
        );

        const token = cookies['auth_token'];
        if (!token) {
            return res.status(401).json({ message: 'No auth_token found' });
        }

        // 2. Verify JWT
        const jwtSecret = process.env.JWT_SECRET || 'super-secret-development-key-change-in-prod';
        const decoded = jwt.verify(token, jwtSecret);

        // 3. Fetch fresh user data from DB
        const userResult = await query('SELECT id, email, role FROM "User" WHERE id = $1', [decoded.userId]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'User no longer exists' });
        }
        const user = userResult.rows[0];

        // 4. Fetch Vendor profile if applicable
        let vendorProfile = null;
        if (user.role === 'VENDOR') {
            const vendorResult = await query('SELECT id, "storeName", status, "platformCommissionRate" FROM "VendorProfile" WHERE "userId" = $1', [user.id]);
            if (vendorResult.rows.length > 0) {
                vendorProfile = vendorResult.rows[0];
            }
        }

        return res.status(200).json({
            user,
            vendorProfile
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        console.error('Session Verification Error:', error);
        return res.status(500).json({ message: 'Internal server error verifying session' });
    }
}
