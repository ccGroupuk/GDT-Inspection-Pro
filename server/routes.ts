import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { insertContactSchema, insertTradePartnerSchema, insertJobSchema, insertTaskSchema, insertPaymentRequestSchema, insertCompanySettingSchema, insertInvoiceSchema, insertJobNoteSchema, insertFinancialCategorySchema, insertFinancialTransactionSchema, insertCalendarEventSchema, insertPartnerAvailabilitySchema, insertJobScheduleProposalSchema, insertSeoBusinessProfileSchema, insertSeoBrandVoiceSchema, insertSeoWeeklyFocusSchema, insertSeoJobMediaSchema, insertSeoContentPostSchema, insertEmployeeSchema, insertTimeEntrySchema, insertPayPeriodSchema, insertPayrollRunSchema, insertPayrollAdjustmentSchema, insertEmployeeDocumentSchema, type Employee } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Simple in-memory rate limiter for login endpoints
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts || now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  
  attempts.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(loginAttempts.entries());
  for (const [ip, attempts] of entries) {
    if (now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
      loginAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup authentication (BEFORE other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  // Helper to get employee from session cookie
  const getEmployeeFromCookie = async (req: Request): Promise<Employee | null> => {
    const sessionToken = req.cookies?.employeeSession;
    if (!sessionToken) return null;
    
    try {
      const session = await storage.getEmployeeSession(sessionToken);
      if (session && new Date(session.expiresAt) > new Date()) {
        const employee = await storage.getEmployee(session.employeeId);
        if (employee && employee.isActive) {
          return employee;
        }
      }
    } catch (error) {
      console.error("Employee cookie auth error:", error);
    }
    return null;
  };

  // Combined admin auth middleware - allows authorized Replit Auth OR employee with owner/full_access
  const isAdminAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    // First check Replit Auth - must be linked to employee or whitelisted
    const user = req.user as any;
    if (req.isAuthenticated() && user?.expires_at && user?.claims) {
      const now = Math.floor(Date.now() / 1000);
      if (now <= user.expires_at) {
        const replitEmail = user.claims.email;
        const replitUserId = user.claims.sub;
        
        // Check if Replit user has linked employee record
        if (replitEmail) {
          const linkedEmployee = await storage.getEmployeeByEmail(replitEmail);
          if (linkedEmployee && linkedEmployee.isActive && 
              (linkedEmployee.accessLevel === "owner" || linkedEmployee.accessLevel === "full_access")) {
            (req as any).employee = linkedEmployee;
            return next();
          }
        }
        
        // Check whitelist
        const adminWhitelist = process.env.REPLIT_ADMIN_USER_IDS?.split(",").map(id => id.trim()) || [];
        if (adminWhitelist.includes(replitUserId)) {
          return next();
        }
      }
    }
    
    // Then check employee cookie auth
    const employee = await getEmployeeFromCookie(req);
    if (employee && (employee.accessLevel === "owner" || employee.accessLevel === "full_access")) {
      (req as any).employee = employee;
      return next();
    }
    
    // Fallback: check Bearer token for backward compatibility
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const session = await storage.getEmployeeSession(token);
        if (session && new Date(session.expiresAt) > new Date()) {
          const emp = await storage.getEmployee(session.employeeId);
          if (emp && emp.isActive && 
              (emp.accessLevel === "owner" || emp.accessLevel === "full_access")) {
            (req as any).employee = emp;
            return next();
          }
        }
      } catch (error) {
        console.error("Employee token auth error:", error);
      }
    }
    
    res.status(401).json({ message: "Unauthorized" });
  };

  // ==================== UNIFIED AUTH ENDPOINTS ====================
  
  // Public routes that don't require authentication
  // Note: req.path inside app.use("/api", ...) is the path AFTER /api
  const publicRoutes = [
    "/auth/me",
    "/auth/logout",
    "/login",
    "/logout",
    "/callback",
    "/employee/login",
    "/employee/logout",
    "/portal/login",
    "/portal/logout",
    "/portal/auth/me",
    "/partner-portal/login",
    "/partner-portal/logout",
    "/partner-portal/auth/me",
    "/employee/auth/me",
  ];

  // Global admin route protection middleware
  app.use("/api", async (req, res, next) => {
    // Skip auth for public routes
    const isPublicRoute = publicRoutes.some(route => req.path === route || req.path.startsWith(route + "/"));
    if (isPublicRoute) {
      return next();
    }

    // Skip auth for portal routes (they have their own auth)
    if (req.path.startsWith("/portal/") || req.path.startsWith("/partner-portal/")) {
      return next();
    }

    // Check Replit Auth first - verify user is authorized for this app
    const user = req.user as any;
    if (req.isAuthenticated() && user?.expires_at && user?.claims) {
      const now = Math.floor(Date.now() / 1000);
      if (now <= user.expires_at) {
        // Verify Replit user is authorized (must have matching employee record OR be in whitelist)
        const replitEmail = user.claims.email;
        const replitUserId = user.claims.sub;
        
        // Check if there's an employee with matching email (linking Replit account to employee)
        if (replitEmail) {
          const linkedEmployee = await storage.getEmployeeByEmail(replitEmail);
          if (linkedEmployee && linkedEmployee.isActive && 
              (linkedEmployee.accessLevel === "owner" || linkedEmployee.accessLevel === "full_access")) {
            (req as any).employee = linkedEmployee;
            return next();
          }
        }
        
        // Check whitelist in environment (comma-separated Replit user IDs)
        const adminWhitelist = process.env.REPLIT_ADMIN_USER_IDS?.split(",").map(id => id.trim()) || [];
        if (adminWhitelist.includes(replitUserId)) {
          return next();
        }
        
        // Replit user not authorized for this app
        console.log(`Unauthorized Replit user attempt: ${replitEmail} (${replitUserId})`);
      }
    }

    // Check employee cookie auth
    const employee = await getEmployeeFromCookie(req);
    if (employee && (employee.accessLevel === "owner" || employee.accessLevel === "full_access")) {
      (req as any).employee = employee;
      return next();
    }

    // Not authenticated
    res.status(401).json({ message: "Unauthorized" });
  });
  
  // Check authentication status (supports both Replit OAuth and employee sessions)
  // Also verifies authorization for admin access
  app.get("/api/auth/me", async (req, res) => {
    try {
      // Check Replit Auth first - but verify authorization too
      const user = req.user as any;
      if (req.isAuthenticated() && user?.expires_at && user?.claims) {
        const now = Math.floor(Date.now() / 1000);
        if (now <= user.expires_at) {
          const replitEmail = user.claims.email;
          const replitUserId = user.claims.sub;
          
          // Check if Replit user has linked employee record
          let linkedEmployee = null;
          let isAuthorized = false;
          
          if (replitEmail) {
            linkedEmployee = await storage.getEmployeeByEmail(replitEmail);
            if (linkedEmployee && linkedEmployee.isActive && 
                (linkedEmployee.accessLevel === "owner" || linkedEmployee.accessLevel === "full_access")) {
              isAuthorized = true;
            }
          }
          
          // Check whitelist
          const adminWhitelist = process.env.REPLIT_ADMIN_USER_IDS?.split(",").map(id => id.trim()) || [];
          if (adminWhitelist.includes(replitUserId)) {
            isAuthorized = true;
          }
          
          if (isAuthorized) {
            return res.json({
              authType: "replit",
              user: {
                id: replitUserId,
                email: replitEmail,
                firstName: user.claims.first_name,
                lastName: user.claims.last_name,
                profileImageUrl: user.claims.profile_image_url,
              },
              employee: linkedEmployee ? {
                id: linkedEmployee.id,
                firstName: linkedEmployee.firstName,
                lastName: linkedEmployee.lastName,
                email: linkedEmployee.email,
                accessLevel: linkedEmployee.accessLevel,
                isActive: linkedEmployee.isActive,
              } : null,
            });
          }
          
          // Replit user authenticated but not authorized
          return res.status(403).json({ 
            message: "Access denied. Your account is not authorized for this application.",
            authenticated: true,
            authorized: false 
          });
        }
      }
      
      // Check employee session cookie
      const employee = await getEmployeeFromCookie(req);
      if (employee) {
        return res.json({
          authType: "employee",
          user: null,
          employee: {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            accessLevel: employee.accessLevel,
            isActive: employee.isActive,
          },
        });
      }
      
      res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Auth check failed" });
    }
  });

  // Unified logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    try {
      // Clear employee session cookie if present
      const sessionToken = req.cookies?.employeeSession;
      if (sessionToken) {
        await storage.deleteEmployeeSession(sessionToken);
        res.clearCookie("employeeSession", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      }
      
      // If using Replit Auth, log them out too
      if (req.isAuthenticated()) {
        req.logout(() => {});
      }
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });
  
  // Dashboard
  app.get("/api/dashboard", async (req, res) => {
    try {
      const [jobs, contacts, partners, tasks, scheduleResponses] = await Promise.all([
        storage.getJobs(),
        storage.getContacts(),
        storage.getTradePartners(),
        storage.getTasks(),
        storage.getPendingScheduleResponses(),
      ]);
      res.json({ jobs, contacts, partners, tasks, scheduleResponses });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });

  // Global Search
  app.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.q as string || "").trim().toLowerCase();
      if (!query || query.length < 2) {
        return res.json({ contacts: [], jobs: [], partners: [] });
      }

      const [contacts, jobs, partners] = await Promise.all([
        storage.getContacts(),
        storage.getJobs(),
        storage.getTradePartners(),
      ]);

      const matchedContacts = contacts.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query) ||
        c.postcode?.toLowerCase().includes(query)
      ).slice(0, 5);

      // Create contact lookup for enriching jobs
      const contactMap = new Map(contacts.map(c => [c.id, c]));

      const matchedJobs = jobs.filter(j => {
        const contact = contactMap.get(j.contactId);
        return j.jobNumber?.toLowerCase().includes(query) ||
          j.serviceType?.toLowerCase().includes(query) ||
          j.description?.toLowerCase().includes(query) ||
          j.jobPostcode?.toLowerCase().includes(query) ||
          j.jobAddress?.toLowerCase().includes(query) ||
          contact?.name.toLowerCase().includes(query);
      }).slice(0, 5).map(j => ({
        ...j,
        contact: contactMap.get(j.contactId),
      }));

      const matchedPartners = partners.filter(p => 
        p.businessName.toLowerCase().includes(query) ||
        p.contactName?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.tradeCategory?.toLowerCase().includes(query)
      ).slice(0, 5);

      res.json({
        contacts: matchedContacts,
        jobs: matchedJobs,
        partners: matchedPartners,
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
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
      
      // Get current job to check if status is changing to "paid"
      const currentJob = await storage.getJob(req.params.id);
      if (!currentJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const job = await storage.updateJob(req.params.id, data);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Auto-create finance transaction when job moves to "paid" status
      if (data.status === "paid" && currentJob.status !== "paid" && job.quotedValue != null) {
        try {
          // Find income category
          const incomeCategory = await storage.getFinancialCategoryByName("Client Payments");
          
          // Get contact info for description
          const contact = currentJob.contactId 
            ? await storage.getContact(currentJob.contactId) 
            : null;
          
          const grossAmount = parseFloat(job.quotedValue);
          let cccMargin = grossAmount;
          let partnerEarnings = 0;
          
          // Calculate CCC margin vs partner earnings for partner jobs
          if (job.deliveryType === "partner" && job.partnerId && job.partnerCharge) {
            const partnerCharge = parseFloat(job.partnerCharge);
            if (job.partnerChargeType === "percentage") {
              // CCC keeps the percentage as their margin
              cccMargin = Math.min(grossAmount, Math.max(0, grossAmount * (partnerCharge / 100)));
            } else {
              // Fixed amount is CCC's margin
              cccMargin = Math.min(grossAmount, Math.max(0, partnerCharge));
            }
            partnerEarnings = grossAmount - cccMargin;
          }
          
          // Create income transaction for CCC's actual profit (margin only for partner jobs)
          await storage.createFinancialTransaction({
            date: new Date(),
            type: "income",
            categoryId: incomeCategory?.id,
            amount: cccMargin.toFixed(2),
            description: job.deliveryType === "partner" 
              ? `CCC Margin for ${job.jobNumber}${contact ? ` - ${contact.name}` : ""} (${job.partnerChargeType === "percentage" ? job.partnerCharge + "%" : "£" + job.partnerCharge} of £${grossAmount.toFixed(2)})`
              : `Payment received for ${job.jobNumber}${contact ? ` - ${contact.name}` : ""}`,
            jobId: job.id,
            partnerId: job.deliveryType === "partner" ? job.partnerId : undefined,
            invoiceId: undefined,
            sourceType: "job_payment",
            grossAmount: grossAmount.toFixed(2),
            profitAmount: cccMargin.toFixed(2),
          });
          console.log(`Auto-created income transaction for job ${job.jobNumber} - CCC Margin: £${cccMargin.toFixed(2)}`);
        } catch (financeError) {
          // Log but don't fail the job update if finance transaction fails
          console.error("Failed to auto-create finance transaction:", financeError);
        }
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

  // ==================== INVOICES ====================

  // Get all invoices for a job
  app.get("/api/jobs/:jobId/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByJob(req.params.jobId);
      res.json(invoices);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get a single invoice with line items
  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      const lineItems = await storage.getInvoiceLineItems(req.params.id);
      res.json({ invoice, lineItems });
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Create an invoice (snapshot current quote items and totals)
  app.post("/api/jobs/:jobId/invoices", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { type, notes, dueDate, paymentTerms } = req.body;
      
      // Get job and quote items
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const quoteItems = await storage.getQuoteItemsByJob(jobId);
      
      // Calculate totals
      const subtotal = quoteItems.reduce((sum, item) => sum + parseFloat(item.lineTotal || "0"), 0);
      
      let discountAmount = 0;
      if (job.discountType && job.discountValue) {
        if (job.discountType === "percentage") {
          discountAmount = subtotal * (parseFloat(job.discountValue) / 100);
        } else {
          discountAmount = parseFloat(job.discountValue) || 0;
        }
      }
      
      const afterDiscount = subtotal - discountAmount;
      
      let taxAmount = 0;
      if (job.taxEnabled && job.taxRate) {
        taxAmount = afterDiscount * (parseFloat(job.taxRate) / 100);
      }
      
      const grandTotal = afterDiscount + taxAmount;
      
      // Calculate deposit if applicable
      let depositCalculated = null;
      if (job.depositRequired && job.depositAmount) {
        if (job.depositType === "percentage") {
          depositCalculated = String(grandTotal * (parseFloat(job.depositAmount) / 100));
        } else {
          depositCalculated = job.depositAmount;
        }
      }
      
      // Normalize type and generate reference number (count by type to ensure uniqueness)
      const normalizedType = type === "invoice" ? "invoice" : "quote";
      const existingInvoices = await storage.getInvoicesByJob(jobId);
      const prefix = normalizedType === "invoice" ? "INV" : "QTE";
      const sameTypeCount = existingInvoices.filter(inv => inv.type === normalizedType).length + 1;
      const referenceNumber = `${job.jobNumber}-${prefix}-${String(sameTypeCount).padStart(2, "0")}`;
      
      // Create invoice
      const invoice = await storage.createInvoice({
        jobId,
        referenceNumber,
        type: normalizedType,
        status: "draft",
        subtotal: String(subtotal),
        discountType: job.discountType,
        discountValue: job.discountValue,
        discountAmount: String(discountAmount),
        taxEnabled: job.taxEnabled || false,
        taxRate: job.taxRate,
        taxAmount: String(taxAmount),
        grandTotal: String(grandTotal),
        depositRequired: job.depositRequired || false,
        depositType: job.depositType,
        depositAmount: job.depositAmount,
        depositCalculated,
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentTerms,
        notes,
        showInPortal: false,
      });
      
      // Copy quote items to invoice line items
      for (let i = 0; i < quoteItems.length; i++) {
        const item = quoteItems[i];
        await storage.createInvoiceLineItem({
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          sortOrder: i,
        });
      }
      
      const lineItems = await storage.getInvoiceLineItems(invoice.id);
      res.status(201).json({ invoice, lineItems });
    } catch (error) {
      console.error("Create invoice error:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Send an invoice (make it visible in portal)
  app.post("/api/invoices/:id/send", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const updated = await storage.updateInvoice(req.params.id, {
        status: "sent",
        showInPortal: true,
        sentAt: new Date(),
      });
      
      // Update job status based on invoice type
      const job = await storage.getJob(invoice.jobId);
      if (job) {
        const newStatus = invoice.type === "invoice" ? "invoice_sent" : "quote_sent";
        await storage.updateJob(invoice.jobId, { status: newStatus });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Send invoice error:", error);
      res.status(500).json({ message: "Failed to send invoice" });
    }
  });

  // Update invoice status (e.g., mark as paid)
  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.updateInvoice(req.params.id, req.body);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Update invoice error:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Delete an invoice
  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete invoice error:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
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
      const { contactId } = req.params;
      const access = await storage.getClientPortalAccess(contactId);
      const invite = await storage.getClientInviteByContact(contactId);
      
      // Priority 1: Active portal access (client has accepted invite)
      if (access && access.isActive) {
        res.json({
          ...access,
          inviteStatus: "accepted",
          portalToken: access.accessToken,
        });
      // Priority 2: Pending invite (not yet accepted)
      } else if (invite) {
        res.json({
          id: null,
          contactId,
          isActive: false,
          inviteStatus: "pending",
          portalToken: invite.inviteToken,
          accessToken: null,
          createdAt: invite.createdAt,
          inviteSentAt: invite.createdAt,
          inviteExpiresAt: invite.expiresAt,
        });
      // Priority 3: No active access or pending invite
      } else {
        res.json(access || null);
      }
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
      const allInvoices = await storage.getInvoicesByJob(req.params.jobId);
      const invoices = allInvoices.filter(inv => inv.showInPortal);
      res.json({ ...job, paymentRequests, quoteItems, invoices });
    } catch (error) {
      console.error("Portal job detail error:", error);
      res.status(500).json({ message: "Failed to load job" });
    }
  });

  // Client portal: Respond to quote (accept/decline)
  app.post("/api/portal/jobs/:jobId/quote-response", async (req, res) => {
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
      
      const { response } = req.body;
      if (!['accepted', 'declined'].includes(response)) {
        return res.status(400).json({ message: "Invalid response. Must be 'accepted' or 'declined'" });
      }
      
      // Prevent re-submission if already responded
      if (job.quoteResponse) {
        return res.status(400).json({ 
          message: "Quote has already been responded to",
          currentResponse: job.quoteResponse 
        });
      }
      
      // Only allow response when quote has been sent
      if (job.status !== 'quote_sent') {
        return res.status(400).json({ message: "Quote is not available for response" });
      }
      
      // Update job with quote response and optionally update status
      const updateData: any = {
        quoteResponse: response,
        quoteRespondedAt: new Date(),
      };
      
      // If accepted, move to "Quote Accepted" stage
      if (response === 'accepted') {
        updateData.status = 'quote_accepted';
      }
      
      const updatedJob = await storage.updateJob(req.params.jobId, updateData);
      res.json(updatedJob);
    } catch (error) {
      console.error("Portal quote response error:", error);
      res.status(500).json({ message: "Failed to submit quote response" });
    }
  });

  // Client portal auth check endpoint
  app.get("/api/portal/auth/me", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const access = await storage.getClientPortalAccessByToken(token);
      if (!access || !access.isActive || (access.tokenExpiry && access.tokenExpiry < new Date())) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const contact = await storage.getContact(access.contactId);
      res.json({ authenticated: true, contact });
    } catch (error) {
      console.error("Portal auth check error:", error);
      res.status(500).json({ message: "Auth check failed" });
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

  // Client Portal: Get payment details for invoices
  app.get("/api/portal/payment-details", async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      const paymentDetails = {
        bankName: settings.find(s => s.settingKey === "payment_bank_name")?.settingValue || "",
        accountName: settings.find(s => s.settingKey === "payment_account_name")?.settingValue || "",
        sortCode: settings.find(s => s.settingKey === "payment_sort_code")?.settingValue || "",
        accountNumber: settings.find(s => s.settingKey === "payment_account_number")?.settingValue || "",
        paymentMethods: settings.find(s => s.settingKey === "payment_methods")?.settingValue || "",
        paymentNotes: settings.find(s => s.settingKey === "payment_notes")?.settingValue || "",
      };
      res.json(paymentDetails);
    } catch (error) {
      console.error("Get payment details error:", error);
      res.status(500).json({ message: "Failed to load payment details" });
    }
  });

  // ==================== PARTNER PORTAL ADMIN ENDPOINTS ====================

  // Send partner portal invite
  app.post("/api/partners/:id/send-portal-invite", async (req, res) => {
    try {
      const partner = await storage.getTradePartner(req.params.id);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      if (!partner.email) {
        return res.status(400).json({ message: "Partner has no email address" });
      }

      const inviteToken = crypto.randomUUID();
      const invite = await storage.createPartnerInvite({
        partnerId: req.params.id,
        inviteToken,
        email: partner.email,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      const inviteLink = `/partner-portal/invite/${inviteToken}`;
      const fullInviteUrl = `${req.protocol}://${req.get('host')}${inviteLink}`;
      
      // Send email with invite link
      const { sendPartnerPortalAccess } = await import('./email');
      const emailResult = await sendPartnerPortalAccess(
        partner.email,
        partner.contactName || partner.businessName,
        fullInviteUrl,
        inviteToken
      );
      
      if (emailResult.success) {
        console.log(`[email] Partner invite sent to ${partner.email}`);
        res.status(201).json({ 
          invite, 
          inviteLink,
          emailSent: true,
          message: "Invite sent successfully" 
        });
      } else {
        console.warn(`[email] Failed to send partner invite: ${emailResult.error}`);
        res.status(201).json({ 
          invite, 
          inviteLink,
          emailSent: false,
          emailError: emailResult.error,
          message: "Invite created but email could not be sent" 
        });
      }
    } catch (error) {
      console.error("Send partner portal invite error:", error);
      res.status(500).json({ message: "Failed to send invite" });
    }
  });

  // Get partner portal access status
  app.get("/api/partners/:partnerId/portal-access", async (req, res) => {
    try {
      const { partnerId } = req.params;
      const access = await storage.getPartnerPortalAccess(partnerId);
      const invite = await storage.getPartnerInviteByPartner(partnerId);
      
      // Priority 1: Active portal access (partner has accepted invite)
      // Note: We use a separate portalToken for admin to open portal directly
      // This is the accessToken that allows authentication
      if (access && access.isActive) {
        res.json({
          id: access.id,
          partnerId,
          isActive: true,
          inviteStatus: "accepted",
          portalToken: access.accessToken, // This is safe - admin needs to open portal for partner
          createdAt: access.createdAt,
        });
      // Priority 2: Pending invite (not yet accepted)
      } else if (invite) {
        res.json({
          id: null,
          partnerId,
          isActive: false,
          inviteStatus: "pending",
          portalToken: invite.inviteToken, // Invite token for pending invites
          createdAt: invite.createdAt,
          inviteSentAt: invite.createdAt,
          inviteExpiresAt: invite.expiresAt,
        });
      // Priority 3: No active access or pending invite
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Get partner portal access error:", error);
      res.status(500).json({ message: "Failed to get portal access" });
    }
  });

  // ==================== PARTNER PORTAL PUBLIC ENDPOINTS ====================

  // Get invite details
  app.get("/api/partner-portal/invite/:token", async (req, res) => {
    try {
      const invite = await storage.getPartnerInviteByToken(req.params.token);
      if (!invite) {
        return res.status(404).json({ message: "Invite not found or expired" });
      }
      if (invite.expiresAt < new Date()) {
        return res.status(410).json({ message: "Invite has expired" });
      }
      if (invite.acceptedAt) {
        return res.status(410).json({ message: "Invite already used" });
      }
      
      const partner = await storage.getTradePartner(invite.partnerId);
      res.json({ invite, partner });
    } catch (error) {
      console.error("Get partner invite error:", error);
      res.status(500).json({ message: "Failed to load invite" });
    }
  });

  // Accept invite and create portal access
  app.post("/api/partner-portal/invite/:token/accept", async (req, res) => {
    try {
      const invite = await storage.getPartnerInviteByToken(req.params.token);
      if (!invite || invite.expiresAt < new Date() || invite.acceptedAt) {
        return res.status(400).json({ message: "Invalid or expired invite" });
      }
      
      // Mark invite as accepted
      await storage.acceptPartnerInvite(req.params.token);
      
      // Create portal access
      const accessToken = crypto.randomUUID();
      const access = await storage.createPartnerPortalAccess({
        partnerId: invite.partnerId,
        accessToken,
        tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
      });
      
      res.json({ access, token: accessToken });
    } catch (error) {
      console.error("Accept partner invite error:", error);
      res.status(500).json({ message: "Failed to accept invite" });
    }
  });

  // Get partner's jobs
  app.get("/api/partner-portal/jobs", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const access = await storage.getPartnerPortalAccessByToken(token);
      if (!access || !access.isActive || (access.tokenExpiry && access.tokenExpiry < new Date())) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Update last login
      await storage.updatePartnerPortalAccessLastLogin(access.partnerId);
      
      const jobs = await storage.getJobsByPartner(access.partnerId);
      
      // Include contact info for each job
      const jobsWithContacts = await Promise.all(
        jobs.map(async (job) => {
          const contact = await storage.getContact(job.contactId);
          return { ...job, contact };
        })
      );
      
      res.json(jobsWithContacts);
    } catch (error) {
      console.error("Partner portal jobs error:", error);
      res.status(500).json({ message: "Failed to load jobs" });
    }
  });

  // Get partner job details
  app.get("/api/partner-portal/jobs/:jobId", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const access = await storage.getPartnerPortalAccessByToken(token);
      if (!access || !access.isActive) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const job = await storage.getJob(req.params.jobId);
      if (!job || job.partnerId !== access.partnerId) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const contact = await storage.getContact(job.contactId);
      const tasks = (await storage.getTasks()).filter(t => t.jobId === job.id);
      
      res.json({ ...job, contact, tasks });
    } catch (error) {
      console.error("Partner portal job detail error:", error);
      res.status(500).json({ message: "Failed to load job" });
    }
  });

  // Partner portal auth check endpoint
  app.get("/api/partner-portal/auth/me", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const access = await storage.getPartnerPortalAccessByToken(token);
      if (!access || !access.isActive || (access.tokenExpiry && access.tokenExpiry < new Date())) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const partner = await storage.getTradePartner(access.partnerId);
      res.json({ authenticated: true, partner });
    } catch (error) {
      console.error("Partner portal auth check error:", error);
      res.status(500).json({ message: "Auth check failed" });
    }
  });

  // Get partner profile
  app.get("/api/partner-portal/profile", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const access = await storage.getPartnerPortalAccessByToken(token);
      if (!access || !access.isActive) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const partner = await storage.getTradePartner(access.partnerId);
      res.json(partner);
    } catch (error) {
      console.error("Partner portal profile error:", error);
      res.status(500).json({ message: "Failed to load profile" });
    }
  });

  // ==================== JOB NOTES API ====================

  // Get job notes (admin)
  app.get("/api/jobs/:jobId/notes", async (req, res) => {
    try {
      const notes = await storage.getJobNotes(req.params.jobId);
      // Get attachments for each note
      const notesWithAttachments = await Promise.all(
        notes.map(async (note) => {
          const attachments = await storage.getJobNoteAttachments(note.id);
          return { ...note, attachments };
        })
      );
      res.json(notesWithAttachments);
    } catch (error) {
      console.error("Get job notes error:", error);
      res.status(500).json({ message: "Failed to load notes" });
    }
  });

  // Create job note
  app.post("/api/jobs/:jobId/notes", async (req, res) => {
    try {
      const data = insertJobNoteSchema.parse({
        ...req.body,
        jobId: req.params.jobId,
      });
      const note = await storage.createJobNote(data);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create job note error:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  // Update job note
  app.patch("/api/jobs/:jobId/notes/:noteId", async (req, res) => {
    try {
      const data = insertJobNoteSchema.partial().parse(req.body);
      const note = await storage.updateJobNote(req.params.noteId, data);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update job note error:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  // Delete job note
  app.delete("/api/jobs/:jobId/notes/:noteId", async (req, res) => {
    try {
      await storage.deleteJobNote(req.params.noteId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete job note error:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Add attachment to note
  app.post("/api/jobs/:jobId/notes/:noteId/attachments", async (req, res) => {
    try {
      const { fileName, fileUrl, mimeType, fileSize } = req.body;
      if (!fileName || !fileUrl) {
        return res.status(400).json({ message: "fileName and fileUrl are required" });
      }
      const attachment = await storage.createJobNoteAttachment({
        noteId: req.params.noteId,
        fileName,
        fileUrl,
        mimeType,
        fileSize,
      });
      res.status(201).json(attachment);
    } catch (error) {
      console.error("Create attachment error:", error);
      res.status(500).json({ message: "Failed to create attachment" });
    }
  });

  // Delete attachment
  app.delete("/api/jobs/:jobId/notes/:noteId/attachments/:attachmentId", async (req, res) => {
    try {
      await storage.deleteJobNoteAttachment(req.params.attachmentId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete attachment error:", error);
      res.status(500).json({ message: "Failed to delete attachment" });
    }
  });

  // Toggle share quote with partner
  app.patch("/api/jobs/:jobId/share-quote", async (req, res) => {
    try {
      const { shareQuoteWithPartner } = req.body;
      const job = await storage.updateJob(req.params.jobId, { shareQuoteWithPartner });
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Toggle share quote error:", error);
      res.status(500).json({ message: "Failed to update share settings" });
    }
  });

  // Toggle share notes with partner
  app.patch("/api/jobs/:jobId/share-notes", async (req, res) => {
    try {
      const { shareNotesWithPartner } = req.body;
      const job = await storage.updateJob(req.params.jobId, { shareNotesWithPartner });
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Toggle share notes error:", error);
      res.status(500).json({ message: "Failed to update share settings" });
    }
  });

  // Partner portal: Get job notes (only visible ones)
  app.get("/api/partner-portal/jobs/:jobId/notes", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const access = await storage.getPartnerPortalAccessByToken(token);
      if (!access || !access.isActive) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const job = await storage.getJob(req.params.jobId);
      if (!job || job.partnerId !== access.partnerId) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check if notes sharing is enabled
      if (!job.shareNotesWithPartner) {
        return res.json([]);
      }
      
      const notes = await storage.getJobNotesForPartner(req.params.jobId);
      // Get attachments for each note
      const notesWithAttachments = await Promise.all(
        notes.map(async (note) => {
          const attachments = await storage.getJobNoteAttachments(note.id);
          return { ...note, attachments };
        })
      );
      res.json(notesWithAttachments);
    } catch (error) {
      console.error("Partner portal job notes error:", error);
      res.status(500).json({ message: "Failed to load notes" });
    }
  });

  // Partner portal: Get quote items (if sharing is enabled)
  app.get("/api/partner-portal/jobs/:jobId/quote-items", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const access = await storage.getPartnerPortalAccessByToken(token);
      if (!access || !access.isActive) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const job = await storage.getJob(req.params.jobId);
      if (!job || job.partnerId !== access.partnerId) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check if quote sharing is enabled
      if (!job.shareQuoteWithPartner) {
        return res.json([]);
      }
      
      const quoteItems = await storage.getQuoteItemsByJob(req.params.jobId);
      res.json(quoteItems);
    } catch (error) {
      console.error("Partner portal quote items error:", error);
      res.status(500).json({ message: "Failed to load quote items" });
    }
  });

  // Financial Categories
  app.get("/api/financial-categories", async (req, res) => {
    try {
      const categories = await storage.getFinancialCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get financial categories error:", error);
      res.status(500).json({ message: "Failed to load financial categories" });
    }
  });

  app.post("/api/financial-categories", async (req, res) => {
    try {
      const data = insertFinancialCategorySchema.parse(req.body);
      const category = await storage.createFinancialCategory(data);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create financial category error:", error);
      res.status(500).json({ message: "Failed to create financial category" });
    }
  });

  app.patch("/api/financial-categories/:id", async (req, res) => {
    try {
      const data = insertFinancialCategorySchema.partial().parse(req.body);
      const category = await storage.updateFinancialCategory(req.params.id, data);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update financial category error:", error);
      res.status(500).json({ message: "Failed to update financial category" });
    }
  });

  app.delete("/api/financial-categories/:id", async (req, res) => {
    try {
      // Check if system category
      const category = await storage.getFinancialCategory(req.params.id);
      if (category?.isSystem) {
        return res.status(400).json({ message: "Cannot delete system category" });
      }
      await storage.deleteFinancialCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete financial category error:", error);
      res.status(500).json({ message: "Failed to delete financial category" });
    }
  });

  // Financial Transactions
  app.get("/api/financial-transactions", async (req, res) => {
    try {
      const { year, month, jobId } = req.query;
      let transactions;
      
      if (jobId && typeof jobId === "string") {
        transactions = await storage.getFinancialTransactionsByJob(jobId);
      } else if (year && month) {
        transactions = await storage.getFinancialTransactionsByMonth(
          parseInt(year as string),
          parseInt(month as string)
        );
      } else {
        transactions = await storage.getFinancialTransactions();
      }
      
      res.json(transactions);
    } catch (error) {
      console.error("Get financial transactions error:", error);
      res.status(500).json({ message: "Failed to load financial transactions" });
    }
  });

  app.get("/api/financial-transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getFinancialTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Get financial transaction error:", error);
      res.status(500).json({ message: "Failed to load financial transaction" });
    }
  });

  app.post("/api/financial-transactions", async (req, res) => {
    try {
      const data = insertFinancialTransactionSchema.parse(req.body);
      const transaction = await storage.createFinancialTransaction(data);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create financial transaction error:", error);
      res.status(500).json({ message: "Failed to create financial transaction" });
    }
  });

  app.patch("/api/financial-transactions/:id", async (req, res) => {
    try {
      const data = insertFinancialTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateFinancialTransaction(req.params.id, data);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update financial transaction error:", error);
      res.status(500).json({ message: "Failed to update financial transaction" });
    }
  });

  app.delete("/api/financial-transactions/:id", async (req, res) => {
    try {
      await storage.deleteFinancialTransaction(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete financial transaction error:", error);
      res.status(500).json({ message: "Failed to delete financial transaction" });
    }
  });

  // Receipt Scanning - Extract data from receipt images using AI
  app.post("/api/scan-receipt", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ message: "No image provided" });
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this receipt image and extract the following information in JSON format:
{
  "vendor": "store/company name",
  "date": "YYYY-MM-DD format or null if not readable",
  "amount": number (total amount paid, just the number),
  "description": "brief description of purchase (max 50 chars)",
  "items": ["list of main items if visible"],
  "category": "Materials & Supplies" or "Vehicle & Fuel" or "Tools & Equipment" or "Overheads" or "Other Expenses"
}

If you cannot read certain fields, use null for that field. Always try to extract at least the amount.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content || "";
      
      // Parse the JSON from the response
      let receiptData;
      try {
        // Extract JSON from response (may be wrapped in markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          receiptData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse receipt data:", parseError, content);
        return res.status(422).json({ 
          message: "Could not extract data from receipt. Please try a clearer photo or enter manually.",
          raw: content
        });
      }

      res.json({
        success: true,
        data: {
          vendor: receiptData.vendor || "Unknown Vendor",
          date: receiptData.date || new Date().toISOString().split("T")[0],
          amount: typeof receiptData.amount === "number" ? receiptData.amount : parseFloat(receiptData.amount) || 0,
          description: receiptData.description || "Receipt expense",
          items: receiptData.items || [],
          category: receiptData.category || "Materials & Supplies"
        }
      });
    } catch (error: any) {
      console.error("Receipt scan error:", error);
      res.status(500).json({ 
        message: "Failed to scan receipt",
        error: error.message 
      });
    }
  });

  // Financial Summary
  app.get("/api/financial-summary", async (req, res) => {
    try {
      const { year, month } = req.query;
      let transactions;
      
      if (year && month) {
        transactions = await storage.getFinancialTransactionsByMonth(
          parseInt(year as string),
          parseInt(month as string)
        );
      } else {
        transactions = await storage.getFinancialTransactions();
      }
      
      const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const profit = income - expenses;
      const margin = income > 0 ? (profit / income) * 100 : 0;
      
      res.json({
        income,
        expenses,
        profit,
        margin: Math.round(margin * 100) / 100,
        transactionCount: transactions.length
      });
    } catch (error) {
      console.error("Get financial summary error:", error);
      res.status(500).json({ message: "Failed to load financial summary" });
    }
  });

  // Financial Forecast - jobs confirmed at quote_accepted stage and beyond
  app.get("/api/financial-forecast", async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      
      // Stages that represent confirmed/expected income
      const confirmedStages = [
        "quote_accepted",
        "deposit_requested", 
        "deposit_paid",
        "scheduled",
        "in_progress",
        "completed",
        "invoice_sent"
      ];
      
      const confirmedJobs = jobs.filter(j => confirmedStages.includes(j.status));
      
      // Calculate forecast totals
      let totalForecast = 0;
      let depositsPending = 0;
      let balanceDue = 0;
      
      const forecastJobs = confirmedJobs.map(job => {
        const quotedValue = parseFloat(job.quotedValue || "0");
        const depositAmount = job.depositRequired 
          ? (job.depositType === "percentage" 
              ? quotedValue * (parseFloat(job.depositAmount || "0") / 100)
              : parseFloat(job.depositAmount || "0"))
          : 0;
        
        const depositPaid = job.depositReceived;
        const isPaid = job.status === "paid" || job.status === "closed";
        
        totalForecast += quotedValue;
        
        if (!depositPaid && job.depositRequired) {
          depositsPending += depositAmount;
        }
        
        if (!isPaid) {
          balanceDue += depositPaid ? (quotedValue - depositAmount) : quotedValue;
        }
        
        return {
          id: job.id,
          jobNumber: job.jobNumber,
          serviceType: job.serviceType,
          status: job.status,
          quotedValue,
          depositAmount,
          depositPaid,
        };
      });
      
      res.json({
        totalForecast,
        depositsPending,
        balanceDue,
        confirmedJobCount: confirmedJobs.length,
        jobs: forecastJobs
      });
    } catch (error) {
      console.error("Get financial forecast error:", error);
      res.status(500).json({ message: "Failed to load financial forecast" });
    }
  });

  // Partner Job Volume - track total value of jobs brought in by partners
  app.get("/api/partner-job-volume", async (req, res) => {
    try {
      const { year, month } = req.query;
      const jobs = await storage.getJobs();
      const partners = await storage.getTradePartners();
      
      // Filter for partner jobs only
      let partnerJobs = jobs.filter(j => j.deliveryType === "partner" && j.partnerId);
      
      // Optionally filter by date (jobs that reached paid status in this month)
      // For now, we'll show all paid partner jobs for the selected month
      if (year && month) {
        const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
        const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
        
        partnerJobs = partnerJobs.filter(j => {
          if (!j.updatedAt) return false;
          const jobDate = new Date(j.updatedAt);
          return jobDate >= startDate && jobDate <= endDate && j.status === "paid";
        });
      }
      
      // Group by partner
      const partnerVolume: Record<string, { partnerId: string; businessName: string; totalValue: number; jobCount: number; cccMargin: number }> = {};
      
      for (const job of partnerJobs) {
        if (!job.partnerId) continue;
        
        if (!partnerVolume[job.partnerId]) {
          const partner = partners.find(p => p.id === job.partnerId);
          partnerVolume[job.partnerId] = {
            partnerId: job.partnerId,
            businessName: partner?.businessName || "Unknown Partner",
            totalValue: 0,
            jobCount: 0,
            cccMargin: 0,
          };
        }
        
        const grossValue = parseFloat(job.quotedValue || "0");
        let margin = grossValue;
        
        if (job.partnerCharge) {
          const charge = parseFloat(job.partnerCharge);
          if (job.partnerChargeType === "percentage") {
            margin = grossValue * (charge / 100);
          } else {
            margin = charge;
          }
        }
        
        partnerVolume[job.partnerId].totalValue += grossValue;
        partnerVolume[job.partnerId].jobCount += 1;
        partnerVolume[job.partnerId].cccMargin += margin;
      }
      
      const partnerList = Object.values(partnerVolume);
      const totalVolume = partnerList.reduce((sum, p) => sum + p.totalValue, 0);
      const totalMargin = partnerList.reduce((sum, p) => sum + p.cccMargin, 0);
      const totalJobCount = partnerList.reduce((sum, p) => sum + p.jobCount, 0);
      
      res.json({
        totalVolume,
        totalMargin,
        totalJobCount,
        partners: partnerList
      });
    } catch (error) {
      console.error("Get partner job volume error:", error);
      res.status(500).json({ message: "Failed to load partner job volume" });
    }
  });

  // Calendar Events
  app.get("/api/calendar-events", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let events;
      
      if (startDate && endDate) {
        events = await storage.getCalendarEventsByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        events = await storage.getCalendarEvents();
      }
      
      // Enrich with job and partner data
      const [jobs, partners] = await Promise.all([
        storage.getJobs(),
        storage.getTradePartners()
      ]);
      
      const enrichedEvents = events.map(event => ({
        ...event,
        job: event.jobId ? jobs.find(j => j.id === event.jobId) : null,
        partner: event.partnerId ? partners.find(p => p.id === event.partnerId) : null
      }));
      
      res.json(enrichedEvents);
    } catch (error) {
      console.error("Get calendar events error:", error);
      res.status(500).json({ message: "Failed to load calendar events" });
    }
  });

  app.get("/api/calendar-events/:id", async (req, res) => {
    try {
      const event = await storage.getCalendarEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Calendar event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Get calendar event error:", error);
      res.status(500).json({ message: "Failed to load calendar event" });
    }
  });

  app.post("/api/calendar-events", async (req, res) => {
    try {
      const data = insertCalendarEventSchema.parse(req.body);
      
      // Validate partnerId is required for partner/hybrid events
      if ((data.teamType === "partner" || data.teamType === "hybrid") && !data.partnerId) {
        return res.status(400).json({ 
          message: "Partner is required for partner or hybrid events" 
        });
      }
      
      const event = await storage.createCalendarEvent(data);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create calendar event error:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  app.patch("/api/calendar-events/:id", async (req, res) => {
    try {
      const data = insertCalendarEventSchema.partial().parse(req.body);
      const event = await storage.updateCalendarEvent(req.params.id, data);
      if (!event) {
        return res.status(404).json({ message: "Calendar event not found" });
      }
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update calendar event error:", error);
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });

  app.delete("/api/calendar-events/:id", async (req, res) => {
    try {
      await storage.deleteCalendarEvent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete calendar event error:", error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  // Confirm calendar event by admin
  app.patch("/api/calendar-events/:id/confirm-admin", async (req, res) => {
    try {
      const event = await storage.getCalendarEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Calendar event not found" });
      }
      
      // For in-house events, admin confirmation is sufficient
      // For partner/hybrid events, both admin and partner must confirm
      const isInHouse = event.teamType === "in_house";
      const partnerConfirmed = event.confirmedByPartner;
      const fullyConfirmed = isInHouse || partnerConfirmed;
      
      // Only set confirmedAt when fully confirmed, leave it untouched otherwise
      const updateData: Record<string, unknown> = {
        confirmedByAdmin: true,
        status: fullyConfirmed ? "confirmed" : "pending",
      };
      
      if (fullyConfirmed) {
        updateData.confirmedAt = new Date();
      }
      
      const updated = await storage.updateCalendarEvent(req.params.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Confirm calendar event error:", error);
      res.status(500).json({ message: "Failed to confirm calendar event" });
    }
  });

  // Partner Availability
  app.get("/api/partner-availability", async (req, res) => {
    try {
      const { partnerId, startDate, endDate } = req.query;
      
      if (startDate && endDate) {
        if (partnerId) {
          const availability = await storage.getPartnerAvailabilityByDateRange(
            partnerId as string,
            new Date(startDate as string),
            new Date(endDate as string)
          );
          res.json(availability);
        } else {
          const availability = await storage.getAllPartnerAvailability(
            new Date(startDate as string),
            new Date(endDate as string)
          );
          res.json(availability);
        }
      } else if (partnerId) {
        const availability = await storage.getPartnerAvailability(partnerId as string);
        res.json(availability);
      } else {
        res.status(400).json({ message: "partnerId or date range required" });
      }
    } catch (error) {
      console.error("Get partner availability error:", error);
      res.status(500).json({ message: "Failed to load partner availability" });
    }
  });

  app.post("/api/partner-availability", async (req, res) => {
    try {
      const data = insertPartnerAvailabilitySchema.parse(req.body);
      const availability = await storage.createPartnerAvailability(data);
      res.status(201).json(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create partner availability error:", error);
      res.status(500).json({ message: "Failed to create partner availability" });
    }
  });

  app.patch("/api/partner-availability/:id", async (req, res) => {
    try {
      const data = insertPartnerAvailabilitySchema.partial().parse(req.body);
      const availability = await storage.updatePartnerAvailability(req.params.id, data);
      if (!availability) {
        return res.status(404).json({ message: "Partner availability not found" });
      }
      res.json(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update partner availability error:", error);
      res.status(500).json({ message: "Failed to update partner availability" });
    }
  });

  app.delete("/api/partner-availability/:id", async (req, res) => {
    try {
      await storage.deletePartnerAvailability(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete partner availability error:", error);
      res.status(500).json({ message: "Failed to delete partner availability" });
    }
  });

  // Partner Portal Calendar Events
  app.get("/api/partner-portal/calendar-events", async (req, res) => {
    try {
      // @ts-ignore
      const partnerAccess = req.partnerAccess;
      if (!partnerAccess) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate required" });
      }
      
      const events = await storage.getCalendarEventsForPartnerPortal(
        partnerAccess.partnerId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      // Enrich with job data
      const jobs = await storage.getJobs();
      const enrichedEvents = events.map(event => ({
        ...event,
        job: event.jobId ? jobs.find(j => j.id === event.jobId) : null
      }));
      
      res.json(enrichedEvents);
    } catch (error) {
      console.error("Get partner portal calendar events error:", error);
      res.status(500).json({ message: "Failed to load calendar events" });
    }
  });

  // Partner confirms calendar event
  app.patch("/api/partner-portal/calendar-events/:id/confirm", async (req, res) => {
    try {
      // @ts-ignore
      const partnerAccess = req.partnerAccess;
      if (!partnerAccess) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const event = await storage.getCalendarEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Calendar event not found" });
      }
      
      // Verify this event belongs to this partner
      if (event.partnerId !== partnerAccess.partnerId) {
        return res.status(403).json({ message: "Not authorized to confirm this event" });
      }
      
      // Both admin and partner must confirm for partner/hybrid events
      const adminConfirmed = event.confirmedByAdmin;
      const fullyConfirmed = adminConfirmed;
      
      // Only set confirmedAt when both parties have confirmed, leave it untouched otherwise
      const updateData: Record<string, unknown> = {
        confirmedByPartner: true,
        status: fullyConfirmed ? "confirmed" : "pending",
      };
      
      if (fullyConfirmed) {
        updateData.confirmedAt = new Date();
      }
      
      const updated = await storage.updateCalendarEvent(req.params.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Partner confirm calendar event error:", error);
      res.status(500).json({ message: "Failed to confirm calendar event" });
    }
  });

  // Partner Availability - for partner portal
  app.get("/api/partner-portal/availability", async (req, res) => {
    try {
      // @ts-ignore
      const partnerAccess = req.partnerAccess;
      if (!partnerAccess) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { startDate, endDate } = req.query;
      if (startDate && endDate) {
        const availability = await storage.getPartnerAvailabilityByDateRange(
          partnerAccess.partnerId,
          new Date(startDate as string),
          new Date(endDate as string)
        );
        res.json(availability);
      } else {
        const availability = await storage.getPartnerAvailability(partnerAccess.partnerId);
        res.json(availability);
      }
    } catch (error) {
      console.error("Get partner availability error:", error);
      res.status(500).json({ message: "Failed to load availability" });
    }
  });

  app.post("/api/partner-portal/availability", async (req, res) => {
    try {
      // @ts-ignore
      const partnerAccess = req.partnerAccess;
      if (!partnerAccess) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const data = insertPartnerAvailabilitySchema.parse({
        ...req.body,
        partnerId: partnerAccess.partnerId
      });
      const availability = await storage.createPartnerAvailability(data);
      res.status(201).json(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create partner availability error:", error);
      res.status(500).json({ message: "Failed to create availability" });
    }
  });

  app.delete("/api/partner-portal/availability/:id", async (req, res) => {
    try {
      // @ts-ignore
      const partnerAccess = req.partnerAccess;
      if (!partnerAccess) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      await storage.deletePartnerAvailability(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete partner availability error:", error);
      res.status(500).json({ message: "Failed to delete availability" });
    }
  });

  // ==================== SCHEDULE PROPOSALS ====================
  
  // Admin: Get schedule proposals for a job
  app.get("/api/jobs/:jobId/schedule-proposals", async (req, res) => {
    try {
      const proposals = await storage.getScheduleProposalsByJob(req.params.jobId);
      res.json(proposals);
    } catch (error) {
      console.error("Get schedule proposals error:", error);
      res.status(500).json({ message: "Failed to load schedule proposals" });
    }
  });

  // Admin: Get active proposal for a job
  app.get("/api/jobs/:jobId/schedule-proposals/active", async (req, res) => {
    try {
      const proposal = await storage.getActiveScheduleProposal(req.params.jobId);
      res.json(proposal || null);
    } catch (error) {
      console.error("Get active schedule proposal error:", error);
      res.status(500).json({ message: "Failed to load active schedule proposal" });
    }
  });

  // Admin: Create a new schedule proposal
  app.post("/api/jobs/:jobId/schedule-proposals", async (req, res) => {
    try {
      // Archive any existing active proposals for this job
      await storage.archiveScheduleProposals(req.params.jobId);
      
      // Convert date strings to Date objects before validation
      const bodyWithDates = {
        ...req.body,
        proposedStartDate: req.body.proposedStartDate ? new Date(req.body.proposedStartDate) : undefined,
        proposedEndDate: req.body.proposedEndDate ? new Date(req.body.proposedEndDate) : null,
        jobId: req.params.jobId,
        proposedByRole: "admin",
        status: "pending_client",
      };
      
      const data = insertJobScheduleProposalSchema.parse(bodyWithDates);
      const proposal = await storage.createScheduleProposal(data);
      res.status(201).json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create schedule proposal error:", error);
      res.status(500).json({ message: "Failed to create schedule proposal" });
    }
  });

  // Admin: Update a schedule proposal (accept client counter, etc.)
  app.patch("/api/schedule-proposals/:id", async (req, res) => {
    try {
      const data = insertJobScheduleProposalSchema.partial().parse(req.body);
      const proposal = await storage.updateScheduleProposal(req.params.id, data);
      if (!proposal) {
        return res.status(404).json({ message: "Schedule proposal not found" });
      }
      res.json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update schedule proposal error:", error);
      res.status(500).json({ message: "Failed to update schedule proposal" });
    }
  });

  // Admin: Confirm client's counter proposal and create calendar event
  app.post("/api/schedule-proposals/:id/confirm", async (req, res) => {
    try {
      const proposal = await storage.getScheduleProposal(req.params.id);
      if (!proposal) {
        return res.status(404).json({ message: "Schedule proposal not found" });
      }

      const job = await storage.getJob(proposal.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Create calendar event
      const eventDate = proposal.counterProposedDate || proposal.proposedStartDate;
      const endDate = proposal.proposedEndDate || eventDate;
      
      const calendarEvent = await storage.createCalendarEvent({
        title: `Project Start: ${job.jobNumber}`,
        jobId: job.id,
        partnerId: job.partnerId || undefined,
        startDate: eventDate,
        endDate: endDate,
        allDay: true,
        eventType: "project_start",
        teamType: job.deliveryType === "in_house" ? "in_house" : job.deliveryType === "partner" ? "partner" : "hybrid",
        status: "confirmed",
        confirmedByAdmin: true,
        confirmedByClient: true,
        clientConfirmedAt: new Date(),
        confirmedAt: new Date(),
      });

      // Update proposal to scheduled status
      const updatedProposal = await storage.updateScheduleProposal(req.params.id, {
        status: "scheduled",
        linkedCalendarEventId: calendarEvent.id,
      });

      // Update job status to scheduled
      await storage.updateJob(job.id, { status: "scheduled" });

      res.json({ proposal: updatedProposal, calendarEvent });
    } catch (error) {
      console.error("Confirm schedule proposal error:", error);
      res.status(500).json({ message: "Failed to confirm schedule proposal" });
    }
  });

  // Client Portal: Get active schedule proposal for a job
  app.get("/api/portal/jobs/:jobId/schedule-proposal", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const access = await storage.getClientPortalAccessByToken(token);
      if (!access || !access.isActive || (access.tokenExpiry && access.tokenExpiry < new Date())) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify job belongs to this client
      const job = await storage.getJob(req.params.jobId);
      if (!job || job.contactId !== access.contactId) {
        return res.status(404).json({ message: "Job not found" });
      }

      const proposal = await storage.getActiveScheduleProposal(req.params.jobId);
      res.json(proposal || null);
    } catch (error) {
      console.error("Get portal schedule proposal error:", error);
      res.status(500).json({ message: "Failed to load schedule proposal" });
    }
  });

  // Client Portal: Respond to schedule proposal (accept/decline/counter)
  app.post("/api/portal/jobs/:jobId/schedule-proposal/respond", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const access = await storage.getClientPortalAccessByToken(token);
      if (!access || !access.isActive || (access.tokenExpiry && access.tokenExpiry < new Date())) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify job belongs to this client
      const job = await storage.getJob(req.params.jobId);
      if (!job || job.contactId !== access.contactId) {
        return res.status(404).json({ message: "Job not found" });
      }

      const proposal = await storage.getActiveScheduleProposal(req.params.jobId);
      if (!proposal) {
        return res.status(404).json({ message: "No active schedule proposal found" });
      }

      const { response, counterDate, reason } = req.body;

      if (response === "accepted") {
        // Client accepted - create calendar event
        const eventDate = proposal.proposedStartDate;
        const endDate = proposal.proposedEndDate || eventDate;
        
        const calendarEvent = await storage.createCalendarEvent({
          title: `Project Start: ${job.jobNumber}`,
          jobId: job.id,
          partnerId: job.partnerId || undefined,
          startDate: eventDate,
          endDate: endDate,
          allDay: true,
          eventType: "project_start",
          teamType: job.deliveryType === "in_house" ? "in_house" : job.deliveryType === "partner" ? "partner" : "hybrid",
          status: "confirmed",
          confirmedByAdmin: true,
          confirmedByClient: true,
          clientConfirmedAt: new Date(),
          confirmedAt: new Date(),
        });

        const updatedProposal = await storage.updateScheduleProposal(proposal.id, {
          status: "scheduled",
          clientResponse: "accepted",
          respondedAt: new Date(),
          linkedCalendarEventId: calendarEvent.id,
        });

        // Update job status to scheduled
        await storage.updateJob(job.id, { status: "scheduled" });

        res.json({ proposal: updatedProposal, calendarEvent });
      } else if (response === "countered") {
        // Client is proposing alternative date
        if (!counterDate) {
          return res.status(400).json({ message: "Counter date is required" });
        }

        const updatedProposal = await storage.updateScheduleProposal(proposal.id, {
          status: "client_countered",
          clientResponse: "countered",
          counterProposedDate: new Date(counterDate),
          counterReason: reason || null,
          respondedAt: new Date(),
        });

        res.json({ proposal: updatedProposal });
      } else if (response === "declined") {
        // Client declined without alternative
        const updatedProposal = await storage.updateScheduleProposal(proposal.id, {
          status: "client_declined",
          clientResponse: "declined",
          counterReason: reason || null,
          respondedAt: new Date(),
        });

        res.json({ proposal: updatedProposal });
      } else {
        return res.status(400).json({ message: "Invalid response type" });
      }
    } catch (error) {
      console.error("Respond to schedule proposal error:", error);
      res.status(500).json({ message: "Failed to respond to schedule proposal" });
    }
  });

  // =====================
  // SEO POWER HOUSE ROUTES
  // =====================

  // SEO Business Profile
  app.get("/api/seo/business-profile", async (req, res) => {
    try {
      const profile = await storage.getSeoBusinessProfile();
      res.json(profile || null);
    } catch (error) {
      console.error("Get SEO business profile error:", error);
      res.status(500).json({ message: "Failed to load business profile" });
    }
  });

  app.post("/api/seo/business-profile", async (req, res) => {
    try {
      const parsed = insertSeoBusinessProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const profile = await storage.upsertSeoBusinessProfile(parsed.data);
      res.json(profile);
    } catch (error) {
      console.error("Save SEO business profile error:", error);
      res.status(500).json({ message: "Failed to save business profile" });
    }
  });

  // SEO Brand Voice
  app.get("/api/seo/brand-voice", async (req, res) => {
    try {
      const voice = await storage.getSeoBrandVoice();
      res.json(voice || null);
    } catch (error) {
      console.error("Get SEO brand voice error:", error);
      res.status(500).json({ message: "Failed to load brand voice" });
    }
  });

  app.post("/api/seo/brand-voice", async (req, res) => {
    try {
      const parsed = insertSeoBrandVoiceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const voice = await storage.upsertSeoBrandVoice(parsed.data);
      res.json(voice);
    } catch (error) {
      console.error("Save SEO brand voice error:", error);
      res.status(500).json({ message: "Failed to save brand voice" });
    }
  });

  // SEO Weekly Focus
  app.get("/api/seo/weekly-focus", async (req, res) => {
    try {
      const list = await storage.getSeoWeeklyFocusList();
      res.json(list);
    } catch (error) {
      console.error("Get SEO weekly focus list error:", error);
      res.status(500).json({ message: "Failed to load weekly focus list" });
    }
  });

  app.get("/api/seo/weekly-focus/active", async (req, res) => {
    try {
      const focus = await storage.getActiveSeoWeeklyFocus();
      res.json(focus || null);
    } catch (error) {
      console.error("Get active weekly focus error:", error);
      res.status(500).json({ message: "Failed to load active weekly focus" });
    }
  });

  app.get("/api/seo/weekly-focus/:id", async (req, res) => {
    try {
      const focus = await storage.getSeoWeeklyFocus(req.params.id);
      if (!focus) {
        return res.status(404).json({ message: "Weekly focus not found" });
      }
      res.json(focus);
    } catch (error) {
      console.error("Get weekly focus error:", error);
      res.status(500).json({ message: "Failed to load weekly focus" });
    }
  });

  app.post("/api/seo/weekly-focus", async (req, res) => {
    try {
      const parsed = insertSeoWeeklyFocusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const focus = await storage.createSeoWeeklyFocus(parsed.data);
      res.json(focus);
    } catch (error) {
      console.error("Create weekly focus error:", error);
      res.status(500).json({ message: "Failed to create weekly focus" });
    }
  });

  app.patch("/api/seo/weekly-focus/:id", async (req, res) => {
    try {
      const parsed = insertSeoWeeklyFocusSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const focus = await storage.updateSeoWeeklyFocus(req.params.id, parsed.data);
      if (!focus) {
        return res.status(404).json({ message: "Weekly focus not found" });
      }
      res.json(focus);
    } catch (error) {
      console.error("Update weekly focus error:", error);
      res.status(500).json({ message: "Failed to update weekly focus" });
    }
  });

  // SEO Job Media
  app.get("/api/seo/job-media", async (req, res) => {
    try {
      const media = await storage.getAllSeoJobMedia();
      res.json(media);
    } catch (error) {
      console.error("Get all SEO job media error:", error);
      res.status(500).json({ message: "Failed to load job media" });
    }
  });

  app.get("/api/seo/job-media/:jobId", async (req, res) => {
    try {
      const media = await storage.getSeoJobMediaByJob(req.params.jobId);
      res.json(media);
    } catch (error) {
      console.error("Get job media error:", error);
      res.status(500).json({ message: "Failed to load job media" });
    }
  });

  app.post("/api/seo/job-media", async (req, res) => {
    try {
      const parsed = insertSeoJobMediaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const media = await storage.createSeoJobMedia(parsed.data);
      res.json(media);
    } catch (error) {
      console.error("Create job media error:", error);
      res.status(500).json({ message: "Failed to create job media" });
    }
  });

  app.patch("/api/seo/job-media/:id", async (req, res) => {
    try {
      const parsed = insertSeoJobMediaSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const media = await storage.updateSeoJobMedia(req.params.id, parsed.data);
      if (!media) {
        return res.status(404).json({ message: "Job media not found" });
      }
      res.json(media);
    } catch (error) {
      console.error("Update job media error:", error);
      res.status(500).json({ message: "Failed to update job media" });
    }
  });

  app.delete("/api/seo/job-media/:id", async (req, res) => {
    try {
      await storage.deleteSeoJobMedia(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete job media error:", error);
      res.status(500).json({ message: "Failed to delete job media" });
    }
  });

  // SEO Content Posts
  app.get("/api/seo/content-posts", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const weeklyFocusId = req.query.weeklyFocusId as string | undefined;
      
      let posts;
      if (status) {
        posts = await storage.getSeoContentPostsByStatus(status);
      } else if (weeklyFocusId) {
        posts = await storage.getSeoContentPostsByWeeklyFocus(weeklyFocusId);
      } else {
        posts = await storage.getSeoContentPosts();
      }
      res.json(posts);
    } catch (error) {
      console.error("Get content posts error:", error);
      res.status(500).json({ message: "Failed to load content posts" });
    }
  });

  app.get("/api/seo/content-posts/:id", async (req, res) => {
    try {
      const post = await storage.getSeoContentPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Content post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Get content post error:", error);
      res.status(500).json({ message: "Failed to load content post" });
    }
  });

  app.post("/api/seo/content-posts", async (req, res) => {
    try {
      const parsed = insertSeoContentPostSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const post = await storage.createSeoContentPost(parsed.data);
      res.json(post);
    } catch (error) {
      console.error("Create content post error:", error);
      res.status(500).json({ message: "Failed to create content post" });
    }
  });

  app.patch("/api/seo/content-posts/:id", async (req, res) => {
    try {
      const parsed = insertSeoContentPostSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const post = await storage.updateSeoContentPost(req.params.id, parsed.data);
      if (!post) {
        return res.status(404).json({ message: "Content post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Update content post error:", error);
      res.status(500).json({ message: "Failed to update content post" });
    }
  });

  app.delete("/api/seo/content-posts/:id", async (req, res) => {
    try {
      await storage.deleteSeoContentPost(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete content post error:", error);
      res.status(500).json({ message: "Failed to delete content post" });
    }
  });

  // AI Content Generation endpoint (uses Replit AI Integrations)
  app.post("/api/seo/generate-content", async (req, res) => {
    try {
      const { platform, postType, service, location, tone, keywords, mediaContext, imageUrl, imageCaption } = req.body;
      
      // Build prompt based on business profile and brand voice
      const businessProfile = await storage.getSeoBusinessProfile();
      const brandVoice = await storage.getSeoBrandVoice();
      
      const prompt = buildContentPrompt({
        platform,
        postType,
        service,
        location,
        tone: tone || brandVoice?.emojiStyle || "professional",
        keywords: keywords || [],
        businessName: businessProfile?.businessName || "CCC Group",
        tradeType: businessProfile?.tradeType || "Carpentry & Home Improvements",
        customPhrases: brandVoice?.customPhrases || [],
        blacklistedPhrases: brandVoice?.blacklistedPhrases || [],
        preferredCtas: brandVoice?.preferredCTAs || [],
        hashtags: brandVoice?.hashtagPreferences || [],
        locationKeywords: brandVoice?.locationKeywords || [],
        mediaContext: imageCaption || mediaContext,
      });

      // Use OpenAI via Replit AI Integrations
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
      
      // Build messages - try multimodal with vision if image provided
      let usedImageSuccessfully = false;
      
      // Construct absolute URL for the image if provided
      let absoluteImageUrl: string | null = null;
      if (imageUrl) {
        if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
          absoluteImageUrl = imageUrl;
        } else {
          // Construct URL from Replit environment
          const replSlug = process.env.REPL_SLUG;
          const replOwner = process.env.REPL_OWNER;
          if (replSlug && replOwner) {
            absoluteImageUrl = `https://${replSlug}.${replOwner}.repl.co${imageUrl}`;
          }
        }
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages: any[] = [
        { role: "system", content: "You are a social media content creator for a local trade business. Write engaging, professional posts that highlight quality work and build local community trust. When analyzing an image, describe the craftsmanship and quality you observe, and create content that showcases this work." }
      ];

      if (absoluteImageUrl) {
        // Multimodal request with vision - GPT-4o can analyze images
        const textPrompt = imageCaption 
          ? `${prompt}\n\nThe uploaded image shows: ${imageCaption}. Please analyze the image and create compelling content that highlights this work.`
          : `${prompt}\n\nPlease analyze the uploaded image showing our craftsmanship and create content that highlights the quality of this work.`;
        
        messages.push({
          role: "user",
          content: [
            { type: "text", text: textPrompt },
            { type: "image_url", image_url: { url: absoluteImageUrl, detail: "low" } }
          ]
        });
        usedImageSuccessfully = true;
      } else if (imageUrl && imageCaption) {
        // Fallback: URL couldn't be constructed but we have a caption - use caption as context
        const textPrompt = `${prompt}\n\nThis post will feature an image showing: ${imageCaption}. Create content that complements and highlights this visual of our work.`;
        messages.push({ role: "user", content: textPrompt });
      } else {
        // Text-only request
        messages.push({ role: "user", content: prompt });
      }
      
      const completion = await client.chat.completions.create({
        model: usedImageSuccessfully ? "gpt-4o" : "gpt-4o-mini",
        messages,
        max_completion_tokens: 500,
      });

      const generatedContent = completion.choices[0]?.message?.content || "";
      
      res.json({ 
        content: generatedContent,
        platform,
        postType,
        usedImage: usedImageSuccessfully,
        imageUrlUsed: absoluteImageUrl || undefined,
      });
    } catch (error) {
      console.error("Generate content error:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  // === SEO Autopilot Routes ===

  // Get autopilot settings
  app.get("/api/seo/autopilot/settings", async (req, res) => {
    try {
      const settings = await storage.getSeoAutopilotSettings();
      res.json(settings || null);
    } catch (error) {
      console.error("Get autopilot settings error:", error);
      res.status(500).json({ message: "Failed to get autopilot settings" });
    }
  });

  // Upsert autopilot settings
  app.post("/api/seo/autopilot/settings", async (req, res) => {
    try {
      const settings = await storage.upsertSeoAutopilotSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update autopilot settings error:", error);
      res.status(500).json({ message: "Failed to update autopilot settings" });
    }
  });

  // Get all autopilot slots
  app.get("/api/seo/autopilot/slots", async (req, res) => {
    try {
      const { startDate, endDate, status } = req.query;
      let slots;
      
      if (startDate && endDate) {
        slots = await storage.getSeoAutopilotSlotsByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else if (status) {
        slots = await storage.getSeoAutopilotSlotsByStatus(status as string);
      } else {
        slots = await storage.getSeoAutopilotSlots();
      }
      
      res.json(slots);
    } catch (error) {
      console.error("Get autopilot slots error:", error);
      res.status(500).json({ message: "Failed to get autopilot slots" });
    }
  });

  // Get single slot
  app.get("/api/seo/autopilot/slots/:id", async (req, res) => {
    try {
      const slot = await storage.getSeoAutopilotSlot(req.params.id);
      if (!slot) {
        return res.status(404).json({ message: "Slot not found" });
      }
      res.json(slot);
    } catch (error) {
      console.error("Get autopilot slot error:", error);
      res.status(500).json({ message: "Failed to get autopilot slot" });
    }
  });

  // Create autopilot slot
  app.post("/api/seo/autopilot/slots", async (req, res) => {
    try {
      const slot = await storage.createSeoAutopilotSlot(req.body);
      res.json(slot);
    } catch (error) {
      console.error("Create autopilot slot error:", error);
      res.status(500).json({ message: "Failed to create autopilot slot" });
    }
  });

  // Update autopilot slot
  app.patch("/api/seo/autopilot/slots/:id", async (req, res) => {
    try {
      const slot = await storage.updateSeoAutopilotSlot(req.params.id, req.body);
      if (!slot) {
        return res.status(404).json({ message: "Slot not found" });
      }
      res.json(slot);
    } catch (error) {
      console.error("Update autopilot slot error:", error);
      res.status(500).json({ message: "Failed to update autopilot slot" });
    }
  });

  // Delete autopilot slot
  app.delete("/api/seo/autopilot/slots/:id", async (req, res) => {
    try {
      await storage.deleteSeoAutopilotSlot(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete autopilot slot error:", error);
      res.status(500).json({ message: "Failed to delete autopilot slot" });
    }
  });

  // Approve slot (move to approved status and optionally create post)
  app.post("/api/seo/autopilot/slots/:id/approve", async (req, res) => {
    try {
      const slot = await storage.getSeoAutopilotSlot(req.params.id);
      if (!slot) {
        return res.status(404).json({ message: "Slot not found" });
      }
      
      // Update slot status
      const updated = await storage.updateSeoAutopilotSlot(req.params.id, {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: "admin",
      });
      
      // If there's an associated content post, update its status too
      if (slot.contentPostId) {
        await storage.updateSeoContentPost(slot.contentPostId, {
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: "admin",
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Approve autopilot slot error:", error);
      res.status(500).json({ message: "Failed to approve slot" });
    }
  });

  // Bulk approve slots
  app.post("/api/seo/autopilot/slots/bulk-approve", async (req, res) => {
    try {
      const { slotIds } = req.body;
      const results = [];
      
      for (const slotId of slotIds) {
        const slot = await storage.getSeoAutopilotSlot(slotId);
        if (slot) {
          const updated = await storage.updateSeoAutopilotSlot(slotId, {
            status: "approved",
            approvedAt: new Date(),
            approvedBy: "admin",
          });
          
          if (slot.contentPostId) {
            await storage.updateSeoContentPost(slot.contentPostId, {
              status: "approved",
              reviewedAt: new Date(),
              reviewedBy: "admin",
            });
          }
          
          results.push(updated);
        }
      }
      
      res.json({ approved: results.length, slots: results });
    } catch (error) {
      console.error("Bulk approve slots error:", error);
      res.status(500).json({ message: "Failed to bulk approve slots" });
    }
  });

  // Mark slot as posted (manual confirmation)
  app.post("/api/seo/autopilot/slots/:id/mark-posted", async (req, res) => {
    try {
      const updated = await storage.updateSeoAutopilotSlot(req.params.id, {
        status: "posted",
        postedAt: new Date(),
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Slot not found" });
      }
      
      // Update associated content post if exists
      const slot = await storage.getSeoAutopilotSlot(req.params.id);
      if (slot?.contentPostId) {
        await storage.updateSeoContentPost(slot.contentPostId, {
          status: "published",
          publishedAt: new Date(),
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Mark slot posted error:", error);
      res.status(500).json({ message: "Failed to mark slot as posted" });
    }
  });

  // Get autopilot runs (audit log)
  app.get("/api/seo/autopilot/runs", async (req, res) => {
    try {
      const runs = await storage.getSeoAutopilotRuns();
      res.json(runs);
    } catch (error) {
      console.error("Get autopilot runs error:", error);
      res.status(500).json({ message: "Failed to get autopilot runs" });
    }
  });

  // Trigger autopilot generation manually
  app.post("/api/seo/autopilot/generate", async (req, res) => {
    try {
      const settings = await storage.getSeoAutopilotSettings();
      if (!settings || !settings.enabled) {
        return res.status(400).json({ message: "Autopilot is not enabled" });
      }

      const businessProfile = await storage.getSeoBusinessProfile();
      const brandVoice = await storage.getSeoBrandVoice();
      const focusList = await storage.getSeoWeeklyFocusList();
      const activeFocus = focusList.find(f => f.status === "active");

      // Calculate slots to generate for the next X days
      const daysAhead = settings.autoGenerateAhead || 7;
      const slotsCreated: any[] = [];
      const postsCreated: any[] = [];

      // Platform configurations based on settings
      const platforms = [
        {
          name: "facebook",
          enabled: settings.facebookEnabled,
          postsPerWeek: settings.facebookPostsPerWeek || 3,
          preferredDays: settings.facebookPreferredDays || ["monday", "wednesday", "friday"],
          preferredTime: settings.facebookPreferredTime || "09:00",
        },
        {
          name: "instagram",
          enabled: settings.instagramEnabled,
          postsPerWeek: settings.instagramPostsPerWeek || 3,
          preferredDays: settings.instagramPreferredDays || ["tuesday", "thursday", "saturday"],
          preferredTime: settings.instagramPreferredTime || "18:00",
        },
        {
          name: "google_business",
          enabled: settings.googleEnabled,
          postsPerWeek: settings.googlePostsPerWeek || 2,
          preferredDays: settings.googlePreferredDays || ["monday", "thursday"],
          preferredTime: settings.googlePreferredTime || "12:00",
        },
      ];

      // Content type weights
      const weights = [
        { type: "project_showcase", weight: settings.projectShowcaseWeight || 40 },
        { type: "before_after", weight: settings.beforeAfterWeight || 20 },
        { type: "tip", weight: settings.tipsWeight || 15 },
        { type: "testimonial", weight: settings.testimonialWeight || 15 },
        { type: "seasonal", weight: settings.seasonalWeight || 10 },
      ];

      // Helper to select content type based on weights
      const selectContentType = () => {
        const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
        let random = Math.random() * totalWeight;
        for (const w of weights) {
          random -= w.weight;
          if (random <= 0) return w.type;
        }
        return "project_showcase";
      };

      // Helper to get day number (0=sunday, 1=monday, etc.)
      const dayNameToNumber = (name: string): number => {
        const days: Record<string, number> = {
          sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
          thursday: 4, friday: 5, saturday: 6,
        };
        return days[name.toLowerCase()] ?? 1;
      };

      // Generate slots for each platform
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const platform of platforms) {
        if (!platform.enabled) continue;

        // Find the next occurrence of each preferred day within the next X days
        for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() + dayOffset);
          const dayOfWeek = checkDate.getDay();
          
          const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          const currentDayName = dayNames[dayOfWeek];

          if (platform.preferredDays.includes(currentDayName)) {
            // Parse preferred time
            const [hours, minutes] = (platform.preferredTime || "09:00").split(":").map(Number);
            const scheduledFor = new Date(checkDate);
            scheduledFor.setHours(hours, minutes, 0, 0);

            // Check if slot already exists for this time
            const existingSlots = await storage.getSeoAutopilotSlotsByDateRange(
              new Date(scheduledFor.getTime() - 60000), // 1 minute before
              new Date(scheduledFor.getTime() + 60000)  // 1 minute after
            );
            
            const hasExisting = existingSlots.some(s => s.platform === platform.name);
            if (hasExisting) continue;

            const contentType = selectContentType();

            // Create the slot
            const slot = await storage.createSeoAutopilotSlot({
              platform: platform.name,
              scheduledFor,
              contentType,
              status: "pending",
              weeklyFocusId: activeFocus?.id,
            });
            slotsCreated.push(slot);

            // Generate content for this slot using OpenAI
            try {
              const OpenAI = (await import("openai")).default;
              const client = new OpenAI({
                apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
                baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
              });

              const service = activeFocus?.primaryService || businessProfile?.servicesOffered?.[0] || "Bespoke Carpentry";
              const location = activeFocus?.primaryLocation || businessProfile?.serviceLocations?.[0] || "Cardiff";

              const prompt = buildContentPrompt({
                platform: platform.name,
                postType: contentType,
                service,
                location,
                tone: brandVoice?.emojiStyle || "professional",
                keywords: [],
                businessName: businessProfile?.businessName || "CCC Group",
                tradeType: businessProfile?.tradeType || "Carpentry & Home Improvements",
                customPhrases: brandVoice?.customPhrases || [],
                blacklistedPhrases: brandVoice?.blacklistedPhrases || [],
                preferredCtas: brandVoice?.preferredCTAs || [],
                hashtags: brandVoice?.hashtagPreferences || [],
                locationKeywords: brandVoice?.locationKeywords || [],
                mediaContext: activeFocus?.focusImageCaption || undefined,
              });

              const completion = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: "You are a social media content creator for a local trade business. Write engaging, professional posts that highlight quality work and build local community trust." },
                  { role: "user", content: prompt },
                ],
                max_completion_tokens: 500,
              });

              const generatedContent = completion.choices[0]?.message?.content || "";

              // Create content post
              const post = await storage.createSeoContentPost({
                platform: platform.name,
                postType: contentType,
                content: generatedContent,
                status: settings.requireApproval ? "pending_review" : "approved",
                source: "autopilot",
                scheduledFor,
                weeklyFocusId: activeFocus?.id,
                mediaUrls: activeFocus?.focusImageUrl ? [activeFocus.focusImageUrl] : undefined,
              });
              postsCreated.push(post);

              // Link post to slot
              await storage.updateSeoAutopilotSlot(slot.id, {
                contentPostId: post.id,
                status: "generated",
              });
            } catch (aiError) {
              console.error("AI generation error for slot:", slot.id, aiError);
            }
          }
        }
      }

      // Log the run
      await storage.createSeoAutopilotRun({
        slotsGenerated: slotsCreated.length,
        postsCreated: postsCreated.length,
        status: "success",
        details: JSON.stringify({
          daysAhead,
          platforms: platforms.filter(p => p.enabled).map(p => p.name),
        }),
      });

      res.json({
        success: true,
        slotsCreated: slotsCreated.length,
        postsCreated: postsCreated.length,
        slots: slotsCreated,
      });
    } catch (error) {
      console.error("Autopilot generation error:", error);
      
      // Log failed run
      await storage.createSeoAutopilotRun({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      
      res.status(500).json({ message: "Failed to generate autopilot content" });
    }
  });

  // ==================== PORTAL MESSAGES ====================

  // Admin: Get all messages
  app.get("/api/portal-messages", async (req, res) => {
    try {
      const messages = await storage.getPortalMessages();
      res.json(messages);
    } catch (error) {
      console.error("Get portal messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Admin: Get messages for specific client
  app.get("/api/contacts/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getPortalMessagesByAudience("client", req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Get client messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Admin: Get messages for specific partner
  app.get("/api/partners/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getPortalMessagesByAudience("partner", req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Get partner messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Admin: Create message for client
  app.post("/api/contacts/:id/messages", async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      const data = {
        audienceType: "client" as const,
        audienceId: req.params.id,
        title: req.body.title,
        body: req.body.body,
        messageType: req.body.messageType || "announcement",
        urgency: req.body.urgency || "normal",
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
        createdBy: req.body.createdBy,
      };

      const message = await storage.createPortalMessage(data);
      res.status(201).json(message);
    } catch (error) {
      console.error("Create client message error:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Admin: Create message for partner
  app.post("/api/partners/:id/messages", async (req, res) => {
    try {
      const partner = await storage.getTradePartner(req.params.id);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      const data = {
        audienceType: "partner" as const,
        audienceId: req.params.id,
        title: req.body.title,
        body: req.body.body,
        messageType: req.body.messageType || "announcement",
        urgency: req.body.urgency || "normal",
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
        createdBy: req.body.createdBy,
      };

      const message = await storage.createPortalMessage(data);
      res.status(201).json(message);
    } catch (error) {
      console.error("Create partner message error:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Admin: Update message
  app.patch("/api/portal-messages/:id", async (req, res) => {
    try {
      const message = await storage.updatePortalMessage(req.params.id, req.body);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      console.error("Update portal message error:", error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  // Admin: Delete message
  app.delete("/api/portal-messages/:id", async (req, res) => {
    try {
      await storage.deletePortalMessage(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete portal message error:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Client Portal: Get active messages
  app.get("/api/portal/messages", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const access = await storage.getClientPortalAccessByToken(token);
      if (!access) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const messages = await storage.getActivePortalMessagesForClient(access.contactId);
      
      // Filter out read messages
      const unreadMessages = [];
      for (const msg of messages) {
        const isRead = await storage.isPortalMessageRead(msg.id);
        if (!isRead) {
          unreadMessages.push(msg);
        }
      }
      
      res.json(unreadMessages);
    } catch (error) {
      console.error("Get client portal messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Client Portal: Mark message as read
  app.post("/api/portal/messages/:id/read", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const access = await storage.getClientPortalAccessByToken(token);
      if (!access) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const message = await storage.getPortalMessage(req.params.id);
      if (!message || message.audienceId !== access.contactId) {
        return res.status(404).json({ message: "Message not found" });
      }

      const read = await storage.markPortalMessageAsRead(req.params.id);
      res.json(read);
    } catch (error) {
      console.error("Mark message read error:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Partner Portal: Get active messages
  app.get("/api/partner-portal/messages", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const access = await storage.getPartnerPortalAccessByToken(token);
      if (!access) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const messages = await storage.getActivePortalMessagesForPartner(access.partnerId);
      
      // Filter out read messages
      const unreadMessages = [];
      for (const msg of messages) {
        const isRead = await storage.isPortalMessageRead(msg.id);
        if (!isRead) {
          unreadMessages.push(msg);
        }
      }
      
      res.json(unreadMessages);
    } catch (error) {
      console.error("Get partner portal messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Partner Portal: Mark message as read
  app.post("/api/partner-portal/messages/:id/read", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const access = await storage.getPartnerPortalAccessByToken(token);
      if (!access) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const message = await storage.getPortalMessage(req.params.id);
      if (!message || message.audienceId !== access.partnerId) {
        return res.status(404).json({ message: "Message not found" });
      }

      const read = await storage.markPortalMessageAsRead(req.params.id);
      res.json(read);
    } catch (error) {
      console.error("Mark message read error:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // ==================== HELP CENTER ROUTES ====================

  // Admin: Get all help categories
  app.get("/api/help-categories", async (req, res) => {
    try {
      const categories = await storage.getHelpCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get help categories error:", error);
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  // Admin: Create help category
  app.post("/api/help-categories", async (req, res) => {
    try {
      const category = await storage.createHelpCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Create help category error:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Admin: Update help category
  app.patch("/api/help-categories/:id", async (req, res) => {
    try {
      const category = await storage.updateHelpCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Update help category error:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Admin: Delete help category
  app.delete("/api/help-categories/:id", async (req, res) => {
    try {
      await storage.deleteHelpCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete help category error:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Admin: Get all help articles
  app.get("/api/help-articles", async (req, res) => {
    try {
      const articles = await storage.getHelpArticles();
      res.json(articles);
    } catch (error) {
      console.error("Get help articles error:", error);
      res.status(500).json({ message: "Failed to get articles" });
    }
  });

  // Admin: Get single help article
  app.get("/api/help-articles/:id", async (req, res) => {
    try {
      const article = await storage.getHelpArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Get help article error:", error);
      res.status(500).json({ message: "Failed to get article" });
    }
  });

  // Admin: Create help article
  app.post("/api/help-articles", async (req, res) => {
    try {
      const article = await storage.createHelpArticle(req.body);
      res.status(201).json(article);
    } catch (error) {
      console.error("Create help article error:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  // Admin: Update help article
  app.patch("/api/help-articles/:id", async (req, res) => {
    try {
      const article = await storage.updateHelpArticle(req.params.id, req.body);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Update help article error:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  // Admin: Delete help article
  app.delete("/api/help-articles/:id", async (req, res) => {
    try {
      await storage.deleteHelpArticle(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete help article error:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Public: Get help articles for admin audience
  app.get("/api/help/admin", async (req, res) => {
    try {
      const categories = await storage.getHelpCategoriesByAudience("admin");
      const articles = await storage.getHelpArticlesByAudience("admin");
      res.json({ categories, articles });
    } catch (error) {
      console.error("Get admin help error:", error);
      res.status(500).json({ message: "Failed to get help content" });
    }
  });

  // Client Portal: Get help content
  app.get("/api/portal/help", async (req, res) => {
    try {
      const categories = await storage.getHelpCategoriesByAudience("client");
      const articles = await storage.getHelpArticlesByAudience("client");
      res.json({ categories, articles });
    } catch (error) {
      console.error("Get client portal help error:", error);
      res.status(500).json({ message: "Failed to get help content" });
    }
  });

  // Partner Portal: Get help content
  app.get("/api/partner-portal/help", async (req, res) => {
    try {
      const categories = await storage.getHelpCategoriesByAudience("partner");
      const articles = await storage.getHelpArticlesByAudience("partner");
      res.json({ categories, articles });
    } catch (error) {
      console.error("Get partner portal help error:", error);
      res.status(500).json({ message: "Failed to get help content" });
    }
  });

  // ==================== EMPLOYEE MANAGEMENT ====================

  // Employee Authentication with rate limiting
  app.post("/api/employee/login", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      
      // Check rate limit
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ message: "Too many login attempts. Please try again later." });
      }

      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const employee = await storage.getEmployeeByEmail(email);
      if (!employee || !employee.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const credential = await storage.getEmployeeCredential(employee.id);
      if (!credential) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if account is locked
      if (credential.lockedUntil && credential.lockedUntil > new Date()) {
        return res.status(423).json({ message: "Account is temporarily locked" });
      }

      const isValid = await bcrypt.compare(password, credential.passwordHash);
      if (!isValid) {
        await storage.updateEmployeeCredential(employee.id, {
          failedLoginAttempts: (credential.failedLoginAttempts || 0) + 1,
          lockedUntil: (credential.failedLoginAttempts || 0) >= 4 
            ? new Date(Date.now() + 15 * 60 * 1000) : null
        });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Reset failed attempts and create session
      await storage.updateEmployeeCredential(employee.id, {
        failedLoginAttempts: 0,
        lockedUntil: null
      });

      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

      await storage.createEmployeeSession({
        employeeId: employee.id,
        sessionToken,
        expiresAt,
        ipAddress: req.ip || null,
        userAgent: req.get("User-Agent") || null
      });

      // Set HttpOnly cookie for secure session management
      res.cookie("employeeSession", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
      });

      res.json({
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          role: employee.role,
          accessLevel: employee.accessLevel,
          accessAreas: employee.accessAreas
        },
        mustChangePassword: credential.mustChangePassword
      });
    } catch (error) {
      console.error("Employee login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/employee/logout", async (req, res) => {
    try {
      const sessionToken = req.cookies?.employeeSession;
      if (sessionToken) {
        await storage.deleteEmployeeSession(sessionToken);
      }
      res.clearCookie("employeeSession", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      res.json({ message: "Logged out" });
    } catch (error) {
      console.error("Employee logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Employee auth check endpoint
  app.get("/api/employee/auth/me", async (req, res) => {
    try {
      const employee = await getEmployeeFromCookie(req);
      if (!employee) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      res.json({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        accessLevel: employee.accessLevel,
        role: employee.role,
      });
    } catch (error) {
      console.error("Employee auth check error:", error);
      res.status(500).json({ message: "Auth check failed" });
    }
  });

  app.post("/api/employee/change-password", async (req, res) => {
    try {
      const sessionToken = req.cookies?.employeeSession;
      if (!sessionToken) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const session = await storage.getEmployeeSession(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Session expired" });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password required" });
      }

      const credential = await storage.getEmployeeCredential(session.employeeId);
      if (!credential) {
        return res.status(400).json({ message: "No credentials found" });
      }

      const isValid = await bcrypt.compare(currentPassword, credential.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateEmployeeCredential(session.employeeId, {
        passwordHash,
        mustChangePassword: false,
        lastPasswordChange: new Date()
      });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.get("/api/employee/me", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const session = await storage.getEmployeeSession(token);
      if (!session) {
        return res.status(401).json({ message: "Session expired" });
      }

      const employee = await storage.getEmployee(session.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        role: employee.role,
        accessAreas: employee.accessAreas
      });
    } catch (error) {
      console.error("Get employee me error:", error);
      res.status(500).json({ message: "Failed to get employee" });
    }
  });

  // Admin: Employee Management (requires admin authentication)
  app.get("/api/employees", isAdminAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({ message: "Failed to get employees" });
    }
  });

  app.get("/api/employees/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Get employee error:", error);
      res.status(500).json({ message: "Failed to get employee" });
    }
  });

  app.post("/api/employees", isAdminAuthenticated, async (req, res) => {
    try {
      const { password, ...employeeData } = req.body;
      const data = insertEmployeeSchema.parse(employeeData);
      
      // Check for existing email
      const existing = await storage.getEmployeeByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const employee = await storage.createEmployee(data);

      // Create credentials if password provided
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        await storage.createEmployeeCredential({
          employeeId: employee.id,
          passwordHash,
          mustChangePassword: true
        });
      }

      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create employee error:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.patch("/api/employees/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const { password, ...updateData } = req.body;
      const employee = await storage.updateEmployee(req.params.id, updateData);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Update password if provided
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        const existing = await storage.getEmployeeCredential(employee.id);
        if (existing) {
          await storage.updateEmployeeCredential(employee.id, { passwordHash });
        } else {
          await storage.createEmployeeCredential({
            employeeId: employee.id,
            passwordHash,
            mustChangePassword: true
          });
        }
      }

      res.json(employee);
    } catch (error) {
      console.error("Update employee error:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", isAdminAuthenticated, async (req, res) => {
    try {
      await storage.deleteEmployee(req.params.id);
      res.json({ message: "Employee deleted" });
    } catch (error) {
      console.error("Delete employee error:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Time Entries (admin only - employees use /api/employee/* routes)
  app.get("/api/time-entries", isAdminAuthenticated, async (req, res) => {
    try {
      const { employeeId, startDate, endDate } = req.query;
      
      let entries;
      if (employeeId) {
        entries = await storage.getTimeEntriesByEmployee(employeeId as string);
      } else if (startDate && endDate) {
        entries = await storage.getTimeEntriesByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        entries = await storage.getTimeEntries();
      }
      
      res.json(entries);
    } catch (error) {
      console.error("Get time entries error:", error);
      res.status(500).json({ message: "Failed to get time entries" });
    }
  });

  app.get("/api/time-entries/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const entry = await storage.getTimeEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Get time entry error:", error);
      res.status(500).json({ message: "Failed to get time entry" });
    }
  });

  app.post("/api/time-entries", isAdminAuthenticated, async (req, res) => {
    try {
      const data = insertTimeEntrySchema.parse(req.body);
      const entry = await storage.createTimeEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create time entry error:", error);
      res.status(500).json({ message: "Failed to create time entry" });
    }
  });

  app.patch("/api/time-entries/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const entry = await storage.updateTimeEntry(req.params.id, req.body);
      if (!entry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Update time entry error:", error);
      res.status(500).json({ message: "Failed to update time entry" });
    }
  });

  app.delete("/api/time-entries/:id", isAdminAuthenticated, async (req, res) => {
    try {
      await storage.deleteTimeEntry(req.params.id);
      res.json({ message: "Time entry deleted" });
    } catch (error) {
      console.error("Delete time entry error:", error);
      res.status(500).json({ message: "Failed to delete time entry" });
    }
  });

  // Employee Clock In/Out
  app.post("/api/employee/clock-in", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const session = await storage.getEmployeeSession(token);
      if (!session) {
        return res.status(401).json({ message: "Session expired" });
      }

      // Check for existing active entry
      const activeEntry = await storage.getActiveTimeEntry(session.employeeId);
      if (activeEntry) {
        return res.status(400).json({ message: "Already clocked in", entry: activeEntry });
      }

      const { entryType, jobId, location, notes } = req.body;

      const entry = await storage.createTimeEntry({
        employeeId: session.employeeId,
        clockIn: new Date(),
        entryType: entryType || "work",
        jobId: jobId || null,
        location: location || null,
        notes: notes || null
      });

      res.status(201).json(entry);
    } catch (error) {
      console.error("Clock in error:", error);
      res.status(500).json({ message: "Failed to clock in" });
    }
  });

  app.post("/api/employee/clock-out", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const session = await storage.getEmployeeSession(token);
      if (!session) {
        return res.status(401).json({ message: "Session expired" });
      }

      const activeEntry = await storage.getActiveTimeEntry(session.employeeId);
      if (!activeEntry) {
        return res.status(400).json({ message: "No active time entry" });
      }

      const clockOut = new Date();
      const clockIn = new Date(activeEntry.clockIn);
      const breakMinutes = req.body.breakMinutes || 0;
      
      const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / 60000 - breakMinutes;
      const totalHours = (totalMinutes / 60).toFixed(2);

      const entry = await storage.updateTimeEntry(activeEntry.id, {
        clockOut,
        breakMinutes,
        totalHours,
        notes: req.body.notes || activeEntry.notes
      });

      res.json(entry);
    } catch (error) {
      console.error("Clock out error:", error);
      res.status(500).json({ message: "Failed to clock out" });
    }
  });

  app.get("/api/employee/active-entry", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const session = await storage.getEmployeeSession(token);
      if (!session) {
        return res.status(401).json({ message: "Session expired" });
      }

      const entry = await storage.getActiveTimeEntry(session.employeeId);
      res.json(entry || null);
    } catch (error) {
      console.error("Get active entry error:", error);
      res.status(500).json({ message: "Failed to get active entry" });
    }
  });

  // Pay Periods (admin only)
  app.get("/api/pay-periods", isAdminAuthenticated, async (req, res) => {
    try {
      const periods = await storage.getPayPeriods();
      res.json(periods);
    } catch (error) {
      console.error("Get pay periods error:", error);
      res.status(500).json({ message: "Failed to get pay periods" });
    }
  });

  app.get("/api/pay-periods/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const period = await storage.getPayPeriod(req.params.id);
      if (!period) {
        return res.status(404).json({ message: "Pay period not found" });
      }
      res.json(period);
    } catch (error) {
      console.error("Get pay period error:", error);
      res.status(500).json({ message: "Failed to get pay period" });
    }
  });

  app.post("/api/pay-periods", isAdminAuthenticated, async (req, res) => {
    try {
      const data = insertPayPeriodSchema.parse(req.body);
      const period = await storage.createPayPeriod(data);
      res.status(201).json(period);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create pay period error:", error);
      res.status(500).json({ message: "Failed to create pay period" });
    }
  });

  app.patch("/api/pay-periods/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const period = await storage.updatePayPeriod(req.params.id, req.body);
      if (!period) {
        return res.status(404).json({ message: "Pay period not found" });
      }
      res.json(period);
    } catch (error) {
      console.error("Update pay period error:", error);
      res.status(500).json({ message: "Failed to update pay period" });
    }
  });

  // Payroll Runs (admin only)
  app.get("/api/payroll-runs", isAdminAuthenticated, async (req, res) => {
    try {
      const { periodId, employeeId } = req.query;
      
      let runs;
      if (periodId) {
        runs = await storage.getPayrollRunsByPeriod(periodId as string);
      } else if (employeeId) {
        runs = await storage.getPayrollRunsByEmployee(employeeId as string);
      } else {
        res.status(400).json({ message: "periodId or employeeId required" });
        return;
      }
      
      res.json(runs);
    } catch (error) {
      console.error("Get payroll runs error:", error);
      res.status(500).json({ message: "Failed to get payroll runs" });
    }
  });

  app.get("/api/payroll-runs/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const run = await storage.getPayrollRun(req.params.id);
      if (!run) {
        return res.status(404).json({ message: "Payroll run not found" });
      }
      
      const adjustments = await storage.getPayrollAdjustments(run.id);
      res.json({ ...run, adjustments });
    } catch (error) {
      console.error("Get payroll run error:", error);
      res.status(500).json({ message: "Failed to get payroll run" });
    }
  });

  app.post("/api/payroll-runs", isAdminAuthenticated, async (req, res) => {
    try {
      const data = insertPayrollRunSchema.parse(req.body);
      const run = await storage.createPayrollRun(data);
      res.status(201).json(run);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create payroll run error:", error);
      res.status(500).json({ message: "Failed to create payroll run" });
    }
  });

  app.patch("/api/payroll-runs/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const run = await storage.updatePayrollRun(req.params.id, req.body);
      if (!run) {
        return res.status(404).json({ message: "Payroll run not found" });
      }
      res.json(run);
    } catch (error) {
      console.error("Update payroll run error:", error);
      res.status(500).json({ message: "Failed to update payroll run" });
    }
  });

  // Payroll Adjustments (admin only)
  app.post("/api/payroll-adjustments", isAdminAuthenticated, async (req, res) => {
    try {
      const data = insertPayrollAdjustmentSchema.parse(req.body);
      const adjustment = await storage.createPayrollAdjustment(data);
      res.status(201).json(adjustment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create adjustment error:", error);
      res.status(500).json({ message: "Failed to create adjustment" });
    }
  });

  app.delete("/api/payroll-adjustments/:id", isAdminAuthenticated, async (req, res) => {
    try {
      await storage.deletePayrollAdjustment(req.params.id);
      res.json({ message: "Adjustment deleted" });
    } catch (error) {
      console.error("Delete adjustment error:", error);
      res.status(500).json({ message: "Failed to delete adjustment" });
    }
  });

  // Employee Documents (admin only)
  app.get("/api/employees/:employeeId/documents", isAdminAuthenticated, async (req, res) => {
    try {
      const docs = await storage.getEmployeeDocuments(req.params.employeeId);
      res.json(docs);
    } catch (error) {
      console.error("Get employee documents error:", error);
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  app.post("/api/employees/:employeeId/documents", isAdminAuthenticated, async (req, res) => {
    try {
      const data = insertEmployeeDocumentSchema.parse({
        ...req.body,
        employeeId: req.params.employeeId
      });
      const doc = await storage.createEmployeeDocument(data);
      res.status(201).json(doc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create document error:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.delete("/api/employee-documents/:id", isAdminAuthenticated, async (req, res) => {
    try {
      await storage.deleteEmployeeDocument(req.params.id);
      res.json({ message: "Document deleted" });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Generate Payroll for Period (admin only)
  app.post("/api/pay-periods/:id/generate-payroll", isAdminAuthenticated, async (req, res) => {
    try {
      const period = await storage.getPayPeriod(req.params.id);
      if (!period) {
        return res.status(404).json({ message: "Pay period not found" });
      }

      const employees = await storage.getEmployees();
      const activeEmployees = employees.filter(e => e.isActive);
      
      const runs = [];
      for (const employee of activeEmployees) {
        // Get time entries for this period
        const entries = await storage.getTimeEntriesByEmployee(employee.id);
        const periodEntries = entries.filter(e => {
          const clockIn = new Date(e.clockIn);
          return clockIn >= period.periodStart && clockIn <= period.periodEnd;
        });

        // Calculate hours
        let regularHours = 0;
        for (const entry of periodEntries) {
          regularHours += parseFloat(entry.totalHours || "0");
        }

        // Calculate pay
        const hourlyRate = parseFloat(employee.hourlyRate || "0");
        const grossPay = regularHours * hourlyRate;

        // Check for existing run
        const existingRuns = await storage.getPayrollRunsByPeriod(period.id);
        const existingRun = existingRuns.find(r => r.employeeId === employee.id);
        
        if (existingRun) {
          const updated = await storage.updatePayrollRun(existingRun.id, {
            regularHours: regularHours.toFixed(2),
            hourlyRate: hourlyRate.toFixed(2),
            grossPay: grossPay.toFixed(2),
            netPay: grossPay.toFixed(2)
          });
          runs.push(updated);
        } else {
          const run = await storage.createPayrollRun({
            payPeriodId: period.id,
            employeeId: employee.id,
            regularHours: regularHours.toFixed(2),
            hourlyRate: hourlyRate.toFixed(2),
            grossPay: grossPay.toFixed(2),
            netPay: grossPay.toFixed(2)
          });
          runs.push(run);
        }
      }

      res.json({ message: "Payroll generated", runs });
    } catch (error) {
      console.error("Generate payroll error:", error);
      res.status(500).json({ message: "Failed to generate payroll" });
    }
  });

  // Register object storage routes
  registerObjectStorageRoutes(app);

  // Email endpoints
  const { 
    isEmailConfigured, 
    sendEmployeeLoginCredentials, 
    sendClientPortalAccess, 
    sendPartnerPortalAccess,
    sendJobReminder,
    sendQuoteNotification,
    sendGenericEmail 
  } = await import("./email");

  app.get("/api/email/status", isAdminAuthenticated, async (req, res) => {
    res.json({ configured: isEmailConfigured() });
  });

  app.post("/api/email/send-employee-credentials", isAdminAuthenticated, async (req, res) => {
    try {
      const { employeeId, password } = req.body;
      
      if (!employeeId || !password) {
        return res.status(400).json({ message: "Employee ID and password required" });
      }

      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      if (!employee.email) {
        return res.status(400).json({ message: "Employee has no email address" });
      }

      const portalUrl = `${req.protocol}://${req.get('host')}/employee-portal`;
      const result = await sendEmployeeLoginCredentials(
        employee.email,
        employee.firstName,
        employee.email,
        password,
        portalUrl
      );

      if (result.success) {
        res.json({ message: "Email sent successfully", messageId: result.messageId });
      } else {
        res.status(500).json({ message: result.error || "Failed to send email" });
      }
    } catch (error) {
      console.error("Send employee credentials error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/email/send-client-access", isAdminAuthenticated, async (req, res) => {
    try {
      const { contactId } = req.body;
      
      if (!contactId) {
        return res.status(400).json({ message: "Contact ID required" });
      }

      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      if (!contact.email) {
        return res.status(400).json({ message: "Contact has no email address" });
      }

      const portalAccess = await storage.getClientPortalAccess(contactId);
      if (!portalAccess) {
        return res.status(400).json({ message: "Contact has no portal access. Generate access first." });
      }

      const portalUrl = `${req.protocol}://${req.get('host')}/portal`;
      const result = await sendClientPortalAccess(
        contact.email!,
        contact.name,
        portalUrl,
        portalAccess.accessToken
      );

      if (result.success) {
        res.json({ message: "Email sent successfully", messageId: result.messageId });
      } else {
        res.status(500).json({ message: result.error || "Failed to send email" });
      }
    } catch (error) {
      console.error("Send client access error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/email/send-partner-access", isAdminAuthenticated, async (req, res) => {
    try {
      const { partnerId } = req.body;
      
      if (!partnerId) {
        return res.status(400).json({ message: "Partner ID required" });
      }

      const partner = await storage.getTradePartner(partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      if (!partner.email) {
        return res.status(400).json({ message: "Partner has no email address" });
      }

      const portalAccess = await storage.getPartnerPortalAccess(partnerId);
      if (!portalAccess) {
        return res.status(400).json({ message: "Partner has no portal access. Generate access first." });
      }

      const portalUrl = `${req.protocol}://${req.get('host')}/partner-portal`;
      const result = await sendPartnerPortalAccess(
        partner.email!,
        partner.contactName || partner.businessName,
        portalUrl,
        portalAccess.accessToken
      );

      if (result.success) {
        res.json({ message: "Email sent successfully", messageId: result.messageId });
      } else {
        res.status(500).json({ message: result.error || "Failed to send email" });
      }
    } catch (error) {
      console.error("Send partner access error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/email/send-job-reminder", isAdminAuthenticated, async (req, res) => {
    try {
      const { email, recipientName, jobTitle, jobAddress, scheduledDate, scheduledTime, notes } = req.body;
      
      if (!email || !recipientName || !jobTitle || !scheduledDate || !scheduledTime) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await sendJobReminder(
        email,
        recipientName,
        jobTitle,
        jobAddress || "Address TBD",
        scheduledDate,
        scheduledTime,
        notes
      );

      if (result.success) {
        res.json({ message: "Reminder sent successfully", messageId: result.messageId });
      } else {
        res.status(500).json({ message: result.error || "Failed to send email" });
      }
    } catch (error) {
      console.error("Send job reminder error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/email/send-quote-notification", isAdminAuthenticated, async (req, res) => {
    try {
      const { contactId, jobId, quoteAmount } = req.body;
      
      if (!contactId || !jobId || !quoteAmount) {
        return res.status(400).json({ message: "Contact ID, Job ID, and quote amount required" });
      }

      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      if (!contact.email) {
        return res.status(400).json({ message: "Contact has no email address" });
      }

      const portalAccess = await storage.getClientPortalAccess(contactId);
      if (!portalAccess) {
        return res.status(400).json({ message: "Contact has no portal access" });
      }

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const portalUrl = `${req.protocol}://${req.get('host')}/portal`;
      const result = await sendQuoteNotification(
        contact.email!,
        contact.name,
        job.serviceType,
        quoteAmount,
        portalUrl,
        portalAccess.accessToken
      );

      if (result.success) {
        res.json({ message: "Quote notification sent successfully", messageId: result.messageId });
      } else {
        res.status(500).json({ message: result.error || "Failed to send email" });
      }
    } catch (error) {
      console.error("Send quote notification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/email/send-generic", isAdminAuthenticated, async (req, res) => {
    try {
      const { to, subject, message, recipientName } = req.body;
      
      if (!to || !subject || !message) {
        return res.status(400).json({ message: "Recipient email, subject, and message required" });
      }

      const result = await sendGenericEmail(to, subject, message, recipientName);

      if (result.success) {
        res.json({ message: "Email sent successfully", messageId: result.messageId });
      } else {
        res.status(500).json({ message: result.error || "Failed to send email" });
      }
    } catch (error) {
      console.error("Send generic email error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}

// Helper function to build AI prompt for content generation
function buildContentPrompt(params: {
  platform: string;
  postType: string;
  service: string;
  location: string;
  tone: string;
  keywords: string[];
  businessName: string;
  tradeType: string;
  customPhrases: string[];
  blacklistedPhrases: string[];
  preferredCtas: string[];
  hashtags: string[];
  locationKeywords: string[];
  mediaContext?: string;
}): string {
  let prompt = `Write a ${params.platform} post for ${params.businessName}, a ${params.tradeType} business.\n\n`;
  
  prompt += `Post type: ${params.postType}\n`;
  prompt += `Service to highlight: ${params.service}\n`;
  prompt += `Location: ${params.location}\n`;
  prompt += `Tone: ${params.tone}\n`;
  
  if (params.keywords.length > 0) {
    prompt += `Keywords to include: ${params.keywords.join(", ")}\n`;
  }
  
  if (params.customPhrases.length > 0) {
    prompt += `Try to use these phrases: ${params.customPhrases.join(", ")}\n`;
  }
  
  if (params.blacklistedPhrases.length > 0) {
    prompt += `Do NOT use these phrases: ${params.blacklistedPhrases.join(", ")}\n`;
  }
  
  if (params.preferredCtas.length > 0) {
    prompt += `End with one of these calls-to-action: ${params.preferredCtas.join(" OR ")}\n`;
  }
  
  if (params.hashtags.length > 0) {
    prompt += `Include relevant hashtags from: ${params.hashtags.join(", ")}\n`;
  }
  
  if (params.locationKeywords.length > 0) {
    prompt += `Location keywords to potentially include: ${params.locationKeywords.join(", ")}\n`;
  }
  
  if (params.mediaContext) {
    prompt += `This post will accompany an image of: ${params.mediaContext}\n`;
  }
  
  prompt += `\nRequirements:\n`;
  prompt += `- Keep it concise and engaging\n`;
  prompt += `- Sound authentic and local, not corporate\n`;
  prompt += `- Focus on quality and trust\n`;
  
  if (params.platform === "google_business") {
    prompt += `- Format for Google Business Profile (professional, informative)\n`;
    prompt += `- Include a clear call-to-action\n`;
  } else if (params.platform === "facebook") {
    prompt += `- Format for Facebook (conversational, community-focused)\n`;
    prompt += `- Encourage engagement (questions, reactions)\n`;
  } else if (params.platform === "instagram") {
    prompt += `- Format for Instagram (visual-first, lifestyle)\n`;
    prompt += `- Include relevant hashtags at the end\n`;
  }
  
  return prompt;
}
