"use client";

import { useEffect } from "react";
import { TreePine, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import type { ProjectionResult, PlannerSettings, MonthRow } from "@/lib/planner/types";
import { formatKsh, formatKshShort, MONTH_NAMES_FULL } from "@/lib/planner/engine";

interface PrintSummaryProps {
  settings: PlannerSettings;
  projection: ProjectionResult;
  nextFee: MonthRow | null;
  curIdx: number;
}

export function PrintSummary({ settings, projection, nextFee, curIdx }: PrintSummaryProps) {
  // Auto-trigger print dialog on load
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 800);
    return () => clearTimeout(timer);
  }, []);

  const curMonth = projection.months[curIdx];
  const hasShortfall = projection.hasShortfall;
  const generatedDate = new Date().toLocaleDateString("en-KE", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="print-container bg-white text-black min-h-screen p-8 max-w-4xl mx-auto" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Screen-only back button */}
      <div className="screen-only mb-4 flex items-center justify-between print:hidden">
        <a
          href="/"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          ← Back to planner
        </a>
        <button
          onClick={() => window.print()}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-green-700 flex items-center justify-center text-white">
              <TreePine className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Forestry Tuition Plan</h1>
              <p className="text-sm text-gray-600">{settings.studentName}</p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Generated: {generatedDate}</p>
            <p>Academic start: {MONTH_NAMES_FULL[settings.academicStartMonth]} {settings.academicStartYear}</p>
            <p>Plan: {MONTH_NAMES_FULL[settings.academicStartMonth]} {settings.academicStartYear} — {MONTH_NAMES_FULL[(settings.academicStartMonth + 7) % 12]} {settings.academicStartYear + 4}</p>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">Executive Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <SummaryBox
            label="Current MMF Balance"
            value={formatKsh(curMonth?.endingBalance ?? 0)}
            sub={`${curMonth?.monthLabel ?? "Now"} · Year ${curMonth?.year ?? 1}`}
          />
          <SummaryBox
            label="Monthly Saving"
            value={formatKsh(settings.monthlySaving)}
            sub={`Required: ${formatKsh(projection.requiredMonthlySaving)}/mo`}
            warning={projection.requiredMonthlySaving > settings.monthlySaving}
          />
          <SummaryBox
            label="Graduation Projection"
            value={formatKsh(projection.finalBalance)}
            sub={hasShortfall ? `Shortfall in ${projection.minBalanceMonth?.monthLabel}` : "On track"}
            warning={hasShortfall}
          />
        </div>
      </section>

      {/* Status Banner */}
      <section className="mb-6">
        <div
          className={`rounded-lg p-4 border-2 ${
            hasShortfall
              ? "border-red-600 bg-red-50"
              : "border-green-700 bg-green-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {hasShortfall ? (
              <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-green-700 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm">
                {hasShortfall ? "FUNDING SHORTFALL DETECTED" : "PLAN IS ON TRACK"}
              </p>
              <p className="text-xs mt-1">
                {hasShortfall
                  ? `Your projected MMF balance drops to ${formatKsh(projection.minBalance)} in ${projection.minBalanceMonth?.monthLabel}. Increase your monthly saving to approximately ${formatKsh(projection.requiredMonthlySaving)} to break even.`
                  : `Your current saving plan of ${formatKsh(settings.monthlySaving)}/month covers all scheduled fees. Projected graduation balance: ${formatKsh(projection.finalBalance)}.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Next Fee */}
      {nextFee && (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">Next Fee Due</h2>
          <div className="rounded-lg border border-gray-300 p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-base">{nextFee.feeLabel}</p>
              <p className="text-sm text-gray-600">{nextFee.monthLabel} · Year {nextFee.year}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{formatKsh(nextFee.withdrawal)}</p>
              <p className="text-xs text-gray-600">{Math.max(0, nextFee.monthIndex - curIdx)} months away</p>
            </div>
          </div>
        </section>
      )}

      {/* Cushion Analysis (three-layers model) */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">Saving Recommendation</h2>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Layer</th>
              <th className="border border-gray-300 p-2 text-right">Amount / Month</th>
              <th className="border border-gray-300 p-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2 font-bold">① Base saving</td>
              <td className="border border-gray-300 p-2 text-right tnum font-bold">{formatKsh(settings.monthlySaving)}</td>
              <td className="border border-gray-300 p-2">Your normal monthly target</td>
            </tr>
            <tr className={projection.cushion.recommendedAdjustment > 0 ? "bg-red-50" : "bg-green-50"}>
              <td className="border border-gray-300 p-2 font-bold">② Cushion adjustment</td>
              <td className="border border-gray-300 p-2 text-right tnum font-bold">
                {projection.cushion.recommendedAdjustment > 0
                  ? `+${formatKsh(projection.cushion.recommendedAdjustment)}`
                  : "Ksh 0 (on track)"}
              </td>
              <td className="border border-gray-300 p-2">
                {projection.cushion.recommendedAdjustment > 0
                  ? "Extra saving needed to reach all fees on time"
                  : "Base saving covers all scheduled fees"}
              </td>
            </tr>
            <tr className="bg-gray-100 font-bold">
              <td className="border border-gray-300 p-2">Save this month</td>
              <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(settings.monthlySaving + projection.cushion.recommendedAdjustment)}</td>
              <td className="border border-gray-300 p-2">Total recommended monthly saving</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-gray-500 mt-2">
          <strong>Method:</strong> The break-even saving is the amount that brings the projected
          graduation balance to approximately zero. It accounts for all fees cumulatively.
          MMF interest ({Math.round(settings.mmfAnnualReturn * 100)}%) is treated as a bonus cushion,
          not relied upon to make the plan work.
        </p>
      </section>

      {/* Upcoming Fees Analysis */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">Upcoming Fees Analysis</h2>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Fee</th>
              <th className="border border-gray-300 p-2 text-left">Date</th>
              <th className="border border-gray-300 p-2 text-right">Amount</th>
              <th className="border border-gray-300 p-2 text-right">Projected Balance</th>
              <th className="border border-gray-300 p-2 text-right">Gap</th>
              <th className="border border-gray-300 p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {projection.cushion.upcomingFees.map((f) => (
              <tr key={f.monthIndex} className={f.status === "shortfall" ? "bg-red-50" : ""}>
                <td className="border border-gray-300 p-2">{f.feeLabel}</td>
                <td className="border border-gray-300 p-2">{f.monthLabel} ({f.monthsAway} mo)</td>
                <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(f.feeAmount)}</td>
                <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(Math.round(f.projectedBalanceAtFee))}</td>
                <td className="border border-gray-300 p-2 text-right tnum">
                  {f.gap > 0 ? formatKsh(Math.round(f.gap)) : "—"}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {f.status === "covered" ? (
                    <span className="text-green-700">✓ Covered</span>
                  ) : (
                    <span className="text-red-600 font-bold">⚠ Shortfall</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Annual Summary Table */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">Annual Summary</h2>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Year</th>
              <th className="border border-gray-300 p-2 text-right">Tuition</th>
              <th className="border border-gray-300 p-2 text-right">HELB</th>
              <th className="border border-gray-300 p-2 text-right">You Fund</th>
              <th className="border border-gray-300 p-2 text-right">Saved</th>
              <th className="border border-gray-300 p-2 text-right">Interest</th>
              <th className="border border-gray-300 p-2 text-right">Fees Out</th>
              <th className="border border-gray-300 p-2 text-right">End Balance</th>
            </tr>
          </thead>
          <tbody>
            {projection.years.map((y) => {
              const fundingNeeded = y.studentFunding;
              const credit = y.helb > y.tuition;
              return (
                <tr key={y.year}>
                  <td className="border border-gray-300 p-2 font-bold">Year {y.year}</td>
                  <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(y.tuition)}</td>
                  <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(y.helb)}</td>
                  <td className="border border-gray-300 p-2 text-right tnum">
                    {credit ? `+${formatKsh(y.helb - y.tuition)}` : formatKsh(fundingNeeded)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(Math.round(y.totalContributions))}</td>
                  <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(Math.round(y.totalInterest))}</td>
                  <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(y.totalWithdrawn)}</td>
                  <td className="border border-gray-300 p-2 text-right tnum font-bold">
                    {formatKsh(Math.round(y.endBalance))}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td className="border border-gray-300 p-2">TOTAL</td>
              <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(settings.tuitionPerYear * 4)}</td>
              <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(settings.helbY1 + settings.helbY2 + settings.helbY3 + settings.helbY4)}</td>
              <td className="border border-gray-300 p-2 text-right tnum">
                {formatKsh((settings.tuitionPerYear * 4) - (settings.helbY1 + settings.helbY2 + settings.helbY3 + settings.helbY4))}
              </td>
              <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(Math.round(projection.totalContributions))}</td>
              <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(Math.round(projection.totalInterest))}</td>
              <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(Math.round(projection.totalWithdrawn))}</td>
              <td className="border border-gray-300 p-2 text-right tnum">{formatKsh(Math.round(projection.finalBalance))}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* 48-Month Detail Table */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">48-Month Detail</h2>
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-1 text-left">Month</th>
              <th className="border border-gray-300 p-1 text-right">Start</th>
              <th className="border border-gray-300 p-1 text-right">Saving</th>
              <th className="border border-gray-300 p-1 text-right">Fee</th>
              <th className="border border-gray-300 p-1 text-right">Interest</th>
              <th className="border border-gray-300 p-1 text-right">End Balance</th>
              <th className="border border-gray-300 p-1 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {projection.months.map((m) => {
              const isFee = m.isFeeMonth;
              const negative = m.endingBalance < 0;
              return (
                <tr key={m.monthIndex} className={isFee ? "bg-orange-50" : ""}>
                  <td className="border border-gray-300 p-1">
                    {m.monthLabel} <span className="text-gray-500">(Y{m.year})</span>
                  </td>
                  <td className="border border-gray-300 p-1 text-right tnum">{formatKsh(Math.round(m.startingBalance))}</td>
                  <td className="border border-gray-300 p-1 text-right tnum">{formatKsh(Math.round(m.contribution))}</td>
                  <td className="border border-gray-300 p-1 text-right tnum">{isFee ? formatKsh(Math.round(m.withdrawal)) : "—"}</td>
                  <td className="border border-gray-300 p-1 text-right tnum">{formatKsh(Math.round(m.interest))}</td>
                  <td className="border border-gray-300 p-1 text-right tnum font-bold">
                    {formatKsh(Math.round(m.endingBalance))}
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    {negative ? (
                      <span className="text-red-600 font-bold">⚠ SHORTFALL</span>
                    ) : isFee ? (
                      <span className="text-orange-700">FEE</span>
                    ) : m.monthIndex === curIdx ? (
                      <span className="text-green-700 font-bold">NOW</span>
                    ) : m.hasActual ? (
                      <span className="text-green-700">✓</span>
                    ) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Assumptions */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">Planning Assumptions</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
          <AssumptionRow label="Tuition per year" value={formatKsh(settings.tuitionPerYear)} />
          <AssumptionRow label="Starting MMF balance" value={formatKsh(settings.startingMMF)} />
          <AssumptionRow label="Monthly saving target" value={formatKsh(settings.monthlySaving)} />
          <AssumptionRow label="MMF annual return (assumed)" value={`${(settings.mmfAnnualReturn * 100).toFixed(1)}%`} />
          <AssumptionRow label="HELB Year 1" value={formatKsh(settings.helbY1)} />
          <AssumptionRow label="HELB Year 2" value={formatKsh(settings.helbY2)} />
          <AssumptionRow label="HELB Year 3" value={formatKsh(settings.helbY3)} />
          <AssumptionRow label="HELB Year 4" value={formatKsh(settings.helbY4)} />
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mt-8 border-t-2 border-gray-300 pt-4">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          <strong>Disclaimer:</strong> This plan is a projection based on the assumptions
          stated above. The {Math.round(settings.mmfAnnualReturn * 100)}% MMF return is an
          assumption, not a guarantee — actual MMF returns fluctuate. Savings are the
          primary funding mechanism; interest is treated as a bonus cushion. The projected
          balance may dip below zero to warn you early; your real MMF balance can never go
          negative. Always consult your MMF provider for actual terms and current yields.
          Generated by Forestry Tuition Planner on {generatedDate}.
        </p>
      </section>
    </div>
  );
}

function SummaryBox({
  label, value, sub, warning,
}: { label: string; value: string; sub?: string; warning?: boolean }) {
  return (
    <div className={`rounded-lg border-2 p-3 ${warning ? "border-red-600 bg-red-50" : "border-gray-300 bg-gray-50"}`}>
      <p className="text-[10px] uppercase tracking-wide text-gray-600">{label}</p>
      <p className={`text-lg font-bold ${warning ? "text-red-700" : "text-black"}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function AssumptionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-200 py-1">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium tnum">{value}</span>
    </div>
  );
}
