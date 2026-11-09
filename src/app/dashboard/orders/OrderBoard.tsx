"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BOARD_STAGES, NEXT_STATUS, STATUS_LABEL, formatINR, type Order, type PaymentMethod, type OrderStatus } from "@/contract";
import { api } from "@/lib/api-client";
import { subscribeToOrders } from "@/lib/feed";
import { useMember } from "../MemberContext";

const STAGE_COLOR: Record<string, string> = {
  new: "var(--accent)", preparing: "var(--turmeric)", ready: "var(--info)", served: "var(--good)",
};

function minutesAgo(iso: string, now: number) {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  return m < 1 ? "just now" : `${m} min ago`;
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch { /* sound is optional */ }
}

export function OrderBoard() {
  const { restaurant, role } = useMember();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const seen = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    try {
      const { orders } = await api.board();
      const fresh = orders.filter((o) => o.status === "new" && seen.current && !seen.current.has(o.id));
      seen.current = new Set(orders.map((o) => o.id));
      if (fresh.length) beep();
      setOrders(orders);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders.");
    }
  }, []);

  useEffect(() => {
    void load();
    const unsubscribe = subscribeToOrders(restaurant.id, () => void load());
    // Fallback refresh in case the live connection drops; also keeps "x min ago" current.
    const t = setInterval(() => { setNow(Date.now()); void load(); }, 30_000);
    return () => { unsubscribe(); clearInterval(t); };
  }, [restaurant.id, load]);

  async function act(orderId: string, fn: () => Promise<unknown>) {
    setBusy(orderId);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const canTakePayment = role === "owner" || role === "manager" || role === "cashier";
  const move = (o: Order, to: OrderStatus) => act(o.id, () => api.moveOrder(o.id, to));
  const pay = (o: Order, m: PaymentMethod) => act(o.id, () => api.markPaid(o.id, m));

  if (!orders) return <p className="muted" style={{ marginTop: 16 }}>{error ?? "Loading orders…"}</p>;

  return (
    <div className="stack" style={{ marginTop: 16 }}>
      {error && <p className="error">{error}</p>}
      <div className="board">
        {BOARD_STAGES.map((stage) => {
          const list = orders.filter((o) => o.status === stage);
          const shown = stage === "served" ? list.slice(0, 8) : list;
          return (
            <section className="col" key={stage}>
              <h2>
                <span>
                  <i style={{ display: "inline-block", width: 9, height: 9, borderRadius: 9, background: STAGE_COLOR[stage], marginRight: 6 }} />
                  {STATUS_LABEL[stage]}
                </span>
                <span className="muted num">{list.length}</span>
              </h2>
              {shown.length === 0 && <div className="empty">No {STATUS_LABEL[stage].toLowerCase()} orders</div>}
              {shown.map((o) => {
                const next = NEXT_STATUS[o.status];
                const disabled = busy === o.id;
                return (
                  <article className="ticket" key={o.id} aria-busy={disabled}>
                    <div className="row">
                      <b style={{ fontFamily: "var(--f-display)", fontSize: 17 }}>{o.tableLabel ?? "No table"}</b>
                      <span className="muted small num">#{o.orderNo} · {minutesAgo(o.createdAt, now)}</span>
                    </div>
                    <ul>
                      {o.lines.map((l, i) => (
                        <li key={i}>
                          <em>{l.qty}×</em>
                          <span><span className={`mark ${l.isVeg ? "v" : "n"}`} />{l.name}</span>
                        </li>
                      ))}
                    </ul>
                    {o.note && <div className="t-note">Note: {o.note}</div>}
                    <div className="row">
                      <span className={`pill ${o.paymentStatus === "paid" ? "paid" : "due"}`}>
                        {o.paymentStatus === "paid" ? `Paid ${o.paymentMethod ?? ""}` : `Due ${formatINR(o.totalPaise)}`}
                      </span>
                      <span className="row" style={{ gap: 6 }}>
                        {o.paymentStatus !== "paid" && canTakePayment && (
                          <>
                            <button className="btn-sm" disabled={disabled} onClick={() => pay(o, "cash")}>Cash</button>
                            <button className="btn-sm" disabled={disabled} onClick={() => pay(o, "upi")}>UPI</button>
                          </>
                        )}
                        {next && (
                          <button className="btn-sm btn-dark" disabled={disabled} onClick={() => move(o, next.to)}>{next.action}</button>
                        )}
                      </span>
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
      <p className="muted small">New orders appear here automatically. Keep this screen open in the kitchen.</p>
    </div>
  );
}
