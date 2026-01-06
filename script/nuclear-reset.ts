
import pg from "pg";
// Load env vars if locally, but on Replit they are usually auto-loaded or passed in.
// We'll skip explicit dotenv require since we might not have it in dependencies for production build, 
// although this is a dev script.
import "dotenv/config";

if (!process.env.DATABASE_URL) {
    console.error("❌ No DATABASE_URL found! This script must be run where the database lives (e.g. Replit).");
    process.exit(1);
}

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    console.log("\n☢️  NUCLEAR RESET INITIATED ☢️");
    console.log("This will permanently delete ALL data in the database to fix the migration loop.");
    console.log("Waiting 3 seconds in case you want to Cancel (Ctrl+C)...\n");

    await new Promise(r => setTimeout(r, 3000));

    console.log("...Dropping 'public' schema...");

    const client = await pool.connect();
    try {
        // Drop everything
        await client.query("DROP SCHEMA IF EXISTS public CASCADE;");
        // Recreate empty schema
        await client.query("CREATE SCHEMA public;");

        // Grant permissions (standard for default postgres behavior)
        await client.query("GRANT ALL ON SCHEMA public TO public;");
        await client.query("COMMENT ON SCHEMA public IS 'standard public schema';");

        console.log("\n✅ SUCCESS: Database has been wiped clean.");
        console.log("\n👇 NEXT STEPS:");
        console.log("1. Run: npm run db:push");
        console.log("2. The site should restart automatically.");

    } catch (err) {
        console.error("❌ Failed to wipe database:", err);
    } finally {
        client.release();
        pool.end();
    }
}

main();
