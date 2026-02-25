import bcrypt from 'bcryptjs';
import { query } from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { storeName, email, password, gstNumber, bankName, bankAccount, ifscCode } = req.body;

    if (!storeName || !email || !password || !gstNumber) {
        return res.status(400).json({ message: 'Missing required onboarding fields' });
    }

    try {
        // 1. Check if user already exists
        const existingUser = await query('SELECT * FROM "User" WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'A user with this email already exists.' });
        }

        // 2. Hash Password securely
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. Database Transaction: We must create the User AND the VendorProfile together
        // Transactions ensure if Vendor creation fails, the User isn't orphaned.
        await query('BEGIN');

        const newUserId = uuidv4();
        const newVendorId = uuidv4();

        // Insert to "User"
        await query(
            'INSERT INTO "User" (id, email, password, role, "updatedAt") VALUES ($1, $2, $3, $4, NOW())',
            [newUserId, email, hashedPassword, 'VENDOR']
        );

        // Insert to "VendorProfile"
        await query(
            `INSERT INTO "VendorProfile" 
       (id, "userId", "storeName", "gstNumber", "bankName", "bankAccount", "ifscCode") 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [newVendorId, newUserId, storeName, gstNumber, bankName || '', bankAccount || '', ifscCode || '']
        );

        await query('COMMIT');

        return res.status(201).json({
            message: 'Registration successful',
            user: { id: newUserId, email, role: 'VENDOR' },
            vendorProfile: { id: newVendorId, storeName, status: 'PENDING' }
        });

    } catch (error) {
        await query('ROLLBACK');
        console.error('Registration Error:', error);
        return res.status(500).json({ message: 'Internal server error during registration' });
    }
}
