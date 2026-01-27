import cron from "node-cron";
import { storage } from "./storage";
import { log } from "./index";
import { sendMotReminder, isEmailConfigured } from "./email";

interface AutopilotGenerationResult {
  slotsCreated: number;
  postsCreated: number;
  errors: string[];
}

async function runAutopilotGeneration(): Promise<AutopilotGenerationResult> {
  const result: AutopilotGenerationResult = {
    slotsCreated: 0,
    postsCreated: 0,
    errors: [],
  };

  try {
    const settings = await storage.getSeoAutopilotSettings();
    if (!settings || !settings.enabled) {
      log("Autopilot is disabled, skipping generation", "scheduler");
      return result;
    }

    log("Starting autopilot content generation...", "scheduler");

    const businessProfile = await storage.getSeoBusinessProfile();
    const brandVoice = await storage.getSeoBrandVoice();
    const focusList = await storage.getSeoWeeklyFocusList();
    const activeFocus = focusList.find(f => f.status === "active");

    const daysAhead = settings.autoGenerateAhead || 7;

    const platforms = [
      {
        name: "facebook",
        enabled: settings.facebookEnabled,
        preferredDays: settings.facebookPreferredDays || ["monday", "wednesday", "friday"],
        preferredTime: settings.facebookPreferredTime || "09:00",
      },
      {
        name: "instagram",
        enabled: settings.instagramEnabled,
        preferredDays: settings.instagramPreferredDays || ["tuesday", "thursday", "saturday"],
        preferredTime: settings.instagramPreferredTime || "18:00",
      },
      {
        name: "google_business",
        enabled: settings.googleEnabled,
        preferredDays: settings.googlePreferredDays || ["monday", "thursday"],
        preferredTime: settings.googlePreferredTime || "12:00",
      },
    ];

    const weights = [
      { type: "project_showcase", weight: settings.projectShowcaseWeight || 40 },
      { type: "before_after", weight: settings.beforeAfterWeight || 20 },
      { type: "tip", weight: settings.tipsWeight || 15 },
      { type: "testimonial", weight: settings.testimonialWeight || 15 },
      { type: "seasonal", weight: settings.seasonalWeight || 10 },
    ];

    const selectContentType = () => {
      const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
      let random = Math.random() * totalWeight;
      for (const w of weights) {
        random -= w.weight;
        if (random <= 0) return w.type;
      }
      return "project_showcase";
    };

    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const platform of platforms) {
      if (!platform.enabled) continue;

      for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() + dayOffset);
        const currentDayName = dayNames[checkDate.getDay()];

        if (platform.preferredDays.includes(currentDayName)) {
          const [hours, minutes] = (platform.preferredTime || "09:00").split(":").map(Number);
          const scheduledFor = new Date(checkDate);
          scheduledFor.setHours(hours, minutes, 0, 0);

          const existingSlots = await storage.getSeoAutopilotSlotsByDateRange(
            new Date(scheduledFor.getTime() - 60000),
            new Date(scheduledFor.getTime() + 60000)
          );

          const hasExisting = existingSlots.some(s => s.platform === platform.name);
          if (hasExisting) continue;

          const contentType = selectContentType();

          const slot = await storage.createSeoAutopilotSlot({
            platform: platform.name,
            scheduledFor,
            contentType,
            status: "pending",
            weeklyFocusId: activeFocus?.id,
          });
          result.slotsCreated++;

          try {
            const OpenAI = (await import("openai")).default;
            const client = new OpenAI({
              apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
              baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
            });

            const service = activeFocus?.primaryService || businessProfile?.servicesOffered?.[0] || "Bespoke Carpentry";
            const location = activeFocus?.primaryLocation || businessProfile?.serviceLocations?.[0] || "Cardiff";

            const prompt = buildContentPrompt({
              platform: platform.name,
              postType: contentType,
              service,
              location,
              tone: brandVoice?.emojiStyle || "professional",
              businessName: businessProfile?.businessName || "CCC Group",
              tradeType: businessProfile?.tradeType || "Carpentry & Home Improvements",
              customPhrases: brandVoice?.customPhrases || [],
              blacklistedPhrases: brandVoice?.blacklistedPhrases || [],
              preferredCtas: brandVoice?.preferredCTAs || [],
              hashtags: brandVoice?.hashtagPreferences || [],
              mediaContext: activeFocus?.focusImageCaption || undefined,
            });

            const completion = await client.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: "You are a social media content creator for a local trade business. Write engaging, professional posts that highlight quality work and build local community trust." },
                { role: "user", content: prompt },
              ],
              max_completion_tokens: 500,
            });

            const generatedContent = completion.choices[0]?.message?.content || "";

            const post = await storage.createSeoContentPost({
              platform: platform.name,
              postType: contentType,
              content: generatedContent,
              status: settings.requireApproval ? "pending_review" : "approved",
              source: "autopilot",
              scheduledFor,
              weeklyFocusId: activeFocus?.id,
              mediaUrls: activeFocus?.focusImageUrl ? [activeFocus.focusImageUrl] : undefined,
            });
            result.postsCreated++;

            await storage.updateSeoAutopilotSlot(slot.id, {
              contentPostId: post.id,
              status: "generated",
            });
          } catch (aiError) {
            const errorMessage = aiError instanceof Error ? aiError.message : "AI generation failed";
            result.errors.push(`Slot ${slot.id}: ${errorMessage}`);
            log(`AI generation error for slot ${slot.id}: ${errorMessage}`, "scheduler");
          }
        }
      }
    }

    await storage.createSeoAutopilotRun({
      slotsGenerated: result.slotsCreated,
      postsCreated: result.postsCreated,
      status: result.errors.length > 0 ? "partial" : "success",
      errorMessage: result.errors.length > 0 ? result.errors.join("; ") : undefined,
      details: JSON.stringify({
        daysAhead,
        platforms: platforms.filter(p => p.enabled).map(p => p.name),
      }),
    });

    log(`Autopilot generation complete: ${result.slotsCreated} slots, ${result.postsCreated} posts`, "scheduler");
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log(`Autopilot generation failed: ${errorMessage}`, "scheduler");
    
    await storage.createSeoAutopilotRun({
      status: "failed",
      errorMessage,
    });

    result.errors.push(errorMessage);
    return result;
  }
}

function buildContentPrompt(params: {
  platform: string;
  postType: string;
  service: string;
  location: string;
  tone: string;
  businessName: string;
  tradeType: string;
  customPhrases: string[];
  blacklistedPhrases: string[];
  preferredCtas: string[];
  hashtags: string[];
  mediaContext?: string;
}): string {
  let prompt = `Write a ${params.platform} post for ${params.businessName}, a ${params.tradeType} business.\n\n`;
  
  prompt += `Post type: ${params.postType}\n`;
  prompt += `Service to highlight: ${params.service}\n`;
  prompt += `Location: ${params.location}\n`;
  prompt += `Tone: ${params.tone}\n`;
  
  if (params.customPhrases.length > 0) {
    prompt += `Try to use these phrases: ${params.customPhrases.join(", ")}\n`;
  }
  
  if (params.blacklistedPhrases.length > 0) {
    prompt += `Do NOT use these phrases: ${params.blacklistedPhrases.join(", ")}\n`;
  }
  
  if (params.preferredCtas.length > 0) {
    prompt += `End with one of these calls-to-action: ${params.preferredCtas.join(" OR ")}\n`;
  }
  
  if (params.hashtags.length > 0) {
    prompt += `Include relevant hashtags from: ${params.hashtags.join(", ")}\n`;
  }
  
  if (params.mediaContext) {
    prompt += `This post will accompany a photo/image showing: ${params.mediaContext}\n`;
  }
  
  prompt += "\nKeep the post concise and engaging. For Facebook/Instagram, aim for 100-150 words. For Google Business Profile, aim for 50-100 words.";
  
  return prompt;
}

async function runMotReminderCheck(): Promise<{ tasksCreated: number; emailsSent: number }> {
  const result = { tasksCreated: 0, emailsSent: 0 };
  
  try {
    // Prefetch all data once to avoid O(n^2) queries
    const assets = await storage.getAssets();
    const vehicles = assets.filter(a => a.type === "vehicle" && a.motDate);
    const employees = await storage.getEmployees();
    const existingTasks = await storage.getTasks();
    const allReminders = await storage.getAssetReminders();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    for (const vehicle of vehicles) {
      if (!vehicle.motDate) continue;
      
      const motDate = new Date(vehicle.motDate);
      motDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((motDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only process if within 7 days or overdue
      if (daysUntilDue > 7) continue;
      
      // Check if task already exists for this MOT (prefetched)
      const hasExistingTask = existingTasks.some(t => 
        t.title?.includes(`MOT: ${vehicle.name}`) && 
        t.status !== "completed"
      );
      
      if (!hasExistingTask) {
        // Create a task for the MOT reminder with dueDate set to MOT date
        await storage.createTask({
          title: `MOT: ${vehicle.name} ${daysUntilDue < 0 ? '(OVERDUE)' : `due in ${daysUntilDue} days`}`,
          description: `Vehicle ${vehicle.registrationNumber || vehicle.name} has an MOT expiring on ${motDate.toLocaleDateString('en-GB')}. Please schedule the MOT test.`,
          priority: daysUntilDue <= 0 ? "urgent" : daysUntilDue <= 3 ? "high" : "medium",
          status: "pending",
          dueDate: motDate,
          assignedTo: vehicle.assignedToId || null,
        });
        result.tasksCreated++;
        log(`Created MOT reminder task for ${vehicle.name}`, "scheduler");
      }
      
      // Send email if assigned to an employee and email is configured
      if (isEmailConfigured() && vehicle.assignedToId) {
        const assignee = employees.find(e => e.id === vehicle.assignedToId);
        if (assignee?.email) {
          // Only send email once per week - check using notifiedAt field (prefetched)
          const hasRecentEmail = allReminders.some(r => 
            r.assetId === vehicle.id && 
            r.reminderType === "mot_expiry" &&
            r.notifiedAt && 
            new Date(r.notifiedAt).getTime() > oneWeekAgo.getTime()
          );
          
          if (!hasRecentEmail) {
            const emailResult = await sendMotReminder(
              assignee.email,
              assignee.firstName,
              vehicle.name,
              vehicle.registrationNumber || "N/A",
              motDate.toLocaleDateString('en-GB'),
              daysUntilDue
            );
            
            if (emailResult.success) {
              // Create a reminder record to track we sent an email
              await storage.createAssetReminder({
                assetId: vehicle.id,
                reminderType: "mot_expiry",
                dueDate: motDate,
                notified: true,
                notifiedAt: new Date(),
              });
              result.emailsSent++;
              log(`Sent MOT reminder email to ${assignee.email} for ${vehicle.name}`, "scheduler");
            }
          }
        }
      }
    }
    
    log(`MOT reminder check complete: ${result.tasksCreated} tasks created, ${result.emailsSent} emails sent`, "scheduler");
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log(`MOT reminder check failed: ${errorMessage}`, "scheduler");
    return result;
  }
}

export function initializeScheduler(): void {
  log("Initializing autopilot scheduler...", "scheduler");
  
  cron.schedule("0 6 * * *", async () => {
    log("Running scheduled autopilot generation (6 AM daily)", "scheduler");
    await runAutopilotGeneration();
    
    log("Running MOT reminder check (6 AM daily)", "scheduler");
    await runMotReminderCheck();
  });

  cron.schedule("0 12 * * *", async () => {
    log("Running midday autopilot check (12 PM daily)", "scheduler");
    const settings = await storage.getSeoAutopilotSettings();
    if (settings?.enabled) {
      const slots = await storage.getSeoAutopilotSlotsByStatus("approved");
      const now = new Date();
      
      for (const slot of slots) {
        const scheduledTime = new Date(slot.scheduledFor);
        if (scheduledTime <= now && !slot.postedAt) {
          log(`Reminder: Post for ${slot.platform} was scheduled for ${scheduledTime.toISOString()}`, "scheduler");
        }
      }
    }
  });

  log("Scheduler initialized: autopilot runs daily at 6 AM, reminders at 12 PM", "scheduler");
}

export { runMotReminderCheck };

export { runAutopilotGeneration };
