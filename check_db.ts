import { db } from "./server/db";
import { contacts, jobs } from "./shared/schema";
import { seedProductionData } from "./server/seed";

async function runDiagnostic() {
    try {
        console.log("--- Triggering Seed ---");
        await seedProductionData();
        console.log("--- Seed Finished ---");

        const allContacts = await db.select().from(contacts);
        console.log("--- Contacts ---");
        console.log(JSON.stringify(allContacts, null, 2));

        const allJobs = await db.select().from(jobs);
        console.log("--- Jobs ---");
        console.log(JSON.stringify(allJobs, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Diagnostic failed:", err);
        process.exit(1);
    }
}

runDiagnostic();
