// Reset all actual transactions (clears the plan-vs-actual tracking history).
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE() {
  try {
    const { db } = await import("@/lib/db");
    const result = await db.actualTransaction.deleteMany({});
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
