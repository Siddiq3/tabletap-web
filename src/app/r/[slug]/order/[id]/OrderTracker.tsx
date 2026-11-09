"use client";

import { useEffect, useState } from "react";
import { formatINR, upiLink, type Order } from "@/contract";
import { publicApi } from "@/lib/api";

const STEPS = [
  { status: "new", title: "Order received", sub: "Sent to the kitchen" },
  { status: "preparing", title: "Being prepared", sub: "The chef is on it" },
  { status: "ready", title: "Ready", sub: "Coming to your table" },
  { status: "served", title: "Served", sub: "Enjoy your meal" },
] as const;

type Props = { initial: Order; restaurant: { name: string; slug: string; upiId: string | null } };

export function OrderTracker({ initial, restaurant }: Props) {
  const [order, setOrder] = useState(initial);

  // Polling keeps tracking independent of any realtime provider.
  useEffect(() => {
    if (order.status === "served" && order.paymentStatus === "paid") return;
    const t = setInterval(async () => {
      try {
        const res = await publicApi.publicOrder(restaurant.slug, order.id);
        setOrder(res.order);
      } catch { /* offline for a moment; try again next tick */ }
    }, 5000);
    return () => clearInterval(t);
  }, [order.id, order.status, order.paymentStatus, restaurant.slug]);

  const idx = STEPS.findIndex((s) => s.status === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="cust">
      <div className="sheet-inner">
        <div className="row">
          <div>
            <p className="label" style={{ margin: 0 }}>{restaurant.name}</p>
            <h1 style={{ fontSize: 26 }}>Order #{order.orderNo}</h1>
          </div>
          <span className={`pill ${order.paymentStatus === "paid" ? "paid" : "due"}`}>
            {order.paymentStatus === "paid" ? "Paid" : "Payment due"}
          </span>
        </div>
        <p className="muted" style={{ margin: 0 }}>Table {order.tableLabel} · keep this page open to follow your order.</p>

        {cancelled ? (
          <p className="error">This order was cancelled. Please speak to the staff.</p>
        ) : (
          <ol className="track">
            {STEPS.map((s, i) => {
              const done = i < idx || (i === idx && s.status === "served");
              const now = i === idx && !done;
              return (
                <li key={s.status} className={done ? "done" : now ? "now" : ""}>
                  <span className="dot">{done ? "✓" : i + 1}</span>
                  <span><b>{s.title}</b>{s.sub}</span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="card stack">
          {order.lines.map((l, i) => (
            <div className="row" key={i}>
              <span><span className={`mark ${l.isVeg ? "v" : "n"}`} />{l.qty} × {l.name}</span>
              <span className="num">{formatINR(l.unitPricePaise * l.qty)}</span>
            </div>
          ))}
          <div className="totals">
            <div className="muted"><span>GST</span><span>{formatINR(order.taxPaise)}</span></div>
            <div className="grand"><span>Total</span><span>{formatINR(order.totalPaise)}</span></div>
          </div>
        </div>

        {order.paymentStatus !== "paid" && restaurant.upiId && (
          <div className="stack">
            <a className="btn w-full" href={upiLink(restaurant.upiId, restaurant.name, order.totalPaise, `Order ${order.orderNo}`)}>
              Pay {formatINR(order.totalPaise)} with UPI
            </a>
            <p className="muted small" style={{ margin: 0 }}>
              Opens GPay, PhonePe or Paytm. UPI ID: <span style={{ userSelect: "all" }}>{restaurant.upiId}</span>.
              Staff will mark the order paid once they see the payment.
            </p>
          </div>
        )}
        {order.paymentStatus !== "paid" && !restaurant.upiId && (
          <p className="muted small" style={{ margin: 0 }}>Please pay at the counter after your meal.</p>
        )}

        <a className="btn-ghost" style={{ textAlign: "center", textDecoration: "none" }} href={`/r/${restaurant.slug}${order.tableId ? `?t=${order.tableId}` : ""}`}>
          Order more
        </a>
      </div>
    </div>
  );
}
