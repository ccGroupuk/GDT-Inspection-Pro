import { storage } from "./storage";

const helpCategories = [
  {
    name: "Getting Started",
    description: "Quick start guides and essential information for new users",
    icon: "Rocket",
    audience: "admin",
    sortOrder: 1,
  },
  {
    name: "Job Management",
    description: "Managing jobs, pipeline stages, and job details",
    icon: "Briefcase",
    audience: "admin",
    sortOrder: 2,
  },
  {
    name: "Contacts & Partners",
    description: "Managing clients and trade partner relationships",
    icon: "Users",
    audience: "admin",
    sortOrder: 3,
  },
  {
    name: "Quotes & Pricing",
    description: "Creating quotes, pricing items, and templates",
    icon: "FileText",
    audience: "admin",
    sortOrder: 4,
  },
  {
    name: "Employee Management",
    description: "Staff management, timecards, and payroll",
    icon: "UserCog",
    audience: "admin",
    sortOrder: 5,
  },
  {
    name: "Financial Tracking",
    description: "Income, expenses, and financial reporting",
    icon: "PoundSterling",
    audience: "admin",
    sortOrder: 6,
  },
  {
    name: "Calendar & Scheduling",
    description: "Work calendar and event management",
    icon: "Calendar",
    audience: "admin",
    sortOrder: 7,
  },
  {
    name: "Tools & Vehicles",
    description: "Managing equipment, vehicles, and maintenance",
    icon: "Wrench",
    audience: "admin",
    sortOrder: 8,
  },
  {
    name: "SEO & Marketing",
    description: "AI-powered content generation and social media",
    icon: "TrendingUp",
    audience: "admin",
    sortOrder: 9,
  },
  {
    name: "Client Portal Guide",
    description: "Help for clients using their portal",
    icon: "User",
    audience: "client",
    sortOrder: 10,
  },
  {
    name: "Partner Portal Guide",
    description: "Help for trade partners using their portal",
    icon: "Handshake",
    audience: "partner",
    sortOrder: 11,
  },
];

const helpArticles = [
  // Getting Started
  {
    categoryName: "Getting Started",
    title: "Dashboard Overview",
    summary: "Understanding your CRM dashboard and key metrics",
    audience: "admin",
    sortOrder: 1,
    content: `# Dashboard Overview

Your dashboard is the command centre of your CRM, giving you an at-a-glance view of your entire business.

## Key Metrics

### Total Clients
Shows the number of contacts in your database. Click to view your full contacts list.

### Active Jobs
Displays jobs currently in progress. This includes all jobs from "Quoted" through to "Awaiting Final Payment" stages.

### Trade Partners
Your network of subcontractors and partners. Click to manage partner relationships.

### Pipeline Value
The total value of all active quotes and jobs. This helps you forecast cash flow.

## Quick Actions

- **New Job**: Create a new job directly from the dashboard
- **Global Search**: Press Ctrl+K to search across clients, jobs, and partners
- **Recent Activity**: View the latest updates across your business

## Navigation

Use the sidebar to access all areas:
- **Dashboard**: Return here anytime
- **Pipeline**: Visual job tracking
- **Jobs List**: All jobs in table format
- **Contacts**: Client management
- **Trade Partners**: Partner network
- **Calendar**: Work scheduling
- **Financials**: Income and expenses
- **Employees**: Staff management
- **Settings**: System configuration`,
  },
  {
    categoryName: "Getting Started",
    title: "Global Search",
    summary: "How to quickly find anything in your CRM",
    audience: "admin",
    sortOrder: 2,
    content: `# Global Search

The global search (Ctrl+K or Cmd+K) lets you find anything instantly.

## What You Can Search

- **Contacts**: Search by name, email, phone, or address
- **Jobs**: Search by title, address, or reference number
- **Trade Partners**: Search by business name or contact name
- **Employees**: Search by name or email

## Using Search

1. Press **Ctrl+K** (or click the search bar)
2. Start typing your search term
3. Results appear instantly as you type
4. Click a result to go directly to that record

## Search Tips

- Search is case-insensitive
- Partial matches work (e.g., "john" finds "Johnson")
- Search across multiple fields at once
- Recent searches are remembered for quick access`,
  },
  // Job Management
  {
    categoryName: "Job Management",
    title: "Job Pipeline Stages",
    summary: "Understanding the 16 job stages from enquiry to completion",
    audience: "admin",
    sortOrder: 1,
    content: `# Job Pipeline Stages

Your CRM tracks jobs through 16 stages, giving you complete visibility of every project.

## Stage Overview

### 1. Enquiry
Initial contact from a potential client. Gather requirements and schedule a site visit.

### 2. Site Visit Booked
Visit arranged to assess the job. Confirm date/time with client.

### 3. Site Visit Complete
Assessment done. Ready to prepare a quote.

### 4. Quote Sent
Quote delivered to client. Follow up if no response within 7 days.

### 5. Quoted
Quote is with the client awaiting their decision.

### 6. Quote Accepted
Client has approved the quote. Schedule the work.

### 7. Deposit Invoiced
Deposit invoice sent (if applicable).

### 8. Deposit Received
Deposit payment confirmed. Job ready to schedule.

### 9. Work Scheduled
Job has been added to the calendar.

### 10. Materials on Order
Required materials have been ordered.

### 11. In Progress
Work has commenced on site.

### 12. On Hold
Job temporarily paused (awaiting materials, client decision, etc.).

### 13. Snagging
Finishing touches and minor corrections.

### 14. Work Completed
All work finished on site.

### 15. Awaiting Final Payment
Final invoice sent, awaiting payment.

### 16. Job Complete
Payment received, job fully closed.

## Moving Jobs Between Stages

1. Open the job detail page
2. Click the current stage badge
3. Select the new stage
4. Add notes if needed

Or use the Pipeline view to drag and drop jobs between stages.`,
  },
  {
    categoryName: "Job Management",
    title: "Creating a New Job",
    summary: "Step-by-step guide to creating jobs",
    audience: "admin",
    sortOrder: 2,
    content: `# Creating a New Job

## Quick Create

1. Click **+ New Job** in the sidebar
2. Select an existing contact or create a new one
3. Enter the job title and address
4. Choose the service type
5. Set the initial stage (usually "Enquiry")
6. Click **Create Job**

## Job Details

### Required Fields
- **Contact**: Link to the client
- **Title**: Brief description (e.g., "Kitchen Extension")
- **Address**: Job site location
- **Service Type**: Category of work

### Optional Fields
- **Description**: Detailed scope of work
- **Estimated Value**: Expected job value
- **Source**: How the enquiry came in
- **Assigned Team**: Who will do the work

## After Creating

Once created, you can:
- Add quotes with line items
- Attach notes and photos
- Assign trade partners
- Schedule calendar events
- Track costs and invoices`,
  },
  {
    categoryName: "Job Management",
    title: "Job Notes and Photos",
    summary: "Documenting job progress with notes and images",
    audience: "admin",
    sortOrder: 3,
    content: `# Job Notes and Photos

Keep a complete record of every job with notes and photo attachments.

## Adding Notes

1. Open the job detail page
2. Scroll to the Notes section
3. Click **Add Note**
4. Enter your note content
5. Choose visibility level
6. Attach photos if needed
7. Click **Save**

## Visibility Levels

- **Internal**: Only visible to admin staff
- **Partner**: Visible to assigned trade partners
- **Client**: Visible to the client in their portal
- **All**: Visible to everyone

## Photo Attachments

- Click the camera icon to attach photos
- Multiple photos can be added per note
- Photos are stored securely in the cloud
- Clients and partners see photos based on note visibility

## Best Practices

- Add notes at key milestones
- Include photos of completed work
- Document any issues or changes
- Use appropriate visibility for each note`,
  },
  // Contacts & Partners
  {
    categoryName: "Contacts & Partners",
    title: "Managing Contacts",
    summary: "Adding and organising your client database",
    audience: "admin",
    sortOrder: 1,
    content: `# Managing Contacts

Your contacts are the foundation of your CRM - every job links to a contact.

## Adding a Contact

1. Go to **Contacts** in the sidebar
2. Click **Add Contact**
3. Enter name and contact details
4. Add address information
5. Click **Create**

## Contact Information

### Essential Details
- Full name
- Email address
- Phone number(s)
- Address

### Optional Details
- Company name
- Notes
- Tags for categorisation

## Client Portal Access

Give clients access to track their jobs:

1. Open the contact record
2. Click **Generate Portal Access**
3. Send the access link to the client
4. Client can now view job progress online

## Searching Contacts

- Use the search bar to find contacts
- Filter by tags or status
- Sort by name, date added, or job count`,
  },
  {
    categoryName: "Contacts & Partners",
    title: "Trade Partner Management",
    summary: "Managing subcontractors and trade partners",
    audience: "admin",
    sortOrder: 2,
    content: `# Trade Partner Management

Trade partners are your subcontractors and specialist suppliers.

## Adding a Partner

1. Go to **Trade Partners** in the sidebar
2. Click **Add Partner**
3. Enter business details
4. Add contact information
5. Select their trade categories
6. Set commission rates if applicable
7. Click **Create**

## Partner Details

### Business Information
- Business name
- Contact name
- Email and phone
- Address
- Trade categories (e.g., Plumbing, Electrical)

### Financial Settings
- Commission rate
- Payment terms
- Bank details

## Partner Portal Access

Give partners access to view their assigned jobs:

1. Open the partner record
2. Click **Generate Portal Access**
3. Send the access link
4. Partner can view job details, notes, and submit quotes

## Partner Rating System

Rate partners based on:
- Quality of work
- Reliability
- Communication
- Value for money

Ratings help you choose the best partners for each job.`,
  },
  {
    categoryName: "Contacts & Partners",
    title: "Partner Commissions and Fees",
    summary: "Tracking partner payments and commissions",
    audience: "admin",
    sortOrder: 3,
    content: `# Partner Commissions and Fees

Track what you owe partners and what they owe you.

## Commission Types

### Percentage-Based
Set a percentage of job value as commission. Calculated automatically.

### Fixed Fee
Set a fixed amount per job or per referral.

## Tracking Payments

1. Go to the partner record
2. View the **Financials** tab
3. See outstanding amounts
4. Record payments when made

## Partner Job Financials

For each job a partner works on:
- Agreed quote amount
- Payments made
- Outstanding balance
- Commission earned

## Fee Tracking

Track fees partners owe you:
- Lead fees
- Material markups
- Administration charges

All tracked in the partner's financial summary.`,
  },
  // Quotes & Pricing
  {
    categoryName: "Quotes & Pricing",
    title: "Creating Quotes",
    summary: "Building professional quotes with line items",
    audience: "admin",
    sortOrder: 1,
    content: `# Creating Quotes

Send professional, detailed quotes to your clients.

## Creating a Quote

1. Open the job detail page
2. Click **Create Quote**
3. Add line items
4. Apply discounts if needed
5. Set validity period
6. Preview and send

## Line Items

Each quote line includes:
- Description
- Quantity
- Unit price
- VAT rate
- Subtotal

### Adding Items
- Type a description and price
- Or use saved product catalog items
- Drag to reorder items

## Quote Options

### Discounts
- Percentage discount
- Fixed amount discount
- Applied to subtotal

### VAT/Tax
- Enable per-item VAT
- Set default VAT rate
- Automatic calculations

### Notes
- Terms and conditions
- Payment terms
- Special instructions

## Sending Quotes

- Email directly from the system
- Generate PDF download
- Client receives portal link
- Track when quote is viewed`,
  },
  {
    categoryName: "Quotes & Pricing",
    title: "Quote Templates",
    summary: "Creating reusable quote templates for common jobs",
    audience: "admin",
    sortOrder: 2,
    content: `# Quote Templates

Save time with pre-built templates for common job types.

## Creating a Template

1. Go to **Quote Templates**
2. Click **Create Template**
3. Name your template
4. Add standard line items
5. Save

## Using Templates

When creating a quote:
1. Click **Use Template**
2. Select a template
3. Items are automatically added
4. Adjust quantities/prices as needed

## Template Best Practices

- Create templates for each service type
- Include standard labour and materials
- Update prices regularly
- Use clear, consistent descriptions

## Example Templates

- Kitchen Installation
- Bathroom Renovation
- Deck Building
- General Carpentry (Day Rate)
- Emergency Callout`,
  },
  {
    categoryName: "Quotes & Pricing",
    title: "Product Catalog",
    summary: "Managing your catalog of products and services",
    audience: "admin",
    sortOrder: 3,
    content: `# Product Catalog

Build a catalog of your standard products, materials, and services.

## Adding Products

1. Go to **Product Catalog**
2. Click **Add Product**
3. Enter product details
4. Set default pricing
5. Save

## Product Details

- Name and description
- Category
- Default unit price
- Default VAT rate
- SKU/reference (optional)

## Using the Catalog

When creating quotes:
1. Click **Add from Catalog**
2. Search or browse products
3. Click to add to quote
4. Adjust quantity as needed

## Categories

Organise products by category:
- Labour
- Materials
- Fixtures & Fittings
- Subcontractor Services
- Equipment Hire`,
  },
  // Employee Management
  {
    categoryName: "Employee Management",
    title: "Adding Employees",
    summary: "Setting up employee profiles and access",
    audience: "admin",
    sortOrder: 1,
    content: `# Adding Employees

Set up your team members with appropriate access levels.

## Creating an Employee

1. Go to **Employees** in the sidebar
2. Click **Add Employee**
3. Enter personal details
4. Set role and access level
5. Configure hourly rate
6. Save

## Access Levels

### Owner
Full access to everything including billing and settings.

### Full Access
Access to all features except billing management.

### Standard
Day-to-day access - can view and update jobs, clock in/out.

### Limited
Basic access only - timecard and personal information.

## Employee Details

- Name and contact info
- Role/job title
- Hourly rate
- Start date
- Emergency contact

## Employee Login

Employees with Standard access or above can:
1. Log into the Employee Portal
2. Clock in/out
3. View their timecards
4. Access payslips`,
  },
  {
    categoryName: "Employee Management",
    title: "Time Tracking",
    summary: "Clock in/out and break tracking",
    audience: "admin",
    sortOrder: 2,
    content: `# Time Tracking

Track employee hours with the built-in timecard system.

## Clock In/Out

Employees clock in/out via the Employee Portal:
1. Log into Employee Portal
2. Click **Clock In** at start of shift
3. Take breaks using **Start Break** / **End Break**
4. Click **Clock Out** at end of day

## Viewing Timecards

As admin:
1. Go to **Employees**
2. Click an employee
3. View their **Timecard** tab
4. See daily hours and totals

## Timecard Details

Each entry shows:
- Clock in time
- Breaks taken
- Clock out time
- Total hours worked
- Notes/job references

## Manual Adjustments

If needed, admins can:
- Add missed clock-ins
- Correct times
- Add notes explaining changes
- Approve adjusted timecards`,
  },
  {
    categoryName: "Employee Management",
    title: "Payroll Processing",
    summary: "Generating and managing payroll",
    audience: "admin",
    sortOrder: 3,
    content: `# Payroll Processing

Generate payroll based on timecard hours.

## Generating Payroll

1. Go to **Employees** > **Payroll**
2. Select pay period
3. Review hours and rates
4. Make any adjustments
5. Click **Generate Payroll**

## Payroll Calculations

- Regular hours x hourly rate
- Overtime calculations (if applicable)
- Deductions
- Net pay

## Adjustments

Add adjustments for:
- Bonuses
- Expense reimbursements
- Deductions
- Corrections

## Payslips

Once generated:
- Employees can view in their portal
- Download PDF payslips
- Send via email (if enabled)

## Pay Period History

View all previous pay periods with:
- Total hours
- Total paid
- Individual breakdowns`,
  },
  // Financial Tracking
  {
    categoryName: "Financial Tracking",
    title: "Income and Expenses",
    summary: "Tracking your business finances",
    audience: "admin",
    sortOrder: 1,
    content: `# Income and Expenses

Keep track of your business finances in one place.

## Recording Income

Income is recorded when:
- Client payments are received
- Deposits are paid
- Final invoices are settled

### Adding Income
1. Go to **Financials**
2. Click **Add Transaction**
3. Select **Income**
4. Enter amount and details
5. Link to job (if applicable)
6. Save

## Recording Expenses

Track all business expenses:
- Materials purchases
- Tool and equipment
- Vehicle costs
- Subcontractor payments
- Insurance and overheads

### Adding Expenses
1. Go to **Financials**
2. Click **Add Transaction**
3. Select **Expense**
4. Choose category
5. Enter amount and details
6. Save

## Categories

Organise transactions by category:
- Materials
- Labour
- Subcontractors
- Tools & Equipment
- Vehicle Expenses
- Insurance
- Marketing
- Other`,
  },
  {
    categoryName: "Financial Tracking",
    title: "Monthly Overview",
    summary: "Understanding your monthly financial summary",
    audience: "admin",
    sortOrder: 2,
    content: `# Monthly Overview

See your business performance at a glance.

## Dashboard Metrics

### Total Income
All payments received this month.

### Total Expenses
All costs incurred this month.

### Net Profit
Income minus expenses.

### Cash Flow
Running balance throughout the month.

## Monthly Breakdown

View by:
- Day-by-day totals
- Category breakdown
- Job-by-job profitability

## Comparison

Compare against:
- Previous month
- Same month last year
- Monthly average

## Reports

Generate reports for:
- Tax purposes
- Accountant review
- Business planning`,
  },
  // Calendar & Scheduling
  {
    categoryName: "Calendar & Scheduling",
    title: "Work Calendar",
    summary: "Managing your work schedule",
    audience: "admin",
    sortOrder: 1,
    content: `# Work Calendar

Schedule and manage all your work in one calendar.

## Calendar Views

- **Week View**: See the full week at a glance
- **Day View**: Detailed daily schedule
- **Month View**: Monthly overview

## Adding Events

1. Click on a date/time slot
2. Or click **Add Event**
3. Select the job
4. Choose team type:
   - In-House (your employees)
   - Partner (trade partner)
   - Hybrid (both)
5. Add start/end times
6. Add notes
7. Save

## Event Colours

Events are colour-coded:
- **Blue**: In-House team
- **Green**: Partner work
- **Purple**: Hybrid (both)

## Event Status

- **Tentative**: Pending confirmation
- **Confirmed**: Approved and scheduled
- **Completed**: Work finished

## Confirmation Workflow

1. Create event as Tentative
2. Notify relevant parties
3. Update to Confirmed when approved
4. Mark Complete when done`,
  },
  {
    categoryName: "Calendar & Scheduling",
    title: "Survey Booking System",
    summary: "Managing site survey appointments",
    audience: "admin",
    sortOrder: 2,
    content: `# Survey Booking System

Schedule and manage site surveys efficiently.

## Creating a Survey Booking

1. Open the job
2. Click **Book Survey**
3. Select date and time
4. Choose surveyor
5. Add notes for the visit
6. Save

## Survey Status

- **Scheduled**: Booked and confirmed
- **Completed**: Survey done
- **Cancelled**: Cancelled/rescheduled

## After the Survey

Once completed:
1. Mark survey as complete
2. Add notes and photos
3. Update job to "Quote Sent" stage
4. Create the quote

## Client Notifications

Clients can receive:
- Booking confirmation
- Reminder before survey
- Follow-up after survey`,
  },
  // Tools & Vehicles
  {
    categoryName: "Tools & Vehicles",
    title: "Tool Management",
    summary: "Tracking your tools and equipment",
    audience: "admin",
    sortOrder: 1,
    content: `# Tool Management

Keep track of all your tools and equipment.

## Adding Tools

1. Go to **Tools & Vehicles**
2. Click **Add Tool**
3. Enter tool details
4. Add purchase information
5. Set next service date
6. Save

## Tool Details

- Name and description
- Serial number
- Purchase date and price
- Assigned employee
- Condition status
- Service schedule

## Fault Reporting

When a tool has an issue:
1. Find the tool
2. Click **Report Fault**
3. Describe the problem
4. Set priority
5. Submit

Faults are tracked until resolved.

## Service Tracking

- Set service intervals
- Receive reminders
- Log service history
- Track service costs`,
  },
  {
    categoryName: "Tools & Vehicles",
    title: "Vehicle Management",
    summary: "Managing company vehicles and MOT reminders",
    audience: "admin",
    sortOrder: 2,
    content: `# Vehicle Management

Track your company vehicles with automatic MOT reminders.

## Adding Vehicles

1. Go to **Tools & Vehicles**
2. Click **Add Vehicle**
3. Enter registration and details
4. Set MOT expiry date
5. Set insurance renewal date
6. Save

## Vehicle Details

- Registration number
- Make and model
- Assigned driver
- MOT expiry date
- Insurance renewal
- Service schedule

## MOT Reminders

The system automatically:
- Tracks MOT expiry dates
- Sends reminders 30 days before
- Sends urgent alerts 7 days before
- Marks overdue MOTs

## Mileage Tracking

- Log mileage readings
- Track business vs personal miles
- Calculate running costs
- View mileage history`,
  },
  // SEO & Marketing
  {
    categoryName: "SEO & Marketing",
    title: "SEO Power House Overview",
    summary: "AI-powered content generation for your business",
    audience: "admin",
    sortOrder: 1,
    content: `# SEO Power House Overview

Generate professional marketing content with AI assistance.

## What It Does

The SEO Power House helps you:
- Create social media posts
- Write Google Business Profile updates
- Generate blog content ideas
- Maintain consistent brand voice

## Supported Platforms

- Google Business Profile
- Facebook
- Instagram

## Key Features

### Brand Voice
Set your brand personality and the AI matches your tone.

### Weekly Focus
Set a focus topic each week for themed content.

### Content Queue
Review, edit, and approve content before posting.

### Autopilot Mode
Automatically generate and schedule content.

## Getting Started

1. Go to **SEO Power House**
2. Configure your brand settings
3. Connect your social accounts
4. Generate your first content`,
  },
  {
    categoryName: "SEO & Marketing",
    title: "Content Generation",
    summary: "Creating and managing AI-generated content",
    audience: "admin",
    sortOrder: 2,
    content: `# Content Generation

Create professional marketing content with AI.

## Generating Content

1. Go to **SEO Power House** > **Content**
2. Click **Generate Content**
3. Choose platform (Google, Facebook, Instagram)
4. Select content type
5. Set your weekly focus topic
6. Click **Generate**

## Content Types

- Promotional posts
- Educational tips
- Behind-the-scenes
- Customer testimonials
- Seasonal content

## Review Process

1. AI generates draft content
2. Review in the content queue
3. Edit as needed
4. Approve or reject
5. Schedule for posting

## Autopilot Mode

Enable autopilot to:
- Generate content daily
- Follow your content mix settings
- Queue for review
- Or post automatically`,
  },
  // Client Portal Guide
  {
    categoryName: "Client Portal Guide",
    title: "Accessing Your Portal",
    summary: "How to log into your client portal",
    audience: "client",
    sortOrder: 1,
    content: `# Accessing Your Portal

Welcome to your CCC Group client portal!

## Logging In

1. Click the link in your welcome email
2. Or visit the portal URL provided
3. Enter your access token
4. You're in!

## What You Can Do

- View your current jobs
- Track job progress
- See quotes and accept them
- View photos and updates
- Send messages

## Portal Features

### Job Tracking
See exactly what stage your job is at, from enquiry through to completion.

### Quotes
View detailed quotes with line items. Accept quotes directly in the portal.

### Updates
See notes and photos from site visits and work progress.

### Messages
Communicate directly with the team.

## Need Help?

Contact us:
- Email: info@cccgroup.co.uk
- Phone: [Your phone number]`,
  },
  {
    categoryName: "Client Portal Guide",
    title: "Viewing Your Jobs",
    summary: "How to check your job progress",
    audience: "client",
    sortOrder: 2,
    content: `# Viewing Your Jobs

Track all your projects in one place.

## Job List

When you log in, you'll see all your jobs listed with:
- Job title
- Current stage
- Last update date

## Job Details

Click any job to see:
- Full description
- Current status
- Timeline of progress
- Notes and photos
- Quotes

## Understanding Stages

Your job moves through stages:
1. Enquiry - We've received your request
2. Site Visit - We'll visit to assess the work
3. Quote Sent - You'll receive our quote
4. Quote Accepted - You've approved the work
5. Scheduled - Work is booked in
6. In Progress - Work is underway
7. Completed - All done!

## Photos

View photos from:
- Site surveys
- Work in progress
- Completed work`,
  },
  {
    categoryName: "Client Portal Guide",
    title: "Accepting Quotes",
    summary: "How to review and accept quotes",
    audience: "client",
    sortOrder: 3,
    content: `# Accepting Quotes

Review and accept quotes easily in your portal.

## Viewing a Quote

1. Open the job
2. Click on the quote
3. Review line items
4. Check the total

## Quote Details

Each quote shows:
- Itemised breakdown
- Individual prices
- VAT if applicable
- Total amount

## Accepting a Quote

1. Review the quote carefully
2. Click **Accept Quote**
3. Confirm your acceptance
4. Done!

## What Happens Next

After you accept:
1. We'll be notified immediately
2. We'll schedule the work
3. You may receive a deposit invoice
4. Work will begin as planned

## Questions?

If you have questions about a quote:
- Use the portal messaging
- Call us directly
- Email us`,
  },
  // Partner Portal Guide
  {
    categoryName: "Partner Portal Guide",
    title: "Partner Portal Overview",
    summary: "Getting started with your partner portal",
    audience: "partner",
    sortOrder: 1,
    content: `# Partner Portal Overview

Welcome to your CCC Group partner portal!

## Logging In

1. Click the link in your welcome email
2. Enter your access credentials
3. You're in!

## What You Can See

- Jobs assigned to you
- Job details and requirements
- Notes and specifications
- Quote requests

## What You Can Do

- View job information
- Submit quotes
- Add notes
- Respond to callouts
- View your payment status

## Dashboard

Your dashboard shows:
- Active jobs
- Pending quote requests
- Recent activity
- Outstanding payments`,
  },
  {
    categoryName: "Partner Portal Guide",
    title: "Submitting Partner Quotes",
    summary: "How to submit quotes for jobs",
    audience: "partner",
    sortOrder: 2,
    content: `# Submitting Partner Quotes

When we request a quote, here's how to submit it.

## Quote Requests

You'll see quote requests for:
- Jobs matching your trade
- Jobs in your area
- Emergency callouts

## Submitting Your Quote

1. Open the job
2. Click **Submit Quote**
3. Enter your price
4. Add any notes
5. Submit

## Quote Details

Include:
- Your total price
- Breakdown if requested
- Estimated timeline
- Any conditions

## After Submitting

1. We review your quote
2. You'll be notified of decision
3. If accepted, job is confirmed
4. Payment terms as agreed

## Revising a Quote

If you need to revise:
1. Contact us
2. Explain the change
3. Submit updated quote`,
  },
  {
    categoryName: "Partner Portal Guide",
    title: "Emergency Callouts",
    summary: "Responding to emergency callout requests",
    audience: "partner",
    sortOrder: 3,
    content: `# Emergency Callouts

Respond quickly to emergency callout requests.

## How It Works

1. We send an emergency request
2. You receive notification
3. Acknowledge if available
4. Submit your response

## Acknowledging Callouts

When you receive a callout:
1. Open the callout details
2. Review the requirements
3. Click **Acknowledge** if available
4. Or decline if unavailable

## Response Options

- **Available**: You can attend
- **Unavailable**: You cannot attend
- **Partial**: You can help but with limitations

## Callout Details

Each callout includes:
- Job description
- Location
- Urgency level
- Required skills
- Contact information

## After Acknowledgement

1. We confirm the booking
2. You receive full details
3. Attend and complete work
4. Submit your invoice`,
  },
];

export async function seedHelpCenter() {
  console.log("[seed-help] Starting Help Center seed...");
  
  try {
    // Check if articles already exist
    const existingArticles = await storage.getHelpArticles();
    if (existingArticles.length > 0) {
      console.log(`[seed-help] Help Center already has ${existingArticles.length} articles. Skipping seed.`);
      return;
    }

    // Create categories first
    const categoryMap = new Map<string, string>();
    
    for (const cat of helpCategories) {
      console.log(`[seed-help] Creating category: ${cat.name}`);
      const created = await storage.createHelpCategory(cat);
      categoryMap.set(cat.name, created.id);
    }

    // Create articles
    for (const article of helpArticles) {
      const categoryId = categoryMap.get(article.categoryName);
      if (!categoryId) {
        console.log(`[seed-help] Warning: Category not found for article: ${article.title}`);
        continue;
      }

      console.log(`[seed-help] Creating article: ${article.title}`);
      await storage.createHelpArticle({
        categoryId,
        title: article.title,
        summary: article.summary,
        content: article.content,
        audience: article.audience,
        sortOrder: article.sortOrder,
        isPublished: true,
      });
    }

    console.log(`[seed-help] Help Center seeded with ${helpCategories.length} categories and ${helpArticles.length} articles`);
  } catch (error) {
    console.error("[seed-help] Error seeding Help Center:", error);
  }
}
