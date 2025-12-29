/**
 * Pipeline Stage Prerequisite Rules
 * Defines what conditions must be met before a job can progress to each stage
 */

export type StagePrerequisite = {
  field: string;
  check: "exists" | "truthy" | "equals" | "has_related";
  value?: string | boolean | number;
  relatedTable?: string;
  relatedField?: string;
  message: string;
};

export type StageRule = {
  stage: string;
  label: string;
  prerequisites: StagePrerequisite[];
  canSkip?: boolean; // Some stages can be skipped (e.g., deposit if not required)
};

/**
 * Stage progression rules - defines what must be complete before moving to each stage
 * 
 * Check types:
 * - "truthy": Field must have a truthy value
 * - "exists": Field must exist and not be null
 * - "equals": Field must equal a specific value
 * - "has_related": Must have related records in another table
 */
export const JOB_STAGE_RULES: StageRule[] = [
  {
    stage: "new_enquiry",
    label: "New Enquiry",
    prerequisites: [], // Starting stage - no requirements
  },
  {
    stage: "contacted",
    label: "Contacted",
    prerequisites: [], // Just requires manual confirmation of contact
  },
  {
    stage: "survey_booked",
    label: "Survey Booked",
    prerequisites: [
      {
        field: "hasSurveyScheduled",
        check: "truthy",
        message: "A survey must be assigned and scheduled before marking as Survey Booked",
      },
    ],
  },
  {
    stage: "quoting",
    label: "Quoting",
    prerequisites: [], // Can start quoting anytime after contact
  },
  {
    stage: "quote_sent",
    label: "Quote Sent",
    prerequisites: [
      {
        field: "hasQuoteItems",
        check: "truthy",
        message: "Quote must have line items before it can be sent",
      },
      {
        field: "quotedValue",
        check: "truthy",
        message: "Quote must have a total value before it can be sent",
      },
    ],
  },
  {
    stage: "follow_up",
    label: "Follow-Up Due",
    prerequisites: [], // Can be set anytime for reminder purposes
    canSkip: true,
  },
  {
    stage: "quote_accepted",
    label: "Quote Accepted",
    prerequisites: [
      {
        field: "quoteResponse",
        check: "equals",
        value: "accepted",
        message: "Client must accept the quote first (update via Client Portal or manually)",
      },
    ],
  },
  {
    stage: "deposit_requested",
    label: "Deposit Requested",
    prerequisites: [
      {
        field: "depositRequired",
        check: "truthy",
        message: "Deposit must be configured on the job",
      },
      {
        field: "depositAmount",
        check: "truthy",
        message: "Deposit amount must be set",
      },
    ],
    canSkip: true, // Can skip if no deposit required
  },
  {
    stage: "deposit_paid",
    label: "Deposit Paid",
    prerequisites: [
      {
        field: "depositReceived",
        check: "truthy",
        message: "Deposit must be marked as received",
      },
    ],
    canSkip: true, // Can skip if no deposit required
  },
  {
    stage: "scheduled",
    label: "Scheduled",
    prerequisites: [
      {
        field: "hasWorkScheduled",
        check: "truthy",
        message: "Work must be scheduled on the calendar (Project Start event or confirmed schedule proposal)",
      },
    ],
  },
  {
    stage: "in_progress",
    label: "In Progress",
    prerequisites: [], // Manual confirmation of work starting
  },
  {
    stage: "completed",
    label: "Completed",
    prerequisites: [], // Manual confirmation of work completion
  },
  {
    stage: "invoice_sent",
    label: "Invoice Sent",
    prerequisites: [
      {
        field: "hasInvoice",
        check: "truthy",
        message: "An invoice must be created and sent before marking as Invoice Sent",
      },
    ],
  },
  {
    stage: "paid",
    label: "Paid",
    prerequisites: [
      {
        field: "isPaidInFull",
        check: "truthy",
        message: "Job must be paid in full before marking as Paid",
      },
    ],
  },
  {
    stage: "closed",
    label: "Closed",
    prerequisites: [], // Can close anytime (usually after paid)
  },
  {
    stage: "lost",
    label: "Lost",
    prerequisites: [], // Can mark as lost at any point
  },
];

/**
 * Get the rule for a specific stage
 */
export function getStageRule(stage: string): StageRule | undefined {
  return JOB_STAGE_RULES.find(r => r.stage === stage);
}

/**
 * Get the index of a stage in the pipeline
 */
export function getStageIndex(stage: string): number {
  return JOB_STAGE_RULES.findIndex(r => r.stage === stage);
}

/**
 * Check if moving from one stage to another is a forward progression
 */
export function isForwardProgression(fromStage: string, toStage: string): boolean {
  const fromIndex = getStageIndex(fromStage);
  const toIndex = getStageIndex(toStage);
  return toIndex > fromIndex;
}

/**
 * Stages that can be moved to from any other stage (escape hatches)
 */
export const UNRESTRICTED_TARGET_STAGES = ["lost", "closed", "follow_up"];

/**
 * Check if a stage can be reached without restrictions
 */
export function isUnrestrictedStage(stage: string): boolean {
  return UNRESTRICTED_TARGET_STAGES.includes(stage);
}
