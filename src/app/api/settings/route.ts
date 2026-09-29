import { NextResponse } from "next/server";
import { loadSettings, saveSettings } from "@/lib/planner/data";
import { defaultSettings } from "@/lib/planner/engine";
import type { PlannerSettings } from "@/lib/planner/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await loadSettings();
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Partial<PlannerSettings>;
    const current = await loadSettings();
    const merged: PlannerSettings = { ...defaultSettings(), ...current, ...body };
    // Clamp / sanitise
    merged.tuitionPerYear = Math.max(0, Math.round(merged.tuitionPerYear));
    merged.startingMMF = Math.max(0, Math.round(merged.startingMMF));
    merged.monthlySaving = Math.max(0, Math.round(merged.monthlySaving));
    merged.mmfAnnualReturn = Math.max(0, Math.min(1, Number(merged.mmfAnnualReturn)));
    merged.helbY1 = Math.max(0, Math.round(merged.helbY1));
    merged.helbY2 = Math.max(0, Math.round(merged.helbY2));
    merged.helbY3 = Math.max(0, Math.round(merged.helbY3));
    merged.helbY4 = Math.max(0, Math.round(merged.helbY4));
    merged.academicStartMonth = Math.max(0, Math.min(11, Math.round(merged.academicStartMonth)));
    merged.academicStartYear = Math.max(2000, Math.min(2100, Math.round(merged.academicStartYear)));
    merged.studentName = String(merged.studentName || "Forestry Student").slice(0, 100);
    merged.onboarded = body.onboarded ?? (current.onboarded ?? true);
    await saveSettings(merged);

    // Audit trail: record a SavingHistory entry if the monthly saving OR
    // MMF return changed from the previous value. This powers the
    // saving-history chart on the dashboard.
    const savingChanged = merged.monthlySaving !== current.monthlySaving;
    const returnChanged = Math.abs(merged.mmfAnnualReturn - current.mmfAnnualReturn) > 0.0001;
    if (savingChanged || returnChanged) {
      try {
        const { db } = await import("@/lib/db");
        await db.savingHistory.create({
          data: {
            monthlySaving: merged.monthlySaving,
            mmfReturn: merged.mmfAnnualReturn,
            note: savingChanged
              ? `Saving ${current.monthlySaving} → ${merged.monthlySaving}`
              : `Return ${Math.round(current.mmfAnnualReturn * 100)}% → ${Math.round(merged.mmfAnnualReturn * 100)}%`,
          },
        });
      } catch {
        // SavingHistory table may not exist if migration hasn't run — ignore.
      }
    }

    return NextResponse.json(merged);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
