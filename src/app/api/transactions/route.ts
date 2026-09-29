import { NextResponse } from "next/server";
import { loadActuals, upsertActual } from "@/lib/planner/data";
import type { ActualTransaction } from "@/lib/planner/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actuals = await loadActuals();
    return NextResponse.json(actuals);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as ActualTransaction & { notes?: string | null };
    if (typeof body.monthIndex !== "number") {
      return NextResponse.json({ error: "monthIndex required" }, { status: 400 });
    }
    await upsertActual({
      monthIndex: Math.max(0, Math.min(47, Math.round(body.monthIndex))),
      actualSaving: body.actualSaving ?? null,
      actualInterest: body.actualInterest ?? null,
      actualWithdrawal: body.actualWithdrawal ?? null,
      actualEndingBalance: body.actualEndingBalance ?? null,
      completedAt: body.completedAt ?? new Date().toISOString(),
      notes: body.notes ?? null,
    });
    const actuals = await loadActuals();
    return NextResponse.json(actuals);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
