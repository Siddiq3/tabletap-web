"use client";
import { useLayoutEffect } from "react";

/** Marks [data-reveal] elements with data-inview once they scroll into view; CSS plays the animation.
    Does nothing under reduced motion, so content is simply shown. */
export function RevealOnScroll() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    root.dataset.motion = "1";
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).dataset.inview = "1"; io.unobserve(e.target); }
    }, { threshold: 0.25 });
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => { io.disconnect(); delete root.dataset.motion; };
  }, []);
  return null;
}
