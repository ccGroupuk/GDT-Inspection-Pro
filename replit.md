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