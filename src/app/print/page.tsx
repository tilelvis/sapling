import { loadSettings, loadFeeSchedule, loadActuals } from "@/lib/planner/data";
import { buildProjection, formatKsh, formatKshShort, MONTH_NAMES_FULL, currentMonthIndex, nextFeeMonth } from "@/lib/planner/engine";
import { PrintSummary } from "@/components/planner/print-summary";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Forestry Tuition Plan — Print Summary",
  description: "Printable 48-month tuition savings plan summary",
};

export default async function PrintPage() {
  const settings = await loadSettings();
  const fees = await loadFeeSchedule();
  const actuals = await loadActuals();
  const projection = buildProjection(settings, fees, undefined, actuals);
  const curIdx = currentMonthIndex(settings);
  const nextFee = nextFeeMonth(projection.months, curIdx);

  return <PrintSummary settings={settings} projection={projection} nextFee={nextFee} curIdx={curIdx} />;
}
