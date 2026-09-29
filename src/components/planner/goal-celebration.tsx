"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Goal celebration: a one-time confetti-like celebration that shows when the
 * projected graduation balance turns positive (no shortfall). Only fires once
 * per browser (tracked in localStorage) so it doesn't annoy on every reload.
 */
const CELEBRATE_KEY = "forestry-planner-celebrated-positive";

interface GoalCelebrationProps {
  finalBalance: number;
  hasShortfall: boolean;
}

export function GoalCelebration({ finalBalance, hasShortfall }: GoalCelebrationProps) {
  const [show, setShow] = useState(false);
  const celebratedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Only celebrate if: balance is positive, no shortfall, not already celebrated
    const alreadyCelebrated = localStorage.getItem(CELEBRATE_KEY) === "1";
    celebratedRef.current = alreadyCelebrated;
    if (!hasShortfall && finalBalance > 0 && !alreadyCelebrated) {
      // Small delay so it appears after dashboard settles
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem(CELEBRATE_KEY, "1");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [finalBalance, hasShortfall]);

  const handleDismiss = () => setShow(false);

  const handleShare = async () => {
    const shareText = `I'm on track to graduate without a funding gap! 🎉 My projected MMF balance is +${formatKshSafe(finalBalance)}. #ForestryDegree #TuitionPlanner`;
    const shareData = {
      title: "Forestry Tuition Plan — Funded!",
      text: shareText,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    // Use the Web Share API if available (mobile-friendly native share sheet)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared your win!");
      } catch (err) {
        // User cancelled — no toast needed
      }
      return;
    }

    // Fallback: copy to clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Copied to clipboard — paste anywhere to share!");
      } catch {
        toast.error("Could not copy — try taking a screenshot instead");
      }
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: "oklch(0.18 0.02 150 / 0.5)" }}
        >
          <motion.div
            initial={{ scale: 0.7, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="pointer-events-auto"
          >
            <div className="relative bg-card rounded-2xl card-shadow-lg p-6 max-w-xs mx-4 text-center overflow-hidden">
              {/* Confetti dots */}
              <Confetti />
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-chart-2 to-chart-3 text-white hero-shadow"
              >
                <PartyPopper className="h-7 w-7" />
              </motion.div>
              <h2 className="text-lg font-bold text-foreground">You're funded! 🎉</h2>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Your projected graduation balance is now positive
                (<strong className="text-primary">+{formatKshSafe(finalBalance)}</strong>).
                You're on track to graduate without a funding gap.
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Keep up the saving discipline — you've got this! 🌳
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="h-3.5 w-3.5 mr-1" />
                  Share
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleDismiss}
                >
                  <PartyPopper className="h-3.5 w-3.5 mr-1" />
                  Continue
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatKshSafe(n: number): string {
  return `Ksh ${Math.round(Math.abs(n)).toLocaleString("en-KE")}`;
}

/** Simple CSS-based confetti — small colored dots animating downward. */
function Confetti() {
  // 12 confetti dots with random positions/colors/delays
  const colors = [
    "oklch(0.5 0.13 150)", // green
    "oklch(0.68 0.14 75)", // gold
    "oklch(0.6 0.16 35)",  // terracotta
    "oklch(0.55 0.1 200)", // teal
    "oklch(0.72 0.12 100)", // olive
  ];
  const dots = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((i) => {
        const left = (i * 7 + 5) % 100;
        const delay = (i * 0.08) % 1;
        const duration = 1.5 + (i % 3) * 0.4;
        const color = colors[i % colors.length];
        const size = 6 + (i % 3) * 2;
        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
            animate={{
              y: 280,
              x: (i % 2 === 0 ? 1 : -1) * (20 + (i * 3) % 30),
              rotate: 360,
              opacity: [1, 1, 0],
            }}
            transition={{ duration, delay, repeat: Infinity, ease: "easeIn" }}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: 0,
              width: size,
              height: size,
              borderRadius: i % 2 === 0 ? "50%" : "2px",
              background: color,
            }}
          />
        );
      })}
    </div>
  );
}
