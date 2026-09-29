"use client";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw } from "lucide-react";
import { useProjection } from "./hooks";
import { useWhatIf } from "./what-if-context";
import { formatKsh } from "@/lib/planner/engine";

export function WhatIfSlider({ baseSaving }: { baseSaving: number }) {
  const { whatIfEnabled, setWhatIfEnabled, whatIfSaving, setWhatIfSaving } = useWhatIf();
  const value = whatIfSaving ?? baseSaving;
  const proj = useProjection(whatIfEnabled ? value : undefined);

  const finalBalance = proj.data?.projection.finalBalance ?? 0;
  const hasShortfall = proj.data?.projection.hasShortfall ?? false;

  const min = Math.max(0, Math.floor(baseSaving * 0.2 / 100) * 100);
  const max = Math.ceil((baseSaving * 2.5 + 10000) / 100) * 100;

  return (
    <Card className="p-3 border-accent/40 bg-accent/5">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-xs font-semibold truncate">What if I save…</h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Label htmlFor="whatif-switch" className="text-[11px] text-muted-foreground">
            On
          </Label>
          <Switch
            id="whatif-switch"
            checked={whatIfEnabled}
            onCheckedChange={setWhatIfEnabled}
          />
        </div>
      </div>

      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-xl font-bold tnum text-foreground truncate">
          {formatKsh(value)}
          <span className="text-xs font-normal text-muted-foreground">/month</span>
        </p>
        {whatIfEnabled && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px] shrink-0"
            onClick={() => setWhatIfSaving(baseSaving)}
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        )}
      </div>

      <Slider
        disabled={!whatIfEnabled}
        value={[value]}
        min={min}
        max={max}
        step={100}
        onValueChange={(v) => setWhatIfSaving(v[0])}
        className={!whatIfEnabled ? "opacity-50" : ""}
      />
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{formatKsh(min)}</span>
        <span>{formatKsh(max)}</span>
      </div>

      {whatIfEnabled && (
        <div className="mt-2 rounded-lg bg-card p-2.5 border border-border/60">
          <p className="text-[11px] text-muted-foreground">Graduation balance at this saving</p>
          <p
            className={`text-lg font-bold tnum ${
              hasShortfall ? "text-destructive" : "text-primary"
            }`}
          >
            {formatKsh(finalBalance)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {hasShortfall
              ? "Still not enough — try increasing the slider."
              : finalBalance > baseSaving
                ? "Comfortably funded with a cushion."
                : "Breaks even — just covered."}
          </p>
        </div>
      )}
      {!whatIfEnabled && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Turn on to test different monthly savings and see the impact instantly.
        </p>
      )}
    </Card>
  );
}
