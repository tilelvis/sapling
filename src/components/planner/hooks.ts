"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PlannerSettings, FeeEntry, ActualTransaction } from "@/lib/planner/types";

// ---- Settings ----
export function useSettings() {
  return useQuery<PlannerSettings>({
    queryKey: ["settings"],
    queryFn: async () => {
      const r = await fetch("/api/settings");
      if (!r.ok) throw new Error("Failed to load settings");
      return r.json();
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Partial<PlannerSettings>) => {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!r.ok) throw new Error("Failed to save settings");
      return r.json();
    },
    onSuccess: (data) => {
      qc.setQueryData(["settings"], data);
      qc.invalidateQueries({ queryKey: ["projection"] });
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });
}

// ---- Fee schedule ----
export function useFeeSchedule() {
  return useQuery<FeeEntry[]>({
    queryKey: ["fee-schedule"],
    queryFn: async () => {
      const r = await fetch("/api/fee-schedule");
      if (!r.ok) throw new Error("Failed to load fee schedule");
      return r.json();
    },
  });
}

export function useUpdateFeeSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fees: FeeEntry[]) => {
      const r = await fetch("/api/fee-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fees),
      });
      if (!r.ok) throw new Error("Failed to save fee schedule");
      return r.json();
    },
    onSuccess: (data) => {
      qc.setQueryData(["fee-schedule"], data);
      qc.invalidateQueries({ queryKey: ["projection"] });
      toast.success("Fee schedule saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });
}

// ---- Projection ----
export interface ProjectionBundle {
  settings: PlannerSettings;
  projection: import("@/lib/planner/types").ProjectionResult;
  actuals: ActualTransaction[];
}

export function useProjection(whatIfSaving?: number) {
  const qs = whatIfSaving !== undefined ? `?whatIf=${whatIfSaving}` : "";
  return useQuery<ProjectionBundle>({
    queryKey: ["projection", whatIfSaving ?? "default"],
    queryFn: async () => {
      const r = await fetch(`/api/projection${qs}`);
      if (!r.ok) throw new Error("Failed to load projection");
      return r.json();
    },
  });
}

// ---- Transactions ----
export function useCompleteMonth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      monthIndex: number;
      actualSaving?: number;
      actualInterest?: number;
      actualWithdrawal?: number;
      actualEndingBalance?: number;
      notes?: string;
    }) => {
      const r = await fetch("/api/complete-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed to complete month");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projection"] });
      toast.success("Month marked as complete");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
}

export function useResetMonth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (monthIndex: number) => {
      const r = await fetch(`/api/complete-month?monthIndex=${monthIndex}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("Failed to reset month");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projection"] });
      toast.success("Month reset");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
}

// ---- Apply cushion (set monthly saving to the recommended amount) ----
export function useApplyCushion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recommendedSaving: number) => {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlySaving: recommendedSaving }),
      });
      if (!r.ok) throw new Error("Failed to apply cushion");
      return r.json();
    },
    onSuccess: (_data, recommendedSaving) => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["projection"] });
      toast.success(`Monthly saving updated to Ksh ${recommendedSaving.toLocaleString("en-KE")}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
}

// ---- Data backup (export JSON) ----
export function useBackup() {
  return useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/backup");
      if (!r.ok) throw new Error("Failed to create backup");
      const data = await r.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forestry-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return data;
    },
    onSuccess: () => toast.success("Backup downloaded"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Backup failed"),
  });
}

// ---- Data restore (import JSON) ----
export function useRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const payload = JSON.parse(text);
      const r = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("Failed to restore backup");
      return r.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["fee-schedule"] });
      qc.invalidateQueries({ queryKey: ["projection"] });
      toast.success(
        `Backup restored: ${data?.restored?.fees ?? 0} fees, ${data?.restored?.actuals ?? 0} actuals`,
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Restore failed"),
  });
}

// ---- Reset all actuals (clear plan-vs-actual history) ----
export function useResetActuals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/reset-actuals", { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to reset actuals");
      return r.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["projection"] });
      toast.success(`Cleared ${data?.deleted ?? 0} tracked month(s)`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Reset failed"),
  });
}

// ---- Scenario preset (apply a named set of assumptions) ----
export function useScenarioPreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<import("@/lib/planner/types").PlannerSettings>) => {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!r.ok) throw new Error("Failed to apply preset");
      return r.json();
    },
    onSuccess: (_data, settings) => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["projection"] });
      toast.success(
        `Scenario applied: ${settings.monthlySaving?.toLocaleString("en-KE") ?? ""}/mo, ${((settings.mmfAnnualReturn ?? 0) * 100).toFixed(0)}% return`,
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
}
