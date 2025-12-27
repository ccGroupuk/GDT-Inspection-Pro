# CCC Group CRM

## Overview
A professional CRM system for Cardiff & Caerphilly Carpentry (CCC Group). The system manages clients, jobs, trade partners, and tasks with a visual pipeline for tracking job progress.

## Current State
- **Version**: MVP Complete
- **Last Updated**: December 2024
- **Status**: Fully functional CRM with persistent data storage

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

### Tasks
- Task management linked to jobs
- Priority levels (Low, Medium, High)
- Status tracking (Pending, Completed)
- Due date tracking with overdue indicators

### Client Portal
- Separate portal for clients to view their job progress
- Invite system: Admin sends email invites from contacts page
- Token-based authentication (separate from admin Replit Auth)
- Job list view showing client's projects only
- Visual 16-stage progress timeline on job detail page
- Payment requests section (deposit prompts, balance due)
- Profile management page
- Reviews page with configurable social media links (Facebook, Google, Trustpilot)

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

### Trade Partners
- `GET /api/partners` - List all partners
- `GET /api/partners/:id` - Get single partner
- `POST /api/partners` - Create partner
- `PATCH /api/partners/:id` - Update partner
- `DELETE /api/partners/:id` - Delete partner

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
