import { Pool } from 'pg';

let pool;

export function getDb() {
    if (!pool) {
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL is not defined in the environment variables.");
        }

        // Create a connection pool to Supabase
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            // For Supabase IPv4 connection handling (pgBouncer), ssl might be needed
            // but the ?pgbouncer=true flag often handles it. Adding basic ssl config:
            ssl: {
                rejectUnauthorized: false
            },
            // Keep connections alive to avoid reconnect latency in Serverless environments
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });
    }
    return pool;
}

// Helper to quickly query without passing pool everywhere
export async function query(text, params) {
    const db = getDb();
    return db.query(text, params);
}

// Helper to cleanup abandoned Cashfree transactions and refund their locked stock
export async function cleanupExpiredOrders() {
    const db = getDb();

    try {
        await db.query('BEGIN');

        // 1. Find all PENDING_PAYMENT orders older than 5 minutes
        const expiredOrders = await db.query(`
            SELECT id FROM "Order" 
            WHERE status = 'PENDING_PAYMENT' 
            AND "createdAt" < NOW() - INTERVAL '5 minutes'
            FOR UPDATE SKIP LOCKED
        `);

        if (expiredOrders.rows.length === 0) {
            await db.query('COMMIT');
            return;
        }

        const orderIds = expiredOrders.rows.map(r => r.id);

        for (const orderId of orderIds) {
            // Find all items in this abandoned order
            const itemsResult = await db.query(`SELECT "productId", quantity FROM "OrderItem" WHERE "orderId" = $1`, [orderId]);

            // Refund the stock directly back to the live product
            for (const item of itemsResult.rows) {
                await db.query(`
                    UPDATE "Product" 
                    SET "stockQuantity" = "stockQuantity" + $1,
                        "updatedAt" = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [item.quantity, item.productId]);
            }

            // Mark the order itself as permanently cancelled
            await db.query(`
                UPDATE "Order"
                SET status = 'CANCELLED',
                    "updatedAt" = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [orderId]);
        }

        await db.query('COMMIT');
        if (orderIds.length > 0) {
            console.log(`Cleaned up ${orderIds.length} expired orders and refunded stock.`);
        }
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Cleanup script failed:", error);
    }
}
