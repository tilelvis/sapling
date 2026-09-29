"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated number counter that counts up/down to a target value.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */
export function AnimatedNumber({
  value,
  duration = 600,
  format,
  className,
}: {
  value: number;
  duration?: number;
  format: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;

    // Early-exit: no animation needed if value unchanged.
    // (Don't call setState here — display is already correct.)
    if (from === to) return;

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
