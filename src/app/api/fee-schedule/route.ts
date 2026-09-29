import { NextResponse } from "next/server";
import { loadFeeSchedule, saveFeeSchedule } from "@/lib/planner/data";
import type { FeeEntry } from "@/lib/planner/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fees = await loadFeeSchedule();
    return NextResponse.json(fees);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as FeeEntry[];
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected an array of fees" }, { status: 400 });
    }
    const clean = body
      .filter((f) => f && typeof f.monthIndex === "number" && typeof f.amount === "number")
      .map((f) => ({
        monthIndex: Math.max(0, Math.min(47, Math.round(f.monthIndex))),
        amount: Math.max(0, Math.round(f.amount)),
        label: String(f.label || `Fee at month ${f.monthIndex}`).slice(0, 120),
      }));
    await saveFeeSchedule(clean);
    return NextResponse.json(clean);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
