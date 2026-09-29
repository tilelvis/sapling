"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellRing, CalendarClock, Wallet, Sparkles, BellOff, Send,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatKsh, currentMonthIndex, MONTH_NAMES_FULL } from "@/lib/planner/engine";
import type { ProjectionResult, PlannerSettings, MonthRow } from "@/lib/planner/types";
import { useNotifications } from "./use-notifications";
import { toast } from "sonner";

interface Reminder {
  key: string;
  type: "monthly-saving" | "fee-approaching" | "fee-due" | "graduation";
  priority: "info" | "warning" | "urgent";
  title: string;
  detail: string;
  monthLabel: string;
  monthsAway: number;
  icon: typeof Bell;
}

/**
 * In-app fee reminders. Derives a list of upcoming reminders from the
 * projection + fee schedule. No push API needed — just a smart card that
 * shows what to act on this month.
 */
export function RemindersCard({
  projection, settings,
}: { projection: ProjectionResult; settings: PlannerSettings }) {
  const curIdx = currentMonthIndex(settings);
  const reminders = useMemo(() => buildReminders(projection, settings, curIdx), [projection, settings, curIdx]);

  const hasReminders = reminders.length > 0;
  const urgentCount = reminders.filter((r) => r.priority === "urgent").length;
  const warningCount = reminders.filter((r) => r.priority === "warning").length;

  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            urgentCount > 0 ? "bg-destructive/15 text-destructive pulse-ring" : "bg-accent text-accent-foreground",
          )}>
            {urgentCount > 0 ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </div>
          <h3 className="text-sm font-semibold">Reminders</h3>
        </div>
        {hasReminders && (
          <Badge variant="outline" className="text-[10px] tnum">
            {reminders.length} active
          </Badge>
        )}
      </div>

      {!hasReminders ? (
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <BellOff className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-[11px] text-muted-foreground">
            No active reminders. You're all caught up! 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto fancy-scroll">
          <AnimatePresence>
            {reminders.map((r) => (
              <ReminderRow key={r.key} reminder={r} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Summary line */}
      {hasReminders && (
        <div className="mt-2 text-center text-[10px] text-muted-foreground">
          {urgentCount > 0 && (
            <span className="text-destructive font-medium">
              {urgentCount} urgent{warningCount > 0 ? ", " : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-chart-3 font-medium">
              {warningCount} warning{urgentCount > 0 ? "" : ""}
            </span>
          )}
          {urgentCount === 0 && warningCount === 0 && (
            <span>{reminders.length} info reminder(s)</span>
          )}
        </div>
      )}
    </Card>
  );
}

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const { type, priority, title, detail, monthLabel, monthsAway } = reminder;
  const Icon = reminder.icon;
  const { notify, permission } = useNotifications();

  const toneCls = {
    info: "border-primary/20 bg-primary/5 text-primary",
    warning: "border-chart-3/30 bg-chart-3/5 text-chart-3",
    urgent: "border-destructive/30 bg-destructive/5 text-destructive",
  }[priority];

  const handleSendNotification = () => {
    if (permission !== "granted") {
      toast.info("Enable notifications first (see the opt-in card above)");
      return;
    }
    const sent = notify(title, { body: detail });
    if (sent) {
      toast.success("Reminder sent to your device");
    } else {
      toast.error("Could not send notification");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={cn("rounded-lg border p-2.5", toneCls)}
    >
      <div className="flex items-start gap-2">
        <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", toneCls)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">{title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
              {monthLabel}
            </Badge>
            {monthsAway > 0 && (
              <span className="text-[9px] text-muted-foreground tnum">
                {monthsAway} mo away
              </span>
            )}
            {priority === "urgent" && permission === "granted" && (
              <button
                onClick={handleSendNotification}
                className="ml-auto text-[9px] flex items-center gap-0.5 text-foreground hover:text-primary"
                aria-label="Send notification"
              >
                <Send className="h-2.5 w-2.5" />
                Notify
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function buildReminders(
  projection: ProjectionResult,
  settings: PlannerSettings,
  curIdx: number,
): Reminder[] {
  const reminders: Reminder[] = [];
  const now = new Date();
  const curMonth = projection.months[curIdx];
  if (!curMonth) return reminders;

  // 1. Monthly saving reminder (always active — this month's saving)
  reminders.push({
    key: "monthly-saving",
    type: "monthly-saving",
    priority: "info",
    title: `Save ${formatKsh(settings.monthlySaving)} this month`,
    detail: `Your regular monthly contribution for ${curMonth.monthLabel}.`,
    monthLabel: curMonth.monthLabel,
    monthsAway: 0,
    icon: Wallet,
  });

  // 2. Fee reminders — for each upcoming fee, create a reminder
  //    that escalates in priority as it approaches.
  for (const fee of projection.cushion.upcomingFees) {
    const monthsAway = fee.monthsAway;
    let priority: Reminder["priority"];
    let title: string;
    let detail: string;

    if (monthsAway <= 1) {
      priority = "urgent";
      title = `${fee.feeLabel} due now`;
      detail = `${formatKsh(fee.feeAmount)} withdrawal this month. Confirm your MMF has enough.`;
    } else if (monthsAway <= 3) {
      priority = "urgent";
      title = `${fee.feeLabel} due in ${monthsAway} months`;
      detail = `${formatKsh(fee.feeAmount)} — projected balance ${formatKsh(Math.round(fee.projectedBalanceAtFee))}. ${
        fee.gap > 0
          ? `Gap of ${formatKsh(Math.round(fee.gap))}. Increase saving now.`
          : "On track to cover."
      }`;
    } else if (monthsAway <= 6) {
      priority = "warning";
      title = `${fee.feeLabel} in ${monthsAway} months`;
      detail = `${formatKsh(fee.feeAmount)} due ${fee.monthLabel}. ${
        fee.gap > 0
          ? `Projected gap: ${formatKsh(Math.round(fee.gap))}.`
          : "Projected to be covered."
      }`;
    } else {
      priority = "info";
      title = `${fee.feeLabel} coming up`;
      detail = `${formatKsh(fee.feeAmount)} due ${fee.monthLabel} (${monthsAway} months away).`;
    }

    reminders.push({
      key: `fee-${fee.monthIndex}`,
      type: monthsAway <= 1 ? "fee-due" : "fee-approaching",
      priority,
      title,
      detail,
      monthLabel: fee.monthLabel,
      monthsAway,
      icon: CalendarClock,
    });
  }

  // 3. Shortfall reminder — if there's a projected shortfall
  if (projection.hasShortfall && projection.minBalanceMonth) {
    const shortfallMonth = projection.minBalanceMonth;
    const monthsToShortfall = shortfallMonth.monthIndex - curIdx;
    reminders.push({
      key: "shortfall",
      type: "fee-approaching",
      priority: "urgent",
      title: `Balance goes negative in ${shortfallMonth.monthLabel}`,
      detail: `Projected deficit of ${formatKsh(Math.round(projection.shortfallAmount))}. Increase saving to ${formatKsh(projection.requiredMonthlySaving)}/mo to fix.`,
      monthLabel: shortfallMonth.monthLabel,
      monthsAway: Math.max(0, monthsToShortfall),
      icon: Sparkles,
    });
  }

  // Sort by priority (urgent → warning → info), then by monthsAway
  const priorityOrder = { urgent: 0, warning: 1, info: 2 };
  reminders.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.monthsAway - b.monthsAway;
  });

  return reminders;
}
