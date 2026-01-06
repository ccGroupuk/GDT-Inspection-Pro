import { db } from "../server/db";
import { tradePartners } from "@shared/schema";
import { eq } from "drizzle-orm";
import { seedProductionData } from "../server/seed";

async function verify() {
    console.log("Waiting for database initialization...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log("Running seed...");
    await seedProductionData();

    console.log("Verifying partner...");
    const [partner] = await db.select().from(tradePartners).where(eq(tradePartners.email, "mike.spark@example.com"));

    if (partner) {
        console.log("✅ SUCCESS: Dummy trade partner found:");
        console.log(partner);
    } else {
        console.error("❌ FAILURE: Dummy trade partner NOT found.");
        process.exit(1);
    }
}

verify().catch(console.error);
