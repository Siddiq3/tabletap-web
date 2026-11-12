"use client";
import { useEffect, useState } from "react";

type Order = { table: string; lines: [number, string][]; note?: string };
const ORDERS: Order[] = [
  { table: "7", lines: [[2, "Paneer tikka bowl"], [1, "Lemon iced tea"]], note: "Less spicy" },
  { table: "2", lines: [[1, "Butter chicken"], [3, "Garlic naan"]] },
  { table: "11", lines: [[2, "Classic cold coffee"]] },
  { table: "4", lines: [[1, "Garden goodness bowl"], [1, "Chef’s special"]], note: "No onion" },
  { table: "9", lines: [[2, "Butter chicken"], [4, "Garlic naan"]] },
  { table: "1", lines: [[1, "Paneer tikka bowl"]] },
  { table: "6", lines: [[2, "Lemon iced tea"], [2, "Garden goodness bowl"]], note: "Extra ice" },
];
const STAMP = ["New", "Cooking", "Cooking", "Ready", "Ready", "Served", "Served"];

export function Kot({ no, order, stamp, fresh = false }: { no: number; order: Order; stamp: string; fresh?: boolean }) {
  return (
    <li className="kot" data-fresh={fresh || undefined}>
      <span className="kot-clip" />
      <div className="kot-head"><span>KOT {no}</span><span>Dine-in</span></div>
      <b className="kot-table">Table {order.table}</b>
      <ul>{order.lines.map(([q, name]) => <li key={name}><span>{q} x</span>{name}</li>)}</ul>
      {order.note && <p className="kot-note">* {order.note}</p>}
      <span key={stamp} className="kot-stamp" data-stamp={stamp.toLowerCase()}>{stamp}</span>
    </li>
  );
}

/** Example tickets arriving at the kitchen pass. One new ticket every few seconds; still under reduced motion. */
export function TicketRail() {
  const [tickets, setTickets] = useState(() => ORDERS.slice(0, 6).map((o, i) => ({ order: o, no: 1048 - i, key: i })));
  const [settled, setSettled] = useState(false); // after the opening drop, later changes animate without delay
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 2300);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => clearTimeout(t);
    let n = 6;
    const id = setInterval(() => {
      setTickets((ts) => [{ order: ORDERS[n % ORDERS.length], no: ts[0].no + 1, key: n }, ...ts].slice(0, 7));
      n++;
    }, 3200);
    return () => { clearInterval(id); clearTimeout(t); };
  }, []);
  return (
    <div className="rail" aria-hidden="true" data-settled={settled || undefined}>
      <div className="rail-bar" />
      <ol className="rail-tickets">
        {tickets.map((t, i) => <Kot key={t.key} no={t.no} order={t.order} stamp={STAMP[i]} fresh={i === 0 && t.key >= 6} />)}
      </ol>
    </div>
  );
}
