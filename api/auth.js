import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './_utils/db.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    const { action } = req.query;

    if (!action) {
        return res.status(400).json({ message: 'Missing auth action' });
    }

    try {
        if (action === 'login' && req.method === 'POST') {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

            const userResult = await query('SELECT * FROM "User" WHERE email = $1', [email]);
            if (userResult.rows.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

            const user = userResult.rows[0];
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) return res.status(401).json({ message: 'Invalid email or password' });

            let vendorProfile = null;
            if (user.role === 'VENDOR') {
                const vendorResult = await query('SELECT * FROM "VendorProfile" WHERE "userId" = $1', [user.id]);
                if (vendorResult.rows.length > 0) vendorProfile = vendorResult.rows[0];
            }

            const jwtSecret = process.env.JWT_SECRET || 'super-secret-development-key-change-in-prod';
            const token = jwt.sign(
                { userId: user.id, role: user.role, vendorId: vendorProfile ? vendorProfile.id : null },
                jwtSecret,
                { expiresIn: '7d' }
            );

            const isProduction = process.env.NODE_ENV === 'production';
            const cookieString = `auth_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict${isProduction ? '; Secure' : ''}`;
            res.setHeader('Set-Cookie', cookieString);

            return res.status(200).json({
                message: 'Login successful',
                user: { id: user.id, email: user.email, role: user.role },
                vendorProfile: vendorProfile ? {
                    id: vendorProfile.id,
                    storeName: vendorProfile.storeName,
                    status: vendorProfile.status,
                    platformCommissionRate: vendorProfile.platformCommissionRate
                } : null
            });
        }

        if (action === 'register' && req.method === 'POST') {
            const { storeName, email, password, gstNumber, bankName, bankAccount, ifscCode } = req.body;
            if (!storeName || !email || !password || !gstNumber) return res.status(400).json({ message: 'Missing required onboarding fields' });

            const existingUser = await query('SELECT * FROM "User" WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) return res.status(409).json({ message: 'A user with this email already exists.' });

            const hashedPassword = await bcrypt.hash(password, 10);
            await query('BEGIN');

            const newUserId = uuidv4();
            const newVendorId = uuidv4();

            await query('INSERT INTO "User" (id, email, password, role, "updatedAt") VALUES ($1, $2, $3, $4, NOW())', [newUserId, email, hashedPassword, 'VENDOR']);
            await query(
                `INSERT INTO "VendorProfile" (id, "userId", "storeName", "gstNumber", "bankName", "bankAccount", "ifscCode") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [newVendorId, newUserId, storeName, gstNumber, bankName || '', bankAccount || '', ifscCode || '']
            );

            await query('COMMIT');
            return res.status(201).json({
                message: 'Registration successful',
                user: { id: newUserId, email, role: 'VENDOR' },
                vendorProfile: { id: newVendorId, storeName, status: 'PENDING' }
            });
        }

        if (action === 'logout' && req.method === 'POST') {
            const isProduction = process.env.NODE_ENV === 'production';
            const cookieString = `auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${isProduction ? '; Secure' : ''}`;
            res.setHeader('Set-Cookie', cookieString);
            return res.status(200).json({ message: 'Successfully logged out' });
        }

        if (action === 'me' && req.method === 'GET') {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return res.status(401).json({ message: 'No session cookie found' });

            const tokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
            if (!tokenMatch) return res.status(401).json({ message: 'No auth_token found in cookies' });

            const token = tokenMatch[1];
            const jwtSecret = process.env.JWT_SECRET || 'super-secret-development-key-change-in-prod';
            const decoded = jwt.verify(token, jwtSecret);

            const userResult = await query('SELECT id, email, role FROM "User" WHERE id = $1', [decoded.userId]);
            if (userResult.rows.length === 0) return res.status(401).json({ message: 'User no longer exists' });

            const user = userResult.rows[0];
            let vendorProfile = null;
            if (user.role === 'VENDOR') {
                const vendorResult = await query('SELECT id, "storeName", status, "platformCommissionRate" FROM "VendorProfile" WHERE "userId" = $1', [user.id]);
                if (vendorResult.rows.length > 0) vendorProfile = vendorResult.rows[0];
            }

            return res.status(200).json({ user, vendorProfile });
        }

        return res.status(405).json({ message: 'Method Not Allowed or Invalid Action' });

    } catch (error) {
        if (action === 'register') await query('ROLLBACK');
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        console.error(`Auth Error [${action}]:`, error);
        return res.status(500).json({ message: `Internal server error during ${action}` });
    }
}
