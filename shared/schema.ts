import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import and re-export auth models (required for Replit Auth)
import { users, sessions } from "./models/auth";
export { users, sessions };
export type { User, UpsertUser } from "./models/auth";

// Contacts (Clients)
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address"),
  postcode: text("postcode"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactsRelations = relations(contacts, ({ many }) => ({
  jobs: many(jobs),
}));

export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Trade Partners
export const tradePartners = pgTable("trade_partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  tradeCategory: text("trade_category").notNull(), // plumbing, electrical, heating, etc.
  coverageAreas: text("coverage_areas"), // postcodes or towns
  paymentTerms: text("payment_terms"),
  commissionType: text("commission_type").default("percentage"), // percentage or fixed
  commissionValue: decimal("commission_value", { precision: 10, scale: 2 }).default("10"),
  insuranceVerified: boolean("insurance_verified").default(false),
  rating: integer("rating").default(5), // 1-5
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
});

export const insertTradePartnerSchema = createInsertSchema(tradePartners).omit({ id: true });
export type InsertTradePartner = z.infer<typeof insertTradePartnerSchema>;
export type TradePartner = typeof tradePartners.$inferSelect;

// Jobs (Projects / Enquiries)
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobNumber: text("job_number").notNull().unique(),
  contactId: varchar("contact_id").notNull().references(() => contacts.id),
  
  // Job Details
  serviceType: text("service_type").notNull(),
  description: text("description"),
  jobAddress: text("job_address").notNull(),
  jobPostcode: text("job_postcode").notNull(),
  leadSource: text("lead_source"),
  
  // Classification
  deliveryType: text("delivery_type").notNull().default("in_house"), // in_house, partner, hybrid
  tradeCategory: text("trade_category"), // if partner/hybrid
  partnerId: varchar("partner_id").references(() => tradePartners.id),
  
  // Pipeline Status
  status: text("status").notNull().default("new_enquiry"),
  
  // Pricing
  quoteType: text("quote_type").default("fixed"), // fixed or estimate
  quotedValue: decimal("quoted_value", { precision: 10, scale: 2 }),
  depositRequired: boolean("deposit_required").default(false),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositReceived: boolean("deposit_received").default(false),
  
  // Partner financials
  partnerCharge: decimal("partner_charge", { precision: 10, scale: 2 }),
  cccMargin: decimal("ccc_margin", { precision: 10, scale: 2 }),
  partnerInvoiceReceived: boolean("partner_invoice_received").default(false),
  partnerPaid: boolean("partner_paid").default(false),
  
  // Partner status
  partnerStatus: text("partner_status"), // offered, accepted, declined, in_progress, completed, invoiced, paid
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [jobs.contactId],
    references: [contacts.id],
  }),
  partner: one(tradePartners, {
    fields: [jobs.partnerId],
    references: [tradePartners.id],
  }),
  tasks: many(tasks),
}));

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true, jobNumber: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Tasks & Follow-Ups
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium"), // low, medium, high
  status: text("status").default("pending"), // pending, completed
  assignedTo: varchar("assigned_to"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  job: one(jobs, {
    fields: [tasks.jobId],
    references: [jobs.id],
  }),
}));

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Pipeline Stages (for reference)
export const PIPELINE_STAGES = [
  { value: "new_enquiry", label: "New Enquiry", color: "bg-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-sky-500" },
  { value: "survey_booked", label: "Survey Booked", color: "bg-cyan-500" },
  { value: "quoting", label: "Quoting", color: "bg-teal-500" },
  { value: "quote_sent", label: "Quote Sent", color: "bg-emerald-500" },
  { value: "follow_up", label: "Follow-Up Due", color: "bg-yellow-500" },
  { value: "quote_accepted", label: "Quote Accepted", color: "bg-green-500" },
  { value: "deposit_requested", label: "Deposit Requested", color: "bg-lime-500" },
  { value: "deposit_paid", label: "Deposit Paid", color: "bg-green-600" },
  { value: "scheduled", label: "Scheduled", color: "bg-indigo-500" },
  { value: "in_progress", label: "In Progress", color: "bg-purple-500" },
  { value: "completed", label: "Completed", color: "bg-violet-500" },
  { value: "invoice_sent", label: "Invoice Sent", color: "bg-pink-500" },
  { value: "paid", label: "Paid", color: "bg-rose-500" },
  { value: "closed", label: "Closed", color: "bg-gray-500" },
  { value: "lost", label: "Lost", color: "bg-red-500" },
] as const;

export const SERVICE_TYPES = [
  "Bespoke Carpentry",
  "Under-Stairs Storage",
  "Media Walls",
  "Fitted Wardrobes",
  "Kitchens / Joinery",
  "Bathrooms",
  "Plumbing",
  "Electrical",
  "Heating",
  "Drains",
  "Full Home Project",
  "Other",
] as const;

export const TRADE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Heating",
  "Plastering",
  "Tiling",
  "Fire Installs",
  "Decorating",
  "Other",
] as const;

export const LEAD_SOURCES = [
  "Website",
  "Phone",
  "Referral",
  "Social Media",
  "Google",
  "Repeat Customer",
  "Other",
] as const;

export const DELIVERY_TYPES = [
  { value: "in_house", label: "CCC In-House", icon: "CheckCircle" },
  { value: "partner", label: "Trade Partner", icon: "Handshake" },
  { value: "hybrid", label: "Hybrid (CCC + Partner)", icon: "RefreshCw" },
] as const;

export const PARTNER_STATUSES = [
  "offered",
  "accepted", 
  "declined",
  "in_progress",
  "completed",
  "invoiced",
  "paid",
] as const;

// ==================== CLIENT PORTAL ====================

// Client Portal Access (links contacts to portal users)
export const clientPortalAccess = pgTable("client_portal_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: varchar("contact_id").notNull().references(() => contacts.id),
  userId: varchar("user_id").references(() => users.id), // Replit Auth user
  accessToken: text("access_token").unique(), // For magic link login
  tokenExpiry: timestamp("token_expiry"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const clientPortalAccessRelations = relations(clientPortalAccess, ({ one }) => ({
  contact: one(contacts, {
    fields: [clientPortalAccess.contactId],
    references: [contacts.id],
  }),
}));

export const insertClientPortalAccessSchema = createInsertSchema(clientPortalAccess).omit({ id: true, createdAt: true });
export type InsertClientPortalAccess = z.infer<typeof insertClientPortalAccessSchema>;
export type ClientPortalAccess = typeof clientPortalAccess.$inferSelect;

// Client Invites (for sending portal invitations)
export const clientInvites = pgTable("client_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: varchar("contact_id").notNull().references(() => contacts.id),
  inviteToken: text("invite_token").notNull().unique(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientInvitesRelations = relations(clientInvites, ({ one }) => ({
  contact: one(contacts, {
    fields: [clientInvites.contactId],
    references: [contacts.id],
  }),
}));

export const insertClientInviteSchema = createInsertSchema(clientInvites).omit({ id: true, createdAt: true });
export type InsertClientInvite = z.infer<typeof insertClientInviteSchema>;
export type ClientInvite = typeof clientInvites.$inferSelect;

// Payment Requests (for deposit and balance prompts)
export const paymentRequests = pgTable("payment_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  type: text("type").notNull(), // deposit, balance, milestone
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, sent, paid, overdue
  sentAt: timestamp("sent_at"),
  paidAt: timestamp("paid_at"),
  showInPortal: boolean("show_in_portal").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentRequestsRelations = relations(paymentRequests, ({ one }) => ({
  job: one(jobs, {
    fields: [paymentRequests.jobId],
    references: [jobs.id],
  }),
}));

export const insertPaymentRequestSchema = createInsertSchema(paymentRequests).omit({ id: true, createdAt: true });
export type InsertPaymentRequest = z.infer<typeof insertPaymentRequestSchema>;
export type PaymentRequest = typeof paymentRequests.$inferSelect;

// Company Settings (for review links and branding)
export const companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanySettingSchema = createInsertSchema(companySettings).omit({ id: true, updatedAt: true });
export type InsertCompanySetting = z.infer<typeof insertCompanySettingSchema>;
export type CompanySetting = typeof companySettings.$inferSelect;

// Review request tracking
export const reviewRequests = pgTable("review_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  contactId: varchar("contact_id").notNull().references(() => contacts.id),
  sentAt: timestamp("sent_at").defaultNow(),
  facebookClicked: boolean("facebook_clicked").default(false),
  googleClicked: boolean("google_clicked").default(false),
  trustpilotClicked: boolean("trustpilot_clicked").default(false),
});

export const reviewRequestsRelations = relations(reviewRequests, ({ one }) => ({
  job: one(jobs, {
    fields: [reviewRequests.jobId],
    references: [jobs.id],
  }),
  contact: one(contacts, {
    fields: [reviewRequests.contactId],
    references: [contacts.id],
  }),
}));

export const insertReviewRequestSchema = createInsertSchema(reviewRequests).omit({ id: true, sentAt: true });
export type InsertReviewRequest = z.infer<typeof insertReviewRequestSchema>;
export type ReviewRequest = typeof reviewRequests.$inferSelect;

// Payment request types
export const PAYMENT_REQUEST_TYPES = [
  { value: "deposit", label: "Deposit" },
  { value: "balance", label: "Final Balance" },
  { value: "milestone", label: "Milestone Payment" },
] as const;

// Payment status types
export const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "sent", label: "Sent to Client", color: "bg-blue-500" },
  { value: "paid", label: "Paid", color: "bg-green-500" },
  { value: "overdue", label: "Overdue", color: "bg-red-500" },
] as const;
