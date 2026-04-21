"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export interface TourStep {
  /** CSS selector for the element to spotlight. Use `null` for a centered modal step. */
  selector: string | null;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right" | "auto";
}

interface Props {
  storageKey: string;
  steps: TourStep[];
  /** When true, force-show the tour even if completed. Reset to false after run. */
  forceShow?: boolean;
  onClose?: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const TOOLTIP_WIDTH = 320;
const TOOLTIP_GAP = 14;

function getRect(selector: string | null): Rect | null {
  if (!selector) return null;
  if (typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function computeTooltipPos(
  rect: Rect | null,
  placement: TourStep["placement"],
): {
  top: number;
  left: number;
  arrow: "top" | "bottom" | "left" | "right" | null;
} {
  if (typeof window === "undefined" || !rect) {
    return {
      top: typeof window !== "undefined" ? window.innerHeight / 2 - 100 : 200,
      left:
        typeof window !== "undefined"
          ? window.innerWidth / 2 - TOOLTIP_WIDTH / 2
          : 200,
      arrow: null,
    };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - (rect.top + rect.height);
  const spaceAbove = rect.top;
  const spaceRight = vw - (rect.left + rect.width);
  const spaceLeft = rect.left;

  let p = placement ?? "auto";
  if (p === "auto") {
    if (spaceBelow > 180) p = "bottom";
    else if (spaceAbove > 180) p = "top";
    else if (spaceRight > TOOLTIP_WIDTH + 20) p = "right";
    else p = "left";
  }

  let top = 0;
  let left = 0;
  if (p === "bottom") {
    top = rect.top + rect.height + TOOLTIP_GAP;
    left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  } else if (p === "top") {
    top = rect.top - TOOLTIP_GAP - 160;
    left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  } else if (p === "right") {
    top = rect.top + rect.height / 2 - 80;
    left = rect.left + rect.width + TOOLTIP_GAP;
  } else {
    top = rect.top + rect.height / 2 - 80;
    left = rect.left - TOOLTIP_GAP - TOOLTIP_WIDTH;
  }

  // Clamp to viewport
  left = Math.max(12, Math.min(left, vw - TOOLTIP_WIDTH - 12));
  top = Math.max(12, Math.min(top, vh - 180));

  return { top, left, arrow: p };
}

export default function WalkthroughTour({
  storageKey,
  steps,
  forceShow,
  onClose,
}: Props) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
    arrow: "top" | "bottom" | "left" | "right" | null;
  }>({ top: 0, left: 0, arrow: null });

  // Decide whether to start the tour
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (forceShow) {
      setStepIndex(0);
      setActive(true);
      return;
    }
    try {
      const done = window.localStorage.getItem(storageKey);
      if (!done) {
        // small delay to let the page paint
        const t = window.setTimeout(() => setActive(true), 600);
        return () => window.clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [forceShow, storageKey]);

  const close = useCallback(
    (markDone: boolean) => {
      setActive(false);
      if (markDone) {
        try {
          window.localStorage.setItem(storageKey, "1");
        } catch {
          /* ignore */
        }
      }
      onClose?.();
    },
    [onClose, storageKey],
  );

  const step = active ? steps[stepIndex] : null;

  // Recompute spotlight + tooltip position
  useLayoutEffect(() => {
    if (!step) return;
    const update = () => {
      const r = getRect(step.selector);
      setRect(r);
      setTooltipPos(computeTooltipPos(r, step.placement));
    };
    update();
    // Wait a frame in case the target just rendered.
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  // Scroll target into view
  useEffect(() => {
    if (!step?.selector) return;
    const el = document.querySelector(step.selector);
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [step]);

  // Keyboard nav
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
      else if (e.key === "ArrowRight" || e.key === "Enter") {
        if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
        else close(true);
      } else if (e.key === "ArrowLeft") {
        if (stepIndex > 0) setStepIndex((i) => i - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, stepIndex, steps.length, close]);

  if (!active || !step) return null;

  const isLast = stepIndex === steps.length - 1;
  const spotlight = rect
    ? {
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* Dim mask using SVG for cutout */}
      <svg
        className="pointer-events-auto absolute inset-0 h-full w-full"
        onClick={() => close(true)}
        aria-hidden
      >
        <defs>
          <mask id="dashlink-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.55)"
          mask="url(#dashlink-tour-mask)"
        />
      </svg>

      {/* Spotlight border */}
      {spotlight && (
        <div
          className="absolute rounded-xl ring-2 ring-emerald-400/90 shadow-[0_0_0_4px_rgba(16,185,129,0.18)] transition-all duration-200"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="pointer-events-auto absolute rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_WIDTH,
        }}
        role="dialog"
        aria-label={step.title}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Step {stepIndex + 1} of {steps.length}
          </span>
          <button
            onClick={() => close(true)}
            className="text-zinc-400 hover:text-zinc-700"
            aria-label="Close tour"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <h3 className="text-sm font-semibold text-zinc-900">{step.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600">
          {step.body}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => close(true)}
            className="text-xs text-zinc-400 hover:text-zinc-700"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                onClick={() => setStepIndex((i) => i - 1)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-400"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) close(true);
                else setStepIndex((i) => i + 1);
              }}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
            >
              {isLast ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
