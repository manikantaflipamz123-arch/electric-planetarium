import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../api/utils/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
    console.log("Loading .env file");
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length > 1) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/"/g, '').replace(/'/g, '');
            if (key) {
                process.env[key] = value;
            }
        }
    });
}

async function migrate() {
    try {
        console.log('Starting migration...');

        try {
            await query('ALTER TABLE "Product" RENAME COLUMN "stockQuantity" TO quantity');
            console.log('Renamed stockQuantity to quantity');
        } catch (e) {
            console.log('Skipping rename, might already exist:', e.message);
        }

        try {
            await query('ALTER TABLE "Product" ADD COLUMN image TEXT');
            console.log('Added image column');
        } catch (e) {
            console.log('Skipping image, might already exist:', e.message);
        }

        try {
            await query('ALTER TABLE "Product" ADD COLUMN hsn TEXT');
            console.log('Added hsn column');
        } catch (e) {
            console.log('Skipping hsn, might already exist:', e.message);
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
