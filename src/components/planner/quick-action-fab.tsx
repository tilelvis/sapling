"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, CalendarClock, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompleteMonthSheet } from "./complete-month-sheet";

interface QuickAction {
  key: string;
  label: string;
  icon: typeof Plus;
  onClick: () => void;
  tone: "primary" | "accent" | "neutral";
}

/**
 * Floating quick-action button (FAB) for the Dashboard.
 * Expands to show shortcuts: Complete this month, Jump to next fee, Settings.
 */
export function QuickActionFab({ currentMonthIndex }: { currentMonthIndex: number }) {
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Auto-close the expanded menu when the sheet opens, and hide the FAB
  // entirely while the sheet is open so it doesn't overlap the sheet UI.
  const handleOpenSheet = () => {
    setSheetOpen(true);
    setOpen(false);
  };

  const actions: QuickAction[] = [
    {
      key: "complete",
      label: "Complete this month",
      icon: CheckCircle2,
      onClick: handleOpenSheet,
      tone: "primary",
    },
    {
      key: "plan",
      label: "Jump to next fee",
      icon: CalendarClock,
      onClick: () => {
        // Navigate to the 48-month plan tab by dispatching a custom event
        // the AppShell listens for. Fallback: scroll to the nav.
        const navButton = document.querySelector('button[aria-label="48 Months"], nav button:nth-child(2)');
        if (navButton instanceof HTMLElement) {
          navButton.click();
        }
        setOpen(false);
      },
      tone: "accent",
    },
    {
      key: "settings",
      label: "Adjust saving",
      icon: SettingsIcon,
      onClick: () => {
        const navButton = document.querySelector('button[aria-label="Settings"], nav button:nth-child(4)');
        if (navButton instanceof HTMLElement) {
          navButton.click();
        }
        setOpen(false);
      },
      tone: "neutral",
    },
  ];

  return (
    <>
      {/* Floating action button — fixed bottom-right above the nav.
          Auto-hides when the CompleteMonthSheet is open to avoid overlap. */}
      <AnimatePresence>
        {!sheetOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2"
          >
        <AnimatePresence>
          {open && (
            <>
              {actions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.key}
                    initial={{ opacity: 0, scale: 0.6, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.6, y: 10 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={action.onClick}
                    className={cn(
                      "flex items-center gap-2 rounded-full pl-3 pr-4 py-2 shadow-lg text-xs font-medium",
                      "bg-card border border-border/60 active:scale-95 transition-transform",
                      action.tone === "primary" && "text-primary",
                      action.tone === "accent" && "text-accent-foreground",
                      action.tone === "neutral" && "text-foreground",
                    )}
                  >
                    <div className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full",
                      action.tone === "primary" && "bg-primary/15",
                      action.tone === "accent" && "bg-accent",
                      action.tone === "neutral" && "bg-muted",
                    )}>
                      <Icon className="h-3 w-3" />
                    </div>
                    {action.label}
                  </motion.button>
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Main FAB toggle */}
        <motion.button
          onClick={() => setOpen(!open)}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full shadow-xl text-white",
            "bg-gradient-to-br from-primary to-primary/80 hero-shadow",
            open && "rotate-45",
          )}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          aria-label={open ? "Close quick actions" : "Open quick actions"}
        >
          <Plus className="h-6 w-6" />
        </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete month sheet (opened by the "Complete this month" action) */}
      <CompleteMonthSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        monthIndex={currentMonthIndex}
      />
    </>
  );
}
