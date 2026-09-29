import { NextResponse } from "next/server";
import { loadSettings, loadFeeSchedule, loadActuals, upsertActual } from "@/lib/planner/data";
import { buildProjection } from "@/lib/planner/engine";

export const dynamic = "force-dynamic";

// POST /api/complete-month
// Body: { monthIndex: number, actualSaving?: number, actualInterest?: number, actualWithdrawal?: number, actualEndingBalance?: number, notes?: string }
// If actual values are omitted, the projected values are used as defaults.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      monthIndex: number;
      actualSaving?: number;
      actualInterest?: number;
      actualWithdrawal?: number;
      actualEndingBalance?: number;
      notes?: string;
    };
    if (typeof body.monthIndex !== "number") {
      return NextResponse.json({ error: "monthIndex required" }, { status: 400 });
    }
    const monthIndex = Math.max(0, Math.min(47, Math.round(body.monthIndex)));

    const settings = await loadSettings();
    const fees = await loadFeeSchedule();
    const actuals = await loadActuals();
    const projection = buildProjection(settings, fees, undefined, actuals);
    const month = projection.months[monthIndex];
    if (!month) {
      return NextResponse.json({ error: "Invalid month index" }, { status: 400 });
    }

    await upsertActual({
      monthIndex,
      actualSaving: body.actualSaving ?? month.contribution,
      actualInterest: body.actualInterest ?? Math.round(month.interest),
      actualWithdrawal: body.actualWithdrawal ?? month.withdrawal,
      actualEndingBalance: body.actualEndingBalance ?? Math.round(month.endingBalance),
      completedAt: new Date().toISOString(),
      notes: body.notes ?? null,
    });

    const refreshed = await loadActuals();
    return NextResponse.json({ ok: true, actuals: refreshed });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const monthIndex = Number(url.searchParams.get("monthIndex"));
    if (Number.isNaN(monthIndex)) {
      return NextResponse.json({ error: "monthIndex required" }, { status: 400 });
    }
    const { db } = await import("@/lib/db");
    await db.actualTransaction.deleteMany({ where: { monthIndex: Math.round(monthIndex) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
