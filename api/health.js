export default function handler(req, res) {
    // This is a secure Next.js / Vercel Serverless Function
    // It handles requests to /api/health

    if (req.method === 'GET') {
        res.status(200).json({
            status: 'success',
            message: 'ShopLiveDeals Production API is operational.',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
