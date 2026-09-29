"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CalendarDays, GraduationCap, Settings as SettingsIcon, TreePine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjection, useSettings } from "./hooks";
import { DashboardView } from "./dashboard-view";
import { PlanView } from "./plan-view";
import { FeePlanView } from "./fee-plan-view";
import { SettingsView } from "./settings-view";
import { WhatIfProvider } from "./what-if-context";
import { DashboardSkeleton } from "./skeletons";
import { OnboardingWizard } from "./onboarding-wizard";
import { GoalCelebration } from "./goal-celebration";
import { QuickLinkBar } from "./quick-link-bar";
import { projectionToCsv, downloadCsv } from "@/lib/planner/csv";

export type ViewKey = "dashboard" | "plan" | "fees" | "settings";

const NAV: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Home", icon: LayoutDashboard },
  { key: "plan", label: "48 Months", icon: CalendarDays },
  { key: "fees", label: "Fees", icon: GraduationCap },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell() {
  const [view, setView] = useState<ViewKey>("dashboard");
  const projection = useProjection();
  const settings = useSettings();

  const handleExport = () => {
    if (!projection.data) return;
    const csv = projectionToCsv(projection.data.projection, projection.data.settings);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `forestry-tuition-plan-${date}.csv`);
  };

  return (
    <WhatIfProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Onboarding wizard for first-time users */}
        {settings.data && !settings.data.onboarded && <OnboardingWizard />}

        {/* Goal celebration when projected balance turns positive */}
        {projection.data && (
          <GoalCelebration
            finalBalance={projection.data.projection.finalBalance}
            hasShortfall={projection.data.projection.hasShortfall}
          />
        )}

        {/* Header — single row: logo + name + dropdown icons (fees/alerts/variance/streak/stars/export/theme) */}
        <header className="safe-top sticky top-0 z-30 border-b border-border/60 bg-card/90 backdrop-blur-md card-shadow">
          <div className="mx-auto w-full max-w-2xl px-3 py-1.5 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hero-shadow shrink-0">
              <TreePine className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xs font-semibold leading-tight truncate">
                {projection.data?.settings.studentName ?? "Forestry Student"}
              </h1>
              <div className="flex items-center gap-1 leading-tight">
                <FundingBadge status={projection.data?.projection.fundingStatus} />
              </div>
            </div>
            {/* Dropdown icons — each drops down a compact card listing its contents */}
            {projection.data && (
              <QuickLinkBar
                onExport={handleExport}
                projection={projection.data.projection}
                settings={projection.data.settings}
              />
            )}
          </div>
        </header>

        {/* Main scroll area */}
        <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-4 pb-28">
          {projection.isLoading ? (
            <DashboardSkeleton />
          ) : projection.isError ? (
            <ErrorState message={projection.error.message} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {view === "dashboard" && <DashboardView bundle={projection.data!} />}
                {view === "plan" && <PlanView bundle={projection.data!} />}
                {view === "fees" && <FeePlanView bundle={projection.data!} />}
                {view === "settings" && <SettingsView bundle={projection.data!} />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Footer (sticky bottom nav) */}
        <footer className="sticky bottom-0 z-30 border-t border-border/60 bg-card/95 backdrop-blur-lg safe-bottom card-shadow">
          <nav className="mx-auto w-full max-w-2xl px-2 py-1.5 grid grid-cols-4 gap-1">
            {NAV.map(({ key, label, icon: Icon }) => {
              const active = view === key;
              return (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 rounded-xl py-2 px-1 transition-colors",
                    "active:scale-95 transition-transform",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-primary/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                  <span className="relative text-[10px] font-medium">{label}</span>
                </button>
              );
            })}
          </nav>
        </footer>
      </div>
    </WhatIfProvider>
  );
}

function FundingBadge({ status }: { status?: "on-track" | "shortfall" | "surplus" }) {
  if (!status) return null;
  const map = {
    "on-track": { label: "On Track", cls: "bg-primary/15 text-primary border-primary/30", dot: "bg-primary" },
    "shortfall": { label: "Shortfall", cls: "bg-destructive/15 text-destructive border-destructive/30 pulse-ring", dot: "bg-destructive" },
    "surplus": { label: "Surplus", cls: "bg-chart-2/20 text-chart-3 border-chart-2/40", dot: "bg-chart-3" },
  } as const;
  const cfg = map[status];
  return (
    <span className={cn("hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold", cfg.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
      <p className="text-sm font-medium">Something went wrong</p>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
