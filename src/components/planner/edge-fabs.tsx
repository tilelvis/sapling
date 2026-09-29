"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, Download, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EdgeFabsProps {
  currentMonthIndex: number;
  onCompleteMonth: () => void;
  onToggleWhatIf: () => void;
  whatIfEnabled: boolean;
  onExport: () => void;
  sheetOpen: boolean;
}

/**
 * Multiple floating action buttons on the right edge — a vertical stack.
 * ALWAYS fixed to the bottom — never folds with the cards.
 * - Bottom (primary, largest): Complete this month
 * - Middle: What-If toggle
 * - Top: Export CSV
 * Stays visible even when the CompleteMonthSheet is open (sheet renders above it).
 */
export function EdgeFabs({
  currentMonthIndex: _currentMonthIndex,
  onCompleteMonth,
  onToggleWhatIf,
  whatIfEnabled,
  onExport,
  sheetOpen,
}: EdgeFabsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="fixed bottom-20 right-3 z-30 flex flex-col items-end gap-2 pointer-events-none [&>button]:pointer-events-auto"
      style={{ opacity: sheetOpen ? 0.4 : 1, transition: "opacity 0.2s" }}
    >
      {/* Secondary FABs (expandable) */}
      <AnimatePresence>
        {expanded && (
          <>
            {/* Export */}
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: 0.05 }}
              onClick={onExport}
              whileTap={{ scale: 0.9 }}
              className="flex h-9 w-9 items-center justify-center rounded-full shadow-md bg-card border border-border/60 text-foreground"
              aria-label="Export to CSV"
            >
              <Download className="h-4 w-4" />
            </motion.button>

            {/* What-If toggle */}
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: 0.1 }}
              onClick={onToggleWhatIf}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full shadow-md border",
                whatIfEnabled
                  ? "bg-chart-2 text-white border-chart-2/40 pulse-ring-soft"
                  : "bg-card text-foreground border-border/60",
              )}
              aria-label="Toggle What-If slider"
            >
              <Sparkles className="h-4 w-4" />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Primary FAB: Complete month */}
      <motion.button
        onClick={onCompleteMonth}
        whileTap={{ scale: 0.9 }}
        className="flex h-12 w-12 items-center justify-center rounded-full shadow-xl text-white bg-gradient-to-br from-primary to-primary/80 hero-shadow"
        aria-label="Complete this month"
      >
        <CheckCircle2 className="h-5 w-5" />
      </motion.button>

      {/* Expand toggle (small, to the left of primary) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "absolute -left-10 bottom-1.5 flex h-8 w-8 items-center justify-center rounded-full shadow-md bg-card border border-border/60 text-muted-foreground",
          expanded && "text-foreground",
        )}
        aria-label={expanded ? "Collapse actions" : "Expand actions"}
      >
        <motion.div animate={{ rotate: expanded ? 45 : 0 }}>
          {expanded ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </motion.div>
      </button>
    </div>
  );
}
