import { 
  users, type User, type InsertUser,
  contacts, type Contact, type InsertContact,
  tradePartners, type TradePartner, type InsertTradePartner,
  jobs, type Job, type InsertJob,
  tasks, type Task, type InsertTask,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;

  getTradePartners(): Promise<TradePartner[]>;
  getTradePartner(id: string): Promise<TradePartner | undefined>;
  createTradePartner(partner: InsertTradePartner): Promise<TradePartner>;
  updateTradePartner(id: string, partner: Partial<InsertTradePartner>): Promise<TradePartner | undefined>;
  deleteTradePartner(id: string): Promise<boolean>;

  getJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: string): Promise<boolean>;
  getNextJobNumber(): Promise<string>;

  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getContacts(): Promise<Contact[]> {
    return db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [created] = await db.insert(contacts).values(contact).returning();
    return created;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db.update(contacts).set(contact).where(eq(contacts.id, id)).returning();
    return updated || undefined;
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return true;
  }

  async getTradePartners(): Promise<TradePartner[]> {
    return db.select().from(tradePartners);
  }

  async getTradePartner(id: string): Promise<TradePartner | undefined> {
    const [partner] = await db.select().from(tradePartners).where(eq(tradePartners.id, id));
    return partner || undefined;
  }

  async createTradePartner(partner: InsertTradePartner): Promise<TradePartner> {
    const [created] = await db.insert(tradePartners).values(partner).returning();
    return created;
  }

  async updateTradePartner(id: string, partner: Partial<InsertTradePartner>): Promise<TradePartner | undefined> {
    const [updated] = await db.update(tradePartners).set(partner).where(eq(tradePartners.id, id)).returning();
    return updated || undefined;
  }

  async deleteTradePartner(id: string): Promise<boolean> {
    await db.delete(tradePartners).where(eq(tradePartners.id, id));
    return true;
  }

  async getJobs(): Promise<Job[]> {
    return db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async getNextJobNumber(): Promise<string> {
    const allJobs = await db.select().from(jobs);
    const count = allJobs.length + 1;
    const year = new Date().getFullYear().toString().slice(-2);
    return `CCC-${year}-${count.toString().padStart(4, '0')}`;
  }

  async createJob(job: InsertJob & { jobNumber?: string }): Promise<Job> {
    const jobNumber = job.jobNumber || await this.getNextJobNumber();
    const [created] = await db.insert(jobs).values({ ...job, jobNumber }).returning();
    return created;
  }

  async updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined> {
    const [updated] = await db.update(jobs).set({ ...job, updatedAt: new Date() }).where(eq(jobs.id, id)).returning();
    return updated || undefined;
  }

  async deleteJob(id: string): Promise<boolean> {
    await db.delete(jobs).where(eq(jobs.id, id));
    return true;
  }

  async getTasks(): Promise<Task[]> {
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return updated || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    await db.delete(tasks).where(eq(tasks.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
