import jwt from 'jsonwebtoken';
import { query } from '../utils/db.js';

export default async function handler(req, res) {
    const { method } = req;

    try {
        if (method === 'GET') {
            // GET /api/products
            // Optional filter
            const { vendorId } = req.query;
            let result;
            if (vendorId) {
                result = await query('SELECT * FROM "Product" WHERE "vendorId" = $1 ORDER BY "createdAt" DESC', [vendorId]);
            } else {
                result = await query('SELECT * FROM "Product" ORDER BY "createdAt" DESC');
            }
            return res.status(200).json({ products: result.rows });
        }

        // For POST, PUT, DELETE, we need VENDOR authentication
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) return res.status(401).json({ message: 'No authentication cookie found' });

        const tokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
        if (!tokenMatch) return res.status(401).json({ message: 'No auth_token found in cookies' });

        const token = tokenMatch[1];
        const jwtSecret = process.env.JWT_SECRET || 'fallback_development_secret_key_12345';
        const decoded = jwt.verify(token, jwtSecret);

        if (decoded.role !== 'VENDOR') {
            return res.status(403).json({ message: 'Forbidden. Vendor access required.' });
        }

        // Get the Vendor Profile ID for this user to ensure they only touch their own products
        const vendorResult = await query('SELECT id FROM "VendorProfile" WHERE "userId" = $1 AND status = \'APPROVED\'', [decoded.userId]);
        if (vendorResult.rows.length === 0) {
            return res.status(403).json({ message: 'Forbidden. Active Vendor Profile required.' });
        }
        const vendorProfileId = vendorResult.rows[0].id;

        if (method === 'POST') {
            // POST /api/products
            const { name, description, price, quantity, isGstInclusive, taxRate, hsn, image } = req.body;

            if (!name || price === undefined) {
                return res.status(400).json({ message: 'Name and price are required' });
            }

            // Inline schema patch
            try {
                await query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS image TEXT');
                await query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS hsn TEXT');
            } catch (e) {
                console.log("Migration check complete", e.message);
            }

            // Generate a unique ID 
            const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            const insertResult = await query(`
                INSERT INTO "Product" (id, "vendorId", name, description, price, "stockQuantity", "isGstInclusive", "taxRate", hsn, image, "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
                RETURNING *
            `, [
                productId,
                vendorProfileId,
                name,
                description || '',
                parseFloat(price) || 0,
                parseInt(quantity) || 0,
                Boolean(isGstInclusive),
                parseFloat(taxRate) || 18.0,
                hsn || '',
                image || ''
            ]);

            return res.status(201).json({ product: insertResult.rows[0] });
        }

        if (method === 'PUT') {
            // PUT /api/products?id=XYZ
            const { id } = req.query;
            if (!id) return res.status(400).json({ message: 'Product ID is required' });

            // Verify ownership
            const checkResult = await query('SELECT id FROM "Product" WHERE id = $1 AND "vendorId" = $2', [id, vendorProfileId]);
            if (checkResult.rows.length === 0) return res.status(404).json({ message: 'Product not found or unauthorized' });

            const { name, description, price, quantity, isGstInclusive, taxRate, hsn, image } = req.body;

            const updateResult = await query(`
                UPDATE "Product" 
                SET name = COALESCE($1, name),
                    description = COALESCE($2, description),
                    price = COALESCE($3, price),
                    "stockQuantity" = COALESCE($4, "stockQuantity"),
                    "isGstInclusive" = COALESCE($5, "isGstInclusive"),
                    "taxRate" = COALESCE($6, "taxRate"),
                    hsn = COALESCE($7, hsn),
                    image = COALESCE($8, image),
                    "updatedAt" = CURRENT_TIMESTAMP
                WHERE id = $9 AND "vendorId" = $10
                RETURNING *
            `, [
                name,
                description,
                price !== undefined ? parseFloat(price) : null,
                quantity !== undefined ? parseInt(quantity) : null,
                isGstInclusive !== undefined ? Boolean(isGstInclusive) : null,
                taxRate !== undefined ? parseFloat(taxRate) : null,
                hsn,
                image,
                id,
                vendorProfileId
            ]);

            return res.status(200).json({ product: updateResult.rows[0] });
        }

        if (method === 'DELETE') {
            // DELETE /api/products?id=XYZ
            const { id } = req.query;
            if (!id) return res.status(400).json({ message: 'Product ID is required' });

            // Verify ownership
            const checkResult = await query('SELECT id FROM "Product" WHERE id = $1 AND "vendorId" = $2', [id, vendorProfileId]);
            if (checkResult.rows.length === 0) return res.status(404).json({ message: 'Product not found or unauthorized' });

            await query('DELETE FROM "Product" WHERE id = $1 AND "vendorId" = $2', [id, vendorProfileId]);

            return res.status(200).json({ message: 'Product deleted successfully', id });
        }

        return res.status(405).json({ message: 'Method Not Allowed' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        console.error('Products API Error:', error);
        return res.status(500).json({ message: 'Internal server error processing product request' });
    }
}
