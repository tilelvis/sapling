// Saving history: audit trail of monthly saving changes.
// GET returns the history; POST appends a new entry (called when settings save
// detects a change in monthlySaving).
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db } = await import("@/lib/db");
    const rows = await db.savingHistory.findMany({
      orderBy: { changedAt: "asc" },
    });
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { monthlySaving: number; mmfReturn: number; note?: string };
    if (typeof body.monthlySaving !== "number" || typeof body.mmfReturn !== "number") {
      return NextResponse.json({ error: "monthlySaving and mmfReturn required" }, { status: 400 });
    }
    const { db } = await import("@/lib/db");
    const row = await db.savingHistory.create({
      data: {
        monthlySaving: Math.max(0, Math.round(body.monthlySaving)),
        mmfReturn: Math.max(0, Math.min(1, Number(body.mmfReturn))),
        note: body.note ?? null,
      },
    });
    return NextResponse.json(row);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const { db } = await import("@/lib/db");
    await db.savingHistory.deleteMany({});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
