"use client";

import { Shield, Scale, Zap, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useScenarioPreset, useSettings } from "./hooks";
import type { PlannerSettings } from "@/lib/planner/types";

interface Preset {
  key: string;
  name: string;
  description: string;
  icon: typeof Shield;
  patch: Partial<PlannerSettings>;
  tone: "primary" | "accent" | "destructive";
}

const PRESETS: Preset[] = [
  {
    key: "conservative",
    name: "Conservative",
    description: "0% MMF return. Pure savings. Safest view.",
    icon: Shield,
    tone: "primary",
    patch: { mmfAnnualReturn: 0 },
  },
  {
    key: "balanced",
    name: "Balanced",
    description: "12% MMF return. Your current workbook setting.",
    icon: Scale,
    tone: "accent",
    patch: { mmfAnnualReturn: 0.12 },
  },
  {
    key: "aggressive",
    name: "Optimistic",
    description: "15% MMF return. Treat interest as real cushion.",
    icon: Zap,
    tone: "destructive",
    patch: { mmfAnnualReturn: 0.15 },
  },
];

export function ScenarioPresetsSection() {
  const preset = useScenarioPreset();
  const { data: settings } = useSettings();
  const currentReturn = settings?.mmfAnnualReturn ?? 0.12;

  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Scale className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold">Quick scenarios</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Switch the MMF return assumption to see how your plan changes. Savings stay primary; interest is a cushion.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => {
          const isActive = Math.abs((p.patch.mmfAnnualReturn ?? 0) - currentReturn) < 0.001;
          const toneCls = {
            primary: "border-primary/30 text-primary bg-primary/5",
            accent: "border-chart-2/40 text-chart-3 bg-chart-2/5",
            destructive: "border-destructive/30 text-destructive bg-destructive/5",
          }[p.tone];
          const Icon = p.icon;
          return (
            <Button
              key={p.key}
              variant="outline"
              onClick={() => preset.mutate(p.patch)}
              disabled={preset.isPending || isActive}
              className={cn(
                // w-full + min-w-0 let the grid cell constrain the button width,
                // and whitespace-normal overrides the base button's whitespace-nowrap
                // so the description text wraps inside the narrow phone column.
                "flex flex-col items-start gap-1 h-auto p-2.5 text-left transition-all w-full min-w-0 whitespace-normal break-words",
                isActive ? toneCls + " ring-1 ring-inset" : "hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-1 w-full">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "" : "text-muted-foreground")} />
                {isActive && <CheckCircle2 className="h-3 w-3 ml-auto shrink-0" />}
              </div>
              <span className="text-[11px] font-semibold leading-tight">{p.name}</span>
              <span className="text-[9px] text-muted-foreground leading-tight line-clamp-2 break-words whitespace-normal">
                {p.description}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        <strong className="text-foreground">Tip:</strong> The Conservative scenario (0%) shows the worst case — if your plan works there, you're safe regardless of MMF returns.
      </div>
    </Card>
  );
}
