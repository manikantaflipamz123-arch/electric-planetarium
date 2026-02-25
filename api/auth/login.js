import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../utils/db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // 1. Find User
        const userResult = await query('SELECT * FROM "User" WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = userResult.rows[0];

        // 2. Verify Password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 3. Fetch associated Vendor Profile if they are a vendor
        let vendorProfile = null;
        if (user.role === 'VENDOR') {
            const vendorResult = await query('SELECT * FROM "VendorProfile" WHERE "userId" = $1', [user.id]);
            if (vendorResult.rows.length > 0) {
                vendorProfile = vendorResult.rows[0];
            }
        }

        // 4. Generate JWT
        // Use a secure environmental secret, fallback for local dev only if absolutely necessary
        const jwtSecret = process.env.JWT_SECRET || 'super-secret-development-key-change-in-prod';
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                vendorId: vendorProfile ? vendorProfile.id : null
            },
            jwtSecret,
            { expiresIn: '7d' } // Token valid for 7 days
        );

        // 5. Set HTTP-Only Cookie
        // This prevents XSS attacks from reading the token via document.cookie
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieString = `auth_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict${isProduction ? '; Secure' : ''}`;

        res.setHeader('Set-Cookie', cookieString);

        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            vendorProfile: vendorProfile ? {
                id: vendorProfile.id,
                storeName: vendorProfile.storeName,
                status: vendorProfile.status,
                platformCommissionRate: vendorProfile.platformCommissionRate
            } : null
        });

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ message: 'Internal server error during login' });
    }
}
