import { NextResponse } from "next/server";
import { loadSettings, loadFeeSchedule, loadActuals } from "@/lib/planner/data";
import { buildProjection } from "@/lib/planner/engine";
import { solveRequiredMonthlySaving } from "@/lib/planner/engine";
import type { ProjectionResult, PlannerSettings } from "@/lib/planner/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const whatIfSaving = url.searchParams.get("whatIf");
    const settings = await loadSettings();
    const fees = await loadFeeSchedule();
    const actuals = await loadActuals();

    let override: number | undefined;
    if (whatIfSaving !== null) {
      const n = Number(whatIfSaving);
      if (!Number.isNaN(n) && n >= 0) override = n;
    }

    const projection: ProjectionResult = buildProjection(settings, fees, override, actuals);

    // Also include the required-saving computed against the *base* settings
    // (not the what-if override) so the slider hint stays stable.
    if (override === undefined) {
      projection.requiredMonthlySaving = solveRequiredMonthlySaving(
        settings as PlannerSettings,
        fees,
      );
    }

    return NextResponse.json({
      settings,
      projection,
      actuals,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
