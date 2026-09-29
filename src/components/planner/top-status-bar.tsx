"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatKsh, formatKshShort } from "@/lib/planner/engine";
import type { MonthRow } from "@/lib/planner/types";

interface TopStatusBarProps {
  balance: number;
  savePerMonth: number;
  cushionAdjustment: number;
  nextFee: MonthRow | null;
  hasShortfall: boolean;
  finalBalance: number;
}

/**
 * Sticky, always-visible status strip that sits below the header.
 * Shows the 3 most critical numbers at all times: Balance, Save/mo, Next fee.
 * Each cell is tappable to scroll to the relevant detail section.
 */
export function TopStatusBar({
  balance, savePerMonth, cushionAdjustment, nextFee, hasShortfall, finalBalance,
}: TopStatusBarProps) {
  const totalSave = savePerMonth + cushionAdjustment;

  return (
    <div className="sticky top-[52px] z-20 bg-card/95 backdrop-blur-md border-b border-border/60">
      <div className="mx-auto w-full max-w-2xl grid grid-cols-3 divide-x divide-border/60">
        {/* Balance */}
        <button
          onClick={() => document.getElementById("overview-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="px-2 py-1.5 text-left active:bg-muted/50 transition-colors"
        >
          <p className="text-[8px] uppercase tracking-wide text-muted-foreground leading-none">
            Balance
          </p>
          <motion.p
            key={Math.round(balance)}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className={cn(
              "text-[13px] font-bold tnum leading-tight",
              balance < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {formatKshShort(balance)}
          </motion.p>
        </button>

        {/* Save per month */}
        <button
          onClick={() => document.getElementById("overview-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="px-2 py-1.5 text-left active:bg-muted/50 transition-colors"
        >
          <p className="text-[8px] uppercase tracking-wide text-muted-foreground leading-none">
            Save/mo
          </p>
          <p className={cn(
            "text-[13px] font-bold tnum leading-tight",
            cushionAdjustment > 0 ? "text-primary" : "text-foreground",
          )}>
            {formatKshShort(totalSave)}
            {cushionAdjustment > 0 && (
              <span className="text-[8px] text-destructive ml-0.5">+{Math.round(cushionAdjustment/100)*100/1000}k</span>
            )}
          </p>
        </button>

        {/* Next fee / Graduation */}
        <button
          onClick={() => document.getElementById("fees-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="px-2 py-1.5 text-left active:bg-muted/50 transition-colors"
        >
          <p className="text-[8px] uppercase tracking-wide text-muted-foreground leading-none">
            {nextFee ? "Next fee" : "Graduation"}
          </p>
          <p className={cn(
            "text-[13px] font-bold tnum leading-tight",
            hasShortfall ? "text-destructive" : "text-primary",
          )}>
            {nextFee ? formatKshShort(nextFee.withdrawal) : formatKshShort(finalBalance)}
          </p>
        </button>
      </div>
    </div>
  );
}
