import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import pg from "pg";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "@shared/schema";
import fs from "fs";
import path from "path";

export const pool = (!process.env.DATABASE_URL) ? null : new pg.Pool({ connectionString: process.env.DATABASE_URL });

let dbInstance: any;

console.log(`[DEBUG] Checking DATABASE_URL: ${process.env.DATABASE_URL ? 'DEFINED (Length: ' + process.env.DATABASE_URL.length + ')' : 'UNDEFINED'}`);

if (process.env.DATABASE_URL) {
  dbInstance = drizzle(pool!, { schema });
} else {
  console.log("⚠️ DATABASE_URL not found. Switching to local PGLite (In-Memory/File Persistence)...");

  // Ensure data directory exists
  const dataDir = path.resolve("./.data/postgres");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const client = new PGlite(dataDir);
  dbInstance = drizzlePglite(client, { schema });

  // Simple migration runner for PGLite
  (async () => {
    try {
      console.log("Running local migrations...");
      const migrationsDir = path.resolve("./migrations");
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir).sort();
        for (const file of files) {
          if (file.endsWith(".sql")) {
            try {
              const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
              const statements = sql.split("--> statement-breakpoint");
              for (const statement of statements) {
                if (statement.trim()) {
                  await client.exec(statement);
                }
              }
            } catch (e: any) {
              // Ignore table already exists errors, but log others
              if (e.code !== '42P07') {
                console.log(`[migration] Notice processing ${file}: ${e.message}`);
              } else {
                console.log(`[migration] Skipping ${file} (tables exist)`);
              }
            }
          }
        }
        console.log("Migrations check completed.");
      } else {
        console.log("No migrations folder found. Schema might be empty!");
      }
    } catch (e: any) {
      console.error("Migration system error:", e);
    }
  })();
}

export const db = dbInstance;
