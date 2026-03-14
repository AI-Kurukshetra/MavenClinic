"use client";

import { useEffect, useState } from "react";

const insight = "We spotted a clear pattern: your energy is strongest in the first half of your cycle, while headaches cluster two days before your period. Protect sleep and hydration this week, and bring the pattern to your provider if it continues next month.";

export function InsightTyping() {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(insight.slice(0, index));

      if (index >= insight.length) {
        window.clearInterval(timer);
      }
    }, 22);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <p className="min-h-[8.5rem] text-sm leading-7 text-slate-200 sm:text-base">
      {visibleText}
      <span className="ml-0.5 inline-block h-5 w-px animate-[landing-blink_1s_steps(2,end)_infinite] bg-[var(--teal-400)] align-middle" />
    </p>
  );
}
