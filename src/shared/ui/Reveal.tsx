"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra delay in ms for stagger sequences. */
  delay?: number;
  /** rise | fade | scale | slide-left | slide-right */
  variant?: "rise" | "fade" | "scale" | "slide-left" | "slide-right";
  once?: boolean;
};

/**
 * Scroll / mount reveal — CSS only, no extra deps. Respects prefers-reduced-motion via CSS.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "rise",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  const style = {
    "--reveal-delay": `${delay}ms`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      style={style}
      className={`cmts-reveal cmts-reveal--${variant} ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/** Stagger children with incremental delay. */
export function Stagger({
  children,
  className = "",
  step = 70,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
}) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) => (
        <Reveal key={i} delay={i * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
