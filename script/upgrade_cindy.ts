import { db } from "../server/db";
import { employees } from "../shared/schema";
import { eq, ilike, or } from "drizzle-orm";

async function main() {
  console.log("🔍 Searching for 'Cindy'...");

  // Search for anyone with first name, last name, or email containing "cindy"
  const found = await db.select().from(employees).where(
    or(
      ilike(employees.firstName, "%Cindy%"),
      ilike(employees.lastName, "%Cindy%"),
      ilike(employees.email, "%Cindy%")
    )
  );

  if (found.length === 0) {
    console.log("❌ No employee found matching 'Cindy'.");
    console.log("Please provide Cindy's full name or email address so I can create her account.");
    process.exit(1);
  }

  if (found.length > 1) {
    console.log("⚠️ Multiple employees found matching 'Cindy':");
    found.forEach(e => console.log(`- ${e.firstName} ${e.lastName} (${e.email}) [Current Role: ${e.role}]`));
    console.log("Please specify which one to upgrade.");
    process.exit(1);
  }

  const cindy = found[0];
  console.log(`✅ Found: ${cindy.firstName} ${cindy.lastName} (${cindy.email})`);
  console.log(`   Current Access Level: ${cindy.accessLevel}`);

  if (cindy.accessLevel === "full_access" || cindy.accessLevel === "owner") {
    console.log("🎉 Cindy already has admin access!");
    process.exit(0);
  }

  console.log("🚀 Upgrading Cindy to 'full_access'...");
  await db.update(employees)
    .set({ accessLevel: "full_access" })
    .where(eq(employees.id, cindy.id));

  console.log("✅ Done! Cindy now has full access to the system.");
  console.log("   She needs to log out and log back in to see the changes.");
}

main().catch(console.error);
