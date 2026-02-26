import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { password } = req.body;

        // Hardcoded admin prototype password
        if (password !== 'admin123') {
            return res.status(401).json({ message: 'Invalid administrator password.' });
        }

        const jwtSecret = process.env.JWT_SECRET || 'fallback_development_secret_key_12345';
        const isProduction = process.env.NODE_ENV === 'production';

        const token = jwt.sign(
            { role: 'ADMIN' },
            jwtSecret,
            { expiresIn: '1d' }
        );

        // Set JWT as HttpOnly Cookie
        const cookieString = `auth_token=${token}; HttpOnly; Path=/; Max-Age=${1 * 24 * 60 * 60}; SameSite=Strict${isProduction ? '; Secure' : ''}`;

        res.setHeader('Set-Cookie', cookieString);

        return res.status(200).json({
            message: 'Admin authentication successful',
            user: { role: 'admin' }
        });

    } catch (error) {
        console.error('Admin Login Error:', error);
        return res.status(500).json({ message: 'Internal server error during admin login' });
    }
}
