"use client";

import { useEffect, useRef } from "react";

export function Parallax({
  children,
  speed = 0.25,
  className = "",
}: {
  children?: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offset = rect.top * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
