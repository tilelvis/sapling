"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Save, RotateCcw, Plus, Trash2, GraduationCap, Wallet, Percent, Calendar, PiggyBank } from "lucide-react";
import { useSettings, useUpdateSettings, useFeeSchedule, useUpdateFeeSchedule } from "./hooks";
import { defaultSettings, defaultFeeSchedule, MONTH_NAMES_FULL, formatKsh } from "@/lib/planner/engine";
import { BackupRestoreSection } from "./backup-restore-section";
import { ScenarioPresetsSection } from "./scenario-presets";
import { ScenarioComparison } from "./scenario-comparison";
import { HelpGuideCard } from "./help-guide-card";
import { SavingHistoryCard } from "./saving-history-card";
import type { PlannerSettings, FeeEntry } from "@/lib/planner/types";

export function SettingsView({ bundle: _bundle }: { bundle: import("./hooks").ProjectionBundle }) {
  const { data: saved } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: fees } = useFeeSchedule();
  const updateFees = useUpdateFeeSchedule();

  const [form, setForm] = useState<PlannerSettings>(saved ?? defaultSettings());
  const [feeList, setFeeList] = useState<FeeEntry[]>(fees ?? defaultFeeSchedule());

  // React-recommended "adjust state during render" pattern to sync from server
  // without using setState-in-effect. Only re-syncs when the server reference
  // itself changes (after a save or initial load), preserving local edits otherwise.
  const [lastSavedRef, setLastSavedRef] = useState(saved);
  if (saved && saved !== lastSavedRef) {
    setLastSavedRef(saved);
    setForm(saved);
  }
  const [lastFeesRef, setLastFeesRef] = useState(fees);
  if (fees && fees !== lastFeesRef) {
    setLastFeesRef(fees);
    setFeeList(fees);
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const feeDirty = JSON.stringify(feeList) !== JSON.stringify(fees);

  const set = <K extends keyof PlannerSettings>(k: K, v: PlannerSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => updateSettings.mutate(form);
  const handleReset = () => setForm(saved ?? defaultSettings());
  const handleResetAll = () => {
    const def = defaultSettings();
    setForm(def);
    updateSettings.mutate(def);
  };

  const handleSaveFees = () => updateFees.mutate(feeList);
  const handleResetFees = () => setFeeList(defaultFeeSchedule());

  const addFee = () => {
    const nextIdx = feeList.length > 0 ? Math.max(...feeList.map((f) => f.monthIndex)) + 1 : 0;
    setFeeList((l) => [...l, { monthIndex: Math.min(47, nextIdx), amount: 50000, label: `Fee at month ${nextIdx}` }]);
  };
  const removeFee = (idx: number) => setFeeList((l) => l.filter((_, i) => i !== idx));
  const updateFee = (idx: number, patch: Partial<FeeEntry>) =>
    setFeeList((l) => l.map((f, i) => (i === idx ? { ...f, ...patch } : f)));

  return (
    <div className="space-y-4">
      <Card className="p-4 card-shadow">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <GraduationCap className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold">Your plan</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Change any number and the whole 4-year plan updates instantly.
        </p>
      </Card>

      {/* Student */}
      <Section title="Student" icon={<GraduationCap className="h-4 w-4" />}>
        <FieldText
          label="Student name"
          value={form.studentName}
          onChange={(v) => set("studentName", v)}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Academic start month</Label>
            <Select
              value={String(form.academicStartMonth)}
              onValueChange={(v) => set("academicStartMonth", Number(v))}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_NAMES_FULL.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FieldNumber
            label="Academic start year"
            value={form.academicStartYear}
            onChange={(v) => set("academicStartYear", v)}
          />
        </div>
      </Section>

      {/* Money */}
      <Section title="Money" icon={<Wallet className="h-4 w-4" />}>
        <FieldNumber
          label="Tuition per year (Ksh)"
          value={form.tuitionPerYear}
          onChange={(v) => set("tuitionPerYear", v)}
          step={10000}
        />
        <FieldNumber
          label="Starting MMF balance (Ksh)"
          value={form.startingMMF}
          onChange={(v) => set("startingMMF", v)}
          step={1000}
        />
        <FieldNumber
          label="Monthly saving (Ksh)"
          value={form.monthlySaving}
          onChange={(v) => set("monthlySaving", v)}
          step={100}
        />
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1">
              <Percent className="h-3 w-3" /> MMF annual return
            </Label>
            <span className="text-sm font-medium tnum text-primary">
              {(form.mmfAnnualReturn * 100).toFixed(1)}%
            </span>
          </div>
          <Slider
            value={[form.mmfAnnualReturn * 100]}
            min={0}
            max={20}
            step={0.5}
            onValueChange={(v) => set("mmfAnnualReturn", v[0] / 100)}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0% (conservative)</span>
            <span>12% (typical)</span>
            <span>20%</span>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Treat this as a bonus cushion, not what makes the plan work. Set to 0% for the safest view.
          </p>
        </div>
      </Section>

      {/* HELB */}
      <Section title="HELB loan per year" icon={<PiggyBank className="h-4 w-4" />}>
        <p className="text-xs text-muted-foreground mb-2">
          How much HELB gives you each academic year. Reduces what you must save.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FieldNumber label="Year 1 HELB" value={form.helbY1} onChange={(v) => set("helbY1", v)} step={5000} />
          <FieldNumber label="Year 2 HELB" value={form.helbY2} onChange={(v) => set("helbY2", v)} step={5000} />
          <FieldNumber label="Year 3 HELB" value={form.helbY3} onChange={(v) => set("helbY3", v)} step={5000} />
          <FieldNumber label="Year 4 HELB" value={form.helbY4} onChange={(v) => set("helbY4", v)} step={5000} />
        </div>
      </Section>

      {/* Save bar */}
      <div className="sticky bottom-20 z-20">
        <Card className={`p-3 transition-all ${dirty ? "border-primary shadow-lg" : "opacity-90"}`}>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={!dirty || updateSettings.isPending} className="flex-1">
              <Save className="h-4 w-4 mr-1" />
              {updateSettings.isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={!dirty} size="icon">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  Reset all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset to defaults?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This restores tuition Ksh 160k, HELB 120k/60k/30k/0, Ksh 60k
                    starting MMF, Ksh 5,000 monthly, 12% return. Your saved
                    actuals stay intact.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAll}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      </div>

      <Separator />

      {/* Fee schedule editor */}
      <Section title="Fee schedule" icon={<Calendar className="h-4 w-4" />}>
        <p className="text-xs text-muted-foreground mb-3">
          The months money leaves your MMF for tuition. Defaults match your workbook.
        </p>
        <div className="space-y-2">
          {feeList
            .slice()
            .sort((a, b) => a.monthIndex - b.monthIndex)
            .map((f, idx) => {
              const realIdx = feeList.findIndex((x) => x === f);
              return (
                <div key={realIdx} className="rounded-lg border border-border/60 p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">Month {f.monthIndex}</Badge>
                    <Input
                      value={f.label}
                      onChange={(e) => updateFee(realIdx, { label: e.target.value })}
                      className="h-8 text-xs flex-1 min-w-0"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-destructive"
                      onClick={() => removeFee(realIdx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0">
                      <Label className="text-[10px] text-muted-foreground">Month index (0-47)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={47}
                        value={f.monthIndex}
                        onChange={(e) => updateFee(realIdx, { monthIndex: Math.max(0, Math.min(47, Number(e.target.value))) })}
                        className="h-8 text-xs tnum"
                      />
                    </div>
                    <div className="min-w-0">
                      <Label className="text-[10px] text-muted-foreground">Amount (Ksh)</Label>
                      <Input
                        type="number"
                        value={f.amount}
                        onChange={(e) => updateFee(realIdx, { amount: Math.max(0, Number(e.target.value)) })}
                        className="h-8 text-xs tnum"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={addFee}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add fee
        </Button>
        {feeDirty && (
          <div className="flex gap-2 mt-3">
            <Button onClick={handleSaveFees} disabled={updateFees.isPending} className="flex-1" size="sm">
              <Save className="h-3.5 w-3.5 mr-1" /> Save fee schedule
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetFees}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </Section>

      {/* Scenario presets */}
      <ScenarioPresetsSection />

      {/* Saved scenarios comparison */}
      <ScenarioComparison />

      {/* Saving history chart */}
      <SavingHistoryCard currentSaving={form.monthlySaving} />

      {/* Data backup/restore */}
      <BackupRestoreSection />

      {/* Help & Guide for non-financial users */}
      <HelpGuideCard />

      <Card className="p-4 card-shadow bg-muted/30">
        <h3 className="text-xs font-semibold mb-1.5">About this planner</h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          This planner mirrors your Excel workbook. Savings are the primary way
          you fund tuition; MMF interest is a cushion, not a guarantee. The
          projected balance may dip below zero to warn you early — your real MMF
          can never go negative. Add it to your home screen for offline use.
        </p>
      </Card>
    </div>
  );
}

function Section({
  title, icon, children,
}: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

function FieldText({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 text-sm"
      />
    </div>
  );
}

function FieldNumber({
  label, value, onChange, step = 1,
}: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 text-sm tnum"
      />
    </div>
  );
}
