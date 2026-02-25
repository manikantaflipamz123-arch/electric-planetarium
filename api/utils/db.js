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
