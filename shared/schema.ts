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
  emergencyCalloutFee: decimal("emergency_callout_fee", { precision: 10, scale: 2 }), // First hour labour fee for emergencies
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
  
  // Client-facing quote visibility settings
  useDefaultMarkup: boolean("use_default_markup").default(true), // Apply system default markup
  customMarkupPercent: decimal("custom_markup_percent", { precision: 5, scale: 2 }), // Override markup %
  hideClientCostBreakdown: boolean("hide_client_cost_breakdown").default(true), // Hide profit margins from client
  
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
  catalogItemId: varchar("catalog_item_id"), // Optional link to catalog item for tracking
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
  // Social media URLs for quick posting
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Google Business Profile Locations - Multiple locations support
export const seoGoogleBusinessLocations = pgTable("seo_google_business_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g. "Cardiff", "Caerphilly"
  googleBusinessUrl: text("google_business_url").notNull(), // Direct link to GMB
  address: text("address"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSeoGoogleBusinessLocationSchema = createInsertSchema(seoGoogleBusinessLocations).omit({ id: true, createdAt: true });
export type InsertSeoGoogleBusinessLocation = z.infer<typeof insertSeoGoogleBusinessLocationSchema>;
export type SeoGoogleBusinessLocation = typeof seoGoogleBusinessLocations.$inferSelect;

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
  platform: text("platform").notNull(), // google_business, facebook, instagram
  postType: text("post_type").notNull().default("update"), // update, offer, before_after, seasonal
  targetLocationId: varchar("target_location_id").references(() => seoGoogleBusinessLocations.id), // For Google Business posts
  
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
  targetLocation: one(seoGoogleBusinessLocations, {
    fields: [seoContentPosts.targetLocationId],
    references: [seoGoogleBusinessLocations.id],
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

// SEO Media Library - Marketing images for content
export const seoMediaLibrary = pgTable("seo_media_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull().default("general"), // job_photos, team, promotional, seasonal, before_after, logo
  title: text("title"),
  description: text("description"),
  tags: text("tags").array(),
  isAiGenerated: boolean("is_ai_generated").default(false),
  aiPrompt: text("ai_prompt"), // If AI generated, store the prompt used
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSeoMediaLibrarySchema = createInsertSchema(seoMediaLibrary).omit({ id: true, createdAt: true });
export type InsertSeoMediaLibrary = z.infer<typeof insertSeoMediaLibrarySchema>;
export type SeoMediaLibrary = typeof seoMediaLibrary.$inferSelect;
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
  jobId: varchar("job_id").references(() => jobs.id, { onDelete: "cascade" }), // Optional - can be created later when partner is assigned
  
  // Client details (for standalone emergencies without a job)
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  clientPostcode: text("client_postcode"),
  
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
  
  // Completion payment tracking (partner collects from client, owes fee to CCC)
  completedAt: timestamp("completed_at"),
  completedByPartnerId: varchar("completed_by_partner_id").references(() => tradePartners.id),
  totalCollected: decimal("total_collected", { precision: 10, scale: 2 }), // Amount partner collected from client
  calloutFeePercent: decimal("callout_fee_percent", { precision: 5, scale: 2 }).default("20.00"), // CCC fee percentage (default 20%)
  calloutFeeAmount: decimal("callout_fee_amount", { precision: 10, scale: 2 }), // Calculated fee owed to CCC
  feePaid: boolean("fee_paid").default(false), // Has partner paid the fee to CCC?
  feePaidAt: timestamp("fee_paid_at"),
  feeTransactionId: varchar("fee_transaction_id").references(() => financialTransactions.id), // Link to finance entry
  
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

// Emergency Priorities
export const EMERGENCY_PRIORITIES = [
  { value: "critical", label: "Critical - Life/Safety", color: "bg-red-600" },
  { value: "high", label: "High - Urgent", color: "bg-red-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "low", label: "Low", color: "bg-gray-500" },
] as const;

// Emergency Callout Statuses
export const EMERGENCY_CALLOUT_STATUSES = [
  { value: "open", label: "Open - Awaiting Responses", color: "bg-red-500" },
  { value: "assigned", label: "Partner Assigned", color: "bg-blue-500" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-500" },
  { value: "resolved", label: "Resolved", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-500" },
] as const;

// ===============================
// PRODUCT CATALOG & QUOTE TEMPLATES
// ===============================

// Product Categories (e.g., "Media Wall Packages", "Under Stairs Storage", "Labour Rates")
export const productCategories = pgTable("product_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type ProductCategory = typeof productCategories.$inferSelect;

// Catalog Item Types
export const CATALOG_ITEM_TYPES = [
  { value: "product", label: "Product" },
  { value: "labour", label: "Labour" },
  { value: "consumable", label: "Consumable" },
  { value: "material", label: "Material" },
] as const;

// Catalog Items (saved products, labour charges, materials with prices)
export const catalogItems = pgTable("catalog_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => productCategories.id),
  type: text("type").notNull().default("product"), // product, labour, consumable, material
  sku: text("sku"), // Optional stock keeping unit
  name: text("name").notNull(),
  description: text("description"),
  unitOfMeasure: text("unit_of_measure").default("each"), // each, hour, metre, sqm, etc.
  defaultQuantity: decimal("default_quantity", { precision: 10, scale: 2 }).default("1"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }), // Optional cost for margin calculations
  taxable: boolean("taxable").default(true),
  isActive: boolean("is_active").default(true),
  isFavorite: boolean("is_favorite").default(false), // Quick access items
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const catalogItemsRelations = relations(catalogItems, ({ one }) => ({
  category: one(productCategories, {
    fields: [catalogItems.categoryId],
    references: [productCategories.id],
  }),
}));

export const insertCatalogItemSchema = createInsertSchema(catalogItems).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCatalogItem = z.infer<typeof insertCatalogItemSchema>;
export type CatalogItem = typeof catalogItems.$inferSelect;

// Quote Templates (pre-built quote packages)
export const quoteTemplates = pgTable("quote_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => productCategories.id), // Optional category grouping
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quoteTemplatesRelations = relations(quoteTemplates, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [quoteTemplates.categoryId],
    references: [productCategories.id],
  }),
  items: many(quoteTemplateItems),
}));

export const insertQuoteTemplateSchema = createInsertSchema(quoteTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuoteTemplate = z.infer<typeof insertQuoteTemplateSchema>;
export type QuoteTemplate = typeof quoteTemplates.$inferSelect;

// Quote Template Items (items within a template)
export const quoteTemplateItems = pgTable("quote_template_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => quoteTemplates.id, { onDelete: "cascade" }),
  catalogItemId: varchar("catalog_item_id").references(() => catalogItems.id), // Optional link to catalog
  description: text("description").notNull(), // Can override catalog item description
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // Can override catalog price
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quoteTemplateItemsRelations = relations(quoteTemplateItems, ({ one }) => ({
  template: one(quoteTemplates, {
    fields: [quoteTemplateItems.templateId],
    references: [quoteTemplates.id],
  }),
  catalogItem: one(catalogItems, {
    fields: [quoteTemplateItems.catalogItemId],
    references: [catalogItems.id],
  }),
}));

export const insertQuoteTemplateItemSchema = createInsertSchema(quoteTemplateItems).omit({ id: true, createdAt: true });
export type InsertQuoteTemplateItem = z.infer<typeof insertQuoteTemplateItemSchema>;
export type QuoteTemplateItem = typeof quoteTemplateItems.$inferSelect;

// Unit of Measure options
export const UNITS_OF_MEASURE = [
  { value: "each", label: "Each" },
  { value: "hour", label: "Hour" },
  { value: "day", label: "Day" },
  { value: "metre", label: "Metre" },
  { value: "sqm", label: "Square Metre" },
  { value: "litre", label: "Litre" },
  { value: "kg", label: "Kilogram" },
  { value: "set", label: "Set" },
  { value: "pack", label: "Pack" },
  { value: "fixed", label: "Fixed Price" },
] as const;

// ===============================
// SUPPLIERS
// ===============================

export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  accountNumber: text("account_number"), // Your account with this supplier
  website: text("website"),
  leadTimeDays: integer("lead_time_days"), // Typical delivery time
  notes: text("notes"),
  isPreferred: boolean("is_preferred").default(false), // Preferred supplier flag
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Supplier-Catalog Item link (same material can have different suppliers with different prices)
export const supplierCatalogItems = pgTable("supplier_catalog_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  catalogItemId: varchar("catalog_item_id").notNull().references(() => catalogItems.id, { onDelete: "cascade" }),
  supplierSku: text("supplier_sku"), // Supplier's SKU/product code
  supplierPrice: decimal("supplier_price", { precision: 10, scale: 2 }), // Cost from this supplier
  minOrderQty: decimal("min_order_qty", { precision: 10, scale: 2 }), // Minimum order quantity
  leadTimeDays: integer("lead_time_days"), // Override supplier default lead time
  isPreferred: boolean("is_preferred").default(false), // Preferred supplier for this item
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supplierCatalogItemsRelations = relations(supplierCatalogItems, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierCatalogItems.supplierId],
    references: [suppliers.id],
  }),
  catalogItem: one(catalogItems, {
    fields: [supplierCatalogItems.catalogItemId],
    references: [catalogItems.id],
  }),
}));

export const insertSupplierCatalogItemSchema = createInsertSchema(supplierCatalogItems).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSupplierCatalogItem = z.infer<typeof insertSupplierCatalogItemSchema>;
export type SupplierCatalogItem = typeof supplierCatalogItems.$inferSelect;

// Connection Links (unified job hub access for clients, partners, internal team)
export const connectionLinks = pgTable("connection_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(), // Unique access token
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  partyType: text("party_type").notNull(), // client, partner, employee
  partyId: varchar("party_id").notNull(), // ID of the contact, tradePartner, or employee
  status: text("status").notNull().default("pending"), // pending, connected, declined
  connectedAt: timestamp("connected_at"),
  declinedAt: timestamp("declined_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration
});

export const connectionLinksRelations = relations(connectionLinks, ({ one }) => ({
  job: one(jobs, {
    fields: [connectionLinks.jobId],
    references: [jobs.id],
  }),
}));

export const insertConnectionLinkSchema = createInsertSchema(connectionLinks).omit({ id: true, createdAt: true });
export type InsertConnectionLink = z.infer<typeof insertConnectionLinkSchema>;
export type ConnectionLink = typeof connectionLinks.$inferSelect;

// Assets (tools, vehicles, equipment)
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetNumber: text("asset_number").notNull().unique(), // Unique identifier like TOOL-001, VAN-001
  name: text("name").notNull(),
  type: text("type").notNull(), // tool, vehicle, equipment
  description: text("description"),
  serialNumber: text("serial_number"),
  
  // Ownership
  owner: text("owner").notNull().default("company"), // company, individual
  assignedToId: varchar("assigned_to_id").references(() => employees.id), // Assigned team member
  
  // Purchase info
  purchaseDate: timestamp("purchase_date"),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
  supplier: text("supplier"),
  
  // Warranty
  warrantyExpiry: timestamp("warranty_expiry"),
  warrantyNotes: text("warranty_notes"),
  
  // Service
  lastServiceDate: timestamp("last_service_date"),
  nextServiceDate: timestamp("next_service_date"),
  serviceIntervalDays: integer("service_interval_days"), // Days between services
  
  // Vehicle-specific fields (stored for type=vehicle)
  motDate: timestamp("mot_date"), // MOT expiry date
  insuranceExpiry: timestamp("insurance_expiry"),
  currentMileage: integer("current_mileage"),
  registrationNumber: text("registration_number"),
  
  // Status
  status: text("status").notNull().default("active"), // active, in_repair, retired, disposed
  location: text("location"), // Where the asset is stored/based
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assetsRelations = relations(assets, ({ one, many }) => ({
  assignedTo: one(employees, {
    fields: [assets.assignedToId],
    references: [employees.id],
  }),
  faults: many(assetFaults),
  reminders: many(assetReminders),
}));

export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true, updatedAt: true, assetNumber: true });
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

// Asset Faults (fault reporting system)
export const assetFaults = pgTable("asset_faults", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  reportedById: varchar("reported_by_id").notNull().references(() => employees.id),
  assignedToId: varchar("assigned_to_id").references(() => employees.id),
  
  // Fault details
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("open"), // open, in_progress, completed, cleared
  
  // Linked task (auto-created in Task Manager)
  taskId: varchar("task_id").references(() => tasks.id),
  
  // Resolution
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  resolvedById: varchar("resolved_by_id").references(() => employees.id),
  clearedAt: timestamp("cleared_at"),
  clearedById: varchar("cleared_by_id").references(() => employees.id),
  
  // Cost tracking
  repairCost: decimal("repair_cost", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assetFaultsRelations = relations(assetFaults, ({ one }) => ({
  asset: one(assets, {
    fields: [assetFaults.assetId],
    references: [assets.id],
  }),
  reportedBy: one(employees, {
    fields: [assetFaults.reportedById],
    references: [employees.id],
    relationName: "reportedFaults",
  }),
  assignedTo: one(employees, {
    fields: [assetFaults.assignedToId],
    references: [employees.id],
    relationName: "assignedFaults",
  }),
  task: one(tasks, {
    fields: [assetFaults.taskId],
    references: [tasks.id],
  }),
}));

export const insertAssetFaultSchema = createInsertSchema(assetFaults).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAssetFault = z.infer<typeof insertAssetFaultSchema>;
export type AssetFault = typeof assetFaults.$inferSelect;

// Asset Reminders (automated notifications for MOT, service, warranty)
export const assetReminders = pgTable("asset_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  
  reminderType: text("reminder_type").notNull(), // mot_due, service_due, warranty_expiring, insurance_expiring
  dueDate: timestamp("due_date").notNull(),
  
  // Notification tracking
  notified: boolean("notified").default(false),
  notifiedAt: timestamp("notified_at"),
  
  // Who to notify
  notifyOwner: boolean("notify_owner").default(true),
  notifyAdmin: boolean("notify_admin").default(true),
  notifyAssignee: boolean("notify_assignee").default(true),
  
  // Status
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedById: varchar("acknowledged_by_id").references(() => employees.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assetRemindersRelations = relations(assetReminders, ({ one }) => ({
  asset: one(assets, {
    fields: [assetReminders.assetId],
    references: [assets.id],
  }),
  acknowledgedBy: one(employees, {
    fields: [assetReminders.acknowledgedById],
    references: [employees.id],
  }),
}));

export const insertAssetReminderSchema = createInsertSchema(assetReminders).omit({ id: true, createdAt: true });
export type InsertAssetReminder = z.infer<typeof insertAssetReminderSchema>;
export type AssetReminder = typeof assetReminders.$inferSelect;

// Asset type constants
export const ASSET_TYPES = [
  { value: "tool", label: "Tool" },
  { value: "vehicle", label: "Vehicle" },
  { value: "equipment", label: "Equipment" },
] as const;

export const ASSET_STATUSES = [
  { value: "active", label: "Active" },
  { value: "in_repair", label: "In Repair" },
  { value: "retired", label: "Retired" },
  { value: "disposed", label: "Disposed" },
] as const;

export const REMINDER_TYPES = [
  { value: "mot_due", label: "MOT Due" },
  { value: "service_due", label: "Service Due" },
  { value: "warranty_expiring", label: "Warranty Expiring" },
  { value: "insurance_expiring", label: "Insurance Expiring" },
] as const;

// =====================================
// MANDATORY CHECKLISTS SYSTEM
// =====================================

// Checklist Templates - defines types of checklists
export const checklistTemplates = pgTable("checklist_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // e.g., "emergency_job", "tool_check", "vehicle_check", "payroll", "team_paid"
  name: text("name").notNull(),
  description: text("description"),
  targetType: text("target_type").notNull(), // job, asset, task, payroll, general
  isMandatory: boolean("is_mandatory").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const checklistTemplatesRelations = relations(checklistTemplates, ({ many }) => ({
  items: many(checklistItems),
  instances: many(checklistInstances),
}));

export const insertChecklistTemplateSchema = createInsertSchema(checklistTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChecklistTemplate = z.infer<typeof insertChecklistTemplateSchema>;
export type ChecklistTemplate = typeof checklistTemplates.$inferSelect;

// Checklist Items - individual items within a template
export const checklistItems = pgTable("checklist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => checklistTemplates.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  description: text("description"),
  itemOrder: integer("item_order").notNull().default(0),
  isRequired: boolean("is_required").default(true),
  requiresNote: boolean("requires_note").default(false),
  requiresPhoto: boolean("requires_photo").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checklistItemsRelations = relations(checklistItems, ({ one, many }) => ({
  template: one(checklistTemplates, {
    fields: [checklistItems.templateId],
    references: [checklistTemplates.id],
  }),
  responses: many(checklistResponses),
}));

export const insertChecklistItemSchema = createInsertSchema(checklistItems).omit({ id: true, createdAt: true });
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;

// Checklist Instances - an instance of a checklist for a specific target
export const checklistInstances = pgTable("checklist_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => checklistTemplates.id),
  targetType: text("target_type").notNull(), // job, asset, payroll, general
  targetId: varchar("target_id"), // references jobs.id, assets.id, etc. - null for general
  assignedToId: varchar("assigned_to_id").references(() => employees.id),
  status: text("status").default("pending"), // pending, in_progress, completed
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  completedById: varchar("completed_by_id").references(() => employees.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const checklistInstancesRelations = relations(checklistInstances, ({ one, many }) => ({
  template: one(checklistTemplates, {
    fields: [checklistInstances.templateId],
    references: [checklistTemplates.id],
  }),
  assignedTo: one(employees, {
    fields: [checklistInstances.assignedToId],
    references: [employees.id],
    relationName: "assignedChecklists",
  }),
  completedBy: one(employees, {
    fields: [checklistInstances.completedById],
    references: [employees.id],
    relationName: "completedChecklists",
  }),
  responses: many(checklistResponses),
  auditEvents: many(checklistAuditEvents),
}));

export const insertChecklistInstanceSchema = createInsertSchema(checklistInstances).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChecklistInstance = z.infer<typeof insertChecklistInstanceSchema>;
export type ChecklistInstance = typeof checklistInstances.$inferSelect;

// Checklist Responses - individual item responses within an instance
export const checklistResponses = pgTable("checklist_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instanceId: varchar("instance_id").notNull().references(() => checklistInstances.id, { onDelete: "cascade" }),
  itemId: varchar("item_id").notNull().references(() => checklistItems.id),
  value: boolean("value").default(false), // for checkbox type
  textValue: text("text_value"), // for text type
  numberValue: decimal("number_value", { precision: 15, scale: 4 }), // for number type
  signatureData: text("signature_data"), // for signature type (base64 data URL)
  note: text("note"),
  photoUrl: text("photo_url"), // for photo type
  completedById: varchar("completed_by_id").references(() => employees.id),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const checklistResponsesRelations = relations(checklistResponses, ({ one }) => ({
  instance: one(checklistInstances, {
    fields: [checklistResponses.instanceId],
    references: [checklistInstances.id],
  }),
  item: one(checklistItems, {
    fields: [checklistResponses.itemId],
    references: [checklistItems.id],
  }),
  completedBy: one(employees, {
    fields: [checklistResponses.completedById],
    references: [employees.id],
  }),
}));

export const insertChecklistResponseSchema = createInsertSchema(checklistResponses).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChecklistResponse = z.infer<typeof insertChecklistResponseSchema>;
export type ChecklistResponse = typeof checklistResponses.$inferSelect;

// Checklist Audit Events - track all actions for compliance
export const checklistAuditEvents = pgTable("checklist_audit_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instanceId: varchar("instance_id").notNull().references(() => checklistInstances.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // created, item_completed, item_uncompleted, completed, reopened
  actorId: varchar("actor_id").references(() => employees.id),
  actorName: text("actor_name"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
});

export const checklistAuditEventsRelations = relations(checklistAuditEvents, ({ one }) => ({
  instance: one(checklistInstances, {
    fields: [checklistAuditEvents.instanceId],
    references: [checklistInstances.id],
  }),
  actor: one(employees, {
    fields: [checklistAuditEvents.actorId],
    references: [employees.id],
  }),
}));

export const insertChecklistAuditEventSchema = createInsertSchema(checklistAuditEvents).omit({ id: true, createdAt: true });
export type InsertChecklistAuditEvent = z.infer<typeof insertChecklistAuditEventSchema>;
export type ChecklistAuditEvent = typeof checklistAuditEvents.$inferSelect;

// Checklist constants
export const CHECKLIST_TARGET_TYPES = [
  { value: "job", label: "Job" },
  { value: "asset", label: "Asset" },
  { value: "payroll", label: "Payroll" },
  { value: "general", label: "General" },
] as const;

export const CHECKLIST_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
] as const;

export const DEFAULT_CHECKLIST_CODES = [
  "emergency_job",
  "tool_check",
  "vehicle_check",
  "payroll_completed",
  "team_paid",
] as const;

// ==================== OWNER WELLBEING SYSTEM ====================

// Owner Wellbeing Settings - configurable nudge and work-life balance preferences
export const ownerWellbeingSettings = pgTable("owner_wellbeing_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id).unique(),
  
  // Water/Hydration reminders
  waterReminderEnabled: boolean("water_reminder_enabled").default(true),
  waterReminderIntervalMinutes: integer("water_reminder_interval_minutes").default(60),
  
  // Stretch/Movement reminders
  stretchReminderEnabled: boolean("stretch_reminder_enabled").default(true),
  stretchReminderIntervalMinutes: integer("stretch_reminder_interval_minutes").default(90),
  
  // Meal reminders
  mealReminderEnabled: boolean("meal_reminder_enabled").default(true),
  mealReminderTimes: text("meal_reminder_times").default("12:00,18:00"), // Comma-separated times
  
  // Work cutoff time
  workCutoffEnabled: boolean("work_cutoff_enabled").default(true),
  workCutoffTime: text("work_cutoff_time").default("18:30"), // HH:MM format
  workCutoffMessage: text("work_cutoff_message").default("Time to switch to family mode!"),
  
  // Session time tracking
  sessionTrackingEnabled: boolean("session_tracking_enabled").default(true),
  sessionWarningMinutes: integer("session_warning_minutes").default(120), // Warn after X mins online
  
  // Daily Top 3 work focus
  dailyTop3Enabled: boolean("daily_top3_enabled").default(true),
  
  // Personal tasks morning routine
  morningRoutineEnabled: boolean("morning_routine_enabled").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ownerWellbeingSettingsRelations = relations(ownerWellbeingSettings, ({ one }) => ({
  employee: one(employees, {
    fields: [ownerWellbeingSettings.employeeId],
    references: [employees.id],
  }),
}));

export const insertOwnerWellbeingSettingsSchema = createInsertSchema(ownerWellbeingSettings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOwnerWellbeingSettings = z.infer<typeof insertOwnerWellbeingSettingsSchema>;
export type OwnerWellbeingSettings = typeof ownerWellbeingSettings.$inferSelect;

// Personal Tasks - personal appointments/tasks for work-life balance
export const personalTasks = pgTable("personal_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  title: text("title").notNull(),
  description: text("description"),
  taskType: text("task_type").default("personal"), // personal, appointment, morning_routine
  dueDate: timestamp("due_date"),
  dueTime: text("due_time"), // HH:MM format for appointments
  reminderMinutesBefore: integer("reminder_minutes_before").default(15),
  location: text("location"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  isMorningTask: boolean("is_morning_task").default(false), // Part of "3 personal tasks before work"
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const personalTasksRelations = relations(personalTasks, ({ one }) => ({
  employee: one(employees, {
    fields: [personalTasks.employeeId],
    references: [employees.id],
  }),
}));

export const insertPersonalTaskSchema = createInsertSchema(personalTasks).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPersonalTask = z.infer<typeof insertPersonalTaskSchema>;
export type PersonalTask = typeof personalTasks.$inferSelect;

// Daily Focus (Top 3) - daily work focus items
export const dailyFocusTasks = pgTable("daily_focus_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  focusDate: timestamp("focus_date").notNull(), // The date this focus is for
  taskId: varchar("task_id").references(() => tasks.id), // Optional link to CRM task
  jobId: varchar("job_id").references(() => jobs.id), // Optional link to job
  title: text("title").notNull(),
  description: text("description"),
  priority: integer("priority").notNull().default(1), // 1, 2, or 3
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dailyFocusTasksRelations = relations(dailyFocusTasks, ({ one }) => ({
  employee: one(employees, {
    fields: [dailyFocusTasks.employeeId],
    references: [employees.id],
  }),
  task: one(tasks, {
    fields: [dailyFocusTasks.taskId],
    references: [tasks.id],
  }),
  job: one(jobs, {
    fields: [dailyFocusTasks.jobId],
    references: [jobs.id],
  }),
}));

export const insertDailyFocusTaskSchema = createInsertSchema(dailyFocusTasks).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDailyFocusTask = z.infer<typeof insertDailyFocusTaskSchema>;
export type DailyFocusTask = typeof dailyFocusTasks.$inferSelect;

// Wellbeing Nudge Log - track when nudges were shown/dismissed
export const wellbeingNudgeLogs = pgTable("wellbeing_nudge_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  nudgeType: text("nudge_type").notNull(), // water, stretch, meal, work_cutoff, session_warning
  action: text("action").notNull(), // shown, dismissed, snoozed, acknowledged
  snoozedUntil: timestamp("snoozed_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wellbeingNudgeLogsRelations = relations(wellbeingNudgeLogs, ({ one }) => ({
  employee: one(employees, {
    fields: [wellbeingNudgeLogs.employeeId],
    references: [employees.id],
  }),
}));

export const insertWellbeingNudgeLogSchema = createInsertSchema(wellbeingNudgeLogs).omit({ id: true, createdAt: true });
export type InsertWellbeingNudgeLog = z.infer<typeof insertWellbeingNudgeLogSchema>;
export type WellbeingNudgeLog = typeof wellbeingNudgeLogs.$inferSelect;

// Wellbeing constants
export const NUDGE_TYPES = [
  { value: "water", label: "Water Reminder", icon: "droplet" },
  { value: "stretch", label: "Stretch Break", icon: "activity" },
  { value: "meal", label: "Meal Reminder", icon: "utensils" },
  { value: "work_cutoff", label: "Work Cutoff", icon: "clock" },
  { value: "session_warning", label: "Session Warning", icon: "timer" },
] as const;

export const PERSONAL_TASK_TYPES = [
  { value: "personal", label: "Personal Task" },
  { value: "appointment", label: "Appointment" },
  { value: "morning_routine", label: "Morning Routine" },
] as const;

// =====================================================
// INTERNAL MESSAGING / COMMUNICATION HUB
// =====================================================

// Direct messages between employees
export const internalMessages = pgTable("internal_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => employees.id),
  recipientId: varchar("recipient_id").notNull().references(() => employees.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  jobId: varchar("job_id").references(() => jobs.id), // optional job reference
  createdAt: timestamp("created_at").defaultNow(),
});

export const internalMessagesRelations = relations(internalMessages, ({ one }) => ({
  sender: one(employees, {
    fields: [internalMessages.senderId],
    references: [employees.id],
    relationName: "messageSender",
  }),
  recipient: one(employees, {
    fields: [internalMessages.recipientId],
    references: [employees.id],
    relationName: "messageRecipient",
  }),
  job: one(jobs, {
    fields: [internalMessages.jobId],
    references: [jobs.id],
  }),
}));

export const insertInternalMessageSchema = createInsertSchema(internalMessages).omit({ id: true, createdAt: true, isRead: true, readAt: true });
export type InsertInternalMessage = z.infer<typeof insertInternalMessageSchema>;
export type InternalMessage = typeof internalMessages.$inferSelect;

// Job chat messages - conversations tied to specific jobs (visible to team)
export const jobChatMessages = pgTable("job_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  content: text("content").notNull(),
  messageType: text("message_type").default("message"), // message, update, question, alert
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobChatMessagesRelations = relations(jobChatMessages, ({ one, many }) => ({
  job: one(jobs, {
    fields: [jobChatMessages.jobId],
    references: [jobs.id],
  }),
  employee: one(employees, {
    fields: [jobChatMessages.employeeId],
    references: [employees.id],
  }),
  reads: many(jobChatMessageReads),
}));

export const insertJobChatMessageSchema = createInsertSchema(jobChatMessages).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJobChatMessage = z.infer<typeof insertJobChatMessageSchema>;
export type JobChatMessage = typeof jobChatMessages.$inferSelect;

// Track which employees have read job chat messages
export const jobChatMessageReads = pgTable("job_chat_message_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => jobChatMessages.id),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  readAt: timestamp("read_at").defaultNow(),
});

export const jobChatMessageReadsRelations = relations(jobChatMessageReads, ({ one }) => ({
  message: one(jobChatMessages, {
    fields: [jobChatMessageReads.messageId],
    references: [jobChatMessages.id],
  }),
  employee: one(employees, {
    fields: [jobChatMessageReads.employeeId],
    references: [employees.id],
  }),
}));

export const insertJobChatMessageReadSchema = createInsertSchema(jobChatMessageReads).omit({ id: true, readAt: true });
export type InsertJobChatMessageRead = z.infer<typeof insertJobChatMessageReadSchema>;
export type JobChatMessageRead = typeof jobChatMessageReads.$inferSelect;

// Activity log for team-wide notifications
export const teamActivityLog = pgTable("team_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id), // who performed the action
  activityType: text("activity_type").notNull(), // task_completed, checklist_completed, job_updated, message_sent, etc.
  entityType: text("entity_type"), // job, task, checklist, message
  entityId: varchar("entity_id"),
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string for extra data
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamActivityLogRelations = relations(teamActivityLog, ({ one }) => ({
  employee: one(employees, {
    fields: [teamActivityLog.employeeId],
    references: [employees.id],
  }),
}));

export const insertTeamActivityLogSchema = createInsertSchema(teamActivityLog).omit({ id: true, createdAt: true });
export type InsertTeamActivityLog = z.infer<typeof insertTeamActivityLogSchema>;
export type TeamActivityLog = typeof teamActivityLog.$inferSelect;

// Message type constants
export const JOB_CHAT_MESSAGE_TYPES = [
  { value: "message", label: "Message" },
  { value: "update", label: "Update" },
  { value: "question", label: "Question" },
  { value: "alert", label: "Alert" },
] as const;

export const ACTIVITY_TYPES = [
  { value: "task_completed", label: "Task Completed" },
  { value: "task_assigned", label: "Task Assigned" },
  { value: "checklist_completed", label: "Checklist Completed" },
  { value: "job_stage_changed", label: "Job Stage Changed" },
  { value: "job_created", label: "Job Created" },
  { value: "quote_sent", label: "Quote Sent" },
  { value: "message_sent", label: "Message Sent" },
  { value: "note_added", label: "Note Added" },
] as const;

// =====================================================
// SUPPLIER PRODUCT CAPTURE (for Product Finder feature)
// =====================================================

// Captured products - products captured from supplier websites before adding to catalog/quote
export const capturedProducts = pgTable("captured_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Captured from supplier
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  supplierName: text("supplier_name"),
  productTitle: text("product_title").notNull(),
  sku: text("sku"),
  price: decimal("price", { precision: 10, scale: 2 }),
  unit: text("unit").default("each"),
  productUrl: text("product_url"),
  imageUrl: text("image_url"),
  
  // Capture metadata
  capturedAt: timestamp("captured_at").defaultNow(),
  capturedBy: varchar("captured_by").references(() => employees.id),
  
  // Status: pending, added_to_quote, saved_to_catalog, discarded
  status: text("status").default("pending"),
  
  // If added to a job's quote items
  jobId: varchar("job_id").references(() => jobs.id),
  
  // If saved to catalog
  catalogItemId: varchar("catalog_item_id").references(() => catalogItems.id),
  
  // Markup applied
  markupPercent: decimal("markup_percent", { precision: 5, scale: 2 }).default("20"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
});

export const capturedProductsRelations = relations(capturedProducts, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [capturedProducts.supplierId],
    references: [suppliers.id],
  }),
  capturer: one(employees, {
    fields: [capturedProducts.capturedBy],
    references: [employees.id],
  }),
  job: one(jobs, {
    fields: [capturedProducts.jobId],
    references: [jobs.id],
  }),
  catalogItem: one(catalogItems, {
    fields: [capturedProducts.catalogItemId],
    references: [catalogItems.id],
  }),
}));

export const insertCapturedProductSchema = createInsertSchema(capturedProducts).omit({ id: true, capturedAt: true });
export type InsertCapturedProduct = z.infer<typeof insertCapturedProductSchema>;
export type CapturedProduct = typeof capturedProducts.$inferSelect;

// Default trade suppliers list (for Product Finder)
export const DEFAULT_TRADE_SUPPLIERS = [
  { name: "B&Q", website: "https://www.diy.com" },
  { name: "Howdens", website: "https://www.howdens.com" },
  { name: "Screwfix", website: "https://www.screwfix.com" },
  { name: "Toolstation", website: "https://www.toolstation.com" },
  { name: "Travis Perkins", website: "https://www.travisperkins.co.uk" },
  { name: "Selco", website: "https://www.selcobw.com" },
  { name: "Wickes", website: "https://www.wickes.co.uk" },
] as const;

// =====================================================
// SUPPLIER PRODUCT LOOKUP - Saved products from suppliers
// =====================================================

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Product info
  productName: text("product_name").notNull(),
  brand: text("brand"),
  storeName: text("store_name").notNull(),
  
  // Pricing
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("GBP"),
  
  // Size info
  sizeValue: integer("size_value"),
  sizeUnit: text("size_unit"),
  sizeLabel: text("size_label"), // e.g. "290ml"
  
  // Source info
  productUrl: text("product_url"),
  externalSku: text("external_sku"),
  priceSource: text("price_source"), // e.g. "diy.com"
  
  // Stock status
  inStock: boolean("in_stock"),
  
  // Timestamps
  lastCheckedAt: timestamp("last_checked_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Product price history for tracking price changes
export const productPriceHistory = pgTable("product_price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  storeName: text("store_name").notNull(),
  checkedAt: timestamp("checked_at").defaultNow(),
});

export const productPriceHistoryRelations = relations(productPriceHistory, ({ one }) => ({
  product: one(products, {
    fields: [productPriceHistory.productId],
    references: [products.id],
  }),
}));

export const insertProductPriceHistorySchema = createInsertSchema(productPriceHistory).omit({ id: true, checkedAt: true });
export type InsertProductPriceHistory = z.infer<typeof insertProductPriceHistorySchema>;
export type ProductPriceHistory = typeof productPriceHistory.$inferSelect;
