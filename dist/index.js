var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  engineers: () => engineers,
  insertEngineerSchema: () => insertEngineerSchema,
  insertInspectionSchema: () => insertInspectionSchema,
  inspections: () => inspections,
  selectEngineerSchema: () => selectEngineerSchema,
  selectInspectionSchema: () => selectInspectionSchema
});
import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
var engineers = pgTable("engineers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("engineer"),
  createdAt: timestamp("created_at").defaultNow()
});
var inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  engineerId: integer("engineer_id").notNull().references(() => engineers.id),
  clientName: text("client_name").notNull(),
  address: text("address").notNull(),
  date: timestamp("date").defaultNow(),
  status: text("status").notNull().default("pending"),
  // pending, completed
  data: jsonb("data").$type(),
  createdAt: timestamp("created_at").defaultNow()
});
var insertEngineerSchema = createInsertSchema(engineers);
var selectEngineerSchema = createSelectSchema(engineers);
var insertInspectionSchema = createInsertSchema(inspections);
var selectInspectionSchema = createSelectSchema(inspections);

// server/storage.ts
import session from "express-session";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set, using in-memory storage");
}
var pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
var db = process.env.DATABASE_URL ? drizzle(pool, { schema: schema_exports }) : null;

// server/storage.ts
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
var PostgresSessionStore = connectPg(session);
var MemoryStore = createMemoryStore(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  async getEngineer(id) {
    const [engineer] = await db.select().from(engineers).where(eq(engineers.id, id));
    return engineer;
  }
  async getEngineerByUsername(username) {
    const [engineer] = await db.select().from(engineers).where(eq(engineers.username, username));
    return engineer;
  }
  async createEngineer(insertEngineer) {
    const [engineer] = await db.insert(engineers).values(insertEngineer).returning();
    return engineer;
  }
  async createInspection(insertInspection) {
    const [inspection] = await db.insert(inspections).values(insertInspection).returning();
    return inspection;
  }
  async getInspection(id) {
    const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
    return inspection;
  }
  async getInspectionsByEngineer(engineerId) {
    return await db.select().from(inspections).where(eq(inspections.engineerId, engineerId));
  }
  async updateInspection(id, inspection) {
    const [updated] = await db.update(inspections).set(inspection).where(eq(inspections.id, id)).returning();
    return updated;
  }
};
var MemStorage = class {
  engineers;
  inspections;
  currentId;
  currentInspectionId;
  sessionStore;
  constructor() {
    this.engineers = /* @__PURE__ */ new Map();
    this.inspections = /* @__PURE__ */ new Map();
    this.currentId = 1;
    this.currentInspectionId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 864e5
    });
  }
  async getEngineer(id) {
    return this.engineers.get(id);
  }
  async getEngineerByUsername(username) {
    return Array.from(this.engineers.values()).find(
      (engineer) => engineer.username === username
    );
  }
  async createEngineer(insertEngineer) {
    const id = this.currentId++;
    const engineer = {
      ...insertEngineer,
      id,
      role: insertEngineer.role ?? "engineer",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.engineers.set(id, engineer);
    return engineer;
  }
  async createInspection(insertInspection) {
    const id = this.currentInspectionId++;
    const inspection = {
      ...insertInspection,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      date: insertInspection.date ? new Date(insertInspection.date) : /* @__PURE__ */ new Date(),
      status: insertInspection.status ?? "pending",
      data: insertInspection.data ?? null
    };
    this.inspections.set(id, inspection);
    return inspection;
  }
  async getInspection(id) {
    return this.inspections.get(id);
  }
  async getInspectionsByEngineer(engineerId) {
    return Array.from(this.inspections.values()).filter(
      (inspection) => inspection.engineerId === engineerId
    );
  }
  async updateInspection(id, inspection) {
    const existing = this.inspections.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...inspection };
    this.inspections.set(id, updated);
    return updated;
  }
};
var storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

// server/auth.ts
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "super secret secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore
  };
  if (app2.get("env") === "production") {
    app2.set("trust proxy", 1);
  }
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getEngineerByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getEngineer(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getEngineerByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createEngineer({
        ...req.body,
        password: hashedPassword
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/routes.ts
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/inspections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    const inspections2 = await storage.getInspectionsByEngineer(user.id);
    res.json(inspections2);
  });
  app2.get("/api/inspections/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    const id = parseInt(req.params.id);
    const inspection = await storage.getInspection(id);
    if (!inspection) return res.sendStatus(404);
    if (inspection.engineerId !== user.id) return res.sendStatus(403);
    res.json(inspection);
  });
  app2.post("/api/inspections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    const newInspection = await storage.createInspection({
      ...req.body,
      engineerId: user.id,
      status: req.body.status || "pending"
    });
    res.status(201).json(newInspection);
  });
  app2.patch("/api/inspections/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    const id = parseInt(req.params.id);
    const existing = await storage.getInspection(id);
    if (!existing) return res.sendStatus(404);
    if (existing.engineerId !== user.id) return res.sendStatus(403);
    const updated = await storage.updateInspection(id, req.body);
    res.json(updated);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    middlewareMode: true,
    fs: {
      allow: [".."]
    },
    proxy: {
      "/api": {
        target: "http://localhost:5004",
        changeOrigin: true
      }
    }
  }
});

// server/vite.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...createLogger(),
      info: (msg) => {
        if (msg.includes("restarting server...")) {
          return;
        }
        console.info(msg);
      }
    },
    server: {
      middlewareMode: true,
      hmr: { server },
      fs: {
        allow: [".."]
      }
    },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = fs.readFileSync(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = 5004;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
