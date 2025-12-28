import { 
  contacts, type Contact, type InsertContact,
  tradePartners, type TradePartner, type InsertTradePartner,
  jobs, type Job, type InsertJob,
  tasks, type Task, type InsertTask,
  quoteItems, type QuoteItem, type InsertQuoteItem,
  clientPortalAccess, type ClientPortalAccess, type InsertClientPortalAccess,
  clientInvites, type ClientInvite, type InsertClientInvite,
  paymentRequests, type PaymentRequest, type InsertPaymentRequest,
  companySettings, type CompanySetting, type InsertCompanySetting,
  reviewRequests, type ReviewRequest, type InsertReviewRequest,
  invoices, type Invoice, type InsertInvoice,
  invoiceLineItems, type InvoiceLineItem, type InsertInvoiceLineItem,
  partnerPortalAccess, type PartnerPortalAccess, type InsertPartnerPortalAccess,
  partnerInvites, type PartnerInvite, type InsertPartnerInvite,
  jobNotes, type JobNote, type InsertJobNote,
  jobNoteAttachments, type JobNoteAttachment, type InsertJobNoteAttachment,
  financialCategories, type FinancialCategory, type InsertFinancialCategory,
  financialTransactions, type FinancialTransaction, type InsertFinancialTransaction,
  calendarEvents, type CalendarEvent, type InsertCalendarEvent,
  partnerAvailability, type PartnerAvailability, type InsertPartnerAvailability,
  jobScheduleProposals, type JobScheduleProposal, type InsertJobScheduleProposal,
  seoBusinessProfile, type SeoBusinessProfile, type InsertSeoBusinessProfile,
  seoBrandVoice, type SeoBrandVoice, type InsertSeoBrandVoice,
  seoWeeklyFocus, type SeoWeeklyFocus, type InsertSeoWeeklyFocus,
  seoJobMedia, type SeoJobMedia, type InsertSeoJobMedia,
  seoContentPosts, type SeoContentPost, type InsertSeoContentPost,
  seoAutopilotSettings, type SeoAutopilotSettings, type InsertSeoAutopilotSettings,
  seoAutopilotSlots, type SeoAutopilotSlot, type InsertSeoAutopilotSlot,
  seoAutopilotRuns, type SeoAutopilotRun, type InsertSeoAutopilotRun,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, isNull, gte, lte } from "drizzle-orm";

export interface IStorage {
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
  getJobsByContact(contactId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: string): Promise<boolean>;
  getNextJobNumber(): Promise<string>;

  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Quote Items
  getQuoteItemsByJob(jobId: string): Promise<QuoteItem[]>;
  createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem>;
  updateQuoteItem(id: string, item: Partial<InsertQuoteItem>): Promise<QuoteItem | undefined>;
  deleteQuoteItem(id: string): Promise<boolean>;
  deleteQuoteItemsByJob(jobId: string): Promise<boolean>;

  // Client Portal
  getClientPortalAccess(contactId: string): Promise<ClientPortalAccess | undefined>;
  getClientPortalAccessByToken(token: string): Promise<ClientPortalAccess | undefined>;
  createClientPortalAccess(access: InsertClientPortalAccess): Promise<ClientPortalAccess>;

  getClientInviteByToken(token: string): Promise<ClientInvite | undefined>;
  getClientInviteByContact(contactId: string): Promise<ClientInvite | undefined>;
  createClientInvite(invite: InsertClientInvite): Promise<ClientInvite>;
  acceptClientInvite(token: string): Promise<void>;

  getPaymentRequestsByJob(jobId: string): Promise<PaymentRequest[]>;
  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>;
  updatePaymentRequest(id: string, request: Partial<InsertPaymentRequest>): Promise<PaymentRequest | undefined>;
  deletePaymentRequest(id: string): Promise<boolean>;

  getCompanySettings(): Promise<CompanySetting[]>;
  upsertCompanySetting(setting: InsertCompanySetting): Promise<CompanySetting>;

  createReviewRequest(request: InsertReviewRequest): Promise<ReviewRequest>;

  // Invoices
  getInvoicesByJob(jobId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceByReference(referenceNumber: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  getNextInvoiceNumber(jobNumber: string, type: string): Promise<string>;
  getPortalInvoicesByJob(jobId: string): Promise<Invoice[]>;

  // Invoice Line Items
  getInvoiceLineItems(invoiceId: string): Promise<InvoiceLineItem[]>;
  createInvoiceLineItem(item: InsertInvoiceLineItem): Promise<InvoiceLineItem>;
  deleteInvoiceLineItems(invoiceId: string): Promise<boolean>;

  // Partner Portal
  getPartnerPortalAccess(partnerId: string): Promise<PartnerPortalAccess | undefined>;
  getPartnerPortalAccessByToken(token: string): Promise<PartnerPortalAccess | undefined>;
  createPartnerPortalAccess(access: InsertPartnerPortalAccess): Promise<PartnerPortalAccess>;
  updatePartnerPortalAccessLastLogin(partnerId: string): Promise<void>;
  
  getPartnerInviteByToken(token: string): Promise<PartnerInvite | undefined>;
  getPartnerInviteByPartner(partnerId: string): Promise<PartnerInvite | undefined>;
  createPartnerInvite(invite: InsertPartnerInvite): Promise<PartnerInvite>;
  acceptPartnerInvite(token: string): Promise<void>;
  
  getJobsByPartner(partnerId: string): Promise<Job[]>;

  // Job Notes
  getJobNotes(jobId: string): Promise<JobNote[]>;
  getJobNote(id: string): Promise<JobNote | undefined>;
  createJobNote(note: InsertJobNote): Promise<JobNote>;
  updateJobNote(id: string, note: Partial<InsertJobNote>): Promise<JobNote | undefined>;
  deleteJobNote(id: string): Promise<boolean>;
  getJobNotesForPartner(jobId: string): Promise<JobNote[]>;
  
  // Job Note Attachments
  getJobNoteAttachments(noteId: string): Promise<JobNoteAttachment[]>;
  createJobNoteAttachment(attachment: InsertJobNoteAttachment): Promise<JobNoteAttachment>;
  deleteJobNoteAttachment(id: string): Promise<boolean>;

  // Financial Categories
  getFinancialCategories(): Promise<FinancialCategory[]>;
  getFinancialCategory(id: string): Promise<FinancialCategory | undefined>;
  getFinancialCategoryByName(name: string): Promise<FinancialCategory | undefined>;
  createFinancialCategory(category: InsertFinancialCategory): Promise<FinancialCategory>;
  updateFinancialCategory(id: string, category: Partial<InsertFinancialCategory>): Promise<FinancialCategory | undefined>;
  deleteFinancialCategory(id: string): Promise<boolean>;

  // Financial Transactions
  getFinancialTransactions(): Promise<FinancialTransaction[]>;
  getFinancialTransaction(id: string): Promise<FinancialTransaction | undefined>;
  getFinancialTransactionsByMonth(year: number, month: number): Promise<FinancialTransaction[]>;
  getFinancialTransactionsByJob(jobId: string): Promise<FinancialTransaction[]>;
  createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction>;
  updateFinancialTransaction(id: string, transaction: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction | undefined>;
  deleteFinancialTransaction(id: string): Promise<boolean>;

  // Calendar Events
  getCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  getCalendarEventsByDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  getCalendarEventsByPartner(partnerId: string): Promise<CalendarEvent[]>;
  getCalendarEventsForPartnerPortal(partnerId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;

  // Partner Availability
  getPartnerAvailability(partnerId: string): Promise<PartnerAvailability[]>;
  getPartnerAvailabilityByDateRange(partnerId: string, startDate: Date, endDate: Date): Promise<PartnerAvailability[]>;
  getAllPartnerAvailability(startDate: Date, endDate: Date): Promise<PartnerAvailability[]>;
  createPartnerAvailability(availability: InsertPartnerAvailability): Promise<PartnerAvailability>;
  updatePartnerAvailability(id: string, availability: Partial<InsertPartnerAvailability>): Promise<PartnerAvailability | undefined>;
  deletePartnerAvailability(id: string): Promise<boolean>;

  // Job Schedule Proposals
  getScheduleProposalsByJob(jobId: string): Promise<JobScheduleProposal[]>;
  getActiveScheduleProposal(jobId: string): Promise<JobScheduleProposal | undefined>;
  getScheduleProposal(id: string): Promise<JobScheduleProposal | undefined>;
  getPendingScheduleResponses(): Promise<JobScheduleProposal[]>;
  createScheduleProposal(proposal: InsertJobScheduleProposal): Promise<JobScheduleProposal>;
  updateScheduleProposal(id: string, proposal: Partial<InsertJobScheduleProposal>): Promise<JobScheduleProposal | undefined>;
  archiveScheduleProposals(jobId: string): Promise<void>;

  // SEO Business Profile
  getSeoBusinessProfile(): Promise<SeoBusinessProfile | undefined>;
  upsertSeoBusinessProfile(profile: InsertSeoBusinessProfile): Promise<SeoBusinessProfile>;

  // SEO Brand Voice
  getSeoBrandVoice(): Promise<SeoBrandVoice | undefined>;
  upsertSeoBrandVoice(voice: InsertSeoBrandVoice): Promise<SeoBrandVoice>;

  // SEO Weekly Focus
  getSeoWeeklyFocusList(): Promise<SeoWeeklyFocus[]>;
  getSeoWeeklyFocus(id: string): Promise<SeoWeeklyFocus | undefined>;
  getActiveSeoWeeklyFocus(): Promise<SeoWeeklyFocus | undefined>;
  createSeoWeeklyFocus(focus: InsertSeoWeeklyFocus): Promise<SeoWeeklyFocus>;
  updateSeoWeeklyFocus(id: string, focus: Partial<InsertSeoWeeklyFocus>): Promise<SeoWeeklyFocus | undefined>;

  // SEO Job Media
  getSeoJobMediaByJob(jobId: string): Promise<SeoJobMedia[]>;
  getAllSeoJobMedia(): Promise<SeoJobMedia[]>;
  createSeoJobMedia(media: InsertSeoJobMedia): Promise<SeoJobMedia>;
  updateSeoJobMedia(id: string, media: Partial<InsertSeoJobMedia>): Promise<SeoJobMedia | undefined>;
  deleteSeoJobMedia(id: string): Promise<boolean>;

  // SEO Content Posts
  getSeoContentPosts(): Promise<SeoContentPost[]>;
  getSeoContentPost(id: string): Promise<SeoContentPost | undefined>;
  getSeoContentPostsByStatus(status: string): Promise<SeoContentPost[]>;
  getSeoContentPostsByWeeklyFocus(weeklyFocusId: string): Promise<SeoContentPost[]>;
  createSeoContentPost(post: InsertSeoContentPost): Promise<SeoContentPost>;
  updateSeoContentPost(id: string, post: Partial<InsertSeoContentPost>): Promise<SeoContentPost | undefined>;
  deleteSeoContentPost(id: string): Promise<boolean>;

  // SEO Autopilot Settings
  getSeoAutopilotSettings(): Promise<SeoAutopilotSettings | undefined>;
  upsertSeoAutopilotSettings(settings: InsertSeoAutopilotSettings): Promise<SeoAutopilotSettings>;

  // SEO Autopilot Slots
  getSeoAutopilotSlots(): Promise<SeoAutopilotSlot[]>;
  getSeoAutopilotSlotsByDateRange(startDate: Date, endDate: Date): Promise<SeoAutopilotSlot[]>;
  getSeoAutopilotSlotsByStatus(status: string): Promise<SeoAutopilotSlot[]>;
  getSeoAutopilotSlot(id: string): Promise<SeoAutopilotSlot | undefined>;
  createSeoAutopilotSlot(slot: InsertSeoAutopilotSlot): Promise<SeoAutopilotSlot>;
  updateSeoAutopilotSlot(id: string, slot: Partial<InsertSeoAutopilotSlot>): Promise<SeoAutopilotSlot | undefined>;
  deleteSeoAutopilotSlot(id: string): Promise<boolean>;

  // SEO Autopilot Runs
  getSeoAutopilotRuns(): Promise<SeoAutopilotRun[]>;
  createSeoAutopilotRun(run: InsertSeoAutopilotRun): Promise<SeoAutopilotRun>;
}

export class DatabaseStorage implements IStorage {
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

  // Client Portal Methods
  async getJobsByContact(contactId: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.contactId, contactId)).orderBy(desc(jobs.createdAt));
  }

  async getClientPortalAccess(contactId: string): Promise<ClientPortalAccess | undefined> {
    const [access] = await db.select().from(clientPortalAccess).where(eq(clientPortalAccess.contactId, contactId));
    return access || undefined;
  }

  async getClientPortalAccessByToken(token: string): Promise<ClientPortalAccess | undefined> {
    const [access] = await db.select().from(clientPortalAccess).where(eq(clientPortalAccess.accessToken, token));
    return access || undefined;
  }

  async createClientPortalAccess(access: InsertClientPortalAccess): Promise<ClientPortalAccess> {
    const [created] = await db.insert(clientPortalAccess).values(access).returning();
    return created;
  }

  async getClientInviteByToken(token: string): Promise<ClientInvite | undefined> {
    const [invite] = await db.select().from(clientInvites).where(eq(clientInvites.inviteToken, token));
    return invite || undefined;
  }

  async getClientInviteByContact(contactId: string): Promise<ClientInvite | undefined> {
    // Only return pending (unaccepted) invites
    const [invite] = await db.select().from(clientInvites)
      .where(and(
        eq(clientInvites.contactId, contactId),
        isNull(clientInvites.acceptedAt)
      ))
      .orderBy(desc(clientInvites.createdAt));
    return invite || undefined;
  }

  async createClientInvite(invite: InsertClientInvite): Promise<ClientInvite> {
    const [created] = await db.insert(clientInvites).values(invite).returning();
    return created;
  }

  async acceptClientInvite(token: string): Promise<void> {
    await db.update(clientInvites).set({ acceptedAt: new Date() }).where(eq(clientInvites.inviteToken, token));
  }

  async getPaymentRequestsByJob(jobId: string): Promise<PaymentRequest[]> {
    return db.select().from(paymentRequests).where(eq(paymentRequests.jobId, jobId)).orderBy(desc(paymentRequests.createdAt));
  }

  async createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest> {
    const [created] = await db.insert(paymentRequests).values(request).returning();
    return created;
  }

  async updatePaymentRequest(id: string, request: Partial<InsertPaymentRequest>): Promise<PaymentRequest | undefined> {
    const [updated] = await db.update(paymentRequests).set(request).where(eq(paymentRequests.id, id)).returning();
    return updated || undefined;
  }

  async deletePaymentRequest(id: string): Promise<boolean> {
    await db.delete(paymentRequests).where(eq(paymentRequests.id, id));
    return true;
  }

  async getCompanySettings(): Promise<CompanySetting[]> {
    return db.select().from(companySettings);
  }

  async upsertCompanySetting(setting: InsertCompanySetting): Promise<CompanySetting> {
    const [created] = await db.insert(companySettings).values(setting)
      .onConflictDoUpdate({
        target: companySettings.settingKey,
        set: { settingValue: setting.settingValue, updatedAt: new Date() }
      })
      .returning();
    return created;
  }

  async createReviewRequest(request: InsertReviewRequest): Promise<ReviewRequest> {
    const [created] = await db.insert(reviewRequests).values(request).returning();
    return created;
  }

  // Quote Items
  async getQuoteItemsByJob(jobId: string): Promise<QuoteItem[]> {
    return db.select().from(quoteItems).where(eq(quoteItems.jobId, jobId)).orderBy(asc(quoteItems.sortOrder));
  }

  async createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem> {
    const [created] = await db.insert(quoteItems).values(item).returning();
    return created;
  }

  async updateQuoteItem(id: string, item: Partial<InsertQuoteItem>): Promise<QuoteItem | undefined> {
    const [updated] = await db.update(quoteItems).set(item).where(eq(quoteItems.id, id)).returning();
    return updated || undefined;
  }

  async deleteQuoteItem(id: string): Promise<boolean> {
    await db.delete(quoteItems).where(eq(quoteItems.id, id));
    return true;
  }

  async deleteQuoteItemsByJob(jobId: string): Promise<boolean> {
    await db.delete(quoteItems).where(eq(quoteItems.jobId, jobId));
    return true;
  }

  // Invoices
  async getInvoicesByJob(jobId: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.jobId, jobId)).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoiceByReference(referenceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.referenceNumber, referenceNumber));
    return invoice || undefined;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(invoice).returning();
    return created;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updated] = await db.update(invoices).set({ ...invoice, updatedAt: new Date() }).where(eq(invoices.id, id)).returning();
    return updated || undefined;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    await db.delete(invoices).where(eq(invoices.id, id));
    return true;
  }

  async getNextInvoiceNumber(jobNumber: string, type: string): Promise<string> {
    const prefix = type === "invoice" ? "INV" : "QTE";
    const existingInvoices = await db.select().from(invoices).where(eq(invoices.jobId, jobNumber));
    const count = existingInvoices.length + 1;
    return `${jobNumber}-${prefix}-${String(count).padStart(2, "0")}`;
  }

  async getPortalInvoicesByJob(jobId: string): Promise<Invoice[]> {
    return db.select().from(invoices)
      .where(eq(invoices.jobId, jobId))
      .orderBy(desc(invoices.createdAt));
  }

  // Invoice Line Items
  async getInvoiceLineItems(invoiceId: string): Promise<InvoiceLineItem[]> {
    return db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId)).orderBy(asc(invoiceLineItems.sortOrder));
  }

  async createInvoiceLineItem(item: InsertInvoiceLineItem): Promise<InvoiceLineItem> {
    const [created] = await db.insert(invoiceLineItems).values(item).returning();
    return created;
  }

  async deleteInvoiceLineItems(invoiceId: string): Promise<boolean> {
    await db.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId));
    return true;
  }

  // Partner Portal Methods
  async getPartnerPortalAccess(partnerId: string): Promise<PartnerPortalAccess | undefined> {
    const [access] = await db.select().from(partnerPortalAccess).where(eq(partnerPortalAccess.partnerId, partnerId));
    return access || undefined;
  }

  async getPartnerPortalAccessByToken(token: string): Promise<PartnerPortalAccess | undefined> {
    const [access] = await db.select().from(partnerPortalAccess).where(eq(partnerPortalAccess.accessToken, token));
    return access || undefined;
  }

  async createPartnerPortalAccess(access: InsertPartnerPortalAccess): Promise<PartnerPortalAccess> {
    const [created] = await db.insert(partnerPortalAccess).values(access).returning();
    return created;
  }

  async updatePartnerPortalAccessLastLogin(partnerId: string): Promise<void> {
    await db.update(partnerPortalAccess)
      .set({ lastLoginAt: new Date() })
      .where(eq(partnerPortalAccess.partnerId, partnerId));
  }

  async getPartnerInviteByToken(token: string): Promise<PartnerInvite | undefined> {
    const [invite] = await db.select().from(partnerInvites).where(eq(partnerInvites.inviteToken, token));
    return invite || undefined;
  }

  async getPartnerInviteByPartner(partnerId: string): Promise<PartnerInvite | undefined> {
    const [invite] = await db.select().from(partnerInvites)
      .where(and(
        eq(partnerInvites.partnerId, partnerId),
        isNull(partnerInvites.acceptedAt)
      ))
      .orderBy(desc(partnerInvites.createdAt));
    return invite || undefined;
  }

  async createPartnerInvite(invite: InsertPartnerInvite): Promise<PartnerInvite> {
    const [created] = await db.insert(partnerInvites).values(invite).returning();
    return created;
  }

  async acceptPartnerInvite(token: string): Promise<void> {
    await db.update(partnerInvites).set({ acceptedAt: new Date() }).where(eq(partnerInvites.inviteToken, token));
  }

  async getJobsByPartner(partnerId: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.partnerId, partnerId)).orderBy(desc(jobs.createdAt));
  }

  // Job Notes Methods
  async getJobNotes(jobId: string): Promise<JobNote[]> {
    return db.select().from(jobNotes).where(eq(jobNotes.jobId, jobId)).orderBy(desc(jobNotes.createdAt));
  }

  async getJobNote(id: string): Promise<JobNote | undefined> {
    const [note] = await db.select().from(jobNotes).where(eq(jobNotes.id, id));
    return note || undefined;
  }

  async createJobNote(note: InsertJobNote): Promise<JobNote> {
    const [created] = await db.insert(jobNotes).values(note).returning();
    return created;
  }

  async updateJobNote(id: string, note: Partial<InsertJobNote>): Promise<JobNote | undefined> {
    const [updated] = await db.update(jobNotes).set({ ...note, updatedAt: new Date() }).where(eq(jobNotes.id, id)).returning();
    return updated || undefined;
  }

  async deleteJobNote(id: string): Promise<boolean> {
    await db.delete(jobNotes).where(eq(jobNotes.id, id));
    return true;
  }

  async getJobNotesForPartner(jobId: string): Promise<JobNote[]> {
    // Only return notes visible to partners (visibility: 'partner' or 'all')
    const notes = await db.select().from(jobNotes).where(eq(jobNotes.jobId, jobId)).orderBy(desc(jobNotes.createdAt));
    return notes.filter(n => n.visibility === 'partner' || n.visibility === 'all');
  }

  // Job Note Attachments Methods
  async getJobNoteAttachments(noteId: string): Promise<JobNoteAttachment[]> {
    return db.select().from(jobNoteAttachments).where(eq(jobNoteAttachments.noteId, noteId)).orderBy(desc(jobNoteAttachments.createdAt));
  }

  async createJobNoteAttachment(attachment: InsertJobNoteAttachment): Promise<JobNoteAttachment> {
    const [created] = await db.insert(jobNoteAttachments).values(attachment).returning();
    return created;
  }

  async deleteJobNoteAttachment(id: string): Promise<boolean> {
    await db.delete(jobNoteAttachments).where(eq(jobNoteAttachments.id, id));
    return true;
  }

  // Financial Categories Methods
  async getFinancialCategories(): Promise<FinancialCategory[]> {
    return db.select().from(financialCategories).orderBy(asc(financialCategories.sortOrder));
  }

  async getFinancialCategory(id: string): Promise<FinancialCategory | undefined> {
    const [category] = await db.select().from(financialCategories).where(eq(financialCategories.id, id));
    return category || undefined;
  }

  async getFinancialCategoryByName(name: string): Promise<FinancialCategory | undefined> {
    const [category] = await db.select().from(financialCategories).where(eq(financialCategories.name, name));
    return category || undefined;
  }

  async createFinancialCategory(category: InsertFinancialCategory): Promise<FinancialCategory> {
    const [created] = await db.insert(financialCategories).values(category).returning();
    return created;
  }

  async updateFinancialCategory(id: string, category: Partial<InsertFinancialCategory>): Promise<FinancialCategory | undefined> {
    const [updated] = await db.update(financialCategories).set(category).where(eq(financialCategories.id, id)).returning();
    return updated || undefined;
  }

  async deleteFinancialCategory(id: string): Promise<boolean> {
    await db.delete(financialCategories).where(eq(financialCategories.id, id));
    return true;
  }

  // Financial Transactions Methods
  async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    return db.select().from(financialTransactions).orderBy(desc(financialTransactions.date));
  }

  async getFinancialTransaction(id: string): Promise<FinancialTransaction | undefined> {
    const [transaction] = await db.select().from(financialTransactions).where(eq(financialTransactions.id, id));
    return transaction || undefined;
  }

  async getFinancialTransactionsByMonth(year: number, month: number): Promise<FinancialTransaction[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return db.select()
      .from(financialTransactions)
      .where(and(
        gte(financialTransactions.date, startDate),
        lte(financialTransactions.date, endDate)
      ))
      .orderBy(desc(financialTransactions.date));
  }

  async getFinancialTransactionsByJob(jobId: string): Promise<FinancialTransaction[]> {
    return db.select().from(financialTransactions).where(eq(financialTransactions.jobId, jobId)).orderBy(desc(financialTransactions.date));
  }

  async createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const [created] = await db.insert(financialTransactions).values(transaction).returning();
    return created;
  }

  async updateFinancialTransaction(id: string, transaction: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction | undefined> {
    const [updated] = await db.update(financialTransactions).set({ ...transaction, updatedAt: new Date() }).where(eq(financialTransactions.id, id)).returning();
    return updated || undefined;
  }

  async deleteFinancialTransaction(id: string): Promise<boolean> {
    await db.delete(financialTransactions).where(eq(financialTransactions.id, id));
    return true;
  }

  // Calendar Events Methods
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return db.select().from(calendarEvents).orderBy(asc(calendarEvents.startDate));
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return event || undefined;
  }

  async getCalendarEventsByDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return db.select()
      .from(calendarEvents)
      .where(and(
        gte(calendarEvents.startDate, startDate),
        lte(calendarEvents.endDate, endDate)
      ))
      .orderBy(asc(calendarEvents.startDate));
  }

  async getCalendarEventsByPartner(partnerId: string): Promise<CalendarEvent[]> {
    return db.select()
      .from(calendarEvents)
      .where(eq(calendarEvents.partnerId, partnerId))
      .orderBy(asc(calendarEvents.startDate));
  }

  async getCalendarEventsForPartnerPortal(partnerId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const allEvents = await db.select()
      .from(calendarEvents)
      .where(and(
        gte(calendarEvents.startDate, startDate),
        lte(calendarEvents.endDate, endDate)
      ))
      .orderBy(asc(calendarEvents.startDate));
    
    // Partner can only see their own partner events or hybrid events they're part of
    return allEvents.filter(e => 
      (e.teamType === "partner" && e.partnerId === partnerId) ||
      (e.teamType === "hybrid" && e.partnerId === partnerId)
    );
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [created] = await db.insert(calendarEvents).values(event).returning();
    return created;
  }

  async updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const [updated] = await db.update(calendarEvents)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(calendarEvents.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return true;
  }

  // Partner Availability Methods
  async getPartnerAvailability(partnerId: string): Promise<PartnerAvailability[]> {
    return db.select()
      .from(partnerAvailability)
      .where(eq(partnerAvailability.partnerId, partnerId))
      .orderBy(asc(partnerAvailability.startDate));
  }

  async getPartnerAvailabilityByDateRange(partnerId: string, startDate: Date, endDate: Date): Promise<PartnerAvailability[]> {
    return db.select()
      .from(partnerAvailability)
      .where(and(
        eq(partnerAvailability.partnerId, partnerId),
        gte(partnerAvailability.startDate, startDate),
        lte(partnerAvailability.endDate, endDate)
      ))
      .orderBy(asc(partnerAvailability.startDate));
  }

  async getAllPartnerAvailability(startDate: Date, endDate: Date): Promise<PartnerAvailability[]> {
    return db.select()
      .from(partnerAvailability)
      .where(and(
        gte(partnerAvailability.startDate, startDate),
        lte(partnerAvailability.endDate, endDate)
      ))
      .orderBy(asc(partnerAvailability.startDate));
  }

  async createPartnerAvailability(availability: InsertPartnerAvailability): Promise<PartnerAvailability> {
    const [created] = await db.insert(partnerAvailability).values(availability).returning();
    return created;
  }

  async updatePartnerAvailability(id: string, availability: Partial<InsertPartnerAvailability>): Promise<PartnerAvailability | undefined> {
    const [updated] = await db.update(partnerAvailability)
      .set(availability)
      .where(eq(partnerAvailability.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePartnerAvailability(id: string): Promise<boolean> {
    await db.delete(partnerAvailability).where(eq(partnerAvailability.id, id));
    return true;
  }

  // Job Schedule Proposal Methods
  async getScheduleProposalsByJob(jobId: string): Promise<JobScheduleProposal[]> {
    return db.select()
      .from(jobScheduleProposals)
      .where(eq(jobScheduleProposals.jobId, jobId))
      .orderBy(desc(jobScheduleProposals.createdAt));
  }

  async getActiveScheduleProposal(jobId: string): Promise<JobScheduleProposal | undefined> {
    const [proposal] = await db.select()
      .from(jobScheduleProposals)
      .where(and(
        eq(jobScheduleProposals.jobId, jobId),
        eq(jobScheduleProposals.isArchived, false)
      ))
      .orderBy(desc(jobScheduleProposals.createdAt))
      .limit(1);
    return proposal || undefined;
  }

  async getScheduleProposal(id: string): Promise<JobScheduleProposal | undefined> {
    const [proposal] = await db.select()
      .from(jobScheduleProposals)
      .where(eq(jobScheduleProposals.id, id));
    return proposal || undefined;
  }

  async getPendingScheduleResponses(): Promise<JobScheduleProposal[]> {
    return db.select()
      .from(jobScheduleProposals)
      .where(
        and(
          eq(jobScheduleProposals.isArchived, false),
          or(
            eq(jobScheduleProposals.status, "scheduled"),
            eq(jobScheduleProposals.status, "client_countered")
          )
        )
      )
      .orderBy(desc(jobScheduleProposals.respondedAt));
  }

  async createScheduleProposal(proposal: InsertJobScheduleProposal): Promise<JobScheduleProposal> {
    const [created] = await db.insert(jobScheduleProposals).values(proposal).returning();
    return created;
  }

  async updateScheduleProposal(id: string, proposal: Partial<InsertJobScheduleProposal>): Promise<JobScheduleProposal | undefined> {
    const [updated] = await db.update(jobScheduleProposals)
      .set({ ...proposal, updatedAt: new Date() })
      .where(eq(jobScheduleProposals.id, id))
      .returning();
    return updated || undefined;
  }

  async archiveScheduleProposals(jobId: string): Promise<void> {
    await db.update(jobScheduleProposals)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(jobScheduleProposals.jobId, jobId));
  }

  // SEO Business Profile Methods
  async getSeoBusinessProfile(): Promise<SeoBusinessProfile | undefined> {
    const [profile] = await db.select().from(seoBusinessProfile).limit(1);
    return profile || undefined;
  }

  async upsertSeoBusinessProfile(profile: InsertSeoBusinessProfile): Promise<SeoBusinessProfile> {
    const existing = await this.getSeoBusinessProfile();
    if (existing) {
      const [updated] = await db.update(seoBusinessProfile)
        .set({ ...profile, updatedAt: new Date() })
        .where(eq(seoBusinessProfile.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(seoBusinessProfile).values(profile).returning();
    return created;
  }

  // SEO Brand Voice Methods
  async getSeoBrandVoice(): Promise<SeoBrandVoice | undefined> {
    const [voice] = await db.select().from(seoBrandVoice).limit(1);
    return voice || undefined;
  }

  async upsertSeoBrandVoice(voice: InsertSeoBrandVoice): Promise<SeoBrandVoice> {
    const existing = await this.getSeoBrandVoice();
    if (existing) {
      const [updated] = await db.update(seoBrandVoice)
        .set({ ...voice, updatedAt: new Date() })
        .where(eq(seoBrandVoice.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(seoBrandVoice).values(voice).returning();
    return created;
  }

  // SEO Weekly Focus Methods
  async getSeoWeeklyFocusList(): Promise<SeoWeeklyFocus[]> {
    return db.select().from(seoWeeklyFocus).orderBy(desc(seoWeeklyFocus.weekStartDate));
  }

  async getSeoWeeklyFocus(id: string): Promise<SeoWeeklyFocus | undefined> {
    const [focus] = await db.select().from(seoWeeklyFocus).where(eq(seoWeeklyFocus.id, id));
    return focus || undefined;
  }

  async getActiveSeoWeeklyFocus(): Promise<SeoWeeklyFocus | undefined> {
    const [focus] = await db.select()
      .from(seoWeeklyFocus)
      .where(eq(seoWeeklyFocus.status, "active"))
      .orderBy(desc(seoWeeklyFocus.weekStartDate))
      .limit(1);
    return focus || undefined;
  }

  async createSeoWeeklyFocus(focus: InsertSeoWeeklyFocus): Promise<SeoWeeklyFocus> {
    const [created] = await db.insert(seoWeeklyFocus).values(focus).returning();
    return created;
  }

  async updateSeoWeeklyFocus(id: string, focus: Partial<InsertSeoWeeklyFocus>): Promise<SeoWeeklyFocus | undefined> {
    const [updated] = await db.update(seoWeeklyFocus)
      .set({ ...focus, updatedAt: new Date() })
      .where(eq(seoWeeklyFocus.id, id))
      .returning();
    return updated || undefined;
  }

  // SEO Job Media Methods
  async getSeoJobMediaByJob(jobId: string): Promise<SeoJobMedia[]> {
    return db.select().from(seoJobMedia).where(eq(seoJobMedia.jobId, jobId));
  }

  async getAllSeoJobMedia(): Promise<SeoJobMedia[]> {
    return db.select().from(seoJobMedia).orderBy(desc(seoJobMedia.createdAt));
  }

  async createSeoJobMedia(media: InsertSeoJobMedia): Promise<SeoJobMedia> {
    const [created] = await db.insert(seoJobMedia).values(media).returning();
    return created;
  }

  async updateSeoJobMedia(id: string, media: Partial<InsertSeoJobMedia>): Promise<SeoJobMedia | undefined> {
    const [updated] = await db.update(seoJobMedia)
      .set(media)
      .where(eq(seoJobMedia.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSeoJobMedia(id: string): Promise<boolean> {
    await db.delete(seoJobMedia).where(eq(seoJobMedia.id, id));
    return true;
  }

  // SEO Content Posts Methods
  async getSeoContentPosts(): Promise<SeoContentPost[]> {
    return db.select().from(seoContentPosts).orderBy(desc(seoContentPosts.createdAt));
  }

  async getSeoContentPost(id: string): Promise<SeoContentPost | undefined> {
    const [post] = await db.select().from(seoContentPosts).where(eq(seoContentPosts.id, id));
    return post || undefined;
  }

  async getSeoContentPostsByStatus(status: string): Promise<SeoContentPost[]> {
    return db.select()
      .from(seoContentPosts)
      .where(eq(seoContentPosts.status, status))
      .orderBy(desc(seoContentPosts.createdAt));
  }

  async getSeoContentPostsByWeeklyFocus(weeklyFocusId: string): Promise<SeoContentPost[]> {
    return db.select()
      .from(seoContentPosts)
      .where(eq(seoContentPosts.weeklyFocusId, weeklyFocusId))
      .orderBy(desc(seoContentPosts.createdAt));
  }

  async createSeoContentPost(post: InsertSeoContentPost): Promise<SeoContentPost> {
    const [created] = await db.insert(seoContentPosts).values(post).returning();
    return created;
  }

  async updateSeoContentPost(id: string, post: Partial<InsertSeoContentPost>): Promise<SeoContentPost | undefined> {
    const [updated] = await db.update(seoContentPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(seoContentPosts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSeoContentPost(id: string): Promise<boolean> {
    await db.delete(seoContentPosts).where(eq(seoContentPosts.id, id));
    return true;
  }

  // SEO Autopilot Settings Methods
  async getSeoAutopilotSettings(): Promise<SeoAutopilotSettings | undefined> {
    const [settings] = await db.select().from(seoAutopilotSettings).limit(1);
    return settings || undefined;
  }

  async upsertSeoAutopilotSettings(settings: InsertSeoAutopilotSettings): Promise<SeoAutopilotSettings> {
    const existing = await this.getSeoAutopilotSettings();
    if (existing) {
      const [updated] = await db.update(seoAutopilotSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(seoAutopilotSettings.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(seoAutopilotSettings).values(settings).returning();
    return created;
  }

  // SEO Autopilot Slots Methods
  async getSeoAutopilotSlots(): Promise<SeoAutopilotSlot[]> {
    return db.select().from(seoAutopilotSlots).orderBy(asc(seoAutopilotSlots.scheduledFor));
  }

  async getSeoAutopilotSlotsByDateRange(startDate: Date, endDate: Date): Promise<SeoAutopilotSlot[]> {
    return db.select()
      .from(seoAutopilotSlots)
      .where(and(
        gte(seoAutopilotSlots.scheduledFor, startDate),
        lte(seoAutopilotSlots.scheduledFor, endDate)
      ))
      .orderBy(asc(seoAutopilotSlots.scheduledFor));
  }

  async getSeoAutopilotSlotsByStatus(status: string): Promise<SeoAutopilotSlot[]> {
    return db.select()
      .from(seoAutopilotSlots)
      .where(eq(seoAutopilotSlots.status, status))
      .orderBy(asc(seoAutopilotSlots.scheduledFor));
  }

  async getSeoAutopilotSlot(id: string): Promise<SeoAutopilotSlot | undefined> {
    const [slot] = await db.select().from(seoAutopilotSlots).where(eq(seoAutopilotSlots.id, id));
    return slot || undefined;
  }

  async createSeoAutopilotSlot(slot: InsertSeoAutopilotSlot): Promise<SeoAutopilotSlot> {
    const [created] = await db.insert(seoAutopilotSlots).values(slot).returning();
    return created;
  }

  async updateSeoAutopilotSlot(id: string, slot: Partial<InsertSeoAutopilotSlot>): Promise<SeoAutopilotSlot | undefined> {
    const [updated] = await db.update(seoAutopilotSlots)
      .set(slot)
      .where(eq(seoAutopilotSlots.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSeoAutopilotSlot(id: string): Promise<boolean> {
    await db.delete(seoAutopilotSlots).where(eq(seoAutopilotSlots.id, id));
    return true;
  }

  // SEO Autopilot Runs Methods
  async getSeoAutopilotRuns(): Promise<SeoAutopilotRun[]> {
    return db.select().from(seoAutopilotRuns).orderBy(desc(seoAutopilotRuns.ranAt));
  }

  async createSeoAutopilotRun(run: InsertSeoAutopilotRun): Promise<SeoAutopilotRun> {
    const [created] = await db.insert(seoAutopilotRuns).values(run).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
