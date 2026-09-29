"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompare, Save, Trash2, Bookmark, TrendingUp, TrendingDown, Sparkles, X, RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";
import { useProjection, useScenarioPreset } from "./hooks";
import { useWhatIf } from "./what-if-context";
import { useSavedScenarios, type SavedScenario } from "./use-saved-scenarios";
import { formatKsh } from "@/lib/planner/engine";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export function ScenarioComparison() {
  const { whatIfEnabled, whatIfSaving, setWhatIfEnabled, setWhatIfSaving } = useWhatIf();
  const { data } = useProjection(whatIfEnabled ? whatIfSaving : undefined);
  const { scenarios, addScenario, removeScenario, clearAll } = useSavedScenarios();
  const applyPreset = useScenarioPreset();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");

  const currentProjection = data?.projection;
  const canSaveCurrent = !!currentProjection;

  const handleSave = () => {
    if (!currentProjection) return;
    const name = scenarioName.trim() || `Ksh ${whatIfSaving?.toLocaleString("en-KE")}/mo @ ${Math.round((data?.settings.mmfAnnualReturn ?? 0) * 100)}%`;
    addScenario({
      name,
      monthlySaving: whatIfSaving ?? data?.settings.monthlySaving ?? 0,
      mmfAnnualReturn: data?.settings.mmfAnnualReturn ?? 0.12,
      finalBalance: currentProjection.finalBalance,
      hasShortfall: currentProjection.hasShortfall,
      shortfallAmount: currentProjection.shortfallAmount,
      requiredMonthlySaving: currentProjection.requiredMonthlySaving,
    });
    toast.success(`Saved "${name}"`);
    setScenarioName("");
    setSaveDialogOpen(false);
  };

  const handleApply = (scenario: SavedScenario) => {
    // Apply the saved scenario back to the plan: set both the monthly saving
    // and the MMF return rate, then turn off the What-If slider so the
    // dashboard reflects the restored plan.
    applyPreset.mutate({
      monthlySaving: scenario.monthlySaving,
      mmfAnnualReturn: scenario.mmfAnnualReturn,
    });
    setWhatIfEnabled(false);
    setWhatIfSaving(scenario.monthlySaving);
    toast.success(`Applied "${scenario.name}" to your plan`);
  };

  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <GitCompare className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">Saved scenarios</h3>
        </div>
        {scenarios.length > 0 && (
          <Badge variant="outline" className="text-[10px] tnum">
            {scenarios.length} saved
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Save what-if snapshots to compare different saving amounts side by side.
        {!whatIfEnabled && " Turn on the What-If slider on the dashboard first."}
      </p>

      {/* Save current scenario button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full mb-3"
        onClick={() => setSaveDialogOpen(true)}
        disabled={!canSaveCurrent}
      >
        <Bookmark className="h-3.5 w-3.5 mr-1" />
        Save current {whatIfEnabled ? "what-if" : "plan"}
      </Button>

      {/* Saved scenarios list */}
      {scenarios.length === 0 ? (
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <Sparkles className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-[11px] text-muted-foreground">
            No saved scenarios yet. Use the What-If slider, then tap "Save current" to compare plans.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2 max-h-80 overflow-y-auto fancy-scroll">
            <AnimatePresence>
              {scenarios.map((s) => (
                <ScenarioRow
                  key={s.id}
                  scenario={s}
                  onRemove={() => removeScenario(s.id)}
                  onApply={() => handleApply(s)}
                  isApplying={applyPreset.isPending}
                />
              ))}
            </AnimatePresence>
          </div>
          {scenarios.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full mt-2 text-[11px] text-muted-foreground">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all saved scenarios?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes all {scenarios.length} saved what-if snapshots. Your actual plan and settings stay intact.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAll}>Clear all</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </>
      )}

      {/* Save dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save scenario</DialogTitle>
            <DialogDescription>
              Give this what-if snapshot a name so you can find it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Name (optional)</Label>
              <Input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder={`e.g. Ksh ${whatIfSaving?.toLocaleString("en-KE")}/mo plan`}
                className="mt-1 text-sm"
                autoFocus
              />
            </div>
            {currentProjection && (
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly saving</span>
                  <span className="tnum font-medium">{formatKsh(whatIfSaving ?? data?.settings.monthlySaving ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MMF return</span>
                  <span className="tnum font-medium">{Math.round((data?.settings.mmfAnnualReturn ?? 0) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Graduation balance</span>
                  <span className={cn("tnum font-bold", currentProjection.finalBalance < 0 ? "text-destructive" : "text-primary")}>
                    {formatKsh(currentProjection.finalBalance)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ScenarioRow({
  scenario, onRemove, onApply, isApplying,
}: { scenario: SavedScenario; onRemove: () => void; onApply: () => void; isApplying?: boolean }) {
  const isShortfall = scenario.hasShortfall;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className={cn(
        "rounded-lg border p-2.5",
        isShortfall ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{scenario.name}</p>
          <p className="text-[10px] text-muted-foreground tnum">
            {formatKsh(scenario.monthlySaving)}/mo · {Math.round(scenario.mmfAnnualReturn * 100)}% return
          </p>
        </div>
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive shrink-0"
          aria-label="Remove scenario"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {isShortfall ? (
            <TrendingDown className="h-3 w-3 text-destructive" />
          ) : (
            <TrendingUp className="h-3 w-3 text-primary" />
          )}
          <span className={cn("text-sm font-bold tnum", isShortfall ? "text-destructive" : "text-primary")}>
            {formatKsh(scenario.finalBalance)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isShortfall ? (
            <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive bg-destructive/5 tnum">
              needs {formatKsh(scenario.requiredMonthlySaving)}/mo
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] border-primary/40 text-primary bg-primary/5">
              funded
            </Badge>
          )}
        </div>
      </div>
      {/* Apply button — restores this scenario's saving + return to the plan */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="w-full h-7 text-[11px] bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
              onClick={onApply}
              disabled={isApplying}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {isApplying ? "Applying…" : "Apply to plan"}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px]">
            <p className="text-xs">
              Sets your monthly saving to {formatKsh(scenario.monthlySaving)} and
              MMF return to {Math.round(scenario.mmfAnnualReturn * 100)}%. The
              dashboard will recalculate instantly.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}
