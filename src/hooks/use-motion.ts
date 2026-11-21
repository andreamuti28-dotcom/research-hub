import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Counts from 0 to `target` once after mount. The server render and the first
 * client render show the final value, so crawlers and no-JS readers never see 0.
 */
export function useCountUp(target: number, durationMs = 1200, delayMs = 500) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    if (prefersReducedMotion() || target <= 0) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    setValue(0);
    const timer = window.setTimeout(() => {
      const step = (ts: number) => {
        if (start === null) start = ts;
        const k = Math.min(1, (ts - start) / durationMs);
        setValue(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs, delayMs]);
  return value;
}

/** Smoothly eases a displayed number towards `target` whenever it changes. */
export function useTweened(target: number) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    if (prefersReducedMotion()) {
      current.current = target;
      setValue(target);
      return;
    }
    let raf = 0;
    const tick = () => {
      const next = current.current + (target - current.current) * 0.22;
      const done = Math.abs(target - next) < 0.5;
      current.current = done ? target : next;
      setValue(current.current);
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}
