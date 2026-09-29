"use client";

import { useState, useEffect, useCallback } from "react";

export interface SavedScenario {
  id: string;
  name: string;
  savedAt: string;
  monthlySaving: number;
  mmfAnnualReturn: number;
  finalBalance: number;
  hasShortfall: boolean;
  shortfallAmount: number;
  requiredMonthlySaving: number;
}

const STORAGE_KEY = "forestry-planner-scenarios";

/**
 * Load scenarios from localStorage. Returns [] during SSR and on first
 * client render (before hydration), then the real value after.
 */
function readScenariosFromStorage(): SavedScenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedScenario[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persist saved scenarios (what-if snapshots) to localStorage.
 * This is intentionally client-only — scenarios are personal scratch space,
 * not part of the official backup/restore flow.
 */
export function useSavedScenarios() {
  // Lazy initializer reads localStorage on first client render.
  // (Returns [] during SSR, which is fine since this hook is only used in
  // client components and the real value populates after hydration.)
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => readScenariosFromStorage());

  // No load effect needed — lazy initializer handles it.

  const persist = useCallback((next: SavedScenario[]) => {
    setScenarios(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage may be full or disabled — ignore
    }
  }, []);

  const addScenario = useCallback((scenario: Omit<SavedScenario, "id" | "savedAt">) => {
    const newScenario: SavedScenario = {
      ...scenario,
      id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: new Date().toISOString(),
    };
    setScenarios((prev) => {
      const next = [newScenario, ...prev].slice(0, 12); // keep max 12
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    return newScenario;
  }, []);

  const removeScenario = useCallback((id: string) => {
    setScenarios((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  return { scenarios, loaded: true, addScenario, removeScenario, clearAll };
}
