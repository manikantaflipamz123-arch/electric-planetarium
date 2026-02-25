import { query as executeQuery } from '../utils/db.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const searchQuery = req.query.query;

    if (!searchQuery) {
        return res.status(400).json({ message: 'Missing search query' });
    }

    try {
        // Check if query is a valid UUID to safely query the 'id' column
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchQuery);

        let result;
        if (isUUID) {
            result = await executeQuery(
                'SELECT id, "storeName", "status", "rejectionReason" FROM "VendorProfile" WHERE id = $1',
                [searchQuery]
            );
        } else {
            result = await executeQuery(
                'SELECT id, "storeName", "status", "rejectionReason" FROM "VendorProfile" WHERE "gstNumber" = $1',
                [searchQuery.toUpperCase()]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Application not found' });
        }

        return res.status(200).json({ application: result.rows[0] });
    } catch (error) {
        console.error('Status Error:', error);
        return res.status(500).json({ message: 'Internal server error while fetching status' });
    }
}
