import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const engineers = pgTable("engineers", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    name: text("name").notNull(),
    password: text("password").notNull(),
    role: text("role").notNull().default("engineer"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const inspections = pgTable("inspections", {
    id: serial("id").primaryKey(),
    engineerId: integer("engineer_id").notNull().references(() => engineers.id),
    clientName: text("client_name").notNull(),
    address: text("address").notNull(),
    date: timestamp("date").defaultNow(),
    status: text("status").notNull().default("pending"), // pending, completed
    data: jsonb("data").$type<{
        checklist: Record<string, boolean>;
        notes: string;
        photos: string[];
    }>(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const insertEngineerSchema = createInsertSchema(engineers);
export const selectEngineerSchema = createSelectSchema(engineers);
export const insertInspectionSchema = createInsertSchema(inspections);
export const selectInspectionSchema = createSelectSchema(inspections);

export type InsertEngineer = z.infer<typeof insertEngineerSchema>;
export type Engineer = z.infer<typeof selectEngineerSchema>;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = z.infer<typeof selectInspectionSchema>;
