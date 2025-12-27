# CCC Group CRM

## Overview
A professional CRM system for Cardiff & Caerphilly Carpentry (CCC Group). The system manages clients, jobs, trade partners, and tasks with a visual pipeline for tracking job progress.

## Current State
- **Version**: MVP Complete + Quote Builder + Job Notes with Attachments
- **Last Updated**: December 2024
- **Status**: Fully functional CRM with persistent data storage, detailed quoting, and job notes with photo attachments

## Core Features

### Dashboard
- Overview stats: Active Jobs, Total Contacts, Trade Partners, Pipeline Value
- Recent jobs list with status badges
- Quick stats for in-progress, pending deposits, partner vs in-house jobs

### Job Pipeline
- Kanban board view with 16 pipeline stages
- List view alternative
- Filter by delivery type (In-House, Partner, Hybrid)
- Search by job number, client, postcode, or service type
- Automatic job number generation (CCC-YY-XXXX format)

### Contacts
- Client management with name, phone, email, address, postcode
- Search and filter functionality
- Create, edit, delete operations

### Trade Partners
- Partner profiles with business info, trade category, coverage areas
- Commission tracking (percentage or fixed)
- Insurance verification status
- Rating system (1-5 stars)
- Active/Inactive status
- Portal invite system: Send invites, track status, open portal for partner

### Tasks
- Task management linked to jobs
- Priority levels (Low, Medium, High)
- Status tracking (Pending, Completed)
- Due date tracking with overdue indicators

### Quote Builder
- Detailed itemized quoting with line items
- Each line item: description, quantity, unit price, auto-calculated line total
- Tax toggle with configurable VAT rate (default 20%)
- Discount options: percentage or fixed amount
- Live calculation of subtotal, discount, tax, and grand total
- Quote items displayed on admin job detail and client portal
- Bulk save endpoint for atomic quote item updates

### Job Notes with Attachments
- Notes with photo attachments for each job
- Four visibility levels: internal (admin only), partner, client, all
- Photo upload via Replit Object Storage with presigned URLs
- Admin toggles to share quotes and notes with partners
- Notes displayed on admin job detail page with full CRUD
- Partner portal shows notes when sharing is enabled (filtered by visibility)

### Client Portal
- Separate portal for clients to view their job progress
- Invite system: Admin sends email invites from contacts page
- Token-based authentication (separate from admin Replit Auth)
- Job list view showing client's projects only
- Visual 16-stage progress timeline on job detail page
- Payment requests section (deposit prompts, balance due)
- Profile management page
- Reviews page with configurable social media links (Facebook, Google, Trustpilot)

### Partner Portal
- Separate portal for trade partners to view their assigned jobs
- Invite system: Admin sends portal invites from Trade Partners page
- Token-based authentication (7-day invite expiry, 30-day access tokens)
- Job list view showing partner's assigned projects only
- Job detail page with client contact info, job notes, and tasks
- Visual 16-stage progress timeline on job detail page
- Quote items displayed when admin enables quote sharing
- Job notes with photos displayed when admin enables notes sharing (filtered by visibility)
- Access via /partner-portal/* routes

### Settings (Admin)
- Company settings management
- Review URL configuration for social platforms
- Client portal invite management

## Project Architecture

```
client/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Shadcn UI components
│   │   ├── app-sidebar.tsx
│   │   ├── job-card.tsx
│   │   ├── stat-card.tsx
│   │   ├── status-badge.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── pages/
│   │   ├── dashboard.tsx
│   │   ├── jobs.tsx
│   │   ├── job-form.tsx
│   │   ├── job-detail.tsx
│   │   ├── contacts.tsx
│   │   ├── partners.tsx
│   │   └── tasks.tsx
│   ├── App.tsx
│   └── index.css

server/
├── db.ts                   # PostgreSQL connection
├── storage.ts              # Database storage layer
├── routes.ts               # API endpoints
└── index.ts

shared/
└── schema.ts               # Drizzle ORM schemas & types
```

## Technology Stack

- **Frontend**: React, TypeScript, TanStack Query, Wouter
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Build**: Vite

## API Endpoints

### Dashboard
- `GET /api/dashboard` - Dashboard data (jobs, contacts, partners, tasks)

### Contacts
- `GET /api/contacts` - List all contacts
- `GET /api/contacts/:id` - Get single contact
- `POST /api/contacts` - Create contact
- `PATCH /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Jobs
- `GET /api/jobs` - List all jobs with contacts and partners
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job
- `PATCH /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Quote Items
- `GET /api/jobs/:jobId/quote-items` - List quote items for a job
- `PUT /api/jobs/:jobId/quote-items` - Bulk update quote items (replaces all items)

### Trade Partners
- `GET /api/partners` - List all partners
- `GET /api/partners/:id` - Get single partner
- `POST /api/partners` - Create partner
- `PATCH /api/partners/:id` - Update partner
- `DELETE /api/partners/:id` - Delete partner

### Job Notes
- `GET /api/jobs/:jobId/notes` - List notes for a job (with attachments)
- `POST /api/jobs/:jobId/notes` - Create note
- `PATCH /api/jobs/:jobId/notes/:noteId` - Update note
- `DELETE /api/jobs/:jobId/notes/:noteId` - Delete note
- `POST /api/jobs/:jobId/notes/:noteId/attachments` - Add attachment to note
- `DELETE /api/notes/attachments/:attachmentId` - Remove attachment

### Partner Sharing
- `PATCH /api/jobs/:jobId/share-quote` - Toggle quote sharing with partner
- `PATCH /api/jobs/:jobId/share-notes` - Toggle notes sharing with partner

### Partner Portal API
- `GET /api/partner-portal/jobs/:jobId/quote-items` - Get quote items (if sharing enabled)
- `GET /api/partner-portal/jobs/:jobId/notes` - Get notes (if sharing enabled, filtered by visibility)

### Tasks
- `GET /api/tasks` - List all tasks with jobs
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Pipeline Stages
1. New Enquiry
2. Contacted
3. Survey Booked
4. Quoting
5. Quote Sent
6. Follow-Up Due
7. Quote Accepted
8. Deposit Requested
9. Deposit Paid
10. Scheduled
11. In Progress
12. Completed
13. Invoice Sent
14. Paid
15. Closed
16. Lost

## Service Types
- Bespoke Carpentry
- Under-Stairs Storage
- Media Walls
- Fitted Wardrobes
- Kitchens / Joinery
- Bathrooms
- Plumbing
- Electrical
- Heating
- Drains
- Full Home Project
- Other

## Delivery Types
- **In-House**: Jobs handled by CCC team
- **Partner**: Jobs assigned to trade partners
- **Hybrid**: Combined CCC + Partner work

## Database Commands
- Push schema: `npm run db:push`
- Force push: `npm run db:push --force`

## User Preferences
- Light/Dark theme toggle
- Collapsible sidebar navigation
