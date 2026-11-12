"use client";

import { useCallback, useEffect, useState } from "react";
import { formatINR, formatInvoiceNo, type SalesReport } from "@/contract";
import { api } from "@/lib/api-client";
import { usePrint } from "@/components/Print";
import { useMember } from "../MemberContext";

const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // yyyy-mm-dd in IST
const istStart = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T00:00:00+05:30`);
const label = (from: string, to: string) => from === to ? new Date(`${from}T12:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : `${from} to ${to}`;

/** Day close: one day's settled bills. Prints at receipt width. */
function DayClose({ report, restaurant, period }: { report: SalesReport; restaurant: { name: string; gstin?: string | null }; period: string }) {
  const row = (k: string, v: number, sign = "") => <div key={k}><dt>{k}</dt><dd>{sign}{formatINR(v)}</dd></div>;
  return (
    <article className="day-close">
      <header><b>{restaurant.name}</b>{restaurant.gstin && <span>GSTIN {restaurant.gstin}</span>}<strong className="inv-title">SALES SUMMARY</strong><span>{period}</span></header>
      <dl>
        <div><dt>Bills</dt><dd>{report.bills} ({report.dineIn} dine-in, {report.takeaway} takeaway)</dd></div>
        {report.firstInvoice !== null && <div><dt>Invoices</dt><dd>{formatInvoiceNo(report.firstInvoice)}–{formatInvoiceNo(report.lastInvoice!)}</dd></div>}
        {row("Food sales", report.subtotalPaise)}
        {report.discountPaise > 0 && row("Discounts", report.discountPaise, "− ")}
        {report.serviceChargePaise > 0 && row("Service charge", report.serviceChargePaise)}
        {report.packagingPaise > 0 && row("Packaging", report.packagingPaise)}
        {row("GST collected", report.taxPaise)}
        {report.roundOffPaise !== 0 && row("Round off", report.roundOffPaise)}
        <div className="inv-total"><dt>Total</dt><dd>{formatINR(report.totalPaise)}</dd></div>
      </dl>
      <h3>PAYMENTS</h3>
      <dl>{report.payments.length ? report.payments.map((p) => <div key={p.method}><dt>{p.method.toUpperCase()} ({p.count})</dt><dd>{formatINR(p.amountPaise)}</dd></div>) : <div><dt>None</dt><dd /></div>}</dl>
      {(report.cancelledItems > 0 || report.voidBills > 0) && (
        <><h3>CANCELLED</h3><dl>
          <div><dt>Items ({report.cancelledItems})</dt><dd>{formatINR(report.cancelledPaise)}</dd></div>
          <div><dt>Voided bills</dt><dd>{report.voidBills}</dd></div>
        </dl></>
      )}
      <p className="inv-thanks">Printed {new Date().toLocaleString("en-IN")}</p>
    </article>
  );
}

export default function ReportsPage() {
  const { restaurant, role } = useMember();
  const today = day(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { print, area } = usePrint();

  const load = useCallback(async () => {
    setError(null);
    try {
      const end = istStart(to); end.setDate(end.getDate() + 1);
      setReport(await api.salesReport(istStart(from).toISOString(), end.toISOString()));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load the report."); }
  }, [from, to]);
  useEffect(() => { if (from <= to) void load(); }, [load, from, to]);

  if (role !== "owner" && role !== "manager") return <p className="muted" style={{ marginTop: 16 }}>Only the owner or a manager can see sales reports.</p>;
  const shift = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return day(d); };
  const monthStart = today.slice(0, 8) + "01";
  const period = label(from, to);

  return (
    <div className="stack" style={{ marginTop: 16 }}>
      <div className="row no-print">
        <div className="row" style={{ justifyContent: "flex-start" }}>
          <button className="btn-sm" aria-pressed={from === today && to === today} onClick={() => { setFrom(today); setTo(today); }}>Today</button>
          <button className="btn-sm" onClick={() => { setFrom(shift(-1)); setTo(shift(-1)); }}>Yesterday</button>
          <button className="btn-sm" onClick={() => { setFrom(monthStart); setTo(today); }}>This month</button>
          <label className="row" style={{ gap: 6 }}><span className="small">From</span><input type="date" value={from} max={today} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="row" style={{ gap: 6 }}><span className="small">To</span><input type="date" value={to} max={today} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
        {report && <button className="btn btn-dark" onClick={() => print(<DayClose report={report} restaurant={restaurant} period={period} />)}>{from === to ? "Print day close" : "Print summary"}</button>}
      </div>
      {from > to && <p className="error">The start date is after the end date.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!report && !error && <p className="muted">Loading…</p>}
      {report && (
        <>
          <div className="report-stats">
            <div className="card"><span className="muted small">Total sales</span><b>{formatINR(report.totalPaise)}</b><span className="muted small">{period}</span></div>
            <div className="card"><span className="muted small">Bills</span><b>{report.bills}</b><span className="muted small">{report.dineIn} dine-in · {report.takeaway} takeaway</span></div>
            <div className="card"><span className="muted small">Average bill</span><b>{formatINR(report.bills ? Math.round(report.totalPaise / report.bills) : 0)}</b></div>
            <div className="card"><span className="muted small">GST collected</span><b>{formatINR(report.taxPaise)}</b><span className="muted small">CGST {formatINR(Math.floor(report.taxPaise / 2))} · SGST {formatINR(report.taxPaise - Math.floor(report.taxPaise / 2))}</span></div>
          </div>
          <div className="report-grid">
            <section className="card stack">
              <h2 style={{ fontSize: 18 }}>Payments</h2>
              {report.payments.length === 0 && <p className="empty">No payments in this period.</p>}
              {report.payments.map((p) => (
                <div key={p.method} className="report-bar">
                  <span>{p.method.toUpperCase()} <span className="muted small">({p.count})</span></span><b>{formatINR(p.amountPaise)}</b>
                  <i style={{ width: `${report.totalPaise ? Math.round((p.amountPaise / report.totalPaise) * 100) : 0}%` }} />
                </div>
              ))}
            </section>
            <section className="card stack">
              <h2 style={{ fontSize: 18 }}>Top dishes</h2>
              {report.topItems.length === 0 && <p className="empty">No dishes sold in this period.</p>}
              <ol className="report-list">{report.topItems.map((t) => <li key={t.name}><span>{t.name}</span><span className="muted small">{t.qty} sold</span><b>{formatINR(t.amountPaise)}</b></li>)}</ol>
            </section>
            <section className="card stack">
              <h2 style={{ fontSize: 18 }}>Breakdown</h2>
              <dl className="report-dl">
                <div><dt>Food sales</dt><dd>{formatINR(report.subtotalPaise)}</dd></div>
                <div><dt>Discounts</dt><dd>− {formatINR(report.discountPaise)}</dd></div>
                <div><dt>Service charge</dt><dd>{formatINR(report.serviceChargePaise)}</dd></div>
                <div><dt>Packaging</dt><dd>{formatINR(report.packagingPaise)}</dd></div>
                <div><dt>GST</dt><dd>{formatINR(report.taxPaise)}</dd></div>
                <div><dt>Round off</dt><dd>{formatINR(report.roundOffPaise)}</dd></div>
                <div><dt>Cancelled items</dt><dd>{report.cancelledItems} · {formatINR(report.cancelledPaise)}</dd></div>
                <div><dt>Voided bills</dt><dd>{report.voidBills}</dd></div>
              </dl>
            </section>
          </div>
        </>
      )}
      {area}
    </div>
  );
}
