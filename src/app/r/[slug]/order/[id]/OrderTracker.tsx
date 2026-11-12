"use client";

import { useEffect, useRef, useState } from "react";
import { formatINR, formatInvoiceNo, upiLink, type Bill, type Order } from "@/contract";
import { CallStaffButton, type CallStaff } from "@/components/CallStaffButton";
import { publicApi } from "@/lib/api";
import { UpiQr } from "@/components/UpiQr";

const STEPS = [
  { status: "new", title: "Order received", sub: "Sent to the kitchen" },
  { status: "preparing", title: "Being prepared", sub: "The chef is on it" },
  { status: "ready", title: "Ready", sub: "Coming to your table" },
  { status: "served", title: "Served", sub: "Enjoy your meal" },
] as const;

/** loadBill: where the table bill comes from in the demo (the real page asks the API). */
type Props = { initial: Order; restaurant: { name: string; slug: string; upiId: string | null }; demo?: boolean; onCallStaff?: CallStaff; onOrderMore?: () => void; loadBill?: () => Promise<Bill | null> };

export function OrderTracker({ initial, restaurant, demo, onOrderMore, onCallStaff, loadBill }: Props) {
  const [order, setOrder] = useState(initial);
  const [bill, setBill] = useState<Bill | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const upiRef = useRef<HTMLSpanElement>(null);

  async function copyUpi(upiId: string) {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopyMsg("UPI ID copied.");
    } catch {
      // Clipboard blocked (old browser, http, in-app browser): select it so they can copy by hand.
      const el = upiRef.current;
      if (el) window.getSelection()?.selectAllChildren(el);
      setCopyMsg("Couldn't copy automatically. The UPI ID is selected: copy it from your keyboard or long-press it.");
    }
  }

  useEffect(() => { setOrder(initial); }, [initial]);

  // Polling keeps tracking independent of any realtime provider.
  useEffect(() => {
    if (demo) return;
    if (order.status === "served" && order.paymentStatus === "paid") return;
    const t = setInterval(async () => {
      try {
        const res = await publicApi.publicOrder(restaurant.slug, order.id);
        setOrder(res.order);
      } catch { /* offline for a moment; try again next tick */ }
    }, 5000);
    return () => clearInterval(t);
  }, [order.id, order.status, order.paymentStatus, restaurant.slug, demo]);

  // The table's whole bill (every round, QR or waiter) so the guest pays once at the end.
  useEffect(() => {
    if (demo && !loadBill) return;
    let live = true;
    const get = () => (loadBill ? loadBill() : publicApi.publicBill(restaurant.slug, order.id).then((r) => r.bill))
      .then((b) => { if (live) setBill(b); })
      .catch(() => { /* keep the last bill; try again next tick */ });
    void get();
    const t = setInterval(get, 5000);
    return () => { live = false; clearInterval(t); };
  }, [order.id, restaurant.slug, demo, loadBill]);

  // While the bill is open, the guest pays the bill (it may hold other rounds, service charge, a discount).
  const tableBill = bill;
  const payPaise = tableBill ? tableBill.duePaise : order.paymentStatus !== "paid" ? order.totalPaise : 0;
  const payNote = tableBill ? `Invoice ${formatInvoiceNo(tableBill.invoiceNo)}` : `Order ${order.orderNo}`;

  const idx = STEPS.findIndex((s) => s.status === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="cust">
      <div className="sheet-inner">
        <header className="track-head">
          <div className="row">
            <div>
              <p className="small">{restaurant.name}, table {order.tableLabel}</p>
              <h1 style={{ fontSize: 28 }}>Order #{order.orderNo}</h1>
            </div>
            <span className={`pill ${order.paymentStatus === "paid" ? "paid" : "due"}`}>
              {order.paymentStatus === "paid" ? "Paid" : "Payment due"}
            </span>
          </div>
          {order.tableId && <CallStaffButton slug={restaurant.slug} tableId={order.tableId} onCall={onCallStaff}/>}
        </header>

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
          {tableBill && <b>This order</b>}
          {order.lines.map((l, i) => (
            <div className="row" key={i}>
              <span><span className={`mark ${l.isVeg ? "v" : "n"}`} />{l.qty} × {l.name}</span>
              <span className="num">{formatINR(l.unitPricePaise * l.qty)}</span>
            </div>
          ))}
          {!tableBill && (
            <div className="totals">
              <div className="muted"><span>GST</span><span>{formatINR(order.taxPaise)}</span></div>
              <div className="grand grand-zone"><span>Total</span><span>{formatINR(order.totalPaise)}</span></div>
            </div>
          )}
        </div>

        {tableBill && (
          <section className="card stack" aria-label="Your table's bill">
            <div className="row"><b>Your bill</b><span className="muted small">{tableBill.orders.length === 1 ? "1 order" : `${tableBill.orders.length} orders on this table`}</span></div>
            {tableBill.lines.map((l) => (
              <div className="row" key={`${l.name}|${l.unitPricePaise}|${l.isVeg}`}>
                <span><span className={`mark ${l.isVeg ? "v" : "n"}`} />{l.qty} × {l.name}</span>
                <span className="num">{formatINR(l.unitPricePaise * l.qty)}</span>
              </div>
            ))}
            <div className="totals">
              {tableBill.discountPaise > 0 && <div className="muted"><span>Discount</span><span>− {formatINR(tableBill.discountPaise)}</span></div>}
              {tableBill.serviceChargePaise > 0 && <div className="muted"><span>Service charge</span><span>{formatINR(tableBill.serviceChargePaise)}</span></div>}
              {tableBill.packagingPaise > 0 && <div className="muted"><span>Packaging</span><span>{formatINR(tableBill.packagingPaise)}</span></div>}
              <div className="muted"><span>GST</span><span>{formatINR(tableBill.taxPaise)}</span></div>
              {tableBill.roundOffPaise !== 0 && <div className="muted"><span>Round off</span><span>{formatINR(tableBill.roundOffPaise)}</span></div>}
              {tableBill.paidPaise > 0 && <div className="muted"><span>Already paid</span><span>− {formatINR(tableBill.paidPaise)}</span></div>}
              <div className="grand grand-zone"><span>{tableBill.paidPaise > 0 ? "Balance due" : "Total"}</span><span>{formatINR(tableBill.duePaise)}</span></div>
            </div>
          </section>
        )}

        {payPaise > 0 && restaurant.upiId && (
          <div className="stack">
            <a className="btn w-full" href={upiLink(restaurant.upiId, restaurant.name, payPaise, payNote)}>
              Pay {formatINR(payPaise)} with UPI
            </a>
            <div className="wide-only card" style={{ justifyItems: "center" }}>
              <p className="muted small">Scan with any UPI app</p>
              <UpiQr upiId={restaurant.upiId} payeeName={restaurant.name} totalPaise={payPaise} note={payNote} />
            </div>
            <div className="row">
              <span className="small">
                UPI ID: <span ref={upiRef} style={{ userSelect: "all", fontWeight: 700 }}>{restaurant.upiId}</span>
              </span>
              <button type="button" className="btn-sm" onClick={() => void copyUpi(restaurant.upiId!)}>Copy UPI ID</button>
            </div>
            {copyMsg && <p className="small" role="status" style={{ margin: 0 }}>{copyMsg}</p>}
            <p className="muted small">After paying, show the payment screen to staff.</p>
          </div>
        )}
        {payPaise > 0 && !restaurant.upiId && (
          <p className="muted small" style={{ margin: 0 }}>{demo ? "Sample order. Use the controls below to simulate payment." : "Pay at the counter after your meal."}</p>
        )}

        {onOrderMore ? <button className="btn btn-dark" onClick={onOrderMore}>Order more</button> : <a className="btn btn-dark" style={{ textAlign: "center", textDecoration: "none" }} href={`/r/${restaurant.slug}${order.tableId ? `?t=${order.tableId}` : ""}`}>
          Order more
        </a>}
      </div>
    </div>
  );
}
