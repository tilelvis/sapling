// Data backup: export all settings, fee schedule, and actual transactions
// as a single JSON file. Useful for offline PWA data portability.
import { NextResponse } from "next/server";
import { loadSettings, loadFeeSchedule, loadActuals } from "@/lib/planner/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [settings, fees, actuals] = await Promise.all([
      loadSettings(),
      loadFeeSchedule(),
      loadActuals(),
    ]);

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: "Forestry Tuition Planner",
      settings,
      feeSchedule: fees,
      actuals,
    };

    return NextResponse.json(backup, {
      headers: {
        "Content-Disposition": `attachment; filename="forestry-planner-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
