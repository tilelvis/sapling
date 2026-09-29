// Server-side data access: load/save settings, fee schedule, actual transactions.
import { db } from "@/lib/db";
import { defaultFeeSchedule, defaultSettings } from "./engine";
import type { PlannerSettings, FeeEntry, ActualTransaction } from "./types";

export async function loadSettings(): Promise<PlannerSettings> {
  const row = await db.settings.findUnique({ where: { id: 1 } });
  if (!row) {
    const def = defaultSettings();
    await db.settings.create({
      data: {
        id: 1,
        tuitionPerYear: def.tuitionPerYear,
        startingMMF: def.startingMMF,
        monthlySaving: def.monthlySaving,
        mmfAnnualReturn: def.mmfAnnualReturn,
        helbY1: def.helbY1,
        helbY2: def.helbY2,
        helbY3: def.helbY3,
        helbY4: def.helbY4,
        academicStartMonth: def.academicStartMonth,
        academicStartYear: def.academicStartYear,
        studentName: def.studentName,
      },
    });
    return def;
  }
  return {
    tuitionPerYear: row.tuitionPerYear,
    startingMMF: row.startingMMF,
    monthlySaving: row.monthlySaving,
    mmfAnnualReturn: row.mmfAnnualReturn,
    helbY1: row.helbY1,
    helbY2: row.helbY2,
    helbY3: row.helbY3,
    helbY4: row.helbY4,
    academicStartMonth: row.academicStartMonth,
    academicStartYear: row.academicStartYear,
    studentName: row.studentName,
    onboarded: row.onboarded,
  };
}

export async function saveSettings(s: PlannerSettings): Promise<void> {
  await db.settings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      tuitionPerYear: s.tuitionPerYear,
      startingMMF: s.startingMMF,
      monthlySaving: s.monthlySaving,
      mmfAnnualReturn: s.mmfAnnualReturn,
      helbY1: s.helbY1,
      helbY2: s.helbY2,
      helbY3: s.helbY3,
      helbY4: s.helbY4,
      academicStartMonth: s.academicStartMonth,
      academicStartYear: s.academicStartYear,
      studentName: s.studentName,
      onboarded: s.onboarded ?? true,
    },
    update: {
      tuitionPerYear: s.tuitionPerYear,
      startingMMF: s.startingMMF,
      monthlySaving: s.monthlySaving,
      mmfAnnualReturn: s.mmfAnnualReturn,
      helbY1: s.helbY1,
      helbY2: s.helbY2,
      helbY3: s.helbY3,
      helbY4: s.helbY4,
      academicStartMonth: s.academicStartMonth,
      academicStartYear: s.academicStartYear,
      studentName: s.studentName,
      onboarded: s.onboarded ?? true,
    },
  });
}

export async function loadFeeSchedule(): Promise<FeeEntry[]> {
  const rows = await db.feeSchedule.findMany({ orderBy: { monthIndex: "asc" } });
  if (rows.length === 0) {
    const def = defaultFeeSchedule();
    await db.feeSchedule.createMany({
      data: def.map((f) => ({ monthIndex: f.monthIndex, amount: f.amount, label: f.label })),
    });
    return def;
  }
  return rows.map((r) => ({ monthIndex: r.monthIndex, amount: r.amount, label: r.label }));
}

export async function saveFeeSchedule(fees: FeeEntry[]): Promise<void> {
  await db.feeSchedule.deleteMany({});
  if (fees.length > 0) {
    await db.feeSchedule.createMany({
      data: fees.map((f) => ({ monthIndex: f.monthIndex, amount: f.amount, label: f.label })),
    });
  }
}

export async function loadActuals(): Promise<ActualTransaction[]> {
  const rows = await db.actualTransaction.findMany({ orderBy: { monthIndex: "asc" } });
  return rows.map((r) => ({
    monthIndex: r.monthIndex,
    actualSaving: r.actualSaving,
    actualInterest: r.actualInterest,
    actualWithdrawal: r.actualWithdrawal,
    actualEndingBalance: r.actualEndingBalance,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    notes: r.notes,
  }));
}

export async function upsertActual(
  tx: ActualTransaction & { completedAt?: string | null; notes?: string | null },
): Promise<void> {
  await db.actualTransaction.upsert({
    where: { monthIndex: tx.monthIndex },
    create: {
      monthIndex: tx.monthIndex,
      actualSaving: tx.actualSaving,
      actualInterest: tx.actualInterest,
      actualWithdrawal: tx.actualWithdrawal,
      actualEndingBalance: tx.actualEndingBalance,
      completedAt: tx.completedAt ? new Date(tx.completedAt) : null,
      notes: tx.notes,
    },
    update: {
      actualSaving: tx.actualSaving,
      actualInterest: tx.actualInterest,
      actualWithdrawal: tx.actualWithdrawal,
      actualEndingBalance: tx.actualEndingBalance,
      completedAt: tx.completedAt ? new Date(tx.completedAt) : null,
      notes: tx.notes,
    },
  });
}
