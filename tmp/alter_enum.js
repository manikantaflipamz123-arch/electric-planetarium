import fs from 'fs';
import { query } from '../api/_utils/db.js';

const envFile = fs.readFileSync('.env', 'utf-8');
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
        const value = values.join('=').trim().replace(/^['"]|['"]$/g, '');
        process.env[key.trim()] = value;
    }
});

async function run() {
    try {
        await query(`ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT'`);
        console.log("Enum updated successfully");
        process.exit(0);
    } catch (e) {
        console.error("Error updating enum:", e.message);
        process.exit(1);
    }
}
run();
