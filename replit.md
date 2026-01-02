# CCC Group CRM

## Overview
A professional CRM system for Cardiff & Caerphilly Carpentry (CCC Group) designed to manage clients, jobs, trade partners, and tasks. It features a visual pipeline for job tracking, detailed quoting, financial tracking, a work calendar, and integrated portals for clients, partners, and employees. The system also includes advanced functionalities like AI-powered SEO content generation and automated scheduling to enhance business operations and market presence.

## User Preferences
- I prefer simple language and clear explanations.
- I want iterative development with regular check-ins.
- Ask for confirmation before implementing major changes or new features.
- Provide detailed explanations for complex technical decisions.
- Do not make changes to the `client/src/components/ui/` folder without explicit instruction.
- I prefer a clean, readable code style with consistent formatting.
- I prefer to be presented with options and their implications before decisions are made.
- Light/Dark theme toggle for UI.
- Collapsible sidebar navigation.

## System Architecture
The CRM is built with a clear separation of concerns, utilizing a modern web stack. The frontend is developed with React and TypeScript, styled with Tailwind CSS and Shadcn UI, providing a responsive and intuitive user experience. The backend leverages Node.js with Express.js to expose a comprehensive API. Data persistence is handled by PostgreSQL, managed through Drizzle ORM.

**Key Features:**
- **Dashboard**: Provides an overview of business metrics, active jobs, contacts, trade partners, and pipeline value.
- **Job Pipeline**: A Kanban board and list view for tracking job progress through 16 defined stages, with filtering and search capabilities.
- **Contact & Partner Management**: Comprehensive CRUD operations for clients and trade partners, including commission tracking and a partner rating system.
- **Task Management**: Job-linked tasks with priority levels and due date tracking.
- **Quote Builder**: Detailed itemized quoting with real-time calculations, tax, and discount options.
- **Job Notes & Attachments**: Notes with photo attachments, featuring four visibility levels (internal, partner, client, all) and integration with Replit Object Storage for uploads.
- **Client & Partner Portals**: Separate, token-authenticated portals allowing clients to track job progress, accept quotes, and manage profiles, and partners to view assigned jobs, notes, and quotes.
- **Portal Messaging**: Admin-to-portal messaging system with various message types, urgency levels, and quick templates.
- **Help Center**: Admin-managed knowledge base with categorised articles, Markdown support, video embeds, and audience targeting for different user roles.
- **Employee Management**: Profiles, role assignments, time tracking (clock in/out, break tracking), and a payroll system with automatic generation and adjustments. Includes a dedicated employee portal.
- **Financial Tracking**: Monthly overview of income, expenses, and profit, with manual and auto-generated transactions, cash flow forecasting, and specific handling for partner job financials.
- **Work Calendar**: Week-based scheduling with color-coded team types (In-House, Partner, Hybrid) and a confirmation workflow for events.
- **SEO Power House**: AI-powered content generation and social media management for Google Business Profile, Facebook, and Instagram. Features include business profile configuration, brand voice customization, weekly focus settings, and a content queue workflow.
- **Autopilot Mode**: Automated content generation and scheduling, configurable per platform with posting schedules and content mix distribution. Includes a daily cron scheduler for content generation and reminders.

**UI/UX Decisions:**
- **Theming**: Supports light/dark mode.
- **Components**: Utilizes Shadcn UI for consistent, accessible, and reusable components.
- **Navigation**: Features a collapsible sidebar for efficient navigation.

**Technical Implementations:**
- **Frontend**: React, TypeScript, TanStack Query for data fetching, Wouter for routing.
- **Backend**: Express.js for RESTful APIs, Node.js runtime.
- **Database**: PostgreSQL for relational data storage, Drizzle ORM for type-safe database interactions.
- **Authentication**: Multi-layered security with:
  - Replit OAuth for project owners (requires linked employee record OR whitelist)
  - Employee login with HttpOnly, secure, SameSite=strict cookies
  - Token-based authentication for client/partner portals
  - Rate limiting on login endpoints (10 attempts per 15-minute window per IP)
  - Global API middleware protecting all admin routes
- **Photo Storage**: Replit Object Storage with presigned URLs for secure and efficient image handling.
- **AI Integration**: Utilizes Replit AI Integrations for SEO content generation, abstracting direct API key management.

## Security Configuration
- **REPLIT_ADMIN_USER_IDS**: Optional environment variable containing comma-separated Replit user IDs that are whitelisted for admin access without needing an employee record.
- **Authorization Flow**: Replit OAuth users must either have a linked employee record (matching email) with owner/full_access level, OR be in the REPLIT_ADMIN_USER_IDS whitelist.
- **Session Management**: Employee sessions expire after 8 hours and are stored as HttpOnly cookies.

## External Dependencies
- **Replit Object Storage**: Used for storing job note attachments (photos).
- **OpenAI (via Replit AI Integrations)**: Powers the SEO content generation and social media management features.
- **PostgreSQL**: The primary database for all application data.
- **YouTube/Loom**: Supported for video embeds within Help Center articles.
- **Resend (Email)**: Transactional email service for sending login credentials, portal access links, reminders, and notifications. Backend ready in `server/email.ts` - requires `RESEND_API_KEY` secret or Replit Resend integration to enable.

## Email Notifications
- **Email (Resend)**: Transactional email service fully integrated with templates for:
  - Employee login credentials
  - Client portal access links
  - Partner portal access links
  - Job reminders
  - Quote notifications
  - Invoice notifications
  - Job status updates
  - Portal message notifications
  - Generic emails
  
  **Automatic Client Notifications:** The system automatically emails clients (who have email AND portal access) when:
  - A quote is sent to their portal
  - An invoice is sent to their portal  
  - Their job status changes to: scheduled, in_progress, completed, awaiting_materials, on_hold, or final_inspection
  - An admin sends them a portal message
  
  Notifications use a non-blocking async pattern to ensure main operations complete even if email fails.
  
  To configure: Replit's Resend integration is already set up. The `EMAIL_FROM` env var can customize the sender address (default: `CCC Group <noreply@cccgroup.co.uk>`).

## Future Business Plans (Saved December 2024)

The owner is exploring commercializing this CRM for other carpentry/construction businesses. Two approaches have been evaluated:

### Option A: Full Multi-Tenant SaaS
- Convert to shared database with tenant isolation (tenant ID on all 70+ tables)
- **Effort:** 4-6 months development
- **Requires:** New auth system, billing integration (Stripe), onboarding flows, tenant provisioning
- **Best for:** High volume of customers, lower per-customer hosting costs at scale
- **Complexity:** High - every query must enforce tenant isolation

### Option B: Clone & Manage Model (Recommended Starting Point)
- Clone the app for each customer as a separate Replit instance
- **Effort:** 1-2 sessions to create template version, ~30 mins per new customer setup
- **Revenue Model:** One-time setup fee + monthly management fee
- **Best for:** Validating market demand, premium service, fewer customers initially
- **Complexity:** Low - current app already works

### Preparation Steps for Option B (To Do):
1. Create a "template" version with CCC Group data removed and generic sample data
2. Add simple branding configuration (company name, logo, primary colors)
3. Document the customer setup checklist
4. Define pricing structure (setup fee + monthly management)

### Per-Customer Setup Process:
1. Clone the template Repl
2. Create new PostgreSQL database
3. Configure company details and branding
4. Set up their custom domain (optional)
5. Create initial admin employee account

**Status:** Planning to start implementation next week (January 2025).

## AI Bridge & Knowledge System (January 2025)

The AI Bridge feature provides an integrated AI coding assistant with deep codebase understanding:

### Knowledge Indexing System (`server/github-knowledge.ts`)
- **Comprehensive File Scanning**: Scans ALL .ts/.tsx files in pages, components, hooks, lib, server, and shared directories
- **Smart Summaries**: Generates intelligent summaries for each file including:
  - Exports and imports
  - UI components used (JSX elements)
  - API calls (queries and mutations)
  - Feature-specific descriptions
- **Import Relationship Mapping**: Builds a component map showing which files import which other files
- **Dynamic Feature Discovery**: Automatically groups files by feature area (dashboard, pipeline, finance, etc.)
- **Version History**: Creates snapshots before each refresh for restore capability

### How It Works
1. User clicks "Refresh Knowledge" in AI Bridge
2. System scans GitHub repo via API
3. Generates manifest (file tree), summaries, and relationships
4. AI receives full context in system prompt (~20k tokens)
5. AI can now accurately identify which files to modify for any request

### Key Files
- `server/github-knowledge.ts` - Knowledge generation and management
- `server/github.ts` - GitHub API integration
- `client/src/pages/ai-bridge.tsx` - AI Bridge UI with chat, file browser, commits

### Token Budget
- Max context: 20,000 tokens
- Includes: manifest, component relationships, file summaries, feature chunks
- Prioritizes: pages > components > server > shared