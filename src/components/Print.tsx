"use client";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Print exactly one document (invoice, KOT, day close). The document renders into a hidden
 * .print-area that is the only thing on paper; the screen is left alone.
 */
export function usePrint() {
  const [doc, setDoc] = useState<ReactNode>(null);
  useEffect(() => {
    if (!doc) return;
    const done = () => setDoc(null);
    window.addEventListener("afterprint", done, { once: true });
    const t = setTimeout(() => window.print(), 60); // let images (UPI QR) paint first
    return () => { clearTimeout(t); window.removeEventListener("afterprint", done); };
  }, [doc]);
  return { print: (d: ReactNode) => setDoc(d), area: doc ? <div className="print-area">{doc}</div> : null };
}
