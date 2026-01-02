// server/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Middleware to validate request data against a Zod schema.
 * It checks req.body, req.query, and req.params.
 *
 * @param schema The Zod schema to validate against.
 * @returns An Express middleware function.
 */
export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Attempt to parse and validate all relevant parts of the request
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next(); // If validation passes, move to the next middleware/route handler
    } catch (error) {
      if (error instanceof ZodError) {
        // If it's a Zod validation error, return a 400 Bad Request with error details
        return res.status(400).json({
          message: 'Validation failed.',
          errors: error.errors.map(err => ({
            path: err.path.join('.'), // Joins path array to a string (e.g., "body.name")
            message: err.message,
          })),
        });
      }
      // For any other unexpected errors during validation
      console.error('Validation middleware error:', error);
      res.status(500).json({ message: 'Internal server error during validation.' });
    }
  };


---

// Add these ENUMS near the top of your schema.ts where other enums are defined,
// or after other core Drizzle imports.
// Example: after 'pgTable', 'serial', etc. imports

export const proposalStatusEnum = pgEnum('proposal_status', ['pending', 'accepted', 'rejected', 'cancelled']);
export const eventTypeEnum = pgEnum('event_type', ['survey', 'installation', 'meeting', 'other']);


// Add these table and relations definitions.
// You can typically place these after your `jobs` and `contacts` definitions,
// but before other related tables if the order matters for Drizzle relations.

export const scheduleProposals = pgTable('schedule_proposals', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobs.id).notNull(),
  tradePartnerId: integer('trade_partner_id').references(() => tradePartners.id), // Optional, can be internal survey
  contactId: integer('contact_id').references(() => contacts.id).notNull(), // The client requesting the survey/appointment
  proposedDateTime: timestamp('proposed_date_time', { withTimezone: true }).notNull(),
  type: eventTypeEnum('type').default('survey').notNull(), // e.g., 'survey', 'installation'
  status: proposalStatusEnum('status').default('pending').notNull(), // pending, accepted, rejected, cancelled
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scheduleProposalsRelations = relations(scheduleProposals, ({ one }) => ({
  job: one(jobs, {
    fields: [scheduleProposals.jobId],
    references: [jobs.id],
  }),
  tradePartner: one(tradePartners, {
    fields: [scheduleProposals.tradePartnerId],
    references: [tradePartners.id],
  }),
  contact: one(contacts, {
    fields: [scheduleProposals.contactId],
    references: [contacts.id],
  }),
}));

export const calendarEvents = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  start: timestamp('start', { withTimezone: true }).notNull(),
  end: timestamp('end', { withTimezone: true }).notNull(),
  allDay: boolean('all_day').default(false).notNull(),
  jobId: integer('job_id').references(() => jobs.id),
  contactId: integer('contact_id').references(() => contacts.id),
  tradePartnerId: integer('trade_partner_id').references(() => tradePartners.id),
  type: eventTypeEnum('type').default('other').notNull(), // 'survey', 'installation', 'meeting', 'other'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  job: one(jobs, {
    fields: [calendarEvents.jobId],
    references: [jobs.id],
  }),
  contact: one(contacts, {
    fields: [calendarEvents.contactId],
    references: [contacts.id],
  }),
  tradePartner: one(tradePartners, {
    fields: [calendarEvents.tradePartnerId],
    references: [tradePartners.id],
  }),
}));

// Remember to add 'proposalStatusEnum', 'eventTypeEnum', 'scheduleProposals',
// and 'calendarEvents' to your exports at the bottom of the schema.ts file
// if you want them accessible elsewhere in your application.
