"use client";

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import type { ProjectionResult, PlannerSettings } from "@/lib/planner/types";
import { UpcomingFeesCard } from "./cushion-card";
import { RemindersCard } from "./reminders-card";
import { VarianceCard } from "./variance-card";
import { StreakCard } from "./streak-card";
import { AchievementsCard } from "./achievements-card";
import type { QuickLinkKey } from "./quick-link-bar";

interface SectionSheetProps {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  section: QuickLinkKey | null;
  projection: ProjectionResult;
  settings: PlannerSettings;
}

const TITLES: Record<QuickLinkKey, string> = {
  fees: "Upcoming fees",
  alerts: "Reminders & alerts",
  variance: "Plan vs Actual",
  streak: "Saving streak",
  awards: "Achievements",
};

const DESCRIPTIONS: Record<QuickLinkKey, string> = {
  fees: "All scheduled fee withdrawals with projected balance and gap analysis.",
  alerts: "Action items: monthly saving, upcoming fees, and shortfall warnings.",
  variance: "How your actual MMF balance compares to the planned projection.",
  streak: "Your consecutive completed months and 48-month calendar heatmap.",
  awards: "Badges you've unlocked for hitting saving milestones.",
};

/**
 * Bottom sheet that renders any of the secondary sections (fees, alerts,
 * variance, streak, awards) on demand. Keeps the main dashboard clean —
 * these sections live here instead of cluttering the scroll.
 */
export function SectionSheet({
  open, onOpenChange, section, projection, settings,
}: SectionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto fancy-scroll">
        {section && (
          <>
            <SheetHeader>
              <SheetTitle className="text-left">{TITLES[section]}</SheetTitle>
              <SheetDescription className="text-left">{DESCRIPTIONS[section]}</SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              {section === "fees" && <UpcomingFeesCard cushion={projection.cushion} />}
              {section === "alerts" && <RemindersCard projection={projection} settings={settings} />}
              {section === "variance" && <VarianceCard projection={projection} />}
              {section === "streak" && <StreakCard projection={projection} settings={settings} />}
              {section === "awards" && <AchievementsCard projection={projection} settings={settings} />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
