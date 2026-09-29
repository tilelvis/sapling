"use client";

import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjection, useCompleteMonth, useResetMonth } from "./hooks";
import { formatKsh } from "@/lib/planner/engine";

export function CompleteMonthSheet({
  open, onOpenChange, monthIndex,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  monthIndex: number;
}) {
  const { data } = useProjection();
  const complete = useCompleteMonth();
  const reset = useResetMonth();

  const month = data?.projection.months[monthIndex];
  const existing = data?.actuals.find((a) => a.monthIndex === monthIndex);

  const [saving, setSaving] = useState("");
  const [interest, setInterest] = useState("");
  const [withdrawal, setWithdrawal] = useState("");
  const [ending, setEnding] = useState("");
  const [notes, setNotes] = useState("");

  // Repopulate the form whenever the sheet is opened for a given month.
  // Uses React's "adjust state during render" pattern instead of an effect.
  const [lastSession, setLastSession] = useState<string>("");
  const sessionKey = open ? `${monthIndex}` : "";
  if (open && month && sessionKey !== lastSession) {
    setLastSession(sessionKey);
    setSaving(String(existing?.actualSaving ?? Math.round(month.contribution)));
    setInterest(String(existing?.actualInterest ?? Math.round(month.interest)));
    setWithdrawal(String(existing?.actualWithdrawal ?? month.withdrawal));
    setEnding(String(existing?.actualEndingBalance ?? Math.round(month.endingBalance)));
    setNotes(existing?.notes ?? "");
  }

  if (!month) return null;

  const handleSubmit = () => {
    complete.mutate(
      {
        monthIndex,
        actualSaving: Number(saving) || 0,
        actualInterest: Number(interest) || 0,
        actualWithdrawal: Number(withdrawal) || 0,
        actualEndingBalance: Number(ending) || 0,
        notes: notes.trim() || undefined,
      },
      { onSettled: () => onOpenChange(false) },
    );
  };

  const handleReset = () => {
    reset.mutate(monthIndex, { onSettled: () => onOpenChange(false) });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto fancy-scroll">
        <SheetHeader>
          <SheetTitle className="text-left">
            {month.monthLabel}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              Year {month.year}
            </span>
          </SheetTitle>
          <SheetDescription className="text-left">
            Record what actually happened this month. Planned figures are
            pre-filled — edit only what changed.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <Field
            id="saving"
            label="Actual saving deposited"
            value={saving}
            onChange={setSaving}
            planned={`Planned: ${formatKsh(month.contribution)}`}
          />
          <Field
            id="interest"
            label="Actual MMF interest earned"
            value={interest}
            onChange={setInterest}
            planned={`Planned: ${formatKsh(Math.round(month.interest))}`}
          />
          <Field
            id="withdrawal"
            label="Actual fee withdrawal"
            value={withdrawal}
            onChange={setWithdrawal}
            planned={month.isFeeMonth ? `Scheduled: ${formatKsh(month.withdrawal)}` : undefined}
          />
          <Field
            id="ending"
            label="Actual MMF ending balance"
            value={ending}
            onChange={setEnding}
            planned={`Projected: ${formatKsh(Math.round(month.endingBalance))}`}
          />
          <div>
            <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. HELB delayed, saved extra 2k…"
              className="mt-1 text-sm"
              rows={2}
            />
          </div>
        </div>

        <SheetFooter className="mt-5 flex-row gap-2">
          {existing && (
            <Button variant="ghost" onClick={handleReset} disabled={reset.isPending}>
              Clear
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={complete.isPending} className="flex-1">
            {complete.isPending ? "Saving…" : existing ? "Update month" : "Complete month"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  id, label, value, onChange, planned,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  planned?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id} className="text-xs">{label}</Label>
        {planned && (
          <span className="text-[10px] text-muted-foreground">{planned}</span>
        )}
      </div>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 text-sm tnum"
      />
    </div>
  );
}
