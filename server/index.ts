import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { initializeScheduler } from "./scheduler";
import { seedProductionData } from "./seed";
import { seedHelpCenter } from "./seed-help-center";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// CORS configuration - allow cross-origin requests with credentials from Replit preview subdomains
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);
    // Allow any replit.dev or replit.app origins
    if (origin.includes('replit.dev') || origin.includes('replit.app') || origin.includes('localhost')) {
      return callback(null, origin);
    }
    // Allow same origin
    return callback(null, true);
  },
  credentials: true,  // Allow cookies to be sent
}));

app.use(cookieParser());

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("[startup] Beginning server initialization...");

    // Seed production data (ensures admin account exists)
    console.log("[startup] Seeding production data...");
    await seedProductionData();

    // Verify AI config
    if (process.env.GEMINI_API_KEY) {
      console.log("[startup] ✅ Gemini API Key detected.");
    } else {
      console.warn("[startup] ⚠️ GEMINI_API_KEY not found in environment. AI features will be disabled.");
    }

    // Seed Help Center articles
    console.log("[startup] Seeding help center...");
    await seedHelpCenter();

    console.log("[startup] Registering routes...");
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error("[error]", err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      console.log("[startup] Setting up static file serving for production...");
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "5000", 10);
    console.log(`[startup] Starting HTTP server on port ${port}...`);

    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        log(`serving on port ${port}`);
        console.log(`[startup] Server successfully started and listening on 0.0.0.0:${port}`);
        initializeScheduler();
      },
    );
  } catch (error) {
    console.error("[startup] FATAL: Server failed to start:", error);
    process.exit(1);
  }
})();
