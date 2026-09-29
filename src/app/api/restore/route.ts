// Data restore: import a JSON backup file, overwriting all settings,
// fee schedule, and actual transactions.
import { NextResponse } from "next/server";
import { saveSettings, saveFeeSchedule, upsertActual } from "@/lib/planner/data";
import { defaultSettings, defaultFeeSchedule } from "@/lib/planner/engine";
import type { PlannerSettings, FeeEntry, ActualTransaction } from "@/lib/planner/types";

export const dynamic = "force-dynamic";

interface BackupPayload {
  version?: number;
  settings?: Partial<PlannerSettings>;
  feeSchedule?: FeeEntry[];
  actuals?: (ActualTransaction & { notes?: string | null })[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BackupPayload;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid backup payload" }, { status: 400 });
    }

    // Restore settings (merge with defaults to ensure all fields present)
    const restoredSettings: PlannerSettings = {
      ...defaultSettings(),
      ...(body.settings ?? {}),
      onboarded: body.settings?.onboarded ?? true,
    };
    await saveSettings(restoredSettings);

    // Restore fee schedule
    const restoredFees: FeeEntry[] = body.feeSchedule ?? defaultFeeSchedule();
    await saveFeeSchedule(restoredFees);

    // Restore actuals (clear existing first, then upsert each)
    const { db } = await import("@/lib/db");
    await db.actualTransaction.deleteMany({});

    const restoredActuals = body.actuals ?? [];
    for (const a of restoredActuals) {
      if (typeof a.monthIndex !== "number") continue;
      await upsertActual({
        monthIndex: Math.max(0, Math.min(47, Math.round(a.monthIndex))),
        actualSaving: a.actualSaving ?? null,
        actualInterest: a.actualInterest ?? null,
        actualWithdrawal: a.actualWithdrawal ?? null,
        actualEndingBalance: a.actualEndingBalance ?? null,
        completedAt: a.completedAt ?? null,
        notes: a.notes ?? null,
      });
    }

    return NextResponse.json({
      ok: true,
      restored: {
        settings: Object.keys(restoredSettings).length,
        fees: restoredFees.length,
        actuals: restoredActuals.length,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
