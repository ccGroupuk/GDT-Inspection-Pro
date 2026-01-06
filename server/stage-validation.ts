/**
 * Stage Validation Service
 * Evaluates job prerequisites before allowing stage transitions
 */

import { db } from "./db";
import {
  jobs,
  quoteItems,
  jobSurveys,
  calendarEvents,
  invoices,
  jobScheduleProposals,
  financialTransactions,
  jobClientPayments
} from "@shared/schema";
import {
  JOB_STAGE_RULES,
  getStageRule,
  isUnrestrictedStage,
  isForwardProgression,
  type StagePrerequisite
} from "@shared/stage-rules";
import { eq, and, sql } from "drizzle-orm";

export type PrerequisiteResult = {
  field: string;
  passed: boolean;
  message: string;
};

export type StageValidationResult = {
  allowed: boolean;
  currentStage: string;
  targetStage: string;
  unmetPrerequisites: PrerequisiteResult[];
  allPrerequisites: PrerequisiteResult[];
};

/**
 * Get enriched job data with computed fields for prerequisite checks
 */
async function getEnrichedJobData(jobId: string) {
  try {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
    if (!job) return null;

    const [quoteItemsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(quoteItems)
      .where(eq(quoteItems.jobId, jobId));

    const [surveyResult] = await db
      .select()
      .from(jobSurveys)
      .where(
        and(
          eq(jobSurveys.jobId, jobId),
          sql`${jobSurveys.status} IN ('scheduled', 'completed')`
        )
      );

    const [workEventResult] = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.jobId, jobId),
          eq(calendarEvents.eventType, "project_start")
        )
      );

    const [confirmedScheduleResult] = await db
      .select()
      .from(jobScheduleProposals)
      .where(
        and(
          eq(jobScheduleProposals.jobId, jobId),
          sql`${jobScheduleProposals.status} IN ('confirmed', 'scheduled')`
        )
      );

    const [invoiceResult] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.jobId, jobId),
          eq(invoices.type, "invoice"),
          sql`${invoices.status} != 'draft'`
        )
      );

    const [paymentsResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.jobId, jobId),
          eq(financialTransactions.type, "income"),
          eq(financialTransactions.sourceType, "job_payment")
        )
      );

    const [clientPaymentsResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(jobClientPayments)
      .where(eq(jobClientPayments.jobId, jobId));

    const quotedValue = parseFloat(String(job.quotedValue)) || 0;
    const finTxParams = parseFloat(paymentsResult?.total || "0");
    const clientPaymentsTotal = parseFloat(clientPaymentsResult?.total || "0");
    const paidAmount = finTxParams + clientPaymentsTotal;

    return {
      ...job,
      hasQuoteItems: (quoteItemsResult?.count || 0) > 0,
      hasSurveyScheduled: !!surveyResult,
      hasWorkScheduled: !!workEventResult || !!confirmedScheduleResult,
      hasInvoice: !!invoiceResult,
      isPaidInFull: quotedValue > 0 && paidAmount >= quotedValue,
      paidAmount,
    };
  } catch (error) {
    console.error("Error getting enriched job data:", error);
    return null;
  }
}

/**
 * Check if a single prerequisite is met
 */
function checkPrerequisite(
  prereq: StagePrerequisite,
  jobData: Record<string, unknown>
): PrerequisiteResult {
  const fieldValue = jobData[prereq.field];
  let passed = false;

  switch (prereq.check) {
    case "truthy":
      passed = !!fieldValue;
      break;
    case "exists":
      passed = fieldValue !== null && fieldValue !== undefined;
      break;
    case "equals":
      passed = fieldValue === prereq.value;
      break;
    case "has_related":
      // For has_related, we expect the field to contain a count or boolean
      passed = !!fieldValue;
      break;
  }

  return {
    field: prereq.field,
    passed,
    message: prereq.message,
  };
}

/**
 * Validate if a job can move to a target stage
 */
export async function validateStageTransition(
  jobId: string,
  targetStage: string
): Promise<StageValidationResult> {
  const jobData = await getEnrichedJobData(jobId);

  if (!jobData) {
    return {
      allowed: false,
      currentStage: "",
      targetStage,
      unmetPrerequisites: [{ field: "job", passed: false, message: "Job not found" }],
      allPrerequisites: [],
    };
  }

  const currentStage = jobData.status;

  // Allow unrestricted stages (lost, closed, follow_up) from any state
  if (isUnrestrictedStage(targetStage)) {
    return {
      allowed: true,
      currentStage,
      targetStage,
      unmetPrerequisites: [],
      allPrerequisites: [],
    };
  }

  // Allow backward movement without restrictions
  if (!isForwardProgression(currentStage, targetStage)) {
    return {
      allowed: true,
      currentStage,
      targetStage,
      unmetPrerequisites: [],
      allPrerequisites: [],
    };
  }

  // Get the target stage rule
  const rule = getStageRule(targetStage);
  if (!rule) {
    return {
      allowed: true,
      currentStage,
      targetStage,
      unmetPrerequisites: [],
      allPrerequisites: [],
    };
  }

  // Check all prerequisites
  const allPrerequisites = rule.prerequisites.map(prereq =>
    checkPrerequisite(prereq, jobData as Record<string, unknown>)
  );

  const unmetPrerequisites = allPrerequisites.filter(p => !p.passed);

  // Check if stage can be skipped (e.g., deposit stages when no deposit required)
  let canSkip = false;
  if (rule.canSkip) {
    // For deposit-related stages, check if deposit is not required
    if (targetStage === "deposit_requested" || targetStage === "deposit_paid") {
      canSkip = !jobData.depositRequired;
    }
  }

  return {
    allowed: unmetPrerequisites.length === 0 || canSkip,
    currentStage,
    targetStage,
    unmetPrerequisites: canSkip ? [] : unmetPrerequisites,
    allPrerequisites,
  };
}

/**
 * Get all stage prerequisites for a job (for UI display)
 */
export async function getJobStageReadiness(jobId: string) {
  const jobData = await getEnrichedJobData(jobId);

  if (!jobData) {
    return null;
  }

  const currentStage = jobData.status;

  // Check each stage's prerequisites
  const stageReadiness = JOB_STAGE_RULES.map(rule => {
    const prerequisites = rule.prerequisites.map(prereq =>
      checkPrerequisite(prereq, jobData as Record<string, unknown>)
    );

    const allMet = prerequisites.every(p => p.passed);
    const isCurrentStage = rule.stage === currentStage;
    const isUnrestricted = isUnrestrictedStage(rule.stage);

    // Check if can skip
    let canSkip = false;
    if (rule.canSkip) {
      if (rule.stage === "deposit_requested" || rule.stage === "deposit_paid") {
        canSkip = !jobData.depositRequired;
      }
    }

    return {
      stage: rule.stage,
      label: rule.label,
      isCurrentStage,
      canProgress: allMet || isUnrestricted || canSkip,
      prerequisites,
      canSkip,
    };
  });

  return {
    jobId,
    currentStage,
    stages: stageReadiness,
    jobData: {
      quotedValue: jobData.quotedValue,
      depositRequired: jobData.depositRequired,
      depositReceived: jobData.depositReceived,
      quoteResponse: jobData.quoteResponse,
      hasQuoteItems: jobData.hasQuoteItems,
      hasSurveyScheduled: jobData.hasSurveyScheduled,
      hasWorkScheduled: jobData.hasWorkScheduled,
      hasInvoice: jobData.hasInvoice,
      isPaidInFull: jobData.isPaidInFull,
    },
  };
}
