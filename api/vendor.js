import { query } from './_utils/db.js';

export default async function handler(req, res) {
    const { action, query: searchQuery } = req.query;

    if (action === 'status' && req.method === 'GET') {
        if (!searchQuery) return res.status(400).json({ message: 'Query parameter is required' });

        try {
            const result = await query(`
                SELECT vp."storeName", vp.status, vp."rejectionReason", u.email, u."createdAt" as "submittedAt"
                FROM "VendorProfile" vp JOIN "User" u ON vp."userId" = u.id
                WHERE vp."storeName" ILIKE $1 OR u.email ILIKE $1
            `, [`%${searchQuery}%`]);

            if (result.rows.length === 0) return res.status(404).json({ message: 'No application found for this Store Name or Email' });

            return res.status(200).json({ application: result.rows[0] });
        } catch (error) {
            console.error('Fetch Status Error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
