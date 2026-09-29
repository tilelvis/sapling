"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, ChevronDown, PiggyBank, TrendingUp, AlertTriangle, Layers,
  Wallet, CalendarClock, Sparkles, BookOpen, Lightbulb,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GuideItem {
  id: string;
  question: string;
  icon: typeof PiggyBank;
  answer: string;
  example?: string;
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    id: "what-is-mmf",
    question: "What is an MMF (Money Market Fund)?",
    icon: PiggyBank,
    answer: "A Money Market Fund is a low-risk investment account where your savings earn interest. You put money in, it grows a bit each month, and you can withdraw when you need to pay fees.",
    example: "Think of it like a savings account that pays you a small bonus each month for keeping your money there.",
  },
  {
    id: "savings-vs-interest",
    question: "Why are savings more important than interest?",
    icon: TrendingUp,
    answer: "MMF interest rates change over time and aren't guaranteed. Your monthly saving is the money you control. This planner treats interest as a bonus cushion — if your plan works with 0% interest, you're safe no matter what.",
    example: "At 12% return, Ksh 60,000 might earn ~Ksh 650/month. But that's not guaranteed. Your Ksh 5,000/month saving is.",
  },
  {
    id: "what-is-shortfall",
    question: "What does 'shortfall' mean?",
    icon: AlertTriangle,
    answer: "A shortfall is when your projected MMF balance would drop below zero — meaning you wouldn't have enough to pay a fee. The app warns you early so you can increase your saving before the fee is due.",
    example: "If you need Ksh 80,000 for a fee but only have Ksh 47,000 projected, that's a Ksh 32,524 shortfall. Increase saving to fix it.",
  },
  {
    id: "three-layers",
    question: "What are the 'three layers' of saving?",
    icon: Layers,
    answer: "① Base saving is your normal monthly target (e.g., Ksh 5,000). ② Cushion adjustment is extra the app recommends so you reach each fee on time. ③ MMF interest is a bonus on top — never relied upon.",
    example: "Base Ksh 5,000 + Cushion Ksh 220 = Save Ksh 5,220/month. Interest adds a little extra cushion.",
  },
  {
    id: "what-is-helb",
    question: "What is HELB?",
    icon: Wallet,
    answer: "HELB (Higher Education Loans Board) is the Kenyan government's student loan. It helps pay your tuition. The amount you get reduces what you must save yourself.",
    example: "If tuition is Ksh 160,000/year and HELB gives Ksh 120,000, you only need to fund Ksh 40,000 that year.",
  },
  {
    id: "when-are-fees",
    question: "When are my fees due?",
    icon: CalendarClock,
    answer: "Your plan has 5 fee payments: Y2 September (Ksh 60,000), Y3 September + April (Ksh 65,000 each), Y4 September + April (Ksh 80,000 each). These are the months money leaves your MMF for tuition.",
    example: "September and April are your fee months. The app highlights them in the 48-Month timeline.",
  },
  {
    id: "what-if-slider",
    question: "What does the What-If slider do?",
    icon: Sparkles,
    answer: "It lets you test different monthly saving amounts without changing your actual plan. Drag it to see how your graduation balance changes instantly. Try Ksh 6,000/month to see what 'comfortably funded' looks like.",
    example: "At Ksh 5,000/month → -Ksh 12,524 (shortfall). At Ksh 6,000/month → +Ksh 48,157 (funded).",
  },
];

export function HelpGuideCard() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <BookOpen className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold">Need help understanding?</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        New to MMFs and financial planning? Here are simple explanations of the key terms.
      </p>

      <div className="space-y-1.5">
        {GUIDE_ITEMS.map((item) => {
          const isOpen = openItem === item.id;
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-lg border transition-colors",
                isOpen ? "border-primary/30 bg-primary/5" : "border-border/60 bg-muted/30",
              )}
            >
              <button
                onClick={() => setOpenItem(isOpen ? null : item.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left"
              >
                <div className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                  isOpen ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="flex-1 text-xs font-medium">{item.question}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 space-y-2">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {item.answer}
                      </p>
                      {item.example && (
                        <div className="rounded-md bg-accent/10 border border-accent/20 p-2 flex items-start gap-1.5">
                          <Lightbulb className="h-3 w-3 text-accent-foreground shrink-0 mt-0.5" />
                          <p className="text-[10px] text-accent-foreground leading-relaxed">
                            <span className="font-medium">Example: </span>
                            {item.example}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
