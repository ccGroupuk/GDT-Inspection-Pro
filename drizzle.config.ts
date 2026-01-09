import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:MkXscqkxhSunftcGMsvIbWhDXklkSRFO@yamanote.proxy.rlwy.net:32018/railway",
  },
});
