import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { insertContactSchema, insertTradePartnerSchema, insertJobSchema, insertTaskSchema, insertPaymentRequestSchema, insertCompanySettingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup authentication (BEFORE other routes)
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Dashboard
  app.get("/api/dashboard", async (req, res) => {
    try {
      const [jobs, contacts, partners, tasks] = await Promise.all([
        storage.getJobs(),
        storage.getContacts(),
        storage.getTradePartners(),
        storage.getTasks(),
      ]);
      res.json({ jobs, contacts, partners, tasks });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });

  // Contacts
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Get contacts error:", error);
      res.status(500).json({ message: "Failed to load contacts" });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Get contact error:", error);
      res.status(500).json({ message: "Failed to load contact" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(data);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create contact error:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const data = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(req.params.id, data);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update contact error:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      await storage.deleteContact(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete contact error:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Trade Partners
  app.get("/api/partners", async (req, res) => {
    try {
      const partners = await storage.getTradePartners();
      res.json(partners);
    } catch (error) {
      console.error("Get partners error:", error);
      res.status(500).json({ message: "Failed to load partners" });
    }
  });

  app.get("/api/partners/:id", async (req, res) => {
    try {
      const partner = await storage.getTradePartner(req.params.id);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      res.json(partner);
    } catch (error) {
      console.error("Get partner error:", error);
      res.status(500).json({ message: "Failed to load partner" });
    }
  });

  app.post("/api/partners", async (req, res) => {
    try {
      const data = insertTradePartnerSchema.parse(req.body);
      const partner = await storage.createTradePartner(data);
      res.status(201).json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create partner error:", error);
      res.status(500).json({ message: "Failed to create partner" });
    }
  });

  app.patch("/api/partners/:id", async (req, res) => {
    try {
      const data = insertTradePartnerSchema.partial().parse(req.body);
      const partner = await storage.updateTradePartner(req.params.id, data);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      res.json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update partner error:", error);
      res.status(500).json({ message: "Failed to update partner" });
    }
  });

  app.delete("/api/partners/:id", async (req, res) => {
    try {
      await storage.deleteTradePartner(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete partner error:", error);
      res.status(500).json({ message: "Failed to delete partner" });
    }
  });

  // Jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const [jobs, contacts, partners] = await Promise.all([
        storage.getJobs(),
        storage.getContacts(),
        storage.getTradePartners(),
      ]);
      res.json({ jobs, contacts, partners });
    } catch (error) {
      console.error("Get jobs error:", error);
      res.status(500).json({ message: "Failed to load jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const [contact, partner, allTasks, contacts, partners] = await Promise.all([
        storage.getContact(job.contactId),
        job.partnerId ? storage.getTradePartner(job.partnerId) : Promise.resolve(undefined),
        storage.getTasks(),
        storage.getContacts(),
        storage.getTradePartners(),
      ]);
      
      const tasks = allTasks.filter(t => t.jobId === job.id);
      
      res.json({ job, contact, partner, tasks, contacts, partners });
    } catch (error) {
      console.error("Get job error:", error);
      res.status(500).json({ message: "Failed to load job" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const data = insertJobSchema.parse(req.body);
      const job = await storage.createJob(data);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create job error:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const data = insertJobSchema.partial().parse(req.body);
      const job = await storage.updateJob(req.params.id, data);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update job error:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      await storage.deleteJob(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete job error:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const [tasks, jobs] = await Promise.all([
        storage.getTasks(),
        storage.getJobs(),
      ]);
      res.json({ tasks, jobs });
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ message: "Failed to load tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Get task error:", error);
      res.status(500).json({ message: "Failed to load task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const data = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(data);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create task error:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const data = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, data);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update task error:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // ==================== QUOTE ITEMS ====================

  app.get("/api/jobs/:jobId/quote-items", async (req, res) => {
    try {
      const items = await storage.getQuoteItemsByJob(req.params.jobId);
      res.json(items);
    } catch (error) {
      console.error("Get quote items error:", error);
      res.status(500).json({ message: "Failed to fetch quote items" });
    }
  });

  app.post("/api/jobs/:jobId/quote-items", async (req, res) => {
    try {
      const item = await storage.createQuoteItem({
        ...req.body,
        jobId: req.params.jobId,
      });
      res.status(201).json(item);
    } catch (error) {
      console.error("Create quote item error:", error);
      res.status(500).json({ message: "Failed to create quote item" });
    }
  });

  app.patch("/api/quote-items/:id", async (req, res) => {
    try {
      const item = await storage.updateQuoteItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ message: "Quote item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Update quote item error:", error);
      res.status(500).json({ message: "Failed to update quote item" });
    }
  });

  app.delete("/api/quote-items/:id", async (req, res) => {
    try {
      await storage.deleteQuoteItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete quote item error:", error);
      res.status(500).json({ message: "Failed to delete quote item" });
    }
  });

  // Bulk update quote items (replace all items for a job)
  app.put("/api/jobs/:jobId/quote-items", async (req, res) => {
    try {
      const { items } = req.body;
      // Delete existing items
      await storage.deleteQuoteItemsByJob(req.params.jobId);
      // Create new items
      const createdItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = await storage.createQuoteItem({
          ...items[i],
          jobId: req.params.jobId,
          sortOrder: i,
        });
        createdItems.push(item);
      }
      res.json(createdItems);
    } catch (error) {
      console.error("Bulk update quote items error:", error);
      res.status(500).json({ message: "Failed to update quote items" });
    }
  });

  // ==================== CLIENT PORTAL ADMIN ENDPOINTS ====================

  // Client Invites
  app.post("/api/contacts/:contactId/invite", async (req, res) => {
    try {
      const { contactId } = req.params;
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      if (!contact.email) {
        return res.status(400).json({ message: "Contact must have an email address" });
      }
      
      const invite = await storage.createClientInvite({
        contactId,
        email: contact.email,
        inviteToken: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      
      res.status(201).json(invite);
    } catch (error) {
      console.error("Create invite error:", error);
      res.status(500).json({ message: "Failed to create invite" });
    }
  });

  app.get("/api/contacts/:contactId/portal-access", async (req, res) => {
    try {
      const access = await storage.getClientPortalAccess(req.params.contactId);
      res.json(access);
    } catch (error) {
      console.error("Get portal access error:", error);
      res.status(500).json({ message: "Failed to get portal access" });
    }
  });

  // Payment Requests
  app.get("/api/jobs/:jobId/payment-requests", async (req, res) => {
    try {
      const requests = await storage.getPaymentRequestsByJob(req.params.jobId);
      res.json(requests);
    } catch (error) {
      console.error("Get payment requests error:", error);
      res.status(500).json({ message: "Failed to load payment requests" });
    }
  });

  app.post("/api/jobs/:jobId/payment-requests", async (req, res) => {
    try {
      const data = insertPaymentRequestSchema.parse({
        ...req.body,
        jobId: req.params.jobId,
      });
      const request = await storage.createPaymentRequest(data);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create payment request error:", error);
      res.status(500).json({ message: "Failed to create payment request" });
    }
  });

  app.patch("/api/payment-requests/:id", async (req, res) => {
    try {
      const data = insertPaymentRequestSchema.partial().parse(req.body);
      const request = await storage.updatePaymentRequest(req.params.id, data);
      if (!request) {
        return res.status(404).json({ message: "Payment request not found" });
      }
      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update payment request error:", error);
      res.status(500).json({ message: "Failed to update payment request" });
    }
  });

  app.delete("/api/payment-requests/:id", async (req, res) => {
    try {
      await storage.deletePaymentRequest(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete payment request error:", error);
      res.status(500).json({ message: "Failed to delete payment request" });
    }
  });

  // Company Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Failed to load settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const data = insertCompanySettingSchema.parse(req.body);
      const setting = await storage.upsertCompanySetting(data);
      res.status(201).json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Save setting error:", error);
      res.status(500).json({ message: "Failed to save setting" });
    }
  });

  // Review Requests
  app.post("/api/jobs/:jobId/review-request", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      const request = await storage.createReviewRequest({
        jobId: req.params.jobId,
        contactId: job.contactId,
      });
      res.status(201).json(request);
    } catch (error) {
      console.error("Create review request error:", error);
      res.status(500).json({ message: "Failed to create review request" });
    }
  });

  // ==================== CLIENT PORTAL PUBLIC ENDPOINTS ====================

  // Accept invite and create portal access
  app.get("/api/portal/invite/:token", async (req, res) => {
    try {
      const invite = await storage.getClientInviteByToken(req.params.token);
      if (!invite) {
        return res.status(404).json({ message: "Invite not found or expired" });
      }
      if (invite.expiresAt < new Date()) {
        return res.status(410).json({ message: "Invite has expired" });
      }
      if (invite.acceptedAt) {
        return res.status(410).json({ message: "Invite already used" });
      }
      
      const contact = await storage.getContact(invite.contactId);
      res.json({ invite, contact });
    } catch (error) {
      console.error("Get invite error:", error);
      res.status(500).json({ message: "Failed to load invite" });
    }
  });

  app.post("/api/portal/invite/:token/accept", async (req, res) => {
    try {
      const invite = await storage.getClientInviteByToken(req.params.token);
      if (!invite || invite.expiresAt < new Date() || invite.acceptedAt) {
        return res.status(400).json({ message: "Invalid or expired invite" });
      }
      
      // Mark invite as accepted
      await storage.acceptClientInvite(req.params.token);
      
      // Create portal access
      const accessToken = crypto.randomUUID();
      const access = await storage.createClientPortalAccess({
        contactId: invite.contactId,
        accessToken,
        tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
      });
      
      res.json({ access, token: accessToken });
    } catch (error) {
      console.error("Accept invite error:", error);
      res.status(500).json({ message: "Failed to accept invite" });
    }
  });

  // Portal data endpoints (requires portal token)
  app.get("/api/portal/jobs", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const access = await storage.getClientPortalAccessByToken(token);
      if (!access || !access.isActive || (access.tokenExpiry && access.tokenExpiry < new Date())) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const jobs = await storage.getJobsByContact(access.contactId);
      res.json(jobs);
    } catch (error) {
      console.error("Portal jobs error:", error);
      res.status(500).json({ message: "Failed to load jobs" });
    }
  });

  app.get("/api/portal/jobs/:jobId", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const access = await storage.getClientPortalAccessByToken(token);
      if (!access || !access.isActive) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const job = await storage.getJob(req.params.jobId);
      if (!job || job.contactId !== access.contactId) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const paymentRequests = await storage.getPaymentRequestsByJob(req.params.jobId);
      const quoteItems = await storage.getQuoteItemsByJob(req.params.jobId);
      res.json({ ...job, paymentRequests, quoteItems });
    } catch (error) {
      console.error("Portal job detail error:", error);
      res.status(500).json({ message: "Failed to load job" });
    }
  });

  app.get("/api/portal/profile", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const access = await storage.getClientPortalAccessByToken(token);
      if (!access || !access.isActive) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const contact = await storage.getContact(access.contactId);
      res.json(contact);
    } catch (error) {
      console.error("Portal profile error:", error);
      res.status(500).json({ message: "Failed to load profile" });
    }
  });

  app.patch("/api/portal/profile", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const access = await storage.getClientPortalAccessByToken(token);
      if (!access || !access.isActive) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { name, email, phone, address, postcode } = req.body;
      const contact = await storage.updateContact(access.contactId, {
        name, email, phone, address, postcode
      });
      res.json(contact);
    } catch (error) {
      console.error("Portal profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/portal/review-links", async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      const reviewLinks = {
        facebook: settings.find(s => s.settingKey === "facebook_review_url")?.settingValue || "",
        google: settings.find(s => s.settingKey === "google_review_url")?.settingValue || "",
        trustpilot: settings.find(s => s.settingKey === "trustpilot_review_url")?.settingValue || "",
      };
      res.json(reviewLinks);
    } catch (error) {
      console.error("Get review links error:", error);
      res.status(500).json({ message: "Failed to load review links" });
    }
  });

  return httpServer;
}
