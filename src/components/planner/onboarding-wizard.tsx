"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TreePine, GraduationCap, Wallet, PiggyBank, Calendar, ArrowRight, ArrowLeft,
  Check, Sparkles,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSettings, useUpdateSettings } from "./hooks";
import { defaultSettings, MONTH_NAMES_FULL, formatKsh } from "@/lib/planner/engine";
import type { PlannerSettings } from "@/lib/planner/types";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "welcome", label: "Welcome", icon: TreePine },
  { key: "student", label: "You", icon: GraduationCap },
  { key: "money", label: "Money", icon: Wallet },
  { key: "helb", label: "HELB", icon: PiggyBank },
  { key: "review", label: "Review", icon: Check },
] as const;

export function OnboardingWizard() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PlannerSettings>(settings ?? defaultSettings());

  // Don't show if already onboarded
  if (settings?.onboarded) return null;

  const set = <K extends keyof PlannerSettings>(k: K, v: PlannerSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFinish = () => {
    updateSettings.mutate({ ...form, onboarded: true }, {
      onSuccess: () => setOpen(false),
    });
  };

  const handleSkip = () => {
    updateSettings.mutate({ ...defaultSettings(), onboarded: true }, {
      onSuccess: () => setOpen(false),
    });
  };

  const canProceed = step !== 1 || form.studentName.trim().length > 0;
  const isLastStep = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden max-h-[92vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>Set up your planner</DialogTitle>
          <DialogDescription>Configure your forestry degree tuition plan.</DialogDescription>
        </DialogHeader>

        {/* Progress header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <TreePine className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Forestry Tuition Planner</span>
          </div>
          <p className="text-xs text-primary-foreground/80 mb-3">
            Let's set up your 4-year tuition plan. Takes 2 minutes.
          </p>
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={cn(
                  "h-1.5 rounded-full flex-1 transition-all",
                  i <= step ? "bg-white" : "bg-white/30",
                )}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px]">
            {STEPS.map((s, i) => (
              <span key={s.key} className={cn("flex-1 text-center", i === step ? "text-white font-medium" : "text-white/60")}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="p-5 min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && <WelcomeStep />}
              {step === 1 && <StudentStep form={form} set={set} />}
              {step === 2 && <MoneyStep form={form} set={set} />}
              {step === 3 && <HelbStep form={form} set={set} />}
              {step === 4 && <ReviewStep form={form} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="border-t border-border/60 p-4 flex items-center justify-between bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-xs"
          >
            Skip for now
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => isLastStep ? handleFinish() : setStep((s) => s + 1)}
              disabled={!canProceed || updateSettings.isPending}
            >
              {isLastStep ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  {updateSettings.isPending ? "Saving…" : "Start planning"}
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center py-4">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hero-shadow">
        <TreePine className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold mb-2">Welcome to your tuition planner</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        This simple planner helps you save for your forestry degree tuition over
        4 years. You'll see exactly how much to save each month, when fees are
        due, and whether you're on track to graduate.
      </p>
      <Card className="p-3 bg-primary/5 border-primary/20 text-left">
        <p className="text-xs font-medium text-primary mb-1.5 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" /> What makes this planner different
        </p>
        <ul className="text-[11px] text-muted-foreground space-y-1">
          <li>• Savings are the main way you fund tuition</li>
          <li>• MMF interest is a bonus cushion, not guaranteed</li>
          <li>• The app tells you early if you're falling behind</li>
          <li>• Works offline — add it to your home screen</li>
        </ul>
      </Card>
    </div>
  );
}

function StudentStep({
  form, set,
}: {
  form: PlannerSettings;
  set: <K extends keyof PlannerSettings>(k: K, v: PlannerSettings[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <StepHeader icon={<GraduationCap className="h-4 w-4" />} title="Tell us about you" />
      <div>
        <Label className="text-xs">Your name (or nickname)</Label>
        <Input
          value={form.studentName}
          onChange={(e) => set("studentName", e.target.value)}
          placeholder="e.g. Forestry Student"
          className="mt-1"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">When do you start?</Label>
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
        <div>
          <Label className="text-xs">Year</Label>
          <Input
            type="number"
            value={form.academicStartYear}
            onChange={(e) => set("academicStartYear", Number(e.target.value))}
            className="mt-1 tnum"
          />
        </div>
      </div>
      <Card className="p-3 bg-muted/40">
        <p className="text-[11px] text-muted-foreground">
          📅 Your 48-month plan will run from{" "}
          <strong className="text-foreground">
            {MONTH_NAMES_FULL[form.academicStartMonth]} {form.academicStartYear}
          </strong>{" "}
          through{" "}
          <strong className="text-foreground">
            {MONTH_NAMES_FULL[form.academicStartMonth === 0 ? 11 : form.academicStartMonth - 1]} {form.academicStartYear + 4}
          </strong>.
        </p>
      </Card>
    </div>
  );
}

function MoneyStep({
  form, set,
}: {
  form: PlannerSettings;
  set: <K extends keyof PlannerSettings>(k: K, v: PlannerSettings[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <StepHeader icon={<Wallet className="h-4 w-4" />} title="Your money setup" />
      <Field
        label="Tuition per year (Ksh)"
        value={form.tuitionPerYear}
        onChange={(v) => set("tuitionPerYear", v)}
        step={10000}
        hint="Total tuition your university charges per academic year"
      />
      <Field
        label="Money you have saved now (Ksh)"
        value={form.startingMMF}
        onChange={(v) => set("startingMMF", v)}
        step={1000}
        hint="Your current MMF balance — the starting buffer"
      />
      <Field
        label="What you can save monthly (Ksh)"
        value={form.monthlySaving}
        onChange={(v) => set("monthlySaving", v)}
        step={100}
        hint="Your target monthly saving. You can change this anytime."
      />
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Expected MMF return
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
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0% (safest)</span>
          <span>12% (typical)</span>
          <span>20%</span>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Treat this as a bonus cushion. The planner works even at 0%.
        </p>
      </div>
    </div>
  );
}

function HelbStep({
  form, set,
}: {
  form: PlannerSettings;
  set: <K extends keyof PlannerSettings>(k: K, v: PlannerSettings[K]) => void;
}) {
  const years = [
    { key: "helbY1" as const, label: "Year 1 HELB" },
    { key: "helbY2" as const, label: "Year 2 HELB" },
    { key: "helbY3" as const, label: "Year 3 HELB" },
    { key: "helbY4" as const, label: "Year 4 HELB" },
  ];
  const totalHelb = form.helbY1 + form.helbY2 + form.helbY3 + form.helbY4;
  const totalTuition = form.tuitionPerYear * 4;

  return (
    <div className="space-y-4">
      <StepHeader icon={<PiggyBank className="h-4 w-4" />} title="HELB loan per year" />
      <p className="text-xs text-muted-foreground">
        How much HELB gives you each academic year. This reduces what you must save.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {years.map((y) => (
          <Field
            key={y.key}
            label={y.label}
            value={form[y.key]}
            onChange={(v) => set(y.key, v)}
            step={5000}
          />
        ))}
      </div>
      <Card className="p-3 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="text-muted-foreground">Total HELB</p>
            <p className="font-bold tnum text-primary">{formatKsh(totalHelb)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Total tuition</p>
            <p className="font-bold tnum text-foreground">{formatKsh(totalTuition)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">You fund</p>
            <p className="font-bold tnum text-destructive">{formatKsh(totalTuition - totalHelb)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ReviewStep({ form }: { form: PlannerSettings }) {
  return (
    <div className="space-y-4">
      <StepHeader icon={<Check className="h-4 w-4" />} title="Review your plan" />
      <Card className="p-3 space-y-2 text-xs">
        <ReviewRow label="Student" value={form.studentName} />
        <ReviewRow label="Start" value={`${MONTH_NAMES_FULL[form.academicStartMonth]} ${form.academicStartYear}`} />
        <ReviewRow label="Tuition/year" value={formatKsh(form.tuitionPerYear)} />
        <ReviewRow label="Starting MMF" value={formatKsh(form.startingMMF)} />
        <ReviewRow label="Monthly saving" value={formatKsh(form.monthlySaving)} />
        <ReviewRow label="MMF return" value={`${(form.mmfAnnualReturn * 100).toFixed(1)}%`} />
        <ReviewRow label="Total HELB" value={formatKsh(form.helbY1 + form.helbY2 + form.helbY3 + form.helbY4)} />
      </Card>
      <p className="text-[11px] text-muted-foreground text-center">
        You can change any of this later in Settings. The planner will recalculate instantly.
      </p>
    </div>
  );
}

function StepHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
  );
}

function Field({
  label, value, onChange, step = 1, hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  hint?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 tnum"
      />
      {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tnum">{value}</span>
    </div>
  );
}
