import { db } from "./server/db";
import { inspections } from "./shared/schema";
import { sql } from "drizzle-orm";

async function checkToday() {
    try {
        const result = await db.select().from(inspections)
            .where(sql`DATE(created_at) = CURRENT_DATE OR DATE(date) = CURRENT_DATE`);
        console.log(`Inspections created today: ${result.length}`);
        
        const all = await db.select().from(inspections);
        console.log(`Total inspections in DB: ${all.length}`);
        if (all.length > 0) {
            console.log(`Latest inspection created at: ${all[all.length-1].createdAt}`);
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkToday();
