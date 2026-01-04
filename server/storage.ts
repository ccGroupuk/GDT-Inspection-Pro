import { 
  contacts, type Contact, type InsertContact,
  tradePartners, type TradePartner, type InsertTradePartner,
  jobs, type Job, type InsertJob,
  tasks, type Task, type InsertTask,
  quoteItems, type QuoteItem, type InsertQuoteItem,
  jobPartners, type JobPartner, type InsertJobPartner,
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
  seoGoogleBusinessLocations, type SeoGoogleBusinessLocation, type InsertSeoGoogleBusinessLocation,
  seoMediaLibrary, type SeoMediaLibrary, type InsertSeoMediaLibrary,
  seoBrandVoice, type SeoBrandVoice, type InsertSeoBrandVoice,
  seoWeeklyFocus, type SeoWeeklyFocus, type InsertSeoWeeklyFocus,
  seoJobMedia, type SeoJobMedia, type InsertSeoJobMedia,
  seoContentPosts, type SeoContentPost, type InsertSeoContentPost,
  seoAutopilotSettings, type SeoAutopilotSettings, type InsertSeoAutopilotSettings,
  seoAutopilotSlots, type SeoAutopilotSlot, type InsertSeoAutopilotSlot,
  seoAutopilotRuns, type SeoAutopilotRun, type InsertSeoAutopilotRun,
  portalMessages, type PortalMessage, type InsertPortalMessage,
  portalMessageReads, type PortalMessageRead, type InsertPortalMessageRead,
  helpCategories, type HelpCategory, type InsertHelpCategory,
  helpArticles, type HelpArticle, type InsertHelpArticle,
  employees, type Employee, type InsertEmployee,
  employeeCredentials, type EmployeeCredential, type InsertEmployeeCredential,
  employeeSessions, type EmployeeSession, type InsertEmployeeSession,
  timeEntries, type TimeEntry, type InsertTimeEntry,
  payPeriods, type PayPeriod, type InsertPayPeriod,
  payrollRuns, type PayrollRun, type InsertPayrollRun,
  payrollAdjustments, type PayrollAdjustment, type InsertPayrollAdjustment,
  employeeDocuments, type EmployeeDocument, type InsertEmployeeDocument,
  jobSurveys, type JobSurvey, type InsertJobSurvey,
  partnerQuotes, type PartnerQuote, type InsertPartnerQuote,
  partnerQuoteItems, type PartnerQuoteItem, type InsertPartnerQuoteItem,
  emergencyCallouts, type EmergencyCallout, type InsertEmergencyCallout,
  emergencyCalloutResponses, type EmergencyCalloutResponse, type InsertEmergencyCalloutResponse,
  productCategories, type ProductCategory, type InsertProductCategory,
  catalogItems, type CatalogItem, type InsertCatalogItem,
  suppliers, type Supplier, type InsertSupplier,
  supplierCatalogItems, type SupplierCatalogItem, type InsertSupplierCatalogItem,
  quoteTemplates, type QuoteTemplate, type InsertQuoteTemplate,
  quoteTemplateItems, type QuoteTemplateItem, type InsertQuoteTemplateItem,
  connectionLinks, type ConnectionLink, type InsertConnectionLink,
  assets, type Asset, type InsertAsset,
  assetFaults, type AssetFault, type InsertAssetFault,
  assetReminders, type AssetReminder, type InsertAssetReminder,
  checklistTemplates, type ChecklistTemplate, type InsertChecklistTemplate,
  checklistItems, type ChecklistItem, type InsertChecklistItem,
  checklistInstances, type ChecklistInstance, type InsertChecklistInstance,
  checklistResponses, type ChecklistResponse, type InsertChecklistResponse,
  checklistAuditEvents, type ChecklistAuditEvent, type InsertChecklistAuditEvent,
  ownerWellbeingSettings, type OwnerWellbeingSettings, type InsertOwnerWellbeingSettings,
  personalTasks, type PersonalTask, type InsertPersonalTask,
  dailyFocusTasks, type DailyFocusTask, type InsertDailyFocusTask,
  wellbeingNudgeLogs, type WellbeingNudgeLog, type InsertWellbeingNudgeLog,
  internalMessages, type InternalMessage, type InsertInternalMessage,
  jobChatMessages, type JobChatMessage, type InsertJobChatMessage,
  jobChatMessageReads, type JobChatMessageRead, type InsertJobChatMessageRead,
  teamActivityLog, type TeamActivityLog, type InsertTeamActivityLog,
  capturedProducts, type CapturedProduct, type InsertCapturedProduct,
  products, type Product, type InsertProduct,
  productPriceHistory, type ProductPriceHistory, type InsertProductPriceHistory,
  dailyActivities, type DailyActivity, type InsertDailyActivity,
  activityReportSnapshots, type ActivityReportSnapshot, type InsertActivityReportSnapshot,
  changeOrders, type ChangeOrder, type InsertChangeOrder,
  changeOrderItems, type ChangeOrderItem, type InsertChangeOrderItem,
  partnerFeeAccruals, type PartnerFeeAccrual, type InsertPartnerFeeAccrual,
  partnerInvoices, type PartnerInvoice, type InsertPartnerInvoice,
  partnerInvoicePayments, type PartnerInvoicePayment, type InsertPartnerInvoicePayment,
  aiConversations, type AiConversation, type InsertAiConversation,
  buildRequests, type BuildRequest, type InsertBuildRequest,
  jobClientPayments, type JobClientPayment, type InsertJobClientPayment,
  jobFundAllocations, type JobFundAllocation, type InsertJobFundAllocation,
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
  getTradePartnerByAccessToken(token: string): Promise<TradePartner | undefined>;
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

  // Job Partners (multiple partners per job)
  getJobPartners(jobId: string): Promise<JobPartner[]>;
  getJobPartner(id: string): Promise<JobPartner | undefined>;
  createJobPartner(partner: InsertJobPartner): Promise<JobPartner>;
  updateJobPartner(id: string, partner: Partial<InsertJobPartner>): Promise<JobPartner | undefined>;
  deleteJobPartner(id: string): Promise<boolean>;

  // Client Portal
  getClientPortalAccess(contactId: string): Promise<ClientPortalAccess | undefined>;
  getClientPortalAccessByToken(token: string): Promise<ClientPortalAccess | undefined>;
  createClientPortalAccess(access: InsertClientPortalAccess): Promise<ClientPortalAccess>;
  updateClientPortalAccessPassword(accessId: string, passwordHash: string): Promise<void>;
  updateClientPortalAccessLastLogin(accessId: string): Promise<void>;

  getClientInviteByToken(token: string): Promise<ClientInvite | undefined>;
  getClientInviteByContact(contactId: string): Promise<ClientInvite | undefined>;
  createClientInvite(invite: InsertClientInvite): Promise<ClientInvite>;
  acceptClientInvite(token: string): Promise<void>;

  getPaymentRequestsByJob(jobId: string): Promise<PaymentRequest[]>;
  getPaymentRequest(id: string): Promise<PaymentRequest | undefined>;
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

  // Change Orders
  getChangeOrdersByJob(jobId: string): Promise<ChangeOrder[]>;
  getChangeOrder(id: string): Promise<ChangeOrder | undefined>;
  createChangeOrder(changeOrder: InsertChangeOrder): Promise<ChangeOrder>;
  updateChangeOrder(id: string, changeOrder: Partial<InsertChangeOrder>): Promise<ChangeOrder | undefined>;
  deleteChangeOrder(id: string): Promise<boolean>;
  getNextChangeOrderNumber(jobNumber: string): Promise<string>;

  // Change Order Items
  getChangeOrderItems(changeOrderId: string): Promise<ChangeOrderItem[]>;
  createChangeOrderItem(item: InsertChangeOrderItem): Promise<ChangeOrderItem>;
  updateChangeOrderItem(id: string, item: Partial<InsertChangeOrderItem>): Promise<ChangeOrderItem | undefined>;
  deleteChangeOrderItem(id: string): Promise<boolean>;
  deleteChangeOrderItems(changeOrderId: string): Promise<boolean>;

  // Partner Portal
  getPartnerPortalAccess(partnerId: string): Promise<PartnerPortalAccess | undefined>;
  getPartnerPortalAccessByToken(token: string): Promise<PartnerPortalAccess | undefined>;
  createPartnerPortalAccess(access: InsertPartnerPortalAccess): Promise<PartnerPortalAccess>;
  updatePartnerPortalAccessLastLogin(partnerId: string): Promise<void>;
  updatePartnerPortalAccessPassword(accessId: string, passwordHash: string): Promise<void>;
  
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
  getCalendarEventsByJob(jobId: string): Promise<CalendarEvent[]>;
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

  // SEO Google Business Locations
  getSeoGoogleBusinessLocations(): Promise<SeoGoogleBusinessLocation[]>;
  getSeoGoogleBusinessLocation(id: string): Promise<SeoGoogleBusinessLocation | undefined>;
  createSeoGoogleBusinessLocation(location: InsertSeoGoogleBusinessLocation): Promise<SeoGoogleBusinessLocation>;
  updateSeoGoogleBusinessLocation(id: string, location: Partial<InsertSeoGoogleBusinessLocation>): Promise<SeoGoogleBusinessLocation | undefined>;
  deleteSeoGoogleBusinessLocation(id: string): Promise<boolean>;

  // SEO Media Library
  getSeoMediaLibrary(): Promise<SeoMediaLibrary[]>;
  getSeoMediaLibraryByCategory(category: string): Promise<SeoMediaLibrary[]>;
  getSeoMediaItem(id: string): Promise<SeoMediaLibrary | undefined>;
  createSeoMediaItem(media: InsertSeoMediaLibrary): Promise<SeoMediaLibrary>;
  updateSeoMediaItem(id: string, media: Partial<InsertSeoMediaLibrary>): Promise<SeoMediaLibrary | undefined>;
  deleteSeoMediaItem(id: string): Promise<boolean>;

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

  // Help Categories
  getHelpCategories(): Promise<HelpCategory[]>;
  getHelpCategoriesByAudience(audience: string): Promise<HelpCategory[]>;
  getHelpCategory(id: string): Promise<HelpCategory | undefined>;
  createHelpCategory(category: InsertHelpCategory): Promise<HelpCategory>;
  updateHelpCategory(id: string, category: Partial<InsertHelpCategory>): Promise<HelpCategory | undefined>;
  deleteHelpCategory(id: string): Promise<boolean>;

  // Help Articles
  getHelpArticles(): Promise<HelpArticle[]>;
  getHelpArticlesByAudience(audience: string): Promise<HelpArticle[]>;
  getHelpArticlesByCategory(categoryId: string): Promise<HelpArticle[]>;
  getHelpArticle(id: string): Promise<HelpArticle | undefined>;
  createHelpArticle(article: InsertHelpArticle): Promise<HelpArticle>;
  updateHelpArticle(id: string, article: Partial<InsertHelpArticle>): Promise<HelpArticle | undefined>;
  deleteHelpArticle(id: string): Promise<boolean>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;

  // Employee Credentials
  getEmployeeCredential(employeeId: string): Promise<EmployeeCredential | undefined>;
  createEmployeeCredential(credential: InsertEmployeeCredential): Promise<EmployeeCredential>;
  updateEmployeeCredential(employeeId: string, credential: Partial<InsertEmployeeCredential>): Promise<EmployeeCredential | undefined>;

  // Employee Sessions
  getEmployeeSession(token: string): Promise<EmployeeSession | undefined>;
  createEmployeeSession(session: InsertEmployeeSession): Promise<EmployeeSession>;
  deleteEmployeeSession(token: string): Promise<boolean>;
  deleteExpiredEmployeeSessions(): Promise<void>;

  // Time Entries
  getTimeEntries(): Promise<TimeEntry[]>;
  getTimeEntriesByEmployee(employeeId: string): Promise<TimeEntry[]>;
  getTimeEntriesByDateRange(startDate: Date, endDate: Date): Promise<TimeEntry[]>;
  getTimeEntry(id: string): Promise<TimeEntry | undefined>;
  getActiveTimeEntry(employeeId: string): Promise<TimeEntry | undefined>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<boolean>;

  // Pay Periods
  getPayPeriods(): Promise<PayPeriod[]>;
  getPayPeriod(id: string): Promise<PayPeriod | undefined>;
  createPayPeriod(period: InsertPayPeriod): Promise<PayPeriod>;
  updatePayPeriod(id: string, period: Partial<InsertPayPeriod>): Promise<PayPeriod | undefined>;

  // Payroll Runs
  getPayrollRunsByPeriod(periodId: string): Promise<PayrollRun[]>;
  getPayrollRunsByEmployee(employeeId: string): Promise<PayrollRun[]>;
  getPayrollRun(id: string): Promise<PayrollRun | undefined>;
  createPayrollRun(run: InsertPayrollRun): Promise<PayrollRun>;
  updatePayrollRun(id: string, run: Partial<InsertPayrollRun>): Promise<PayrollRun | undefined>;

  // Payroll Adjustments
  getPayrollAdjustments(payrollRunId: string): Promise<PayrollAdjustment[]>;
  createPayrollAdjustment(adjustment: InsertPayrollAdjustment): Promise<PayrollAdjustment>;
  deletePayrollAdjustment(id: string): Promise<boolean>;

  // Employee Documents
  getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]>;
  getEmployeeDocument(id: string): Promise<EmployeeDocument | undefined>;
  createEmployeeDocument(doc: InsertEmployeeDocument): Promise<EmployeeDocument>;
  deleteEmployeeDocument(id: string): Promise<boolean>;

  // Job Surveys
  getJobSurveys(): Promise<JobSurvey[]>;
  getJobSurvey(id: string): Promise<JobSurvey | undefined>;
  getJobSurveysByJob(jobId: string): Promise<JobSurvey[]>;
  getJobSurveysByPartner(partnerId: string): Promise<JobSurvey[]>;
  getPendingSurveyAcceptances(): Promise<JobSurvey[]>;
  createJobSurvey(survey: InsertJobSurvey): Promise<JobSurvey>;
  updateJobSurvey(id: string, survey: Partial<InsertJobSurvey>): Promise<JobSurvey | undefined>;
  deleteJobSurvey(id: string): Promise<boolean>;

  // Partner Quotes
  getPartnerQuotes(): Promise<PartnerQuote[]>;
  getPartnerQuote(id: string): Promise<PartnerQuote | undefined>;
  getPartnerQuotesByJob(jobId: string): Promise<PartnerQuote[]>;
  getPartnerQuotesByPartner(partnerId: string): Promise<PartnerQuote[]>;
  getPendingPartnerQuotes(): Promise<PartnerQuote[]>;
  createPartnerQuote(quote: InsertPartnerQuote): Promise<PartnerQuote>;
  updatePartnerQuote(id: string, quote: Partial<InsertPartnerQuote>): Promise<PartnerQuote | undefined>;
  deletePartnerQuote(id: string): Promise<boolean>;

  // Partner Quote Items
  getPartnerQuoteItems(quoteId: string): Promise<PartnerQuoteItem[]>;
  createPartnerQuoteItem(item: InsertPartnerQuoteItem): Promise<PartnerQuoteItem>;
  updatePartnerQuoteItem(id: string, item: Partial<InsertPartnerQuoteItem>): Promise<PartnerQuoteItem | undefined>;
  deletePartnerQuoteItem(id: string): Promise<boolean>;
  deletePartnerQuoteItemsByQuote(quoteId: string): Promise<boolean>;

  // Emergency Callouts
  getEmergencyCallouts(): Promise<EmergencyCallout[]>;
  getEmergencyCallout(id: string): Promise<EmergencyCallout | undefined>;
  getEmergencyCalloutsByJob(jobId: string): Promise<EmergencyCallout[]>;
  getEmergencyCalloutByJobAndPartner(jobId: string, partnerId: string): Promise<EmergencyCallout | undefined>;
  getOpenEmergencyCallouts(): Promise<EmergencyCallout[]>;
  createEmergencyCallout(callout: InsertEmergencyCallout): Promise<EmergencyCallout>;
  updateEmergencyCallout(id: string, callout: Partial<InsertEmergencyCallout>): Promise<EmergencyCallout | undefined>;

  // Emergency Callout Responses
  getEmergencyCalloutResponses(calloutId: string): Promise<EmergencyCalloutResponse[]>;
  getEmergencyCalloutResponse(id: string): Promise<EmergencyCalloutResponse | undefined>;
  getEmergencyCalloutResponsesByPartner(partnerId: string): Promise<EmergencyCalloutResponse[]>;
  getPendingEmergencyCalloutsByPartner(partnerId: string): Promise<EmergencyCalloutResponse[]>;
  createEmergencyCalloutResponse(response: InsertEmergencyCalloutResponse): Promise<EmergencyCalloutResponse>;
  updateEmergencyCalloutResponse(id: string, response: Partial<InsertEmergencyCalloutResponse>): Promise<EmergencyCalloutResponse | undefined>;

  // Product Categories
  getProductCategories(): Promise<ProductCategory[]>;
  getProductCategory(id: string): Promise<ProductCategory | undefined>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: string, category: Partial<InsertProductCategory>): Promise<ProductCategory | undefined>;
  deleteProductCategory(id: string): Promise<boolean>;

  // Catalog Items
  getCatalogItems(): Promise<CatalogItem[]>;
  getCatalogItemsByCategory(categoryId: string): Promise<CatalogItem[]>;
  getCatalogItemsByType(type: string): Promise<CatalogItem[]>;
  getCatalogItem(id: string): Promise<CatalogItem | undefined>;
  createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem>;
  updateCatalogItem(id: string, item: Partial<InsertCatalogItem>): Promise<CatalogItem | undefined>;
  deleteCatalogItem(id: string): Promise<boolean>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  getActiveSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;

  // Supplier Catalog Items
  getSupplierCatalogItems(supplierId: string): Promise<SupplierCatalogItem[]>;
  getSupplierCatalogItemsByCatalogItem(catalogItemId: string): Promise<SupplierCatalogItem[]>;
  getSupplierCatalogItem(id: string): Promise<SupplierCatalogItem | undefined>;
  createSupplierCatalogItem(item: InsertSupplierCatalogItem): Promise<SupplierCatalogItem>;
  updateSupplierCatalogItem(id: string, item: Partial<InsertSupplierCatalogItem>): Promise<SupplierCatalogItem | undefined>;
  deleteSupplierCatalogItem(id: string): Promise<boolean>;

  // Quote Templates
  getQuoteTemplates(): Promise<QuoteTemplate[]>;
  getQuoteTemplate(id: string): Promise<QuoteTemplate | undefined>;
  createQuoteTemplate(template: InsertQuoteTemplate): Promise<QuoteTemplate>;
  updateQuoteTemplate(id: string, template: Partial<InsertQuoteTemplate>): Promise<QuoteTemplate | undefined>;
  deleteQuoteTemplate(id: string): Promise<boolean>;

  // Quote Template Items
  getQuoteTemplateItems(templateId: string): Promise<QuoteTemplateItem[]>;
  createQuoteTemplateItem(item: InsertQuoteTemplateItem): Promise<QuoteTemplateItem>;
  updateQuoteTemplateItem(id: string, item: Partial<InsertQuoteTemplateItem>): Promise<QuoteTemplateItem | undefined>;
  deleteQuoteTemplateItem(id: string): Promise<boolean>;
  deleteQuoteTemplateItemsByTemplate(templateId: string): Promise<boolean>;

  // Connection Links
  getConnectionLinks(): Promise<ConnectionLink[]>;
  getConnectionLink(id: string): Promise<ConnectionLink | undefined>;
  getConnectionLinkByToken(token: string): Promise<ConnectionLink | undefined>;
  getConnectionLinksByJob(jobId: string): Promise<ConnectionLink[]>;
  getConnectionLinksByParty(partyType: string, partyId: string): Promise<ConnectionLink[]>;
  createConnectionLink(link: InsertConnectionLink): Promise<ConnectionLink>;
  updateConnectionLink(id: string, link: Partial<InsertConnectionLink>): Promise<ConnectionLink | undefined>;
  deleteConnectionLink(id: string): Promise<boolean>;

  // Assets
  getAssets(): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | undefined>;
  getAssetsByType(type: string): Promise<Asset[]>;
  getAssetsByAssignee(employeeId: string): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: string): Promise<boolean>;
  getNextAssetNumber(type: string): Promise<string>;

  // Asset Faults
  getAssetFaults(): Promise<AssetFault[]>;
  getAssetFault(id: string): Promise<AssetFault | undefined>;
  getAssetFaultsByAsset(assetId: string): Promise<AssetFault[]>;
  getOpenAssetFaults(): Promise<AssetFault[]>;
  createAssetFault(fault: InsertAssetFault): Promise<AssetFault>;
  updateAssetFault(id: string, fault: Partial<InsertAssetFault>): Promise<AssetFault | undefined>;
  deleteAssetFault(id: string): Promise<boolean>;

  // Asset Reminders
  getAssetReminders(): Promise<AssetReminder[]>;
  getAssetReminder(id: string): Promise<AssetReminder | undefined>;
  getAssetRemindersByAsset(assetId: string): Promise<AssetReminder[]>;
  getPendingAssetReminders(): Promise<AssetReminder[]>;
  getUpcomingAssetReminders(daysAhead: number): Promise<AssetReminder[]>;
  createAssetReminder(reminder: InsertAssetReminder): Promise<AssetReminder>;
  updateAssetReminder(id: string, reminder: Partial<InsertAssetReminder>): Promise<AssetReminder | undefined>;
  deleteAssetReminder(id: string): Promise<boolean>;

  // Checklist Templates
  getChecklistTemplates(): Promise<ChecklistTemplate[]>;
  getChecklistTemplate(id: string): Promise<ChecklistTemplate | undefined>;
  getChecklistTemplateByCode(code: string): Promise<ChecklistTemplate | undefined>;
  createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate>;
  updateChecklistTemplate(id: string, template: Partial<InsertChecklistTemplate>): Promise<ChecklistTemplate | undefined>;
  deleteChecklistTemplate(id: string): Promise<boolean>;

  // Checklist Items
  getChecklistItems(templateId: string): Promise<ChecklistItem[]>;
  getChecklistItem(id: string): Promise<ChecklistItem | undefined>;
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  updateChecklistItem(id: string, item: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined>;
  deleteChecklistItem(id: string): Promise<boolean>;
  deleteChecklistItemsByTemplate(templateId: string): Promise<boolean>;

  // Checklist Instances
  getChecklistInstances(): Promise<ChecklistInstance[]>;
  getChecklistInstance(id: string): Promise<ChecklistInstance | undefined>;
  getChecklistInstancesByTarget(targetType: string, targetId: string): Promise<ChecklistInstance[]>;
  getChecklistInstancesByStatus(status: string): Promise<ChecklistInstance[]>;
  getPendingChecklistInstancesForJob(jobId: string): Promise<ChecklistInstance[]>;
  createChecklistInstance(instance: InsertChecklistInstance): Promise<ChecklistInstance>;
  updateChecklistInstance(id: string, instance: Partial<InsertChecklistInstance>): Promise<ChecklistInstance | undefined>;
  deleteChecklistInstance(id: string): Promise<boolean>;

  // Checklist Responses
  getChecklistResponses(instanceId: string): Promise<ChecklistResponse[]>;
  getChecklistResponse(id: string): Promise<ChecklistResponse | undefined>;
  createChecklistResponse(response: InsertChecklistResponse): Promise<ChecklistResponse>;
  updateChecklistResponse(id: string, response: Partial<InsertChecklistResponse>): Promise<ChecklistResponse | undefined>;
  upsertChecklistResponse(response: InsertChecklistResponse): Promise<ChecklistResponse>;

  // Checklist Audit Events
  getChecklistAuditEvents(instanceId: string): Promise<ChecklistAuditEvent[]>;
  createChecklistAuditEvent(event: InsertChecklistAuditEvent): Promise<ChecklistAuditEvent>;

  // Owner Wellbeing Settings
  getOwnerWellbeingSettings(employeeId: string): Promise<OwnerWellbeingSettings | undefined>;
  upsertOwnerWellbeingSettings(settings: InsertOwnerWellbeingSettings): Promise<OwnerWellbeingSettings>;

  // Personal Tasks
  getPersonalTasks(employeeId: string): Promise<PersonalTask[]>;
  getPersonalTasksByDate(employeeId: string, date: Date): Promise<PersonalTask[]>;
  getMorningTasks(employeeId: string): Promise<PersonalTask[]>;
  getUpcomingPersonalTasks(employeeId: string, daysAhead: number): Promise<PersonalTask[]>;
  getPersonalTask(id: string): Promise<PersonalTask | undefined>;
  createPersonalTask(task: InsertPersonalTask): Promise<PersonalTask>;
  updatePersonalTask(id: string, task: Partial<InsertPersonalTask>): Promise<PersonalTask | undefined>;
  deletePersonalTask(id: string): Promise<boolean>;

  // Daily Focus Tasks
  getDailyFocusTasks(employeeId: string, date: Date): Promise<DailyFocusTask[]>;
  getDailyFocusTask(id: string): Promise<DailyFocusTask | undefined>;
  createDailyFocusTask(task: InsertDailyFocusTask): Promise<DailyFocusTask>;
  updateDailyFocusTask(id: string, task: Partial<InsertDailyFocusTask>): Promise<DailyFocusTask | undefined>;
  deleteDailyFocusTask(id: string): Promise<boolean>;
  clearDailyFocusTasks(employeeId: string, date: Date): Promise<boolean>;

  // Wellbeing Nudge Logs
  getWellbeingNudgeLogs(employeeId: string, type: string): Promise<WellbeingNudgeLog[]>;
  getLatestNudgeLog(employeeId: string, type: string): Promise<WellbeingNudgeLog | undefined>;
  createWellbeingNudgeLog(log: InsertWellbeingNudgeLog): Promise<WellbeingNudgeLog>;

  // Internal Messages (Direct Messages)
  getInternalMessages(employeeId: string): Promise<InternalMessage[]>;
  getConversation(employeeId: string, otherEmployeeId: string): Promise<InternalMessage[]>;
  getUnreadMessageCount(employeeId: string): Promise<number>;
  createInternalMessage(message: InsertInternalMessage): Promise<InternalMessage>;
  markMessagesAsRead(employeeId: string, otherEmployeeId: string): Promise<void>;

  // Job Chat Messages
  getJobChatMessages(jobId: string): Promise<JobChatMessage[]>;
  getJobChatMessage(id: string): Promise<JobChatMessage | undefined>;
  createJobChatMessage(message: InsertJobChatMessage): Promise<JobChatMessage>;
  updateJobChatMessage(id: string, message: Partial<InsertJobChatMessage>): Promise<JobChatMessage | undefined>;
  deleteJobChatMessage(id: string): Promise<boolean>;
  markJobChatAsRead(messageId: string, employeeId: string): Promise<void>;
  getUnreadJobChatCount(employeeId: string): Promise<number>;

  // Team Activity Log
  getTeamActivityLog(limit: number): Promise<TeamActivityLog[]>;
  getTeamActivityLogByEmployee(employeeId: string, limit: number): Promise<TeamActivityLog[]>;
  createTeamActivityLog(activity: InsertTeamActivityLog): Promise<TeamActivityLog>;

  // Captured Products (Supplier Product Finder)
  getCapturedProducts(employeeId?: string): Promise<CapturedProduct[]>;
  getCapturedProductsByJob(jobId: string): Promise<CapturedProduct[]>;
  getCapturedProductsByStatus(status: string): Promise<CapturedProduct[]>;
  getCapturedProduct(id: string): Promise<CapturedProduct | undefined>;
  createCapturedProduct(product: InsertCapturedProduct): Promise<CapturedProduct>;
  updateCapturedProduct(id: string, product: Partial<InsertCapturedProduct>): Promise<CapturedProduct | undefined>;
  deleteCapturedProduct(id: string): Promise<boolean>;

  // Products (Saved from Supplier Lookup)
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Daily Activities (Tracking calls, messages, interactions)
  getDailyActivities(dateStart?: Date, dateEnd?: Date): Promise<DailyActivity[]>;
  getDailyActivitiesByEmployee(employeeId: string, dateStart?: Date, dateEnd?: Date): Promise<DailyActivity[]>;
  getDailyActivity(id: string): Promise<DailyActivity | undefined>;
  createDailyActivity(activity: InsertDailyActivity): Promise<DailyActivity>;
  updateDailyActivity(id: string, activity: Partial<InsertDailyActivity>): Promise<DailyActivity | undefined>;
  deleteDailyActivity(id: string): Promise<boolean>;

  // Activity Report Snapshots
  getActivityReportSnapshots(periodType: string): Promise<ActivityReportSnapshot[]>;
  getActivityReportSnapshot(id: string): Promise<ActivityReportSnapshot | undefined>;
  createActivityReportSnapshot(snapshot: InsertActivityReportSnapshot): Promise<ActivityReportSnapshot>;

  // Partner Fee Accruals
  getPartnerFeeAccruals(partnerId?: string): Promise<PartnerFeeAccrual[]>;
  getPartnerFeeAccrualsByStatus(status: string): Promise<PartnerFeeAccrual[]>;
  getPendingAccrualsForPartner(partnerId: string): Promise<PartnerFeeAccrual[]>;
  getPartnerFeeAccrual(id: string): Promise<PartnerFeeAccrual | undefined>;
  getPartnerFeeAccrualByJob(jobId: string): Promise<PartnerFeeAccrual | undefined>;
  createPartnerFeeAccrual(accrual: InsertPartnerFeeAccrual): Promise<PartnerFeeAccrual>;
  updatePartnerFeeAccrual(id: string, accrual: Partial<InsertPartnerFeeAccrual>): Promise<PartnerFeeAccrual | undefined>;
  deletePartnerFeeAccrual(id: string): Promise<boolean>;

  // Partner Invoices
  getPartnerInvoices(partnerId?: string): Promise<PartnerInvoice[]>;
  getPartnerInvoicesByStatus(status: string): Promise<PartnerInvoice[]>;
  getPartnerInvoice(id: string): Promise<PartnerInvoice | undefined>;
  createPartnerInvoice(invoice: InsertPartnerInvoice): Promise<PartnerInvoice>;
  updatePartnerInvoice(id: string, invoice: Partial<InsertPartnerInvoice>): Promise<PartnerInvoice | undefined>;
  deletePartnerInvoice(id: string): Promise<boolean>;
  getNextPartnerInvoiceNumber(): Promise<string>;

  // Partner Invoice Payments
  getPartnerInvoicePayments(invoiceId?: string): Promise<PartnerInvoicePayment[]>;
  getPartnerInvoicePaymentsByPartner(partnerId: string): Promise<PartnerInvoicePayment[]>;
  getPartnerInvoicePayment(id: string): Promise<PartnerInvoicePayment | undefined>;
  createPartnerInvoicePayment(payment: InsertPartnerInvoicePayment): Promise<PartnerInvoicePayment>;
  updatePartnerInvoicePayment(id: string, payment: Partial<InsertPartnerInvoicePayment>): Promise<PartnerInvoicePayment | undefined>;
  deletePartnerInvoicePayment(id: string): Promise<boolean>;

  // AI Conversations
  getAiConversations(): Promise<AiConversation[]>;
  createAiConversation(message: InsertAiConversation): Promise<AiConversation>;
  clearAiConversations(): Promise<boolean>;

  // Build Requests
  getBuildRequests(): Promise<BuildRequest[]>;
  getBuildRequest(id: string): Promise<BuildRequest | undefined>;
  getBuildRequestsByStatus(status: string): Promise<BuildRequest[]>;
  createBuildRequest(request: InsertBuildRequest): Promise<BuildRequest>;
  updateBuildRequest(id: string, request: Partial<InsertBuildRequest>): Promise<BuildRequest | undefined>;
  deleteBuildRequest(id: string): Promise<boolean>;
  getPendingBuildRequestsCount(): Promise<number>;

  // Job Client Payments
  getJobClientPayments(jobId: string): Promise<JobClientPayment[]>;
  getJobClientPayment(id: string): Promise<JobClientPayment | undefined>;
  createJobClientPayment(payment: InsertJobClientPayment): Promise<JobClientPayment>;
  updateJobClientPayment(id: string, payment: Partial<InsertJobClientPayment>): Promise<JobClientPayment | undefined>;
  deleteJobClientPayment(id: string): Promise<boolean>;

  // Job Fund Allocations
  getJobFundAllocations(jobId: string): Promise<JobFundAllocation[]>;
  getJobFundAllocation(id: string): Promise<JobFundAllocation | undefined>;
  getJobFundAllocationsByPartner(partnerId: string): Promise<JobFundAllocation[]>;
  createJobFundAllocation(allocation: InsertJobFundAllocation): Promise<JobFundAllocation>;
  updateJobFundAllocation(id: string, allocation: Partial<InsertJobFundAllocation>): Promise<JobFundAllocation | undefined>;
  deleteJobFundAllocation(id: string): Promise<boolean>;
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

  async getTradePartnerByAccessToken(token: string): Promise<TradePartner | undefined> {
    if (!token) return undefined;
    const access = await this.getPartnerPortalAccessByToken(token);
    if (!access || !access.isActive) return undefined;
    return this.getTradePartner(access.partnerId);
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

  async updateClientPortalAccessPassword(accessId: string, passwordHash: string): Promise<void> {
    await db.update(clientPortalAccess)
      .set({ passwordHash })
      .where(eq(clientPortalAccess.id, accessId));
  }

  async updateClientPortalAccessLastLogin(accessId: string): Promise<void> {
    await db.update(clientPortalAccess)
      .set({ lastLoginAt: new Date() })
      .where(eq(clientPortalAccess.id, accessId));
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

  async getPaymentRequest(id: string): Promise<PaymentRequest | undefined> {
    const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id));
    return request || undefined;
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

  // Job Partners (multiple partners per job)
  async getJobPartners(jobId: string): Promise<JobPartner[]> {
    return db.select().from(jobPartners).where(eq(jobPartners.jobId, jobId)).orderBy(asc(jobPartners.createdAt));
  }

  async getJobPartner(id: string): Promise<JobPartner | undefined> {
    const [partner] = await db.select().from(jobPartners).where(eq(jobPartners.id, id));
    return partner || undefined;
  }

  async createJobPartner(partner: InsertJobPartner): Promise<JobPartner> {
    const [created] = await db.insert(jobPartners).values(partner).returning();
    return created;
  }

  async updateJobPartner(id: string, partner: Partial<InsertJobPartner>): Promise<JobPartner | undefined> {
    const [updated] = await db.update(jobPartners).set(partner).where(eq(jobPartners.id, id)).returning();
    return updated || undefined;
  }

  async deleteJobPartner(id: string): Promise<boolean> {
    await db.delete(jobPartners).where(eq(jobPartners.id, id));
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

  // Change Order Methods
  async getChangeOrdersByJob(jobId: string): Promise<ChangeOrder[]> {
    return db.select().from(changeOrders).where(eq(changeOrders.jobId, jobId)).orderBy(desc(changeOrders.createdAt));
  }

  async getChangeOrder(id: string): Promise<ChangeOrder | undefined> {
    const [changeOrder] = await db.select().from(changeOrders).where(eq(changeOrders.id, id));
    return changeOrder || undefined;
  }

  async createChangeOrder(changeOrder: InsertChangeOrder): Promise<ChangeOrder> {
    const [created] = await db.insert(changeOrders).values(changeOrder).returning();
    return created;
  }

  async updateChangeOrder(id: string, changeOrder: Partial<InsertChangeOrder>): Promise<ChangeOrder | undefined> {
    const [updated] = await db.update(changeOrders).set({ ...changeOrder, updatedAt: new Date() }).where(eq(changeOrders.id, id)).returning();
    return updated || undefined;
  }

  async deleteChangeOrder(id: string): Promise<boolean> {
    await db.delete(changeOrders).where(eq(changeOrders.id, id));
    return true;
  }

  async getNextChangeOrderNumber(jobNumber: string): Promise<string> {
    const existing = await db.select().from(changeOrders)
      .where(eq(changeOrders.jobId, jobNumber));
    const count = existing.length + 1;
    return `${jobNumber}-CO-${count.toString().padStart(2, "0")}`;
  }

  // Change Order Items Methods
  async getChangeOrderItems(changeOrderId: string): Promise<ChangeOrderItem[]> {
    return db.select().from(changeOrderItems).where(eq(changeOrderItems.changeOrderId, changeOrderId)).orderBy(asc(changeOrderItems.sortOrder));
  }

  async createChangeOrderItem(item: InsertChangeOrderItem): Promise<ChangeOrderItem> {
    const [created] = await db.insert(changeOrderItems).values(item).returning();
    return created;
  }

  async updateChangeOrderItem(id: string, item: Partial<InsertChangeOrderItem>): Promise<ChangeOrderItem | undefined> {
    const [updated] = await db.update(changeOrderItems).set(item).where(eq(changeOrderItems.id, id)).returning();
    return updated || undefined;
  }

  async deleteChangeOrderItem(id: string): Promise<boolean> {
    await db.delete(changeOrderItems).where(eq(changeOrderItems.id, id));
    return true;
  }

  async deleteChangeOrderItems(changeOrderId: string): Promise<boolean> {
    await db.delete(changeOrderItems).where(eq(changeOrderItems.changeOrderId, changeOrderId));
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

  async updatePartnerPortalAccessPassword(accessId: string, passwordHash: string): Promise<void> {
    await db.update(partnerPortalAccess)
      .set({ passwordHash })
      .where(eq(partnerPortalAccess.id, accessId));
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

  async getCalendarEventsByJob(jobId: string): Promise<CalendarEvent[]> {
    return db.select()
      .from(calendarEvents)
      .where(eq(calendarEvents.jobId, jobId))
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
    
    // Get all jobs for this partner to check job-based assignments
    const partnerJobs = await db.select()
      .from(jobs)
      .where(eq(jobs.partnerId, partnerId));
    const partnerJobIds = new Set(partnerJobs.map(j => j.id));
    
    // Partner can see:
    // 1. Events directly assigned to them via partnerId (for partner/hybrid events)
    // 2. Events linked to jobs that are assigned to this partner
    return allEvents.filter(e => 
      (e.teamType === "partner" && e.partnerId === partnerId) ||
      (e.teamType === "hybrid" && e.partnerId === partnerId) ||
      (e.jobId && partnerJobIds.has(e.jobId))
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

  // SEO Google Business Locations Methods
  async getSeoGoogleBusinessLocations(): Promise<SeoGoogleBusinessLocation[]> {
    return db.select().from(seoGoogleBusinessLocations).orderBy(desc(seoGoogleBusinessLocations.isDefault));
  }

  async getSeoGoogleBusinessLocation(id: string): Promise<SeoGoogleBusinessLocation | undefined> {
    const [location] = await db.select().from(seoGoogleBusinessLocations).where(eq(seoGoogleBusinessLocations.id, id));
    return location || undefined;
  }

  async createSeoGoogleBusinessLocation(location: InsertSeoGoogleBusinessLocation): Promise<SeoGoogleBusinessLocation> {
    // If this is set as default, unset all other defaults first
    if (location.isDefault) {
      await db.update(seoGoogleBusinessLocations).set({ isDefault: false });
    }
    const [created] = await db.insert(seoGoogleBusinessLocations).values(location).returning();
    return created;
  }

  async updateSeoGoogleBusinessLocation(id: string, location: Partial<InsertSeoGoogleBusinessLocation>): Promise<SeoGoogleBusinessLocation | undefined> {
    // If this is set as default, unset all other defaults first
    if (location.isDefault) {
      await db.update(seoGoogleBusinessLocations).set({ isDefault: false });
    }
    const [updated] = await db.update(seoGoogleBusinessLocations)
      .set(location)
      .where(eq(seoGoogleBusinessLocations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSeoGoogleBusinessLocation(id: string): Promise<boolean> {
    const result = await db.delete(seoGoogleBusinessLocations).where(eq(seoGoogleBusinessLocations.id, id)).returning();
    return result.length > 0;
  }

  // SEO Media Library Methods
  async getSeoMediaLibrary(): Promise<SeoMediaLibrary[]> {
    return db.select().from(seoMediaLibrary).orderBy(desc(seoMediaLibrary.createdAt));
  }

  async getSeoMediaLibraryByCategory(category: string): Promise<SeoMediaLibrary[]> {
    return db.select().from(seoMediaLibrary).where(eq(seoMediaLibrary.category, category)).orderBy(desc(seoMediaLibrary.createdAt));
  }

  async getSeoMediaItem(id: string): Promise<SeoMediaLibrary | undefined> {
    const [item] = await db.select().from(seoMediaLibrary).where(eq(seoMediaLibrary.id, id));
    return item || undefined;
  }

  async createSeoMediaItem(media: InsertSeoMediaLibrary): Promise<SeoMediaLibrary> {
    const [created] = await db.insert(seoMediaLibrary).values(media).returning();
    return created;
  }

  async updateSeoMediaItem(id: string, media: Partial<InsertSeoMediaLibrary>): Promise<SeoMediaLibrary | undefined> {
    const [updated] = await db.update(seoMediaLibrary)
      .set(media)
      .where(eq(seoMediaLibrary.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSeoMediaItem(id: string): Promise<boolean> {
    const result = await db.delete(seoMediaLibrary).where(eq(seoMediaLibrary.id, id)).returning();
    return result.length > 0;
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

  // Portal Messages Methods
  async getPortalMessages(): Promise<PortalMessage[]> {
    return db.select().from(portalMessages).orderBy(desc(portalMessages.createdAt));
  }

  async getPortalMessage(id: string): Promise<PortalMessage | undefined> {
    const [msg] = await db.select().from(portalMessages).where(eq(portalMessages.id, id));
    return msg || undefined;
  }

  async getPortalMessagesByAudience(audienceType: string, audienceId: string): Promise<PortalMessage[]> {
    return db.select()
      .from(portalMessages)
      .where(and(
        eq(portalMessages.audienceType, audienceType),
        eq(portalMessages.audienceId, audienceId)
      ))
      .orderBy(desc(portalMessages.createdAt));
  }

  async getActivePortalMessagesForClient(contactId: string): Promise<PortalMessage[]> {
    const now = new Date();
    return db.select()
      .from(portalMessages)
      .where(and(
        eq(portalMessages.audienceType, "client"),
        eq(portalMessages.audienceId, contactId),
        eq(portalMessages.isActive, true),
        or(
          isNull(portalMessages.expiresAt),
          gte(portalMessages.expiresAt, now)
        )
      ))
      .orderBy(desc(portalMessages.createdAt));
  }

  async getActivePortalMessagesForPartner(partnerId: string): Promise<PortalMessage[]> {
    const now = new Date();
    return db.select()
      .from(portalMessages)
      .where(and(
        eq(portalMessages.audienceType, "partner"),
        eq(portalMessages.audienceId, partnerId),
        eq(portalMessages.isActive, true),
        or(
          isNull(portalMessages.expiresAt),
          gte(portalMessages.expiresAt, now)
        )
      ))
      .orderBy(desc(portalMessages.createdAt));
  }

  async createPortalMessage(message: InsertPortalMessage): Promise<PortalMessage> {
    const [created] = await db.insert(portalMessages).values(message).returning();
    return created;
  }

  async updatePortalMessage(id: string, message: Partial<InsertPortalMessage>): Promise<PortalMessage | undefined> {
    const [updated] = await db.update(portalMessages)
      .set(message)
      .where(eq(portalMessages.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePortalMessage(id: string): Promise<boolean> {
    await db.delete(portalMessages).where(eq(portalMessages.id, id));
    return true;
  }

  // Portal Message Reads Methods
  async getPortalMessageReads(messageId: string): Promise<PortalMessageRead[]> {
    return db.select()
      .from(portalMessageReads)
      .where(eq(portalMessageReads.messageId, messageId));
  }

  async markPortalMessageAsRead(messageId: string): Promise<PortalMessageRead> {
    const [created] = await db.insert(portalMessageReads).values({ messageId }).returning();
    return created;
  }

  async isPortalMessageRead(messageId: string): Promise<boolean> {
    const reads = await this.getPortalMessageReads(messageId);
    return reads.length > 0;
  }

  // Help Categories Methods
  async getHelpCategories(): Promise<HelpCategory[]> {
    return db.select().from(helpCategories).orderBy(asc(helpCategories.sortOrder));
  }

  async getHelpCategoriesByAudience(audience: string): Promise<HelpCategory[]> {
    return db.select()
      .from(helpCategories)
      .where(or(
        eq(helpCategories.audience, audience),
        eq(helpCategories.audience, "all")
      ))
      .orderBy(asc(helpCategories.sortOrder));
  }

  async getHelpCategory(id: string): Promise<HelpCategory | undefined> {
    const [category] = await db.select().from(helpCategories).where(eq(helpCategories.id, id));
    return category || undefined;
  }

  async createHelpCategory(category: InsertHelpCategory): Promise<HelpCategory> {
    const [created] = await db.insert(helpCategories).values(category).returning();
    return created;
  }

  async updateHelpCategory(id: string, category: Partial<InsertHelpCategory>): Promise<HelpCategory | undefined> {
    const [updated] = await db.update(helpCategories)
      .set(category)
      .where(eq(helpCategories.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteHelpCategory(id: string): Promise<boolean> {
    await db.delete(helpCategories).where(eq(helpCategories.id, id));
    return true;
  }

  // Help Articles Methods
  async getHelpArticles(): Promise<HelpArticle[]> {
    return db.select().from(helpArticles).orderBy(asc(helpArticles.sortOrder));
  }

  async getHelpArticlesByAudience(audience: string): Promise<HelpArticle[]> {
    return db.select()
      .from(helpArticles)
      .where(and(
        eq(helpArticles.isPublished, true),
        or(
          eq(helpArticles.audience, audience),
          eq(helpArticles.audience, "all")
        )
      ))
      .orderBy(asc(helpArticles.sortOrder));
  }

  async getHelpArticlesByCategory(categoryId: string): Promise<HelpArticle[]> {
    return db.select()
      .from(helpArticles)
      .where(eq(helpArticles.categoryId, categoryId))
      .orderBy(asc(helpArticles.sortOrder));
  }

  async getHelpArticle(id: string): Promise<HelpArticle | undefined> {
    const [article] = await db.select().from(helpArticles).where(eq(helpArticles.id, id));
    return article || undefined;
  }

  async createHelpArticle(article: InsertHelpArticle): Promise<HelpArticle> {
    const [created] = await db.insert(helpArticles).values(article).returning();
    return created;
  }

  async updateHelpArticle(id: string, article: Partial<InsertHelpArticle>): Promise<HelpArticle | undefined> {
    const [updated] = await db.update(helpArticles)
      .set({ ...article, updatedAt: new Date() })
      .where(eq(helpArticles.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteHelpArticle(id: string): Promise<boolean> {
    await db.delete(helpArticles).where(eq(helpArticles.id, id));
    return true;
  }

  // Employee Methods
  async getEmployees(): Promise<Employee[]> {
    return db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.email, email.toLowerCase()));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [created] = await db.insert(employees).values({
      ...employee,
      email: employee.email.toLowerCase()
    }).returning();
    return created;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const updateData = { ...employee, updatedAt: new Date() };
    if (employee.email) {
      updateData.email = employee.email.toLowerCase();
    }
    const [updated] = await db.update(employees).set(updateData).where(eq(employees.id, id)).returning();
    return updated || undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    await db.delete(employees).where(eq(employees.id, id));
    return true;
  }

  // Employee Credentials Methods
  async getEmployeeCredential(employeeId: string): Promise<EmployeeCredential | undefined> {
    const [credential] = await db.select().from(employeeCredentials).where(eq(employeeCredentials.employeeId, employeeId));
    return credential || undefined;
  }

  async createEmployeeCredential(credential: InsertEmployeeCredential): Promise<EmployeeCredential> {
    const [created] = await db.insert(employeeCredentials).values(credential).returning();
    return created;
  }

  async updateEmployeeCredential(employeeId: string, credential: Partial<InsertEmployeeCredential>): Promise<EmployeeCredential | undefined> {
    const [updated] = await db.update(employeeCredentials)
      .set({ ...credential, updatedAt: new Date() })
      .where(eq(employeeCredentials.employeeId, employeeId))
      .returning();
    return updated || undefined;
  }

  // Employee Sessions Methods
  async getEmployeeSession(token: string): Promise<EmployeeSession | undefined> {
    const [session] = await db.select().from(employeeSessions)
      .where(and(
        eq(employeeSessions.sessionToken, token),
        gte(employeeSessions.expiresAt, new Date())
      ));
    return session || undefined;
  }

  async createEmployeeSession(session: InsertEmployeeSession): Promise<EmployeeSession> {
    const [created] = await db.insert(employeeSessions).values(session).returning();
    return created;
  }

  async deleteEmployeeSession(token: string): Promise<boolean> {
    await db.delete(employeeSessions).where(eq(employeeSessions.sessionToken, token));
    return true;
  }

  async deleteExpiredEmployeeSessions(): Promise<void> {
    await db.delete(employeeSessions).where(lte(employeeSessions.expiresAt, new Date()));
  }

  // Time Entry Methods
  async getTimeEntries(): Promise<TimeEntry[]> {
    return db.select().from(timeEntries).orderBy(desc(timeEntries.clockIn));
  }

  async getTimeEntriesByEmployee(employeeId: string): Promise<TimeEntry[]> {
    return db.select().from(timeEntries)
      .where(eq(timeEntries.employeeId, employeeId))
      .orderBy(desc(timeEntries.clockIn));
  }

  async getTimeEntriesByDateRange(startDate: Date, endDate: Date): Promise<TimeEntry[]> {
    return db.select().from(timeEntries)
      .where(and(
        gte(timeEntries.clockIn, startDate),
        lte(timeEntries.clockIn, endDate)
      ))
      .orderBy(desc(timeEntries.clockIn));
  }

  async getTimeEntry(id: string): Promise<TimeEntry | undefined> {
    const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    return entry || undefined;
  }

  async getActiveTimeEntry(employeeId: string): Promise<TimeEntry | undefined> {
    const [entry] = await db.select().from(timeEntries)
      .where(and(
        eq(timeEntries.employeeId, employeeId),
        isNull(timeEntries.clockOut)
      ));
    return entry || undefined;
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const [created] = await db.insert(timeEntries).values(entry).returning();
    return created;
  }

  async updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const [updated] = await db.update(timeEntries)
      .set({ ...entry, updatedAt: new Date() })
      .where(eq(timeEntries.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
    return true;
  }

  // Pay Period Methods
  async getPayPeriods(): Promise<PayPeriod[]> {
    return db.select().from(payPeriods).orderBy(desc(payPeriods.periodStart));
  }

  async getPayPeriod(id: string): Promise<PayPeriod | undefined> {
    const [period] = await db.select().from(payPeriods).where(eq(payPeriods.id, id));
    return period || undefined;
  }

  async createPayPeriod(period: InsertPayPeriod): Promise<PayPeriod> {
    const [created] = await db.insert(payPeriods).values(period).returning();
    return created;
  }

  async updatePayPeriod(id: string, period: Partial<InsertPayPeriod>): Promise<PayPeriod | undefined> {
    const [updated] = await db.update(payPeriods).set(period).where(eq(payPeriods.id, id)).returning();
    return updated || undefined;
  }

  // Payroll Run Methods
  async getPayrollRunsByPeriod(periodId: string): Promise<PayrollRun[]> {
    return db.select().from(payrollRuns).where(eq(payrollRuns.payPeriodId, periodId));
  }

  async getPayrollRunsByEmployee(employeeId: string): Promise<PayrollRun[]> {
    return db.select().from(payrollRuns)
      .where(eq(payrollRuns.employeeId, employeeId))
      .orderBy(desc(payrollRuns.createdAt));
  }

  async getPayrollRun(id: string): Promise<PayrollRun | undefined> {
    const [run] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, id));
    return run || undefined;
  }

  async createPayrollRun(run: InsertPayrollRun): Promise<PayrollRun> {
    const [created] = await db.insert(payrollRuns).values(run).returning();
    return created;
  }

  async updatePayrollRun(id: string, run: Partial<InsertPayrollRun>): Promise<PayrollRun | undefined> {
    const [updated] = await db.update(payrollRuns)
      .set({ ...run, updatedAt: new Date() })
      .where(eq(payrollRuns.id, id))
      .returning();
    return updated || undefined;
  }

  // Payroll Adjustment Methods
  async getPayrollAdjustments(payrollRunId: string): Promise<PayrollAdjustment[]> {
    return db.select().from(payrollAdjustments).where(eq(payrollAdjustments.payrollRunId, payrollRunId));
  }

  async createPayrollAdjustment(adjustment: InsertPayrollAdjustment): Promise<PayrollAdjustment> {
    const [created] = await db.insert(payrollAdjustments).values(adjustment).returning();
    return created;
  }

  async deletePayrollAdjustment(id: string): Promise<boolean> {
    await db.delete(payrollAdjustments).where(eq(payrollAdjustments.id, id));
    return true;
  }

  // Employee Document Methods
  async getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    return db.select().from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, employeeId))
      .orderBy(desc(employeeDocuments.createdAt));
  }

  async getEmployeeDocument(id: string): Promise<EmployeeDocument | undefined> {
    const [doc] = await db.select().from(employeeDocuments).where(eq(employeeDocuments.id, id));
    return doc || undefined;
  }

  async createEmployeeDocument(doc: InsertEmployeeDocument): Promise<EmployeeDocument> {
    const [created] = await db.insert(employeeDocuments).values(doc).returning();
    return created;
  }

  async deleteEmployeeDocument(id: string): Promise<boolean> {
    await db.delete(employeeDocuments).where(eq(employeeDocuments.id, id));
    return true;
  }

  // Job Surveys
  async getJobSurveys(): Promise<JobSurvey[]> {
    return db.select().from(jobSurveys).orderBy(desc(jobSurveys.createdAt));
  }

  async getJobSurvey(id: string): Promise<JobSurvey | undefined> {
    const [survey] = await db.select().from(jobSurveys).where(eq(jobSurveys.id, id));
    return survey || undefined;
  }

  async getJobSurveysByJob(jobId: string): Promise<JobSurvey[]> {
    return db.select().from(jobSurveys).where(eq(jobSurveys.jobId, jobId)).orderBy(desc(jobSurveys.createdAt));
  }

  async getJobSurveysByPartner(partnerId: string): Promise<JobSurvey[]> {
    return db.select().from(jobSurveys).where(eq(jobSurveys.partnerId, partnerId)).orderBy(desc(jobSurveys.createdAt));
  }

  async getPendingSurveyAcceptances(): Promise<JobSurvey[]> {
    return db.select()
      .from(jobSurveys)
      .where(
        or(
          eq(jobSurveys.bookingStatus, "client_accepted"),
          eq(jobSurveys.bookingStatus, "client_counter")
        )
      )
      .orderBy(desc(jobSurveys.clientRespondedAt));
  }

  async createJobSurvey(survey: InsertJobSurvey): Promise<JobSurvey> {
    const [created] = await db.insert(jobSurveys).values(survey).returning();
    return created;
  }

  async updateJobSurvey(id: string, survey: Partial<InsertJobSurvey>): Promise<JobSurvey | undefined> {
    const [updated] = await db.update(jobSurveys).set({ ...survey, updatedAt: new Date() }).where(eq(jobSurveys.id, id)).returning();
    return updated || undefined;
  }

  async deleteJobSurvey(id: string): Promise<boolean> {
    await db.delete(jobSurveys).where(eq(jobSurveys.id, id));
    return true;
  }

  // Partner Quotes
  async getPartnerQuotes(): Promise<PartnerQuote[]> {
    return db.select().from(partnerQuotes).orderBy(desc(partnerQuotes.createdAt));
  }

  async getPartnerQuote(id: string): Promise<PartnerQuote | undefined> {
    const [quote] = await db.select().from(partnerQuotes).where(eq(partnerQuotes.id, id));
    return quote || undefined;
  }

  async getPartnerQuotesByJob(jobId: string): Promise<PartnerQuote[]> {
    return db.select().from(partnerQuotes).where(eq(partnerQuotes.jobId, jobId)).orderBy(desc(partnerQuotes.createdAt));
  }

  async getPartnerQuotesByPartner(partnerId: string): Promise<PartnerQuote[]> {
    return db.select().from(partnerQuotes).where(eq(partnerQuotes.partnerId, partnerId)).orderBy(desc(partnerQuotes.createdAt));
  }

  async getPendingPartnerQuotes(): Promise<PartnerQuote[]> {
    return db.select().from(partnerQuotes).where(eq(partnerQuotes.status, "submitted")).orderBy(desc(partnerQuotes.createdAt));
  }

  async createPartnerQuote(quote: InsertPartnerQuote): Promise<PartnerQuote> {
    const [created] = await db.insert(partnerQuotes).values(quote).returning();
    return created;
  }

  async updatePartnerQuote(id: string, quote: Partial<InsertPartnerQuote>): Promise<PartnerQuote | undefined> {
    const [updated] = await db.update(partnerQuotes).set({ ...quote, updatedAt: new Date() }).where(eq(partnerQuotes.id, id)).returning();
    return updated || undefined;
  }

  async deletePartnerQuote(id: string): Promise<boolean> {
    await db.delete(partnerQuotes).where(eq(partnerQuotes.id, id));
    return true;
  }

  // Partner Quote Items
  async getPartnerQuoteItems(quoteId: string): Promise<PartnerQuoteItem[]> {
    return db.select().from(partnerQuoteItems).where(eq(partnerQuoteItems.quoteId, quoteId)).orderBy(asc(partnerQuoteItems.sortOrder));
  }

  async createPartnerQuoteItem(item: InsertPartnerQuoteItem): Promise<PartnerQuoteItem> {
    const [created] = await db.insert(partnerQuoteItems).values(item).returning();
    return created;
  }

  async updatePartnerQuoteItem(id: string, item: Partial<InsertPartnerQuoteItem>): Promise<PartnerQuoteItem | undefined> {
    const [updated] = await db.update(partnerQuoteItems).set(item).where(eq(partnerQuoteItems.id, id)).returning();
    return updated || undefined;
  }

  async deletePartnerQuoteItem(id: string): Promise<boolean> {
    await db.delete(partnerQuoteItems).where(eq(partnerQuoteItems.id, id));
    return true;
  }

  async deletePartnerQuoteItemsByQuote(quoteId: string): Promise<boolean> {
    await db.delete(partnerQuoteItems).where(eq(partnerQuoteItems.quoteId, quoteId));
    return true;
  }

  // Emergency Callouts
  async getEmergencyCallouts(): Promise<EmergencyCallout[]> {
    return db.select().from(emergencyCallouts).orderBy(desc(emergencyCallouts.createdAt));
  }

  async getEmergencyCallout(id: string): Promise<EmergencyCallout | undefined> {
    const [callout] = await db.select().from(emergencyCallouts).where(eq(emergencyCallouts.id, id));
    return callout || undefined;
  }

  async getEmergencyCalloutsByJob(jobId: string): Promise<EmergencyCallout[]> {
    return db.select().from(emergencyCallouts).where(eq(emergencyCallouts.jobId, jobId)).orderBy(desc(emergencyCallouts.createdAt));
  }

  async getEmergencyCalloutByJobAndPartner(jobId: string, partnerId: string): Promise<EmergencyCallout | undefined> {
    const [callout] = await db.select().from(emergencyCallouts).where(
      and(
        eq(emergencyCallouts.jobId, jobId),
        eq(emergencyCallouts.assignedPartnerId, partnerId)
      )
    );
    return callout || undefined;
  }

  async getOpenEmergencyCallouts(): Promise<EmergencyCallout[]> {
    return db.select().from(emergencyCallouts).where(eq(emergencyCallouts.status, "open")).orderBy(desc(emergencyCallouts.createdAt));
  }

  async createEmergencyCallout(callout: InsertEmergencyCallout): Promise<EmergencyCallout> {
    const [created] = await db.insert(emergencyCallouts).values(callout).returning();
    return created;
  }

  async updateEmergencyCallout(id: string, callout: Partial<InsertEmergencyCallout>): Promise<EmergencyCallout | undefined> {
    const [updated] = await db.update(emergencyCallouts).set(callout).where(eq(emergencyCallouts.id, id)).returning();
    return updated || undefined;
  }

  // Emergency Callout Responses
  async getEmergencyCalloutResponses(calloutId: string): Promise<EmergencyCalloutResponse[]> {
    return db.select().from(emergencyCalloutResponses).where(eq(emergencyCalloutResponses.calloutId, calloutId)).orderBy(asc(emergencyCalloutResponses.proposedArrivalMinutes));
  }

  async getEmergencyCalloutResponse(id: string): Promise<EmergencyCalloutResponse | undefined> {
    const [response] = await db.select().from(emergencyCalloutResponses).where(eq(emergencyCalloutResponses.id, id));
    return response || undefined;
  }

  async getEmergencyCalloutResponsesByPartner(partnerId: string): Promise<EmergencyCalloutResponse[]> {
    return db.select().from(emergencyCalloutResponses).where(eq(emergencyCalloutResponses.partnerId, partnerId)).orderBy(desc(emergencyCalloutResponses.createdAt));
  }

  async getPendingEmergencyCalloutsByPartner(partnerId: string): Promise<EmergencyCalloutResponse[]> {
    return db.select().from(emergencyCalloutResponses).where(
      and(
        eq(emergencyCalloutResponses.partnerId, partnerId),
        eq(emergencyCalloutResponses.status, "pending")
      )
    ).orderBy(desc(emergencyCalloutResponses.createdAt));
  }

  async createEmergencyCalloutResponse(response: InsertEmergencyCalloutResponse): Promise<EmergencyCalloutResponse> {
    const [created] = await db.insert(emergencyCalloutResponses).values(response).returning();
    return created;
  }

  async updateEmergencyCalloutResponse(id: string, response: Partial<InsertEmergencyCalloutResponse>): Promise<EmergencyCalloutResponse | undefined> {
    const [updated] = await db.update(emergencyCalloutResponses).set(response).where(eq(emergencyCalloutResponses.id, id)).returning();
    return updated || undefined;
  }

  // Product Categories
  async getProductCategories(): Promise<ProductCategory[]> {
    return db.select().from(productCategories).orderBy(asc(productCategories.displayOrder), asc(productCategories.name));
  }

  async getProductCategory(id: string): Promise<ProductCategory | undefined> {
    const [category] = await db.select().from(productCategories).where(eq(productCategories.id, id));
    return category || undefined;
  }

  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const [created] = await db.insert(productCategories).values(category).returning();
    return created;
  }

  async updateProductCategory(id: string, category: Partial<InsertProductCategory>): Promise<ProductCategory | undefined> {
    const [updated] = await db.update(productCategories).set({ ...category, updatedAt: new Date() }).where(eq(productCategories.id, id)).returning();
    return updated || undefined;
  }

  async deleteProductCategory(id: string): Promise<boolean> {
    await db.delete(productCategories).where(eq(productCategories.id, id));
    return true;
  }

  // Catalog Items
  async getCatalogItems(): Promise<CatalogItem[]> {
    return db.select().from(catalogItems).orderBy(asc(catalogItems.name));
  }

  async getCatalogItemsByCategory(categoryId: string): Promise<CatalogItem[]> {
    return db.select().from(catalogItems).where(eq(catalogItems.categoryId, categoryId)).orderBy(asc(catalogItems.name));
  }

  async getCatalogItemsByType(type: string): Promise<CatalogItem[]> {
    return db.select().from(catalogItems).where(eq(catalogItems.type, type)).orderBy(asc(catalogItems.name));
  }

  async getCatalogItem(id: string): Promise<CatalogItem | undefined> {
    const [item] = await db.select().from(catalogItems).where(eq(catalogItems.id, id));
    return item || undefined;
  }

  async createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem> {
    const [created] = await db.insert(catalogItems).values(item).returning();
    return created;
  }

  async updateCatalogItem(id: string, item: Partial<InsertCatalogItem>): Promise<CatalogItem | undefined> {
    const [updated] = await db.update(catalogItems).set({ ...item, updatedAt: new Date() }).where(eq(catalogItems.id, id)).returning();
    return updated || undefined;
  }

  async deleteCatalogItem(id: string): Promise<boolean> {
    await db.delete(catalogItems).where(eq(catalogItems.id, id));
    return true;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).orderBy(asc(suppliers.name));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async getActiveSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(asc(suppliers.name));
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values(supplier).returning();
    return created;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers).set({ ...supplier, updatedAt: new Date() }).where(eq(suppliers.id, id)).returning();
    return updated || undefined;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    return true;
  }

  // Supplier Catalog Items
  async getSupplierCatalogItems(supplierId: string): Promise<SupplierCatalogItem[]> {
    return db.select().from(supplierCatalogItems).where(eq(supplierCatalogItems.supplierId, supplierId));
  }

  async getSupplierCatalogItemsByCatalogItem(catalogItemId: string): Promise<SupplierCatalogItem[]> {
    return db.select().from(supplierCatalogItems).where(eq(supplierCatalogItems.catalogItemId, catalogItemId));
  }

  async getSupplierCatalogItem(id: string): Promise<SupplierCatalogItem | undefined> {
    const [item] = await db.select().from(supplierCatalogItems).where(eq(supplierCatalogItems.id, id));
    return item || undefined;
  }

  async createSupplierCatalogItem(item: InsertSupplierCatalogItem): Promise<SupplierCatalogItem> {
    const [created] = await db.insert(supplierCatalogItems).values(item).returning();
    return created;
  }

  async updateSupplierCatalogItem(id: string, item: Partial<InsertSupplierCatalogItem>): Promise<SupplierCatalogItem | undefined> {
    const [updated] = await db.update(supplierCatalogItems).set({ ...item, updatedAt: new Date() }).where(eq(supplierCatalogItems.id, id)).returning();
    return updated || undefined;
  }

  async deleteSupplierCatalogItem(id: string): Promise<boolean> {
    await db.delete(supplierCatalogItems).where(eq(supplierCatalogItems.id, id));
    return true;
  }

  // Quote Templates
  async getQuoteTemplates(): Promise<QuoteTemplate[]> {
    return db.select().from(quoteTemplates).orderBy(asc(quoteTemplates.name));
  }

  async getQuoteTemplate(id: string): Promise<QuoteTemplate | undefined> {
    const [template] = await db.select().from(quoteTemplates).where(eq(quoteTemplates.id, id));
    return template || undefined;
  }

  async createQuoteTemplate(template: InsertQuoteTemplate): Promise<QuoteTemplate> {
    const [created] = await db.insert(quoteTemplates).values(template).returning();
    return created;
  }

  async updateQuoteTemplate(id: string, template: Partial<InsertQuoteTemplate>): Promise<QuoteTemplate | undefined> {
    const [updated] = await db.update(quoteTemplates).set({ ...template, updatedAt: new Date() }).where(eq(quoteTemplates.id, id)).returning();
    return updated || undefined;
  }

  async deleteQuoteTemplate(id: string): Promise<boolean> {
    await db.delete(quoteTemplates).where(eq(quoteTemplates.id, id));
    return true;
  }

  // Quote Template Items
  async getQuoteTemplateItems(templateId: string): Promise<QuoteTemplateItem[]> {
    return db.select().from(quoteTemplateItems).where(eq(quoteTemplateItems.templateId, templateId)).orderBy(asc(quoteTemplateItems.sortOrder));
  }

  async createQuoteTemplateItem(item: InsertQuoteTemplateItem): Promise<QuoteTemplateItem> {
    const [created] = await db.insert(quoteTemplateItems).values(item).returning();
    return created;
  }

  async updateQuoteTemplateItem(id: string, item: Partial<InsertQuoteTemplateItem>): Promise<QuoteTemplateItem | undefined> {
    const [updated] = await db.update(quoteTemplateItems).set(item).where(eq(quoteTemplateItems.id, id)).returning();
    return updated || undefined;
  }

  async deleteQuoteTemplateItem(id: string): Promise<boolean> {
    await db.delete(quoteTemplateItems).where(eq(quoteTemplateItems.id, id));
    return true;
  }

  async deleteQuoteTemplateItemsByTemplate(templateId: string): Promise<boolean> {
    await db.delete(quoteTemplateItems).where(eq(quoteTemplateItems.templateId, templateId));
    return true;
  }

  // Connection Links
  async getConnectionLinks(): Promise<ConnectionLink[]> {
    return db.select().from(connectionLinks).orderBy(desc(connectionLinks.createdAt));
  }

  async getConnectionLink(id: string): Promise<ConnectionLink | undefined> {
    const [link] = await db.select().from(connectionLinks).where(eq(connectionLinks.id, id));
    return link || undefined;
  }

  async getConnectionLinkByToken(token: string): Promise<ConnectionLink | undefined> {
    const [link] = await db.select().from(connectionLinks).where(eq(connectionLinks.token, token));
    return link || undefined;
  }

  async getConnectionLinksByJob(jobId: string): Promise<ConnectionLink[]> {
    return db.select().from(connectionLinks).where(eq(connectionLinks.jobId, jobId));
  }

  async getConnectionLinksByParty(partyType: string, partyId: string): Promise<ConnectionLink[]> {
    return db.select().from(connectionLinks).where(
      and(eq(connectionLinks.partyType, partyType), eq(connectionLinks.partyId, partyId))
    );
  }

  async createConnectionLink(link: InsertConnectionLink): Promise<ConnectionLink> {
    const [created] = await db.insert(connectionLinks).values(link).returning();
    return created;
  }

  async updateConnectionLink(id: string, link: Partial<InsertConnectionLink>): Promise<ConnectionLink | undefined> {
    const [updated] = await db.update(connectionLinks).set(link).where(eq(connectionLinks.id, id)).returning();
    return updated || undefined;
  }

  async deleteConnectionLink(id: string): Promise<boolean> {
    await db.delete(connectionLinks).where(eq(connectionLinks.id, id));
    return true;
  }

  // Assets
  async getAssets(): Promise<Asset[]> {
    return db.select().from(assets).orderBy(asc(assets.name));
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset || undefined;
  }

  async getAssetsByType(type: string): Promise<Asset[]> {
    return db.select().from(assets).where(eq(assets.type, type)).orderBy(asc(assets.name));
  }

  async getAssetsByAssignee(employeeId: string): Promise<Asset[]> {
    return db.select().from(assets).where(eq(assets.assignedToId, employeeId));
  }

  async getNextAssetNumber(type: string): Promise<string> {
    const prefix = type === 'vehicle' ? 'VAN' : type === 'tool' ? 'TOOL' : 'EQUIP';
    const allAssets = await db.select().from(assets).where(eq(assets.type, type));
    const count = allAssets.length + 1;
    return `${prefix}-${count.toString().padStart(3, '0')}`;
  }

  async createAsset(asset: InsertAsset & { assetNumber?: string }): Promise<Asset> {
    const assetNumber = asset.assetNumber || await this.getNextAssetNumber(asset.type);
    const [created] = await db.insert(assets).values({ ...asset, assetNumber }).returning();
    return created;
  }

  async updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [updated] = await db.update(assets).set({ ...asset, updatedAt: new Date() }).where(eq(assets.id, id)).returning();
    return updated || undefined;
  }

  async deleteAsset(id: string): Promise<boolean> {
    await db.delete(assets).where(eq(assets.id, id));
    return true;
  }

  // Asset Faults
  async getAssetFaults(): Promise<AssetFault[]> {
    return db.select().from(assetFaults).orderBy(desc(assetFaults.createdAt));
  }

  async getAssetFault(id: string): Promise<AssetFault | undefined> {
    const [fault] = await db.select().from(assetFaults).where(eq(assetFaults.id, id));
    return fault || undefined;
  }

  async getAssetFaultsByAsset(assetId: string): Promise<AssetFault[]> {
    return db.select().from(assetFaults).where(eq(assetFaults.assetId, assetId)).orderBy(desc(assetFaults.createdAt));
  }

  async getOpenAssetFaults(): Promise<AssetFault[]> {
    return db.select().from(assetFaults).where(
      or(eq(assetFaults.status, 'open'), eq(assetFaults.status, 'in_progress'))
    ).orderBy(desc(assetFaults.createdAt));
  }

  async createAssetFault(fault: InsertAssetFault): Promise<AssetFault> {
    const [created] = await db.insert(assetFaults).values(fault).returning();
    return created;
  }

  async updateAssetFault(id: string, fault: Partial<InsertAssetFault>): Promise<AssetFault | undefined> {
    const [updated] = await db.update(assetFaults).set({ ...fault, updatedAt: new Date() }).where(eq(assetFaults.id, id)).returning();
    return updated || undefined;
  }

  async deleteAssetFault(id: string): Promise<boolean> {
    await db.delete(assetFaults).where(eq(assetFaults.id, id));
    return true;
  }

  // Asset Reminders
  async getAssetReminders(): Promise<AssetReminder[]> {
    return db.select().from(assetReminders).orderBy(asc(assetReminders.dueDate));
  }

  async getAssetReminder(id: string): Promise<AssetReminder | undefined> {
    const [reminder] = await db.select().from(assetReminders).where(eq(assetReminders.id, id));
    return reminder || undefined;
  }

  async getAssetRemindersByAsset(assetId: string): Promise<AssetReminder[]> {
    return db.select().from(assetReminders).where(eq(assetReminders.assetId, assetId)).orderBy(asc(assetReminders.dueDate));
  }

  async getPendingAssetReminders(): Promise<AssetReminder[]> {
    return db.select().from(assetReminders).where(
      and(eq(assetReminders.notified, false), eq(assetReminders.acknowledged, false))
    ).orderBy(asc(assetReminders.dueDate));
  }

  async getUpcomingAssetReminders(daysAhead: number): Promise<AssetReminder[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return db.select().from(assetReminders).where(
      and(
        eq(assetReminders.acknowledged, false),
        lte(assetReminders.dueDate, futureDate)
      )
    ).orderBy(asc(assetReminders.dueDate));
  }

  async createAssetReminder(reminder: InsertAssetReminder): Promise<AssetReminder> {
    const [created] = await db.insert(assetReminders).values(reminder).returning();
    return created;
  }

  async updateAssetReminder(id: string, reminder: Partial<InsertAssetReminder>): Promise<AssetReminder | undefined> {
    const [updated] = await db.update(assetReminders).set(reminder).where(eq(assetReminders.id, id)).returning();
    return updated || undefined;
  }

  async deleteAssetReminder(id: string): Promise<boolean> {
    await db.delete(assetReminders).where(eq(assetReminders.id, id));
    return true;
  }

  // Checklist Templates
  async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
    return db.select().from(checklistTemplates).orderBy(asc(checklistTemplates.name));
  }

  async getChecklistTemplate(id: string): Promise<ChecklistTemplate | undefined> {
    const [template] = await db.select().from(checklistTemplates).where(eq(checklistTemplates.id, id));
    return template || undefined;
  }

  async getChecklistTemplateByCode(code: string): Promise<ChecklistTemplate | undefined> {
    const [template] = await db.select().from(checklistTemplates).where(eq(checklistTemplates.code, code));
    return template || undefined;
  }

  async createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate> {
    const [created] = await db.insert(checklistTemplates).values(template).returning();
    return created;
  }

  async updateChecklistTemplate(id: string, template: Partial<InsertChecklistTemplate>): Promise<ChecklistTemplate | undefined> {
    const [updated] = await db.update(checklistTemplates).set({ ...template, updatedAt: new Date() }).where(eq(checklistTemplates.id, id)).returning();
    return updated || undefined;
  }

  async deleteChecklistTemplate(id: string): Promise<boolean> {
    await db.delete(checklistTemplates).where(eq(checklistTemplates.id, id));
    return true;
  }

  // Checklist Items
  async getChecklistItems(templateId: string): Promise<ChecklistItem[]> {
    return db.select().from(checklistItems).where(eq(checklistItems.templateId, templateId)).orderBy(asc(checklistItems.itemOrder));
  }

  async getChecklistItem(id: string): Promise<ChecklistItem | undefined> {
    const [item] = await db.select().from(checklistItems).where(eq(checklistItems.id, id));
    return item || undefined;
  }

  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    const [created] = await db.insert(checklistItems).values(item).returning();
    return created;
  }

  async updateChecklistItem(id: string, item: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined> {
    const [updated] = await db.update(checklistItems).set(item).where(eq(checklistItems.id, id)).returning();
    return updated || undefined;
  }

  async deleteChecklistItem(id: string): Promise<boolean> {
    await db.delete(checklistItems).where(eq(checklistItems.id, id));
    return true;
  }

  async deleteChecklistItemsByTemplate(templateId: string): Promise<boolean> {
    await db.delete(checklistItems).where(eq(checklistItems.templateId, templateId));
    return true;
  }

  // Checklist Instances
  async getChecklistInstances(): Promise<ChecklistInstance[]> {
    return db.select().from(checklistInstances).orderBy(desc(checklistInstances.createdAt));
  }

  async getChecklistInstance(id: string): Promise<ChecklistInstance | undefined> {
    const [instance] = await db.select().from(checklistInstances).where(eq(checklistInstances.id, id));
    return instance || undefined;
  }

  async getChecklistInstancesByTarget(targetType: string, targetId: string): Promise<ChecklistInstance[]> {
    return db.select().from(checklistInstances).where(
      and(eq(checklistInstances.targetType, targetType), eq(checklistInstances.targetId, targetId))
    ).orderBy(desc(checklistInstances.createdAt));
  }

  async getChecklistInstancesByStatus(status: string): Promise<ChecklistInstance[]> {
    return db.select().from(checklistInstances).where(eq(checklistInstances.status, status)).orderBy(desc(checklistInstances.createdAt));
  }

  async getPendingChecklistInstancesForJob(jobId: string): Promise<ChecklistInstance[]> {
    return db.select().from(checklistInstances).where(
      and(
        eq(checklistInstances.targetType, 'job'),
        eq(checklistInstances.targetId, jobId),
        or(eq(checklistInstances.status, 'pending'), eq(checklistInstances.status, 'in_progress'))
      )
    ).orderBy(desc(checklistInstances.createdAt));
  }

  async createChecklistInstance(instance: InsertChecklistInstance): Promise<ChecklistInstance> {
    const [created] = await db.insert(checklistInstances).values(instance).returning();
    return created;
  }

  async updateChecklistInstance(id: string, instance: Partial<InsertChecklistInstance>): Promise<ChecklistInstance | undefined> {
    const [updated] = await db.update(checklistInstances).set({ ...instance, updatedAt: new Date() }).where(eq(checklistInstances.id, id)).returning();
    return updated || undefined;
  }

  async deleteChecklistInstance(id: string): Promise<boolean> {
    await db.delete(checklistInstances).where(eq(checklistInstances.id, id));
    return true;
  }

  // Checklist Responses
  async getChecklistResponses(instanceId: string): Promise<ChecklistResponse[]> {
    return db.select().from(checklistResponses).where(eq(checklistResponses.instanceId, instanceId));
  }

  async getChecklistResponse(id: string): Promise<ChecklistResponse | undefined> {
    const [response] = await db.select().from(checklistResponses).where(eq(checklistResponses.id, id));
    return response || undefined;
  }

  async createChecklistResponse(response: InsertChecklistResponse): Promise<ChecklistResponse> {
    const [created] = await db.insert(checklistResponses).values(response).returning();
    return created;
  }

  async updateChecklistResponse(id: string, response: Partial<InsertChecklistResponse>): Promise<ChecklistResponse | undefined> {
    const [updated] = await db.update(checklistResponses).set({ ...response, updatedAt: new Date() }).where(eq(checklistResponses.id, id)).returning();
    return updated || undefined;
  }

  async upsertChecklistResponse(response: InsertChecklistResponse): Promise<ChecklistResponse> {
    // Check if response exists for this instance/item combo
    const [existing] = await db.select().from(checklistResponses).where(
      and(eq(checklistResponses.instanceId, response.instanceId), eq(checklistResponses.itemId, response.itemId))
    );
    if (existing) {
      const [updated] = await db.update(checklistResponses).set({ ...response, updatedAt: new Date() }).where(eq(checklistResponses.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(checklistResponses).values(response).returning();
    return created;
  }

  // Checklist Audit Events
  async getChecklistAuditEvents(instanceId: string): Promise<ChecklistAuditEvent[]> {
    return db.select().from(checklistAuditEvents).where(eq(checklistAuditEvents.instanceId, instanceId)).orderBy(desc(checklistAuditEvents.createdAt));
  }

  async createChecklistAuditEvent(event: InsertChecklistAuditEvent): Promise<ChecklistAuditEvent> {
    const [created] = await db.insert(checklistAuditEvents).values(event).returning();
    return created;
  }

  // Owner Wellbeing Settings
  async getOwnerWellbeingSettings(employeeId: string): Promise<OwnerWellbeingSettings | undefined> {
    const [settings] = await db.select().from(ownerWellbeingSettings).where(eq(ownerWellbeingSettings.employeeId, employeeId));
    return settings || undefined;
  }

  async upsertOwnerWellbeingSettings(settings: InsertOwnerWellbeingSettings): Promise<OwnerWellbeingSettings> {
    const existing = await this.getOwnerWellbeingSettings(settings.employeeId);
    if (existing) {
      const [updated] = await db.update(ownerWellbeingSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(ownerWellbeingSettings.employeeId, settings.employeeId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(ownerWellbeingSettings).values(settings).returning();
    return created;
  }

  // Personal Tasks
  async getPersonalTasks(employeeId: string): Promise<PersonalTask[]> {
    return db.select().from(personalTasks)
      .where(eq(personalTasks.employeeId, employeeId))
      .orderBy(asc(personalTasks.sortOrder), desc(personalTasks.createdAt));
  }

  async getPersonalTasksByDate(employeeId: string, date: Date): Promise<PersonalTask[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return db.select().from(personalTasks)
      .where(and(
        eq(personalTasks.employeeId, employeeId),
        gte(personalTasks.dueDate, startOfDay),
        lte(personalTasks.dueDate, endOfDay)
      ))
      .orderBy(asc(personalTasks.sortOrder));
  }

  async getMorningTasks(employeeId: string): Promise<PersonalTask[]> {
    return db.select().from(personalTasks)
      .where(and(
        eq(personalTasks.employeeId, employeeId),
        eq(personalTasks.isMorningTask, true),
        eq(personalTasks.isCompleted, false)
      ))
      .orderBy(asc(personalTasks.sortOrder));
  }

  async getUpcomingPersonalTasks(employeeId: string, daysAhead: number): Promise<PersonalTask[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return db.select().from(personalTasks)
      .where(and(
        eq(personalTasks.employeeId, employeeId),
        gte(personalTasks.dueDate, today),
        lte(personalTasks.dueDate, futureDate)
      ))
      .orderBy(asc(personalTasks.dueDate));
  }

  async getPersonalTask(id: string): Promise<PersonalTask | undefined> {
    const [task] = await db.select().from(personalTasks).where(eq(personalTasks.id, id));
    return task || undefined;
  }

  async createPersonalTask(task: InsertPersonalTask): Promise<PersonalTask> {
    const [created] = await db.insert(personalTasks).values(task).returning();
    return created;
  }

  async updatePersonalTask(id: string, task: Partial<InsertPersonalTask>): Promise<PersonalTask | undefined> {
    const [updated] = await db.update(personalTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(personalTasks.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePersonalTask(id: string): Promise<boolean> {
    await db.delete(personalTasks).where(eq(personalTasks.id, id));
    return true;
  }

  // Daily Focus Tasks
  async getDailyFocusTasks(employeeId: string, date: Date): Promise<DailyFocusTask[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return db.select().from(dailyFocusTasks)
      .where(and(
        eq(dailyFocusTasks.employeeId, employeeId),
        gte(dailyFocusTasks.focusDate, startOfDay),
        lte(dailyFocusTasks.focusDate, endOfDay)
      ))
      .orderBy(asc(dailyFocusTasks.priority));
  }

  async getDailyFocusTask(id: string): Promise<DailyFocusTask | undefined> {
    const [task] = await db.select().from(dailyFocusTasks).where(eq(dailyFocusTasks.id, id));
    return task || undefined;
  }

  async createDailyFocusTask(task: InsertDailyFocusTask): Promise<DailyFocusTask> {
    const [created] = await db.insert(dailyFocusTasks).values(task).returning();
    return created;
  }

  async updateDailyFocusTask(id: string, task: Partial<InsertDailyFocusTask>): Promise<DailyFocusTask | undefined> {
    const [updated] = await db.update(dailyFocusTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(dailyFocusTasks.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDailyFocusTask(id: string): Promise<boolean> {
    await db.delete(dailyFocusTasks).where(eq(dailyFocusTasks.id, id));
    return true;
  }

  async clearDailyFocusTasks(employeeId: string, date: Date): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    await db.delete(dailyFocusTasks).where(and(
      eq(dailyFocusTasks.employeeId, employeeId),
      gte(dailyFocusTasks.focusDate, startOfDay),
      lte(dailyFocusTasks.focusDate, endOfDay)
    ));
    return true;
  }

  // Wellbeing Nudge Logs
  async getWellbeingNudgeLogs(employeeId: string, type: string): Promise<WellbeingNudgeLog[]> {
    return db.select().from(wellbeingNudgeLogs)
      .where(and(
        eq(wellbeingNudgeLogs.employeeId, employeeId),
        eq(wellbeingNudgeLogs.nudgeType, type)
      ))
      .orderBy(desc(wellbeingNudgeLogs.createdAt));
  }

  async getLatestNudgeLog(employeeId: string, type: string): Promise<WellbeingNudgeLog | undefined> {
    const [log] = await db.select().from(wellbeingNudgeLogs)
      .where(and(
        eq(wellbeingNudgeLogs.employeeId, employeeId),
        eq(wellbeingNudgeLogs.nudgeType, type)
      ))
      .orderBy(desc(wellbeingNudgeLogs.createdAt))
      .limit(1);
    return log || undefined;
  }

  async createWellbeingNudgeLog(log: InsertWellbeingNudgeLog): Promise<WellbeingNudgeLog> {
    const [created] = await db.insert(wellbeingNudgeLogs).values(log).returning();
    return created;
  }

  // Internal Messages (Direct Messages)
  async getInternalMessages(employeeId: string): Promise<InternalMessage[]> {
    return db.select().from(internalMessages)
      .where(or(
        eq(internalMessages.senderId, employeeId),
        eq(internalMessages.recipientId, employeeId)
      ))
      .orderBy(desc(internalMessages.createdAt));
  }

  async getConversation(employeeId: string, otherEmployeeId: string): Promise<InternalMessage[]> {
    return db.select().from(internalMessages)
      .where(or(
        and(
          eq(internalMessages.senderId, employeeId),
          eq(internalMessages.recipientId, otherEmployeeId)
        ),
        and(
          eq(internalMessages.senderId, otherEmployeeId),
          eq(internalMessages.recipientId, employeeId)
        )
      ))
      .orderBy(asc(internalMessages.createdAt));
  }

  async getUnreadMessageCount(employeeId: string): Promise<number> {
    const messages = await db.select().from(internalMessages)
      .where(and(
        eq(internalMessages.recipientId, employeeId),
        eq(internalMessages.isRead, false)
      ));
    return messages.length;
  }

  async createInternalMessage(message: InsertInternalMessage): Promise<InternalMessage> {
    const [created] = await db.insert(internalMessages).values(message).returning();
    return created;
  }

  async markMessagesAsRead(employeeId: string, otherEmployeeId: string): Promise<void> {
    await db.update(internalMessages)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(internalMessages.recipientId, employeeId),
        eq(internalMessages.senderId, otherEmployeeId),
        eq(internalMessages.isRead, false)
      ));
  }

  // Job Chat Messages
  async getJobChatMessages(jobId: string): Promise<JobChatMessage[]> {
    return db.select().from(jobChatMessages)
      .where(eq(jobChatMessages.jobId, jobId))
      .orderBy(asc(jobChatMessages.createdAt));
  }

  async getJobChatMessage(id: string): Promise<JobChatMessage | undefined> {
    const [message] = await db.select().from(jobChatMessages)
      .where(eq(jobChatMessages.id, id));
    return message || undefined;
  }

  async createJobChatMessage(message: InsertJobChatMessage): Promise<JobChatMessage> {
    const [created] = await db.insert(jobChatMessages).values(message).returning();
    return created;
  }

  async updateJobChatMessage(id: string, message: Partial<InsertJobChatMessage>): Promise<JobChatMessage | undefined> {
    const [updated] = await db.update(jobChatMessages)
      .set({ ...message, updatedAt: new Date() })
      .where(eq(jobChatMessages.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteJobChatMessage(id: string): Promise<boolean> {
    await db.delete(jobChatMessages).where(eq(jobChatMessages.id, id));
    return true;
  }

  async markJobChatAsRead(messageId: string, employeeId: string): Promise<void> {
    const existing = await db.select().from(jobChatMessageReads)
      .where(and(
        eq(jobChatMessageReads.messageId, messageId),
        eq(jobChatMessageReads.employeeId, employeeId)
      ));
    if (existing.length === 0) {
      await db.insert(jobChatMessageReads).values({ messageId, employeeId });
    }
  }

  async getUnreadJobChatCount(employeeId: string): Promise<number> {
    // Get all job chat messages not read by this employee
    const allMessages = await db.select().from(jobChatMessages);
    const reads = await db.select().from(jobChatMessageReads)
      .where(eq(jobChatMessageReads.employeeId, employeeId));
    const readMessageIds = new Set(reads.map(r => r.messageId));
    return allMessages.filter(m => !readMessageIds.has(m.id) && m.employeeId !== employeeId).length;
  }

  // Team Activity Log
  async getTeamActivityLog(limit: number): Promise<TeamActivityLog[]> {
    return db.select().from(teamActivityLog)
      .orderBy(desc(teamActivityLog.createdAt))
      .limit(limit);
  }

  async getTeamActivityLogByEmployee(employeeId: string, limit: number): Promise<TeamActivityLog[]> {
    return db.select().from(teamActivityLog)
      .where(eq(teamActivityLog.employeeId, employeeId))
      .orderBy(desc(teamActivityLog.createdAt))
      .limit(limit);
  }

  async createTeamActivityLog(activity: InsertTeamActivityLog): Promise<TeamActivityLog> {
    const [created] = await db.insert(teamActivityLog).values(activity).returning();
    return created;
  }

  // Captured Products (Supplier Product Finder)
  async getCapturedProducts(employeeId?: string): Promise<CapturedProduct[]> {
    if (employeeId) {
      return db.select().from(capturedProducts)
        .where(eq(capturedProducts.capturedBy, employeeId))
        .orderBy(desc(capturedProducts.capturedAt));
    }
    return db.select().from(capturedProducts).orderBy(desc(capturedProducts.capturedAt));
  }

  async getCapturedProductsByJob(jobId: string): Promise<CapturedProduct[]> {
    return db.select().from(capturedProducts)
      .where(eq(capturedProducts.jobId, jobId))
      .orderBy(desc(capturedProducts.capturedAt));
  }

  async getCapturedProductsByStatus(status: string): Promise<CapturedProduct[]> {
    return db.select().from(capturedProducts)
      .where(eq(capturedProducts.status, status))
      .orderBy(desc(capturedProducts.capturedAt));
  }

  async getCapturedProduct(id: string): Promise<CapturedProduct | undefined> {
    const [product] = await db.select().from(capturedProducts).where(eq(capturedProducts.id, id));
    return product || undefined;
  }

  async createCapturedProduct(product: InsertCapturedProduct): Promise<CapturedProduct> {
    const [created] = await db.insert(capturedProducts).values(product).returning();
    return created;
  }

  async updateCapturedProduct(id: string, product: Partial<InsertCapturedProduct>): Promise<CapturedProduct | undefined> {
    const [updated] = await db.update(capturedProducts)
      .set(product)
      .where(eq(capturedProducts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCapturedProduct(id: string): Promise<boolean> {
    await db.delete(capturedProducts).where(eq(capturedProducts.id, id));
    return true;
  }

  // Products (Saved from Supplier Lookup)
  async getProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  // Daily Activities (Tracking calls, messages, interactions)
  async getDailyActivities(dateStart?: Date, dateEnd?: Date): Promise<DailyActivity[]> {
    let query = db.select().from(dailyActivities);
    if (dateStart && dateEnd) {
      query = query.where(
        and(
          gte(dailyActivities.activityDate, dateStart),
          lte(dailyActivities.activityDate, dateEnd)
        )
      ) as any;
    }
    return query.orderBy(desc(dailyActivities.activityDate)) as any;
  }

  async getDailyActivitiesByEmployee(employeeId: string, dateStart?: Date, dateEnd?: Date): Promise<DailyActivity[]> {
    let conditions = [eq(dailyActivities.employeeId, employeeId)];
    if (dateStart && dateEnd) {
      conditions.push(gte(dailyActivities.activityDate, dateStart));
      conditions.push(lte(dailyActivities.activityDate, dateEnd));
    }
    return db.select().from(dailyActivities)
      .where(and(...conditions))
      .orderBy(desc(dailyActivities.activityDate));
  }

  async getDailyActivity(id: string): Promise<DailyActivity | undefined> {
    const [activity] = await db.select().from(dailyActivities).where(eq(dailyActivities.id, id));
    return activity || undefined;
  }

  async createDailyActivity(activity: InsertDailyActivity): Promise<DailyActivity> {
    const [created] = await db.insert(dailyActivities).values(activity).returning();
    return created;
  }

  async updateDailyActivity(id: string, activity: Partial<InsertDailyActivity>): Promise<DailyActivity | undefined> {
    const [updated] = await db.update(dailyActivities)
      .set(activity)
      .where(eq(dailyActivities.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDailyActivity(id: string): Promise<boolean> {
    await db.delete(dailyActivities).where(eq(dailyActivities.id, id));
    return true;
  }

  // Activity Report Snapshots
  async getActivityReportSnapshots(periodType: string): Promise<ActivityReportSnapshot[]> {
    return db.select().from(activityReportSnapshots)
      .where(eq(activityReportSnapshots.periodType, periodType))
      .orderBy(desc(activityReportSnapshots.periodStart));
  }

  async getActivityReportSnapshot(id: string): Promise<ActivityReportSnapshot | undefined> {
    const [snapshot] = await db.select().from(activityReportSnapshots).where(eq(activityReportSnapshots.id, id));
    return snapshot || undefined;
  }

  async createActivityReportSnapshot(snapshot: InsertActivityReportSnapshot): Promise<ActivityReportSnapshot> {
    const [created] = await db.insert(activityReportSnapshots).values(snapshot).returning();
    return created;
  }

  // Partner Fee Accruals
  async getPartnerFeeAccruals(partnerId?: string): Promise<PartnerFeeAccrual[]> {
    if (partnerId) {
      return db.select().from(partnerFeeAccruals)
        .where(eq(partnerFeeAccruals.partnerId, partnerId))
        .orderBy(desc(partnerFeeAccruals.accrualDate));
    }
    return db.select().from(partnerFeeAccruals).orderBy(desc(partnerFeeAccruals.accrualDate));
  }

  async getPartnerFeeAccrualsByStatus(status: string): Promise<PartnerFeeAccrual[]> {
    return db.select().from(partnerFeeAccruals)
      .where(eq(partnerFeeAccruals.status, status))
      .orderBy(desc(partnerFeeAccruals.accrualDate));
  }

  async getPendingAccrualsForPartner(partnerId: string): Promise<PartnerFeeAccrual[]> {
    return db.select().from(partnerFeeAccruals)
      .where(and(
        eq(partnerFeeAccruals.partnerId, partnerId),
        eq(partnerFeeAccruals.status, "pending")
      ))
      .orderBy(desc(partnerFeeAccruals.accrualDate));
  }

  async getPartnerFeeAccrual(id: string): Promise<PartnerFeeAccrual | undefined> {
    const [accrual] = await db.select().from(partnerFeeAccruals).where(eq(partnerFeeAccruals.id, id));
    return accrual || undefined;
  }

  async getPartnerFeeAccrualByJob(jobId: string): Promise<PartnerFeeAccrual | undefined> {
    const [accrual] = await db.select().from(partnerFeeAccruals).where(eq(partnerFeeAccruals.jobId, jobId));
    return accrual || undefined;
  }

  async createPartnerFeeAccrual(accrual: InsertPartnerFeeAccrual): Promise<PartnerFeeAccrual> {
    const [created] = await db.insert(partnerFeeAccruals).values(accrual).returning();
    return created;
  }

  async updatePartnerFeeAccrual(id: string, accrual: Partial<InsertPartnerFeeAccrual>): Promise<PartnerFeeAccrual | undefined> {
    const [updated] = await db.update(partnerFeeAccruals)
      .set(accrual)
      .where(eq(partnerFeeAccruals.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePartnerFeeAccrual(id: string): Promise<boolean> {
    await db.delete(partnerFeeAccruals).where(eq(partnerFeeAccruals.id, id));
    return true;
  }

  // Partner Invoices
  async getPartnerInvoices(partnerId?: string): Promise<PartnerInvoice[]> {
    if (partnerId) {
      return db.select().from(partnerInvoices)
        .where(eq(partnerInvoices.partnerId, partnerId))
        .orderBy(desc(partnerInvoices.createdAt));
    }
    return db.select().from(partnerInvoices).orderBy(desc(partnerInvoices.createdAt));
  }

  async getPartnerInvoicesByStatus(status: string): Promise<PartnerInvoice[]> {
    return db.select().from(partnerInvoices)
      .where(eq(partnerInvoices.status, status))
      .orderBy(desc(partnerInvoices.createdAt));
  }

  async getPartnerInvoice(id: string): Promise<PartnerInvoice | undefined> {
    const [invoice] = await db.select().from(partnerInvoices).where(eq(partnerInvoices.id, id));
    return invoice || undefined;
  }

  async createPartnerInvoice(invoice: InsertPartnerInvoice): Promise<PartnerInvoice> {
    const [created] = await db.insert(partnerInvoices).values(invoice).returning();
    return created;
  }

  async updatePartnerInvoice(id: string, invoice: Partial<InsertPartnerInvoice>): Promise<PartnerInvoice | undefined> {
    const [updated] = await db.update(partnerInvoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(partnerInvoices.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePartnerInvoice(id: string): Promise<boolean> {
    await db.delete(partnerInvoices).where(eq(partnerInvoices.id, id));
    return true;
  }

  async getNextPartnerInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const allInvoices = await db.select().from(partnerInvoices);
    const yearInvoices = allInvoices.filter(inv => 
      inv.invoiceNumber?.startsWith(`PI-${year}`)
    );
    const nextNumber = yearInvoices.length + 1;
    return `PI-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  // Partner Invoice Payments
  async getPartnerInvoicePayments(invoiceId?: string): Promise<PartnerInvoicePayment[]> {
    if (invoiceId) {
      return db.select().from(partnerInvoicePayments)
        .where(eq(partnerInvoicePayments.invoiceId, invoiceId))
        .orderBy(desc(partnerInvoicePayments.paymentDate));
    }
    return db.select().from(partnerInvoicePayments).orderBy(desc(partnerInvoicePayments.paymentDate));
  }

  async getPartnerInvoicePaymentsByPartner(partnerId: string): Promise<PartnerInvoicePayment[]> {
    return db.select().from(partnerInvoicePayments)
      .where(eq(partnerInvoicePayments.partnerId, partnerId))
      .orderBy(desc(partnerInvoicePayments.paymentDate));
  }

  async getPartnerInvoicePayment(id: string): Promise<PartnerInvoicePayment | undefined> {
    const [payment] = await db.select().from(partnerInvoicePayments).where(eq(partnerInvoicePayments.id, id));
    return payment || undefined;
  }

  async createPartnerInvoicePayment(payment: InsertPartnerInvoicePayment): Promise<PartnerInvoicePayment> {
    const [created] = await db.insert(partnerInvoicePayments).values(payment).returning();
    return created;
  }

  async updatePartnerInvoicePayment(id: string, payment: Partial<InsertPartnerInvoicePayment>): Promise<PartnerInvoicePayment | undefined> {
    const [updated] = await db.update(partnerInvoicePayments)
      .set(payment)
      .where(eq(partnerInvoicePayments.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePartnerInvoicePayment(id: string): Promise<boolean> {
    await db.delete(partnerInvoicePayments).where(eq(partnerInvoicePayments.id, id));
    return true;
  }

  // AI Conversations
  async getAiConversations(): Promise<AiConversation[]> {
    return db.select().from(aiConversations).orderBy(asc(aiConversations.createdAt));
  }

  async createAiConversation(message: InsertAiConversation): Promise<AiConversation> {
    const [created] = await db.insert(aiConversations).values(message).returning();
    return created;
  }

  async clearAiConversations(): Promise<boolean> {
    await db.delete(aiConversations);
    return true;
  }

  // Build Requests
  async getBuildRequests(): Promise<BuildRequest[]> {
    return db.select().from(buildRequests).orderBy(desc(buildRequests.createdAt));
  }

  async getBuildRequest(id: string): Promise<BuildRequest | undefined> {
    const [request] = await db.select().from(buildRequests).where(eq(buildRequests.id, id));
    return request || undefined;
  }

  async getBuildRequestsByStatus(status: string): Promise<BuildRequest[]> {
    return db.select().from(buildRequests)
      .where(eq(buildRequests.status, status))
      .orderBy(desc(buildRequests.createdAt));
  }

  async createBuildRequest(request: InsertBuildRequest): Promise<BuildRequest> {
    const [created] = await db.insert(buildRequests).values(request).returning();
    return created;
  }

  async updateBuildRequest(id: string, request: Partial<InsertBuildRequest>): Promise<BuildRequest | undefined> {
    const [updated] = await db.update(buildRequests)
      .set(request)
      .where(eq(buildRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBuildRequest(id: string): Promise<boolean> {
    await db.delete(buildRequests).where(eq(buildRequests.id, id));
    return true;
  }

  async getPendingBuildRequestsCount(): Promise<number> {
    const result = await db.select().from(buildRequests).where(eq(buildRequests.status, "pending"));
    return result.length;
  }

  // Job Client Payments
  async getJobClientPayments(jobId: string): Promise<JobClientPayment[]> {
    return db.select().from(jobClientPayments)
      .where(eq(jobClientPayments.jobId, jobId))
      .orderBy(desc(jobClientPayments.receivedAt));
  }

  async getJobClientPayment(id: string): Promise<JobClientPayment | undefined> {
    const [payment] = await db.select().from(jobClientPayments).where(eq(jobClientPayments.id, id));
    return payment || undefined;
  }

  async createJobClientPayment(payment: InsertJobClientPayment): Promise<JobClientPayment> {
    const [created] = await db.insert(jobClientPayments).values(payment).returning();
    return created;
  }

  async updateJobClientPayment(id: string, payment: Partial<InsertJobClientPayment>): Promise<JobClientPayment | undefined> {
    const [updated] = await db.update(jobClientPayments)
      .set(payment)
      .where(eq(jobClientPayments.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteJobClientPayment(id: string): Promise<boolean> {
    await db.delete(jobClientPayments).where(eq(jobClientPayments.id, id));
    return true;
  }

  // Job Fund Allocations
  async getJobFundAllocations(jobId: string): Promise<JobFundAllocation[]> {
    return db.select().from(jobFundAllocations)
      .where(eq(jobFundAllocations.jobId, jobId))
      .orderBy(desc(jobFundAllocations.createdAt));
  }

  async getJobFundAllocation(id: string): Promise<JobFundAllocation | undefined> {
    const [allocation] = await db.select().from(jobFundAllocations).where(eq(jobFundAllocations.id, id));
    return allocation || undefined;
  }

  async getJobFundAllocationsByPartner(partnerId: string): Promise<JobFundAllocation[]> {
    return db.select().from(jobFundAllocations)
      .where(eq(jobFundAllocations.partnerId, partnerId))
      .orderBy(desc(jobFundAllocations.createdAt));
  }

  async createJobFundAllocation(allocation: InsertJobFundAllocation): Promise<JobFundAllocation> {
    const [created] = await db.insert(jobFundAllocations).values(allocation).returning();
    return created;
  }

  async updateJobFundAllocation(id: string, allocation: Partial<InsertJobFundAllocation>): Promise<JobFundAllocation | undefined> {
    const [updated] = await db.update(jobFundAllocations)
      .set(allocation)
      .where(eq(jobFundAllocations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteJobFundAllocation(id: string): Promise<boolean> {
    await db.delete(jobFundAllocations).where(eq(jobFundAllocations.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
