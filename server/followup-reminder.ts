import { storage } from "./storage.js";
import { notificationService } from "./notifications.js";

type SchedulerHandle = {
  stop: () => void;
};

const DEFAULT_INTERVAL_MINUTES = parseInt(
  process.env.FOLLOWUP_REMINDER_INTERVAL_MINUTES || "60",
  10,
);

const MAX_BATCH_SIZE = parseInt(
  process.env.FOLLOWUP_REMINDER_BATCH_LIMIT || "250",
  10,
);

function getTodayRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function processDueFollowUps() {
  const { start, end } = getTodayRange();

  const leads = await storage.findLeadsDueForFollowup(start, end, MAX_BATCH_SIZE);
  if (leads.length === 0) {
    return;
  }

  console.log(
    `🔔 Follow-up scheduler: found ${leads.length} lead(s) with follow-up dates for today (${start.toISOString().split("T")[0]}).`,
  );

  for (const lead of leads) {
    if (!lead.userId || !lead.nextFollowupDate) {
      continue;
    }

    const followUpDate = lead.nextFollowupDate
      ? new Date(lead.nextFollowupDate).toISOString().split("T")[0]
      : null;

    if (!followUpDate) {
      continue;
    }

    const alreadySent = await storage.hasFollowUpNotification(
      lead.userId,
      lead.id,
      followUpDate,
    );

    if (alreadySent) {
      continue;
    }

    const user = await storage.getUser(lead.userId);
    if (!user || !user.email) {
      console.warn(
        `Follow-up reminder skipped for lead ${lead.id} - user not found or email missing.`,
      );
      continue;
    }

    try {
      await notificationService.notifyFollowUpReminder(
        lead.userId,
        user.email,
        lead.name ?? "Lead",
        lead.id,
        followUpDate,
      );
    } catch (error) {
      console.error(
        `Failed to send follow-up reminder for lead ${lead.id} (user ${lead.userId}):`,
        error,
      );
    }
  }
}

export function startFollowUpReminderScheduler(): SchedulerHandle | null {
  if (process.env.DISABLE_FOLLOWUP_REMINDERS === "true") {
    console.log("🔕 Follow-up reminder scheduler disabled via DISABLE_FOLLOWUP_REMINDERS.");
    return null;
  }

  const intervalMinutes = Number.isFinite(DEFAULT_INTERVAL_MINUTES) && DEFAULT_INTERVAL_MINUTES > 0
    ? DEFAULT_INTERVAL_MINUTES
    : 60;
  const intervalMs = Math.max(intervalMinutes, 5) * 60 * 1000;

  const runScheduler = async () => {
    try {
      await processDueFollowUps();
    } catch (error) {
      console.error("Follow-up reminder scheduler error:", error);
    }
  };

  // Run once on startup after small delay to let server initialize
  setTimeout(runScheduler, 30 * 1000);

  const timer = setInterval(runScheduler, intervalMs);
  console.log(
    `⏱️ Follow-up reminder scheduler started. Interval: ${intervalMinutes} minute(s).`,
  );

  return {
    stop: () => {
      clearInterval(timer);
    },
  };
}



