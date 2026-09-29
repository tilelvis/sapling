"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface WhatIfContextValue {
  /** undefined = use the saved monthly saving. A number = override. */
  whatIfSaving: number | undefined;
  setWhatIfSaving: (n: number | undefined) => void;
  whatIfEnabled: boolean;
  setWhatIfEnabled: (b: boolean) => void;
}

const WhatIfContext = createContext<WhatIfContextValue | null>(null);

export function WhatIfProvider({ children }: { children: ReactNode }) {
  const [whatIfSaving, setWhatIfSaving] = useState<number | undefined>(undefined);
  const [whatIfEnabled, setWhatIfEnabled] = useState(false);

  return (
    <WhatIfContext.Provider
      value={{ whatIfSaving, setWhatIfSaving, whatIfEnabled, setWhatIfEnabled }}
    >
      {children}
    </WhatIfContext.Provider>
  );
}

export function useWhatIf() {
  const ctx = useContext(WhatIfContext);
  if (!ctx) throw new Error("useWhatIf must be used inside WhatIfProvider");
  return ctx;
}
