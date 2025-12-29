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
  // Emergency callout availability
  emergencyAvailable: boolean("emergency_available").default(false), // Available for emergency callouts
  emergencyNote: text("emergency_note"), // Notes about availability
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
  depositType: text("deposit_type").default("fixed"), // percentage or fixed
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositReceived: boolean("deposit_received").default(false),
  
  // Partner financials
  partnerChargeType: text("partner_charge_type").default("fixed"), // percentage or fixed
  partnerCharge: decimal("partner_charge", { precision: 10, scale: 2 }),
  cccMargin: decimal("ccc_margin", { precision: 10, scale: 2 }),
  partnerInvoiceReceived: boolean("partner_invoice_received").default(false),
  partnerPaid: boolean("partner_paid").default(false),
  
  // Partner status
  partnerStatus: text("partner_status"), // offered, accepted, declined, in_progress, completed, invoiced, paid
  
  // Partner portal sharing
  shareQuoteWithPartner: boolean("share_quote_with_partner").default(false),
  shareNotesWithPartner: boolean("share_notes_with_partner").default(false),
  
  // Quote details
  taxEnabled: boolean("tax_enabled").default(false),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("20"), // Default 20% VAT
  discountType: text("discount_type"), // percentage or fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  
  // Client quote response
  quoteResponse: text("quote_response"), // pending, accepted, declined
  quoteRespondedAt: timestamp("quote_responded_at"),
  
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
  quoteItems: many(quoteItems),
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

// Quote Line Items
export const quoteItems = pgTable("quote_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  job: one(jobs, {
    fields: [quoteItems.jobId],
    references: [jobs.id],
  }),
}));

export const insertQuoteItemSchema = createInsertSchema(quoteItems).omit({ id: true, createdAt: true });
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type QuoteItem = typeof quoteItems.$inferSelect;

// Invoices (sent quotes/invoices with snapshots)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  referenceNumber: text("reference_number").notNull().unique(),
  type: text("type").notNull().default("quote"), // quote, invoice
  status: text("status").notNull().default("draft"), // draft, sent, viewed, paid, cancelled
  
  // Snapshot of totals at time of creation
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountType: text("discount_type"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  taxEnabled: boolean("tax_enabled").default(false),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),
  grandTotal: decimal("grand_total", { precision: 10, scale: 2 }).notNull(),
  
  // Deposit info snapshot
  depositRequired: boolean("deposit_required").default(false),
  depositType: text("deposit_type"),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositCalculated: decimal("deposit_calculated", { precision: 10, scale: 2 }),
  
  // Payment info
  dueDate: timestamp("due_date"),
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  
  // Visibility
  showInPortal: boolean("show_in_portal").default(false),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  paidAt: timestamp("paid_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  job: one(jobs, {
    fields: [invoices.jobId],
    references: [jobs.id],
  }),
  lineItems: many(invoiceLineItems),
}));

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Invoice Line Items (snapshot of quote items at time of invoice creation)
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const insertInvoiceLineItemSchema = createInsertSchema(invoiceLineItems).omit({ id: true });
export type InsertInvoiceLineItem = z.infer<typeof insertInvoiceLineItemSchema>;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;

// Invoice statuses for reference
export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-gray-500" },
  { value: "sent", label: "Sent", color: "bg-blue-500" },
  { value: "viewed", label: "Viewed", color: "bg-purple-500" },
  { value: "paid", label: "Paid", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
] as const;

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
  passwordHash: text("password_hash"), // Optional password for extra security
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

// Partner Portal Access (for trade partners to view their jobs)
export const partnerPortalAccess = pgTable("partner_portal_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => tradePartners.id),
  accessToken: text("access_token").unique(),
  tokenExpiry: timestamp("token_expiry"),
  passwordHash: text("password_hash"), // Optional password for extra security
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const partnerPortalAccessRelations = relations(partnerPortalAccess, ({ one }) => ({
  partner: one(tradePartners, {
    fields: [partnerPortalAccess.partnerId],
    references: [tradePartners.id],
  }),
}));

export const insertPartnerPortalAccessSchema = createInsertSchema(partnerPortalAccess).omit({ id: true, createdAt: true });
export type InsertPartnerPortalAccess = z.infer<typeof insertPartnerPortalAccessSchema>;
export type PartnerPortalAccess = typeof partnerPortalAccess.$inferSelect;

// Partner Invites (for sending portal invitations to trade partners)
export const partnerInvites = pgTable("partner_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => tradePartners.id),
  inviteToken: text("invite_token").notNull().unique(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const partnerInvitesRelations = relations(partnerInvites, ({ one }) => ({
  partner: one(tradePartners, {
    fields: [partnerInvites.partnerId],
    references: [tradePartners.id],
  }),
}));

export const insertPartnerInviteSchema = createInsertSchema(partnerInvites).omit({ id: true, createdAt: true });
export type InsertPartnerInvite = z.infer<typeof insertPartnerInviteSchema>;
export type PartnerInvite = typeof partnerInvites.$inferSelect;

// ==================== JOB NOTES ====================

// Job Notes (structured notes with visibility controls)
export const jobNotes = pgTable("job_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  visibility: text("visibility").notNull().default("internal"), // internal, partner, client, all
  authorName: text("author_name"), // Name of who wrote the note
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobNotesRelations = relations(jobNotes, ({ one, many }) => ({
  job: one(jobs, {
    fields: [jobNotes.jobId],
    references: [jobs.id],
  }),
  attachments: many(jobNoteAttachments),
}));

export const insertJobNoteSchema = createInsertSchema(jobNotes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJobNote = z.infer<typeof insertJobNoteSchema>;
export type JobNote = typeof jobNotes.$inferSelect;

// Job Note Attachments (photos and files)
export const jobNoteAttachments = pgTable("job_note_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").notNull().references(() => jobNotes.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(), // URL to the stored file
  mimeType: text("mime_type"),
  fileSize: integer("file_size"), // Size in bytes
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobNoteAttachmentsRelations = relations(jobNoteAttachments, ({ one }) => ({
  note: one(jobNotes, {
    fields: [jobNoteAttachments.noteId],
    references: [jobNotes.id],
  }),
}));

export const insertJobNoteAttachmentSchema = createInsertSchema(jobNoteAttachments).omit({ id: true, createdAt: true });
export type InsertJobNoteAttachment = z.infer<typeof insertJobNoteAttachmentSchema>;
export type JobNoteAttachment = typeof jobNoteAttachments.$inferSelect;

// Note visibility options
export const NOTE_VISIBILITY = [
  { value: "internal", label: "Internal Only", description: "Only visible to CCC team" },
  { value: "partner", label: "Partner", description: "Visible to assigned trade partner" },
  { value: "client", label: "Client", description: "Visible to client" },
  { value: "all", label: "All", description: "Visible to everyone" },
] as const;

// ==================== FINANCIAL TRACKING ====================

// Financial Categories
export const financialCategories = pgTable("financial_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // income, expense
  isSystem: boolean("is_system").default(false), // System categories can't be deleted
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFinancialCategorySchema = createInsertSchema(financialCategories).omit({ id: true, createdAt: true });
export type InsertFinancialCategory = z.infer<typeof insertFinancialCategorySchema>;
export type FinancialCategory = typeof financialCategories.$inferSelect;

// Financial Transactions
export const financialTransactions = pgTable("financial_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull().defaultNow(),
  type: text("type").notNull(), // income, expense
  categoryId: varchar("category_id").references(() => financialCategories.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  
  // Links to other entities (optional)
  jobId: varchar("job_id").references(() => jobs.id),
  partnerId: varchar("partner_id").references(() => tradePartners.id),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  
  // Source tracking
  sourceType: text("source_type").notNull(), // job_payment, partner_payment, manual, adjustment
  
  // For partner jobs - track the profit/margin
  grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }), // What client paid
  partnerCost: decimal("partner_cost", { precision: 10, scale: 2 }), // What we paid partner
  profitAmount: decimal("profit_amount", { precision: 10, scale: 2 }), // Our margin
  
  // Receipt scanning
  receiptUrl: text("receipt_url"), // URL to receipt image in object storage
  vendor: text("vendor"), // Extracted vendor name from receipt
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  category: one(financialCategories, {
    fields: [financialTransactions.categoryId],
    references: [financialCategories.id],
  }),
  job: one(jobs, {
    fields: [financialTransactions.jobId],
    references: [jobs.id],
  }),
  partner: one(tradePartners, {
    fields: [financialTransactions.partnerId],
    references: [tradePartners.id],
  }),
  invoice: one(invoices, {
    fields: [financialTransactions.invoiceId],
    references: [invoices.id],
  }),
}));

export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;

// Default financial categories
export const DEFAULT_FINANCIAL_CATEGORIES = [
  { name: "Client Payments", type: "income", isSystem: true, description: "Income from client job payments" },
  { name: "Partner Payments", type: "expense", isSystem: true, description: "Payments to trade partners" },
  { name: "Materials & Supplies", type: "expense", isSystem: false, description: "Materials purchased for jobs" },
  { name: "Overheads", type: "expense", isSystem: false, description: "Rent, utilities, insurance, etc." },
  { name: "Vehicle & Fuel", type: "expense", isSystem: false, description: "Vehicle costs and fuel" },
  { name: "Tools & Equipment", type: "expense", isSystem: false, description: "Tools and equipment purchases" },
  { name: "Marketing", type: "expense", isSystem: false, description: "Advertising and marketing costs" },
  { name: "Other Income", type: "income", isSystem: false, description: "Miscellaneous income" },
  { name: "Other Expenses", type: "expense", isSystem: false, description: "Miscellaneous expenses" },
] as const;

// Transaction source types
export const TRANSACTION_SOURCE_TYPES = [
  { value: "job_payment", label: "Job Payment", description: "Payment received from client" },
  { value: "partner_payment", label: "Partner Payment", description: "Payment made to trade partner" },
  { value: "manual", label: "Manual Entry", description: "Manually entered transaction" },
  { value: "adjustment", label: "Adjustment", description: "Adjustment or correction" },
  { value: "receipt_scan", label: "Receipt Scan", description: "Scanned from receipt photo" },
] as const;

// Calendar Events - for scheduling jobs with partners/in-house team
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id),
  partnerId: varchar("partner_id").references(() => tradePartners.id),
  
  // Event details
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  allDay: boolean("all_day").default(true),
  
  // Event type - general, home_visit_ccc, home_visit_partner, project_start
  eventType: text("event_type").notNull().default("general"),
  
  // Team type determines visibility
  teamType: text("team_type").notNull().default("in_house"), // in_house, partner, hybrid
  
  // Confirmation status
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled
  confirmedByAdmin: boolean("confirmed_by_admin").default(false),
  confirmedByPartner: boolean("confirmed_by_partner").default(false),
  confirmedAt: timestamp("confirmed_at"),
  
  // Client confirmation (for project_start events proposed to clients)
  confirmedByClient: boolean("confirmed_by_client").default(false),
  clientConfirmedAt: timestamp("client_confirmed_at"),
  
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  job: one(jobs, {
    fields: [calendarEvents.jobId],
    references: [jobs.id],
  }),
  partner: one(tradePartners, {
    fields: [calendarEvents.partnerId],
    references: [tradePartners.id],
  }),
}));

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// Partner Availability - track when partners are available/unavailable
export const partnerAvailability = pgTable("partner_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => tradePartners.id),
  
  // Date range
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Status - available means they're free, unavailable means they're blocked
  status: text("status").notNull().default("unavailable"), // available, unavailable
  
  // Reason for unavailability (holiday, sick, other job, etc.)
  reason: text("reason"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const partnerAvailabilityRelations = relations(partnerAvailability, ({ one }) => ({
  partner: one(tradePartners, {
    fields: [partnerAvailability.partnerId],
    references: [tradePartners.id],
  }),
}));

export const insertPartnerAvailabilitySchema = createInsertSchema(partnerAvailability).omit({ id: true, createdAt: true });
export type InsertPartnerAvailability = z.infer<typeof insertPartnerAvailabilitySchema>;
export type PartnerAvailability = typeof partnerAvailability.$inferSelect;

// Calendar event team types
export const CALENDAR_TEAM_TYPES = [
  { value: "in_house", label: "In-House", description: "CCC team work" },
  { value: "partner", label: "Partner", description: "Trade partner work" },
  { value: "hybrid", label: "Hybrid", description: "Combined CCC + Partner work" },
] as const;

// Calendar event statuses
export const CALENDAR_EVENT_STATUSES = [
  { value: "pending", label: "Pending", description: "Awaiting confirmation" },
  { value: "confirmed", label: "Confirmed", description: "Confirmed by all parties" },
  { value: "cancelled", label: "Cancelled", description: "Cancelled" },
] as const;

// Calendar event types
export const CALENDAR_EVENT_TYPES = [
  { value: "general", label: "General", description: "General calendar event" },
  { value: "home_visit_ccc", label: "Home Visit (CCC)", description: "CCC team home visit for measurement/quote" },
  { value: "home_visit_partner", label: "Home Visit (Partner)", description: "Trade partner home visit for measurement/quote" },
  { value: "project_start", label: "Project Start", description: "Proposed project start date" },
] as const;

// ==================== SCHEDULE PROPOSALS ====================

// Job Schedule Proposals - for negotiating start dates with clients
export const jobScheduleProposals = pgTable("job_schedule_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  
  // Proposed dates
  proposedStartDate: timestamp("proposed_start_date").notNull(),
  proposedEndDate: timestamp("proposed_end_date"),
  
  // Status: pending_client, client_accepted, client_declined, client_countered, admin_confirmed, scheduled
  status: text("status").notNull().default("pending_client"),
  
  // Who proposed this date
  proposedByRole: text("proposed_by_role").notNull().default("admin"), // admin, client
  
  // Client response
  clientResponse: text("client_response"), // accepted, declined
  counterProposedDate: timestamp("counter_proposed_date"), // If client suggests alternative
  counterReason: text("counter_reason"), // Why client declined/countered
  respondedAt: timestamp("responded_at"),
  
  // Linked calendar event (created when proposal is confirmed/scheduled)
  linkedCalendarEventId: varchar("linked_calendar_event_id").references(() => calendarEvents.id),
  
  // Notes
  adminNotes: text("admin_notes"),
  
  // Archive old proposals
  isArchived: boolean("is_archived").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobScheduleProposalsRelations = relations(jobScheduleProposals, ({ one }) => ({
  job: one(jobs, {
    fields: [jobScheduleProposals.jobId],
    references: [jobs.id],
  }),
  linkedCalendarEvent: one(calendarEvents, {
    fields: [jobScheduleProposals.linkedCalendarEventId],
    references: [calendarEvents.id],
  }),
}));

export const insertJobScheduleProposalSchema = createInsertSchema(jobScheduleProposals).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJobScheduleProposal = z.infer<typeof insertJobScheduleProposalSchema>;
export type JobScheduleProposal = typeof jobScheduleProposals.$inferSelect;

// Schedule proposal statuses
export const SCHEDULE_PROPOSAL_STATUSES = [
  { value: "pending_client", label: "Awaiting Client", description: "Waiting for client response" },
  { value: "client_accepted", label: "Client Accepted", description: "Client accepted proposed date" },
  { value: "client_declined", label: "Client Declined", description: "Client declined without alternative" },
  { value: "client_countered", label: "Client Countered", description: "Client suggested alternative date" },
  { value: "admin_confirmed", label: "Admin Confirmed", description: "Admin confirmed client's counter" },
  { value: "scheduled", label: "Scheduled", description: "Date confirmed and added to calendar" },
] as const;

// ==================== SEO POWER HOUSE ====================

// SEO Business Profile - Company SEO settings (single record)
export const seoBusinessProfile = pgTable("seo_business_profile", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  tradeType: text("trade_type").notNull(), // carpentry, plumbing, electrical, etc.
  servicesOffered: text("services_offered").array(), // multi-select array
  serviceLocations: text("service_locations").array(), // city/area based
  brandTone: text("brand_tone").notNull().default("professional"), // professional, friendly, premium, straight-talking
  primaryGoals: text("primary_goals").array(), // more_calls, more_quotes, more_visibility
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSeoBusinessProfileSchema = createInsertSchema(seoBusinessProfile).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSeoBusinessProfile = z.infer<typeof insertSeoBusinessProfileSchema>;
export type SeoBusinessProfile = typeof seoBusinessProfile.$inferSelect;

// SEO Brand Voice - Tone and style control
export const seoBrandVoice = pgTable("seo_brand_voice", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customPhrases: text("custom_phrases").array(), // preferred phrases to use
  blacklistedPhrases: text("blacklisted_phrases").array(), // phrases to avoid
  preferredCTAs: text("preferred_ctas").array(), // Call now, Get a quote, etc.
  emojiStyle: text("emoji_style").default("moderate"), // none, minimal, moderate, heavy
  hashtagPreferences: text("hashtag_preferences").array(),
  locationKeywords: text("location_keywords").array(), // Cardiff, Caerphilly, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSeoBrandVoiceSchema = createInsertSchema(seoBrandVoice).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSeoBrandVoice = z.infer<typeof insertSeoBrandVoiceSchema>;
export type SeoBrandVoice = typeof seoBrandVoice.$inferSelect;

// SEO Weekly Focus - Auto-generated weekly content focus
export const seoWeeklyFocus = pgTable("seo_weekly_focus", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekStartDate: timestamp("week_start_date").notNull(),
  weekEndDate: timestamp("week_end_date").notNull(),
  primaryService: text("primary_service").notNull(), // e.g. "Under-Stairs Storage"
  primaryLocation: text("primary_location").notNull(), // e.g. "Cardiff"
  supportingKeywords: text("supporting_keywords").array(),
  seasonalTheme: text("seasonal_theme"), // e.g. "Spring home improvements"
  focusImageUrl: text("focus_image_url"), // uploaded image for multimodal AI content
  focusImageCaption: text("focus_image_caption"), // description of the image
  recommendedPostCount: integer("recommended_post_count").default(6),
  status: text("status").notNull().default("active"), // active, completed, skipped
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSeoWeeklyFocusSchema = createInsertSchema(seoWeeklyFocus).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  weekStartDate: z.coerce.date(),
  weekEndDate: z.coerce.date(),
});
export type InsertSeoWeeklyFocus = z.infer<typeof insertSeoWeeklyFocusSchema>;
export type SeoWeeklyFocus = typeof seoWeeklyFocus.$inferSelect;

// SEO Job Media - Link jobs to media for SEO content
export const seoJobMedia = pgTable("seo_job_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").notNull().default("photo"), // photo, video
  caption: text("caption"),
  isBefore: boolean("is_before").default(false), // before/after toggle
  isApprovedForSeo: boolean("is_approved_for_seo").default(true),
  tags: text("tags").array(), // service tags, location tags
  createdAt: timestamp("created_at").defaultNow(),
});

export const seoJobMediaRelations = relations(seoJobMedia, ({ one }) => ({
  job: one(jobs, {
    fields: [seoJobMedia.jobId],
    references: [jobs.id],
  }),
}));

export const insertSeoJobMediaSchema = createInsertSchema(seoJobMedia).omit({ id: true, createdAt: true });
export type InsertSeoJobMedia = z.infer<typeof insertSeoJobMediaSchema>;
export type SeoJobMedia = typeof seoJobMedia.$inferSelect;

// SEO Content Posts - Generated and scheduled social posts
export const seoContentPosts = pgTable("seo_content_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weeklyFocusId: varchar("weekly_focus_id").references(() => seoWeeklyFocus.id),
  jobId: varchar("job_id").references(() => jobs.id),
  
  // Platform targeting
  platform: text("platform").notNull(), // gbp, facebook, instagram
  postType: text("post_type").notNull().default("update"), // update, offer, before_after, seasonal
  
  // Content
  content: text("content").notNull(),
  hashtags: text("hashtags"),
  callToAction: text("call_to_action"),
  mediaUrls: text("media_urls").array(),
  
  // Status workflow
  status: text("status").notNull().default("draft"), // draft, pending_review, approved, scheduled, published, rejected
  source: text("source").default("manual"), // manual, autopilot
  
  // Scheduling
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  
  // Review
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  // Metrics (for Phase 2)
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  engagement: integer("engagement").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const seoContentPostsRelations = relations(seoContentPosts, ({ one }) => ({
  weeklyFocus: one(seoWeeklyFocus, {
    fields: [seoContentPosts.weeklyFocusId],
    references: [seoWeeklyFocus.id],
  }),
  job: one(jobs, {
    fields: [seoContentPosts.jobId],
    references: [jobs.id],
  }),
}));

export const insertSeoContentPostSchema = createInsertSchema(seoContentPosts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSeoContentPost = z.infer<typeof insertSeoContentPostSchema>;
export type SeoContentPost = typeof seoContentPosts.$inferSelect;

// SEO Autopilot Settings
export const seoAutopilotSettings = pgTable("seo_autopilot_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Global toggle
  enabled: boolean("enabled").default(false),
  
  // Platform-specific settings
  facebookEnabled: boolean("facebook_enabled").default(true),
  facebookPostsPerWeek: integer("facebook_posts_per_week").default(3),
  facebookPreferredDays: text("facebook_preferred_days").array(), // ['monday', 'wednesday', 'friday']
  facebookPreferredTime: text("facebook_preferred_time").default("09:00"), // 24hr format
  
  instagramEnabled: boolean("instagram_enabled").default(true),
  instagramPostsPerWeek: integer("instagram_posts_per_week").default(3),
  instagramPreferredDays: text("instagram_preferred_days").array(), // ['tuesday', 'thursday', 'saturday']
  instagramPreferredTime: text("instagram_preferred_time").default("18:00"),
  
  googleEnabled: boolean("google_enabled").default(true),
  googlePostsPerWeek: integer("google_posts_per_week").default(2),
  googlePreferredDays: text("google_preferred_days").array(), // ['monday', 'thursday']
  googlePreferredTime: text("google_preferred_time").default("12:00"),
  
  // Content mix weights (percentage allocation)
  projectShowcaseWeight: integer("project_showcase_weight").default(40),
  beforeAfterWeight: integer("before_after_weight").default(20),
  tipsWeight: integer("tips_weight").default(15),
  testimonialWeight: integer("testimonial_weight").default(15),
  seasonalWeight: integer("seasonal_weight").default(10),
  
  // Auto-generation preferences
  autoGenerateAhead: integer("auto_generate_ahead").default(7), // days ahead to generate
  requireApproval: boolean("require_approval").default(true),
  useWeeklyFocusImages: boolean("use_weekly_focus_images").default(true),
  
  // Notification preferences
  notifyOnGeneration: boolean("notify_on_generation").default(true),
  notifyBeforePost: boolean("notify_before_post").default(true),
  notifyBeforePostHours: integer("notify_before_post_hours").default(2),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSeoAutopilotSettingsSchema = createInsertSchema(seoAutopilotSettings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSeoAutopilotSettings = z.infer<typeof insertSeoAutopilotSettingsSchema>;
export type SeoAutopilotSettings = typeof seoAutopilotSettings.$inferSelect;

// SEO Autopilot Scheduled Slots
export const seoAutopilotSlots = pgTable("seo_autopilot_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Scheduling info
  platform: text("platform").notNull(), // facebook, instagram, google_business
  scheduledFor: timestamp("scheduled_for").notNull(),
  contentType: text("content_type").notNull(), // project_showcase, before_after, tip, testimonial, seasonal
  
  // Status
  status: text("status").notNull().default("pending"), // pending, generated, approved, posted, skipped
  
  // Link to generated post
  contentPostId: varchar("content_post_id").references(() => seoContentPosts.id),
  
  // Weekly focus to use (if any)
  weeklyFocusId: varchar("weekly_focus_id").references(() => seoWeeklyFocus.id),
  
  // Approval
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),
  
  // Posted info
  postedAt: timestamp("posted_at"),
  postError: text("post_error"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const seoAutopilotSlotsRelations = relations(seoAutopilotSlots, ({ one }) => ({
  contentPost: one(seoContentPosts, {
    fields: [seoAutopilotSlots.contentPostId],
    references: [seoContentPosts.id],
  }),
  weeklyFocus: one(seoWeeklyFocus, {
    fields: [seoAutopilotSlots.weeklyFocusId],
    references: [seoWeeklyFocus.id],
  }),
}));

export const insertSeoAutopilotSlotSchema = createInsertSchema(seoAutopilotSlots).omit({ id: true, createdAt: true });
export type InsertSeoAutopilotSlot = z.infer<typeof insertSeoAutopilotSlotSchema>;
export type SeoAutopilotSlot = typeof seoAutopilotSlots.$inferSelect;

// SEO Autopilot Generation Runs (audit log)
export const seoAutopilotRuns = pgTable("seo_autopilot_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Run info
  ranAt: timestamp("ran_at").defaultNow(),
  slotsGenerated: integer("slots_generated").default(0),
  postsCreated: integer("posts_created").default(0),
  
  // Status
  status: text("status").notNull().default("success"), // success, partial, failed
  errorMessage: text("error_message"),
  
  // Details
  details: text("details"), // JSON string with generation details
});

export const insertSeoAutopilotRunSchema = createInsertSchema(seoAutopilotRuns).omit({ id: true });
export type InsertSeoAutopilotRun = z.infer<typeof insertSeoAutopilotRunSchema>;
export type SeoAutopilotRun = typeof seoAutopilotRuns.$inferSelect;

// ==================== PORTAL MESSAGES ====================

// Portal Messages (admin sends to clients or partners)
export const portalMessages = pgTable("portal_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Audience targeting
  audienceType: text("audience_type").notNull(), // 'client' or 'partner'
  audienceId: varchar("audience_id").notNull(), // contactId or partnerId
  
  // Message content
  title: text("title").notNull(),
  body: text("body").notNull(),
  messageType: text("message_type").notNull().default("announcement"), // warning, announcement, birthday, sales, custom
  urgency: text("urgency").notNull().default("normal"), // low, normal, high
  
  // Visibility and scheduling
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  
  // Metadata
  createdBy: text("created_by"), // admin username
  createdAt: timestamp("created_at").defaultNow(),
});

export const portalMessagesRelations = relations(portalMessages, ({ many }) => ({
  reads: many(portalMessageReads),
}));

export const insertPortalMessageSchema = createInsertSchema(portalMessages).omit({ id: true, createdAt: true });
export type InsertPortalMessage = z.infer<typeof insertPortalMessageSchema>;
export type PortalMessage = typeof portalMessages.$inferSelect;

// Portal Message Reads (track which messages have been dismissed)
export const portalMessageReads = pgTable("portal_message_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => portalMessages.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at").defaultNow(),
});

export const portalMessageReadsRelations = relations(portalMessageReads, ({ one }) => ({
  message: one(portalMessages, {
    fields: [portalMessageReads.messageId],
    references: [portalMessages.id],
  }),
}));

export const insertPortalMessageReadSchema = createInsertSchema(portalMessageReads).omit({ id: true, readAt: true });
export type InsertPortalMessageRead = z.infer<typeof insertPortalMessageReadSchema>;
export type PortalMessageRead = typeof portalMessageReads.$inferSelect;

// Message Types
export const MESSAGE_TYPES = [
  { value: "warning", label: "Warning", color: "bg-amber-500" },
  { value: "announcement", label: "Announcement", color: "bg-blue-500" },
  { value: "birthday", label: "Birthday", color: "bg-pink-500" },
  { value: "sales", label: "Sales Info", color: "bg-green-500" },
  { value: "custom", label: "Custom", color: "bg-purple-500" },
] as const;

// Message Urgency Levels
export const MESSAGE_URGENCY = [
  { value: "low", label: "Low", color: "text-muted-foreground" },
  { value: "normal", label: "Normal", color: "text-foreground" },
  { value: "high", label: "High", color: "text-destructive" },
] as const;

// SEO Brand Tones
export const SEO_BRAND_TONES = [
  { value: "professional", label: "Professional", description: "Formal and business-like" },
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "premium", label: "Premium", description: "High-end and exclusive" },
  { value: "straight_talking", label: "Straight-Talking", description: "Direct and honest" },
] as const;

// SEO Post Platforms
export const SEO_PLATFORMS = [
  { value: "gbp", label: "Google Business Profile", description: "Google Maps & Search" },
  { value: "facebook", label: "Facebook", description: "Facebook Page posts" },
  { value: "instagram", label: "Instagram", description: "Instagram feed posts" },
] as const;

// SEO Post Types
export const SEO_POST_TYPES = [
  { value: "update", label: "Update", description: "General business update" },
  { value: "offer", label: "Offer", description: "Special promotion or offer" },
  { value: "before_after", label: "Before/After", description: "Project showcase" },
  { value: "seasonal", label: "Seasonal", description: "Seasonal content" },
  { value: "testimonial", label: "Testimonial", description: "Customer review highlight" },
] as const;

// SEO Post Statuses
export const SEO_POST_STATUSES = [
  { value: "draft", label: "Draft", description: "Initial draft" },
  { value: "pending_review", label: "Pending Review", description: "Awaiting approval" },
  { value: "approved", label: "Approved", description: "Ready to schedule" },
  { value: "scheduled", label: "Scheduled", description: "Scheduled for publishing" },
  { value: "published", label: "Published", description: "Published to platform" },
  { value: "rejected", label: "Rejected", description: "Rejected, needs revision" },
] as const;

// ==================== HELP CENTER ====================

// Help Categories
export const helpCategories = pgTable("help_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"), // lucide icon name
  audience: text("audience").notNull().default("all"), // admin, client, partner, all
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const helpCategoriesRelations = relations(helpCategories, ({ many }) => ({
  articles: many(helpArticles),
}));

export const insertHelpCategorySchema = createInsertSchema(helpCategories).omit({ id: true, createdAt: true });
export type InsertHelpCategory = z.infer<typeof insertHelpCategorySchema>;
export type HelpCategory = typeof helpCategories.$inferSelect;

// Help Articles
export const helpArticles = pgTable("help_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => helpCategories.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  summary: text("summary"), // brief summary for article lists
  content: text("content").notNull(), // markdown or rich text content
  audience: text("audience").notNull().default("all"), // admin, client, partner, all
  videoUrl: text("video_url"), // YouTube or Vimeo embed URL
  sortOrder: integer("sort_order").default(0),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const helpArticlesRelations = relations(helpArticles, ({ one }) => ({
  category: one(helpCategories, {
    fields: [helpArticles.categoryId],
    references: [helpCategories.id],
  }),
}));

export const insertHelpArticleSchema = createInsertSchema(helpArticles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHelpArticle = z.infer<typeof insertHelpArticleSchema>;
export type HelpArticle = typeof helpArticles.$inferSelect;

// Help Audiences
export const HELP_AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "admin", label: "Admin Only" },
  { value: "client", label: "Clients Only" },
  { value: "partner", label: "Partners Only" },
] as const;

// ==================== EMPLOYEE MANAGEMENT ====================

// Employees
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Personal info
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  postcode: text("postcode"),
  dateOfBirth: timestamp("date_of_birth"),
  
  // Employment details
  role: text("role").notNull().default("fitting"), // admin, accounting, fitting, sales
  employmentType: text("employment_type").default("full_time"), // full_time, part_time, contractor
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"), // If terminated
  
  // Pay information
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  paySchedule: text("pay_schedule").default("weekly"), // weekly, monthly
  nationalInsurance: text("national_insurance"),
  taxCode: text("tax_code"),
  bankAccountName: text("bank_account_name"),
  bankSortCode: text("bank_sort_code"),
  bankAccountNumber: text("bank_account_number"),
  
  // Access control
  isActive: boolean("is_active").default(true),
  accessLevel: text("access_level").notNull().default("standard"), // standard, full_access, owner
  accessAreas: text("access_areas").array(), // Array of areas they can access
  
  // Emergency contact
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeesRelations = relations(employees, ({ one, many }) => ({
  credential: one(employeeCredentials),
  sessions: many(employeeSessions),
  timeEntries: many(timeEntries),
  documents: many(employeeDocuments),
}));

export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// Employee Credentials (separate table for security)
export const employeeCredentials = pgTable("employee_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }).unique(),
  passwordHash: text("password_hash").notNull(),
  mustChangePassword: boolean("must_change_password").default(true),
  lastPasswordChange: timestamp("last_password_change"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeeCredentialsRelations = relations(employeeCredentials, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeCredentials.employeeId],
    references: [employees.id],
  }),
}));

export const insertEmployeeCredentialSchema = createInsertSchema(employeeCredentials).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmployeeCredential = z.infer<typeof insertEmployeeCredentialSchema>;
export type EmployeeCredential = typeof employeeCredentials.$inferSelect;

// Employee Sessions (for login tokens)
export const employeeSessions = pgTable("employee_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

export const employeeSessionsRelations = relations(employeeSessions, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeSessions.employeeId],
    references: [employees.id],
  }),
}));

export const insertEmployeeSessionSchema = createInsertSchema(employeeSessions).omit({ id: true, createdAt: true, lastActiveAt: true });
export type InsertEmployeeSession = z.infer<typeof insertEmployeeSessionSchema>;
export type EmployeeSession = typeof employeeSessions.$inferSelect;

// Time Entries (clock in/out tracking)
export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  // Time tracking
  clockIn: timestamp("clock_in").notNull(),
  clockOut: timestamp("clock_out"),
  breakMinutes: integer("break_minutes").default(0),
  
  // Work type
  entryType: text("entry_type").notNull().default("work"), // work, project, quoting, fitting, training, admin
  
  // Optional job link
  jobId: varchar("job_id").references(() => jobs.id, { onDelete: "set null" }),
  
  // Location/notes
  location: text("location"),
  notes: text("notes"),
  
  // Calculated hours (stored for reporting)
  totalHours: decimal("total_hours", { precision: 10, scale: 2 }),
  
  // Approval
  status: text("status").default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [timeEntries.employeeId],
    references: [employees.id],
  }),
  job: one(jobs, {
    fields: [timeEntries.jobId],
    references: [jobs.id],
  }),
}));

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;

// Pay Periods
export const payPeriods = pgTable("pay_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  payDate: timestamp("pay_date").notNull(),
  periodType: text("period_type").notNull(), // weekly, monthly
  status: text("status").default("open"), // open, processing, closed
  createdAt: timestamp("created_at").defaultNow(),
});

export const payPeriodsRelations = relations(payPeriods, ({ many }) => ({
  payrollRuns: many(payrollRuns),
}));

export const insertPayPeriodSchema = createInsertSchema(payPeriods).omit({ id: true, createdAt: true });
export type InsertPayPeriod = z.infer<typeof insertPayPeriodSchema>;
export type PayPeriod = typeof payPeriods.$inferSelect;

// Payroll Runs (individual employee payslips)
export const payrollRuns = pgTable("payroll_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payPeriodId: varchar("pay_period_id").notNull().references(() => payPeriods.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  // Hours worked
  regularHours: decimal("regular_hours", { precision: 10, scale: 2 }).default("0"),
  overtimeHours: decimal("overtime_hours", { precision: 10, scale: 2 }).default("0"),
  
  // Rates at time of payroll
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  overtimeRate: decimal("overtime_rate", { precision: 10, scale: 2 }),
  
  // Calculations
  grossPay: decimal("gross_pay", { precision: 10, scale: 2 }).notNull(),
  totalBonuses: decimal("total_bonuses", { precision: 10, scale: 2 }).default("0"),
  totalDeductions: decimal("total_deductions", { precision: 10, scale: 2 }).default("0"),
  netPay: decimal("net_pay", { precision: 10, scale: 2 }).notNull(),
  
  // Status
  status: text("status").default("draft"), // draft, approved, paid
  paidAt: timestamp("paid_at"),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
  payPeriod: one(payPeriods, {
    fields: [payrollRuns.payPeriodId],
    references: [payPeriods.id],
  }),
  employee: one(employees, {
    fields: [payrollRuns.employeeId],
    references: [employees.id],
  }),
  adjustments: many(payrollAdjustments),
}));

export const insertPayrollRunSchema = createInsertSchema(payrollRuns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayrollRun = z.infer<typeof insertPayrollRunSchema>;
export type PayrollRun = typeof payrollRuns.$inferSelect;

// Payroll Adjustments (bonuses and deductions)
export const payrollAdjustments = pgTable("payroll_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payrollRunId: varchar("payroll_run_id").notNull().references(() => payrollRuns.id, { onDelete: "cascade" }),
  
  type: text("type").notNull(), // bonus, deduction
  category: text("category").notNull(), // performance_bonus, overtime_bonus, advance, tax, insurance, equipment, etc.
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const payrollAdjustmentsRelations = relations(payrollAdjustments, ({ one }) => ({
  payrollRun: one(payrollRuns, {
    fields: [payrollAdjustments.payrollRunId],
    references: [payrollRuns.id],
  }),
}));

export const insertPayrollAdjustmentSchema = createInsertSchema(payrollAdjustments).omit({ id: true, createdAt: true });
export type InsertPayrollAdjustment = z.infer<typeof insertPayrollAdjustmentSchema>;
export type PayrollAdjustment = typeof payrollAdjustments.$inferSelect;

// Employee Documents
export const employeeDocuments = pgTable("employee_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  documentType: text("document_type").notNull(), // contract, id, certification, other
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  
  // Expiry tracking for certifications
  expiryDate: timestamp("expiry_date"),
  
  notes: text("notes"),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id],
  }),
}));

export const insertEmployeeDocumentSchema = createInsertSchema(employeeDocuments).omit({ id: true, createdAt: true });
export type InsertEmployeeDocument = z.infer<typeof insertEmployeeDocumentSchema>;
export type EmployeeDocument = typeof employeeDocuments.$inferSelect;

// Job Surveys (Trade Partner Survey Workflow)
export const jobSurveys = pgTable("job_surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  partnerId: varchar("partner_id").references(() => tradePartners.id),
  
  // Survey assignment and status
  status: text("status").notNull().default("requested"), // requested, accepted, declined, scheduled, completed, cancelled
  assignedBy: varchar("assigned_by"), // Employee ID who assigned
  
  // Partner proposed scheduling (for client approval)
  proposedDate: timestamp("proposed_date"), // Date partner proposes for site visit
  proposedTime: text("proposed_time"), // Time partner proposes e.g., "10:00 AM"
  bookingStatus: text("booking_status"), // pending_client, client_accepted, client_declined, client_counter, confirmed
  
  // Client response to proposed date
  clientProposedDate: timestamp("client_proposed_date"), // Alternative date client proposes
  clientProposedTime: text("client_proposed_time"), // Alternative time client proposes
  clientNotes: text("client_notes"), // Notes from client when responding
  clientRespondedAt: timestamp("client_responded_at"), // When client responded
  
  // Confirmed scheduling (after client approval)
  scheduledDate: timestamp("scheduled_date"),
  scheduledTime: text("scheduled_time"), // e.g., "10:00 AM"
  
  // Notes
  adminNotes: text("admin_notes"), // Notes from admin when assigning
  partnerNotes: text("partner_notes"), // Notes from partner during survey
  surveyDetails: text("survey_details"), // Detailed survey findings
  
  // Decline reason (if declined)
  declineReason: text("decline_reason"),
  
  // Timestamps
  requestedAt: timestamp("requested_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),
  proposedAt: timestamp("proposed_at"), // When partner proposed date
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobSurveysRelations = relations(jobSurveys, ({ one }) => ({
  job: one(jobs, {
    fields: [jobSurveys.jobId],
    references: [jobs.id],
  }),
  partner: one(tradePartners, {
    fields: [jobSurveys.partnerId],
    references: [tradePartners.id],
  }),
}));

export const insertJobSurveySchema = createInsertSchema(jobSurveys).omit({ id: true, createdAt: true, updatedAt: true, requestedAt: true });
export type InsertJobSurvey = z.infer<typeof insertJobSurveySchema>;
export type JobSurvey = typeof jobSurveys.$inferSelect;

// Partner Quotes (Quotations submitted by trade partners)
export const partnerQuotes = pgTable("partner_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  partnerId: varchar("partner_id").notNull().references(() => tradePartners.id),
  surveyId: varchar("survey_id").references(() => jobSurveys.id),
  
  // Quote status
  status: text("status").notNull().default("draft"), // draft, submitted, accepted, declined
  
  // Quote totals
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  taxEnabled: boolean("tax_enabled").default(false),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("20"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  
  // Additional info
  notes: text("notes"),
  validUntil: timestamp("valid_until"),
  
  // Admin response
  adminNotes: text("admin_notes"),
  respondedAt: timestamp("responded_at"),
  respondedBy: varchar("responded_by"),
  
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const partnerQuotesRelations = relations(partnerQuotes, ({ one, many }) => ({
  job: one(jobs, {
    fields: [partnerQuotes.jobId],
    references: [jobs.id],
  }),
  partner: one(tradePartners, {
    fields: [partnerQuotes.partnerId],
    references: [tradePartners.id],
  }),
  survey: one(jobSurveys, {
    fields: [partnerQuotes.surveyId],
    references: [jobSurveys.id],
  }),
  items: many(partnerQuoteItems),
}));

export const insertPartnerQuoteSchema = createInsertSchema(partnerQuotes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPartnerQuote = z.infer<typeof insertPartnerQuoteSchema>;
export type PartnerQuote = typeof partnerQuotes.$inferSelect;

// Partner Quote Line Items
export const partnerQuoteItems = pgTable("partner_quote_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").notNull().references(() => partnerQuotes.id, { onDelete: "cascade" }),
  
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const partnerQuoteItemsRelations = relations(partnerQuoteItems, ({ one }) => ({
  quote: one(partnerQuotes, {
    fields: [partnerQuoteItems.quoteId],
    references: [partnerQuotes.id],
  }),
}));

export const insertPartnerQuoteItemSchema = createInsertSchema(partnerQuoteItems).omit({ id: true, createdAt: true });
export type InsertPartnerQuoteItem = z.infer<typeof insertPartnerQuoteItemSchema>;
export type PartnerQuoteItem = typeof partnerQuoteItems.$inferSelect;

// Survey Status Constants
export const SURVEY_STATUSES = [
  { value: "requested", label: "Requested", color: "bg-blue-500" },
  { value: "accepted", label: "Accepted", color: "bg-green-500" },
  { value: "declined", label: "Declined", color: "bg-red-500" },
  { value: "scheduled", label: "Scheduled", color: "bg-purple-500" },
  { value: "completed", label: "Completed", color: "bg-emerald-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-500" },
] as const;

// Employee Roles
export const EMPLOYEE_ROLES = [
  { value: "admin", label: "Admin", description: "Full system access" },
  { value: "accounting", label: "Accounting", description: "Financial and payroll access" },
  { value: "fitting", label: "Fitting", description: "Field work and job access" },
  { value: "sales", label: "Sales", description: "Contacts, jobs, and quotes" },
] as const;

// Employment Types
export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contractor", label: "Contractor" },
] as const;

// Time Entry Types
export const TIME_ENTRY_TYPES = [
  { value: "work", label: "General Work", color: "bg-blue-500" },
  { value: "project", label: "Project Work", color: "bg-green-500" },
  { value: "quoting", label: "Quoting", color: "bg-purple-500" },
  { value: "fitting", label: "Fitting", color: "bg-orange-500" },
  { value: "training", label: "Training", color: "bg-cyan-500" },
  { value: "admin", label: "Admin Tasks", color: "bg-gray-500" },
] as const;

// Pay Schedules
export const PAY_SCHEDULES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

// Document Types
export const DOCUMENT_TYPES = [
  { value: "contract", label: "Employment Contract" },
  { value: "id", label: "ID Document" },
  { value: "certification", label: "Certification" },
  { value: "training", label: "Training Record" },
  { value: "other", label: "Other" },
] as const;

// Access Areas (for role-based access control)
export const ACCESS_AREAS = [
  { value: "dashboard", label: "Dashboard" },
  { value: "jobs", label: "Jobs & Pipeline" },
  { value: "contacts", label: "Contacts" },
  { value: "partners", label: "Trade Partners" },
  { value: "tasks", label: "Tasks" },
  { value: "finance", label: "Finance" },
  { value: "calendar", label: "Calendar" },
  { value: "seo", label: "SEO Power House" },
  { value: "settings", label: "Settings" },
  { value: "employees", label: "Employee Management" },
  { value: "payroll", label: "Payroll" },
  { value: "help_center", label: "Help Center Admin" },
] as const;

// Emergency Callouts - for urgent jobs that need immediate partner response
export const emergencyCallouts = pgTable("emergency_callouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  
  // Emergency details
  incidentType: text("incident_type").notNull(), // leak, flood, fire_damage, security, electrical, gas, structural, other
  priority: text("priority").notNull().default("high"), // high, critical
  description: text("description"),
  
  // Status tracking
  status: text("status").notNull().default("open"), // open, assigned, in_progress, resolved, cancelled
  
  // Broadcast info
  broadcastAt: timestamp("broadcast_at"),
  
  // Assignment
  assignedPartnerId: varchar("assigned_partner_id").references(() => tradePartners.id),
  assignedAt: timestamp("assigned_at"),
  
  // Resolution
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const emergencyCalloutsRelations = relations(emergencyCallouts, ({ one, many }) => ({
  job: one(jobs, {
    fields: [emergencyCallouts.jobId],
    references: [jobs.id],
  }),
  assignedPartner: one(tradePartners, {
    fields: [emergencyCallouts.assignedPartnerId],
    references: [tradePartners.id],
  }),
  responses: many(emergencyCalloutResponses),
}));

export const insertEmergencyCalloutSchema = createInsertSchema(emergencyCallouts).omit({ id: true, createdAt: true });
export type InsertEmergencyCallout = z.infer<typeof insertEmergencyCalloutSchema>;
export type EmergencyCallout = typeof emergencyCallouts.$inferSelect;

// Emergency Callout Responses - partner responses to emergency broadcasts
export const emergencyCalloutResponses = pgTable("emergency_callout_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  calloutId: varchar("callout_id").notNull().references(() => emergencyCallouts.id, { onDelete: "cascade" }),
  partnerId: varchar("partner_id").notNull().references(() => tradePartners.id),
  
  // Response status
  status: text("status").notNull().default("pending"), // pending, acknowledged, responded, declined, selected, not_selected
  
  // Partner response
  acknowledgedAt: timestamp("acknowledged_at"),
  respondedAt: timestamp("responded_at"),
  proposedArrivalMinutes: integer("proposed_arrival_minutes"), // ETA in minutes
  proposedArrivalTime: timestamp("proposed_arrival_time"), // or specific time
  responseNotes: text("response_notes"),
  
  // Decline reason
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),
  
  // Selection
  selectedAt: timestamp("selected_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const emergencyCalloutResponsesRelations = relations(emergencyCalloutResponses, ({ one }) => ({
  callout: one(emergencyCallouts, {
    fields: [emergencyCalloutResponses.calloutId],
    references: [emergencyCallouts.id],
  }),
  partner: one(tradePartners, {
    fields: [emergencyCalloutResponses.partnerId],
    references: [tradePartners.id],
  }),
}));

export const insertEmergencyCalloutResponseSchema = createInsertSchema(emergencyCalloutResponses).omit({ id: true, createdAt: true });
export type InsertEmergencyCalloutResponse = z.infer<typeof insertEmergencyCalloutResponseSchema>;
export type EmergencyCalloutResponse = typeof emergencyCalloutResponses.$inferSelect;

// Emergency Incident Types
export const EMERGENCY_INCIDENT_TYPES = [
  { value: "leak", label: "Water Leak", icon: "droplet" },
  { value: "flood", label: "Flooding", icon: "waves" },
  { value: "fire_damage", label: "Fire Damage", icon: "flame" },
  { value: "security", label: "Security Issue", icon: "shield" },
  { value: "electrical", label: "Electrical Emergency", icon: "zap" },
  { value: "gas", label: "Gas Leak", icon: "alert-triangle" },
  { value: "structural", label: "Structural Damage", icon: "home" },
  { value: "roof", label: "Roof Damage", icon: "cloud-rain" },
  { value: "other", label: "Other Emergency", icon: "alert-circle" },
] as const;

// Emergency Callout Statuses
export const EMERGENCY_CALLOUT_STATUSES = [
  { value: "open", label: "Open - Awaiting Responses", color: "bg-red-500" },
  { value: "assigned", label: "Partner Assigned", color: "bg-blue-500" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-500" },
  { value: "resolved", label: "Resolved", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-500" },
] as const;
