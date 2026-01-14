import { engineers, inspections, type Engineer, type InsertEngineer, type Inspection, type InsertInspection } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import createMemoryStore from "memorystore";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
    getEngineer(id: number): Promise<Engineer | undefined>;
    getEngineerByUsername(username: string): Promise<Engineer | undefined>;
    createEngineer(engineer: InsertEngineer): Promise<Engineer>;

    // Inspection methods
    createInspection(inspection: InsertInspection): Promise<Inspection>;
    getInspection(id: number): Promise<Inspection | undefined>;
    getInspectionsByEngineer(engineerId: number): Promise<Inspection[]>;
    updateInspection(id: number, inspection: Partial<InsertInspection>): Promise<Inspection | undefined>;

    sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
    sessionStore: session.Store;

    constructor() {
        this.sessionStore = new PostgresSessionStore({
            pool: pool!,
            createTableIfMissing: true,
        });
    }

    async getEngineer(id: number): Promise<Engineer | undefined> {
        const [engineer] = await db!.select().from(engineers).where(eq(engineers.id, id));
        return engineer;
    }

    async getEngineerByUsername(username: string): Promise<Engineer | undefined> {
        const [engineer] = await db!.select().from(engineers).where(eq(engineers.username, username));
        return engineer;
    }

    async createEngineer(insertEngineer: InsertEngineer): Promise<Engineer> {
        const [engineer] = await db!.insert(engineers).values(insertEngineer).returning();
        return engineer;
    }

    async createInspection(insertInspection: InsertInspection): Promise<Inspection> {
        const [inspection] = await db!.insert(inspections).values(insertInspection as any).returning();
        return inspection;
    }

    async getInspection(id: number): Promise<Inspection | undefined> {
        const [inspection] = await db!.select().from(inspections).where(eq(inspections.id, id));
        return inspection;
    }

    async getInspectionsByEngineer(engineerId: number): Promise<Inspection[]> {
        return await db!.select().from(inspections).where(eq(inspections.engineerId, engineerId));
    }

    async updateInspection(id: number, inspection: Partial<InsertInspection>): Promise<Inspection | undefined> {
        const [updated] = await db!
            .update(inspections)
            .set(inspection as any)
            .where(eq(inspections.id, id))
            .returning();
        return updated;
    }
}

import fs from 'fs/promises';
import path from 'path';

export class FileStorage implements IStorage {
    private engineers: Map<number, Engineer>;
    private inspections: Map<number, Inspection>;
    currentId: number;
    currentInspectionId: number;
    sessionStore: session.Store;
    private dataDir: string;
    private dataFile: string;

    constructor() {
        this.engineers = new Map();
        this.inspections = new Map();
        this.currentId = 1;
        this.currentInspectionId = 1;
        this.sessionStore = new MemoryStore({
            checkPeriod: 86400000,
        });

        this.dataDir = path.join(process.cwd(), "data");
        this.dataFile = path.join(this.dataDir, "db.json");

        this.init();
    }

    private async init() {
        try {
            // Ensure data dir exists (handled by mkdir in task, but good safety)
            await fs.mkdir(this.dataDir, { recursive: true });

            try {
                const data = await fs.readFile(this.dataFile, 'utf-8');
                const json = JSON.parse(data);

                // Hydrate maps
                if (json.engineers) {
                    this.engineers = new Map(json.engineers);
                    // Find max ID
                    this.currentId = Math.max(0, ...Array.from(this.engineers.keys())) + 1;
                }
                if (json.inspections) {
                    this.inspections = new Map(json.inspections);
                    // Fix dates from JSON string
                    for (const [id, inspection] of this.inspections) {
                        if (inspection.createdAt) inspection.createdAt = new Date(inspection.createdAt);
                        if (inspection.date) inspection.date = new Date(inspection.date);
                    }
                    this.currentInspectionId = Math.max(0, ...Array.from(this.inspections.keys())) + 1;
                }

                console.log(`[Storage] Hydrated from ${this.dataFile}. ${this.inspections.size} inspections loaded.`);
            } catch (e) {
                if ((e as any).code !== 'ENOENT') {
                    console.error("[Storage] Failed to load data", e);
                } else {
                    console.log("[Storage] No existing data file found, starting fresh.");
                }
            }
        } catch (e) {
            console.error("[Storage] Failed to init", e);
        }
    }

    private async persist() {
        try {
            const data = {
                engineers: Array.from(this.engineers.entries()),
                inspections: Array.from(this.inspections.entries())
            };
            await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error("[Storage] Failed to persist data", e);
        }
    }

    async getEngineer(id: number): Promise<Engineer | undefined> {
        return this.engineers.get(id);
    }

    async getEngineerByUsername(username: string): Promise<Engineer | undefined> {
        return Array.from(this.engineers.values()).find(
            (engineer) => engineer.username === username,
        );
    }

    async createEngineer(insertEngineer: InsertEngineer): Promise<Engineer> {
        const id = this.currentId++;
        const engineer: Engineer = {
            ...insertEngineer,
            id,
            role: insertEngineer.role ?? "engineer",
            createdAt: new Date()
        };
        this.engineers.set(id, engineer);
        await this.persist();
        return engineer;
    }

    async createInspection(insertInspection: InsertInspection): Promise<Inspection> {
        const id = this.currentInspectionId++;
        const inspection: Inspection = {
            ...insertInspection,
            id,
            createdAt: new Date(),
            date: insertInspection.date ? new Date(insertInspection.date) : new Date(),
            status: insertInspection.status ?? "pending",
            data: insertInspection.data ?? null,
            engineerId: insertInspection.engineerId ?? 1 // Hack: Default to 1 if missing in partial
        };
        this.inspections.set(id, inspection);
        await this.persist();
        return inspection;
    }

    async getInspection(id: number): Promise<Inspection | undefined> {
        return this.inspections.get(id);
    }

    async getInspectionsByEngineer(engineerId: number): Promise<Inspection[]> {
        return Array.from(this.inspections.values()).filter(
            (inspection) => inspection.engineerId === engineerId
        );
    }

    async updateInspection(id: number, inspection: Partial<InsertInspection>): Promise<Inspection | undefined> {
        const existing = this.inspections.get(id);
        if (!existing) return undefined;
        const updated = { ...existing, ...inspection };
        this.inspections.set(id, updated);
        await this.persist();
        return updated;
    }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new FileStorage();
