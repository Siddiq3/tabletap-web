"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { STATUS_LABEL, formatINR, formatInvoiceNo, rupeesToPaise, type Bill, type MenuItem, type OrderLine, type PaymentMethod } from "@/contract";
import { AddItems, tableName } from "./AddItems";
import { Invoice, billTitle, type InvoiceRestaurant } from "./Invoice";
import { Kot } from "./Kot";
import { usePrint } from "./Print";

const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const METHODS: { id: PaymentMethod; label: string }[] = [{ id: "cash", label: "Cash" }, { id: "upi", label: "UPI" }, { id: "card", label: "Card" }];
const rupees = (p: number) => (p / 100).toFixed(2).replace(/\.00$/, "");

export type OrderTarget = { tableId: string } | { billId: string } | { takeaway: { customerName?: string; customerPhone?: string } };

/** Everything the bills screen needs: the real API on the dashboard, browser storage in the owner demo. */
export type BillsSource = {
  loadItems: () => Promise<MenuItem[]>;
  addOrder: (target: OrderTarget, items: { menuItemId: string; qty: number }[], note: string) => Promise<{ orderNo: number; billId?: string }>;
  /** Must refuse with code "BILL_CHANGED" when the total is no longer `bill.totalPaise`. */
  pay: (bill: Bill, method: PaymentMethod, amountPaise: number) => Promise<void>;
  update: (bill: Bill, patch: { discountPaise?: number; discountReason?: string; serviceChargeOn?: boolean }) => Promise<void>;
  move: (bill: Bill, tableId: string) => Promise<void>;
  merge: (bill: Bill, intoBillId: string) => Promise<void>;
  voidBill: (bill: Bill, reason: string) => Promise<void>;
  cancelItem: (line: OrderLine, qty: number, reason: string) => Promise<void>;
  refresh: () => void;
};

type Adding = { kind: "table"; id: string; label: string } | { kind: "bill"; bill: Bill } | { kind: "takeaway" };

/** Open bills: rounds (QR + staff), KOTs, GST invoice with UPI QR, split payments, discounts, move/merge/void, cancellations. */
export function BillsView({ bills, tables, restaurant, canSettle, canManage, source }: {
  bills: Bill[];
  tables: { id: string; label: string }[];
  restaurant: InvoiceRestaurant;
  /** owner, manager, cashier: take payments, merge bills */
  canSettle: boolean;
  /** owner, manager: discounts, service charge, void, cancel items */
  canManage: boolean;
  source: BillsSource;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState<Adding | null>(null);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [confirm, setConfirm] = useState<PaymentMethod | null>(null);
  const [discount, setDiscount] = useState({ amount: "", reason: "" });
  const [cancelling, setCancelling] = useState<{ line: OrderLine; qty: number; reason: string } | null>(null);
  const [voiding, setVoiding] = useState<string | null>(null);
  const { print, area } = usePrint();

  const bill = useMemo(() => bills.find((b) => b.id === selected) ?? bills[0] ?? null, [bills, selected]);
  const freeTables = tables.filter((t) => !bills.some((b) => b.status === "open" && b.tableId === t.id));
  const otherBills = bills.filter((b) => b.id !== bill?.id);

  // The bill changed under us (guest ordered again, waiter added, someone paid): drop any half-done
  // payment and say so, so nobody takes money against a total they haven't seen.
  const billKey = bill ? `${bill.id}:${bill.totalPaise}:${bill.paidPaise}:${bill.orders.length}` : "";
  const seen = useRef<{ id?: string; key?: string }>({});
  useEffect(() => {
    const before = seen.current;
    if (bill && before.id === bill.id && before.key !== billKey && confirm) {
      setNotice(`${billTitle(bill)} changed: the bill below is updated. Check it before taking payment.`);
    }
    seen.current = { id: bill?.id, key: billKey };
    setConfirm(null);
    setAmount(bill ? rupees(bill.duePaise) : "");
    setDiscount({ amount: bill && bill.discountPaise ? rupees(bill.discountPaise) : "", reason: bill?.discountReason ?? "" });
    setCancelling(null); setVoiding(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the bill itself changes
  }, [billKey]);

  async function run(fn: () => Promise<void>, ok?: string) {
    setBusy(true); setError(null); setNotice(null);
    try { await fn(); if (ok) setNotice(ok); }
    catch (e) {
      const changed = (e as { code?: string }).code === "BILL_CHANGED";
      setError(changed ? "This bill changed just now. Check the updated bill, then take payment again." : e instanceof Error ? e.message : "That didn't work. Try again.");
    } finally { setBusy(false); setConfirm(null); source.refresh(); }
  }

  const amountPaise = rupeesToPaise(amount);
  const amountOk = !!bill && amountPaise !== null && amountPaise > 0 && amountPaise <= bill.duePaise;
  const selectBill = (id: string) => { setSelected(id); setAdding(null); setNotice(null); setError(null); };

  return (
    <div className="bills">
      <aside className="bills-list no-print" aria-label="Open bills">
        <h2>Open bills <span className="muted num">{bills.length}</span></h2>
        {bills.length === 0 && <p className="empty">No open bills. Table QR orders, waiter orders and takeaways appear here.</p>}
        {bills.map((b) => (
          <button key={b.id} className="bill-chip" aria-pressed={b.id === bill?.id && !adding} onClick={() => selectBill(b.id)}>
            <b>{billTitle(b)}</b>
            <span className="muted small">#{formatInvoiceNo(b.invoiceNo)} · {b.orders.length} {b.orders.length === 1 ? "order" : "orders"} · {clock(b.openedAt)}</span>
            <span className="num">{formatINR(b.duePaise)}</span>
          </button>
        ))}
        <button className="btn-ghost" onClick={() => { setAdding({ kind: "takeaway" }); setCustomer({ name: "", phone: "" }); setNotice(null); setError(null); }}>New takeaway</button>
        {freeTables.length > 0 && (
          <label className="field">
            <span>Start an order for a table</span>
            <select value="" onChange={(e) => { const t = tables.find((x) => x.id === e.target.value); if (t) { setAdding({ kind: "table", ...t }); setNotice(null); setError(null); } }}>
              <option value="">Choose a free table…</option>
              {freeTables.map((t) => <option key={t.id} value={t.id}>{tableName(t.label)}</option>)}
            </select>
          </label>
        )}
      </aside>

      <section className="bill-detail stack">
        {notice && <p role="status" className="notice no-print">{notice}</p>}
        {error && <p role="alert" className="error no-print">{error}</p>}

        {adding ? (
          <AddItems
            title={adding.kind === "takeaway" ? "New takeaway" : adding.kind === "table" ? `New order · ${tableName(adding.label)}` : `Add items · ${billTitle(adding.bill)}`}
            loadItems={source.loadItems}
            submit={(items, note) => source.addOrder(
              adding.kind === "table" ? { tableId: adding.id } : adding.kind === "bill" ? { billId: adding.bill.id }
                : { takeaway: { customerName: customer.name.trim() || undefined, customerPhone: customer.phone.trim() || undefined } },
              items, note)}
            onCancel={() => setAdding(null)}
            onDone={(msg, billId) => { if (billId) setSelected(billId); setAdding(null); setNotice(msg); source.refresh(); }}
          >
            {adding.kind === "takeaway" && (
              <div className="form-grid">
                <label className="field"><span>Customer name (optional)</span><input maxLength={60} value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} /></label>
                <label className="field"><span>Phone (optional)</span><input inputMode="tel" maxLength={15} value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} /></label>
              </div>
            )}
          </AddItems>
        ) : bill ? (
          <>
            <div className="row no-print">
              <div><h2 style={{ fontSize: 24 }}>{billTitle(bill)}</h2><span className="muted small">Invoice {formatInvoiceNo(bill.invoiceNo)} · opened {clock(bill.openedAt)}</span></div>
              <span className="row" style={{ gap: 8 }}>
                <button className="btn-ghost" onClick={() => setAdding({ kind: "bill", bill })}>Add items</button>
                <button className="btn btn-dark" onClick={() => print(<Invoice bill={bill} restaurant={restaurant} />)}>Print bill</button>
              </span>
            </div>

            <ol className="rounds no-print" aria-label="Orders on this bill">
              {bill.orders.map((o) => (
                <li key={o.id}>
                  <div className="row">
                    <b>#{o.orderNo} · {clock(o.createdAt)} <span className="muted small">{o.source === "staff" ? `added by ${o.placedByName ?? "staff"}` : "guest QR"}</span></b>
                    <span className="row" style={{ gap: 6 }}>
                      <span className="pill">{STATUS_LABEL[o.status]}</span>
                      <button className="btn-sm" onClick={() => print(<Kot order={o} where={billTitle(bill)} />)}>Print KOT</button>
                    </span>
                  </div>
                  <ul className="round-lines">
                    {o.lines.map((l, i) => (
                      <li key={l.id ?? i}>
                        <span>{l.qty} × {l.name} <span className="muted small">{formatINR(l.unitPricePaise * l.qty)}</span></span>
                        {canManage && l.id && <button className="link-btn small" onClick={() => setCancelling({ line: l, qty: 1, reason: "" })}>Cancel</button>}
                      </li>
                    ))}
                  </ul>
                  {o.note && <span className="muted small">“{o.note}”</span>}
                </li>
              ))}
            </ol>

            {cancelling && (
              <form className="card stack no-print" onSubmit={(e) => { e.preventDefault(); const c = cancelling; void run(() => source.cancelItem(c.line, c.qty, c.reason.trim()), `Cancelled ${c.qty} × ${c.line.name}.`); }}>
                <b>Cancel {cancelling.line.name}</b>
                <div className="form-grid">
                  <label className="field"><span>How many</span><select value={cancelling.qty} onChange={(e) => setCancelling({ ...cancelling, qty: Number(e.target.value) })}>{Array.from({ length: cancelling.line.qty }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
                  <label className="field"><span>Reason</span><input required minLength={2} maxLength={120} placeholder="Out of stock, wrong item…" value={cancelling.reason} onChange={(e) => setCancelling({ ...cancelling, reason: e.target.value })} /></label>
                </div>
                <div className="row" style={{ justifyContent: "flex-start" }}><button className="btn" disabled={busy}>Cancel item</button><button type="button" className="btn-ghost" onClick={() => setCancelling(null)}>Keep it</button></div>
              </form>
            )}

            <Invoice bill={bill} restaurant={restaurant} />

            {canManage && (
              <div className="card stack no-print">
                <b>Discount and charges</b>
                <form className="form-grid" onSubmit={(e) => {
                  e.preventDefault();
                  const p = rupeesToPaise(discount.amount || "0");
                  if (p === null) return setError("Enter the discount in rupees.");
                  void run(() => source.update(bill, { discountPaise: p, discountReason: discount.reason.trim() }), p ? `Discount of ${formatINR(p)} applied.` : "Discount removed.");
                }}>
                  <label className="field"><span>Discount (₹)</span><input inputMode="decimal" value={discount.amount} onChange={(e) => setDiscount((d) => ({ ...d, amount: e.target.value }))} placeholder="0" /></label>
                  <label className="field"><span>Reason</span><input maxLength={120} value={discount.reason} onChange={(e) => setDiscount((d) => ({ ...d, reason: e.target.value }))} placeholder="Regular customer" /></label>
                  <button className="btn-ghost" disabled={busy}>Apply</button>
                </form>
                {bill.kind === "dine_in" && !!restaurant.serviceChargePercent && (
                  <label className="row" style={{ justifyContent: "flex-start" }}>
                    <input type="checkbox" checked={bill.serviceChargeOn} disabled={busy} onChange={(e) => void run(() => source.update(bill, { serviceChargeOn: e.target.checked }))} />
                    Service charge {restaurant.serviceChargePercent}%
                  </label>
                )}
              </div>
            )}

            {canSettle && (
              <div className="settle card stack no-print">
                <div className="row"><b>Take payment · due {formatINR(bill.duePaise)}</b><span className="muted small">Enter part of the amount to split between cash, UPI and card.</span></div>
                {bill.payments.length > 0 && <p className="small muted">Paid so far: {bill.payments.map((p) => `${formatINR(p.amountPaise)} ${p.method.toUpperCase()}`).join(" + ")}</p>}
                {confirm ? (
                  <div className="row" style={{ justifyContent: "flex-start" }}>
                    <button className="btn" disabled={busy || !amountOk} onClick={() => void run(() => source.pay(bill, confirm, amountPaise!), amountPaise === bill.duePaise ? `${billTitle(bill)} paid and closed.` : `${formatINR(amountPaise!)} received by ${confirm.toUpperCase()}.`)}>
                      {busy ? "Saving…" : `Confirm ${formatINR(amountPaise ?? 0)} by ${confirm.toUpperCase()}`}
                    </button>
                    <button className="btn-ghost" disabled={busy} onClick={() => setConfirm(null)}>Back</button>
                  </div>
                ) : (
                  <div className="row" style={{ justifyContent: "flex-start" }}>
                    <label className="field" style={{ maxWidth: 160 }}><span>Amount (₹)</span><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
                    {METHODS.map((m) => <button key={m.id} className="btn-ghost" disabled={!amountOk || bill.duePaise === 0} onClick={() => setConfirm(m.id)}>{m.label}</button>)}
                  </div>
                )}
                {amount && !amountOk && bill.duePaise > 0 && <p className="small error">Enter an amount up to {formatINR(bill.duePaise)}.</p>}
              </div>
            )}

            <div className="card stack no-print">
              <b>Table</b>
              <div className="row" style={{ justifyContent: "flex-start" }}>
                {bill.kind === "dine_in" && freeTables.length > 0 && (
                  <label className="field"><span>Move to</span>
                    <select value="" disabled={busy} onChange={(e) => { const t = tables.find((x) => x.id === e.target.value); if (t) void run(() => source.move(bill, t.id), `Moved to ${tableName(t.label)}.`); }}>
                      <option value="">Choose a free table…</option>
                      {freeTables.map((t) => <option key={t.id} value={t.id}>{tableName(t.label)}</option>)}
                    </select>
                  </label>
                )}
                {canSettle && otherBills.length > 0 && (
                  <label className="field"><span>Merge into</span>
                    <select value="" disabled={busy} onChange={(e) => { const into = otherBills.find((b) => b.id === e.target.value); if (into) void run(async () => { await source.merge(bill, into.id); setSelected(into.id); }, `Merged into ${billTitle(into)}.`); }}>
                      <option value="">Choose a bill…</option>
                      {otherBills.map((b) => <option key={b.id} value={b.id}>{billTitle(b)} · #{formatInvoiceNo(b.invoiceNo)}</option>)}
                    </select>
                  </label>
                )}
                {canManage && bill.payments.length === 0 && (voiding === null
                  ? <button className="btn-sm" onClick={() => setVoiding("")}>Void bill</button>
                  : <form className="row" onSubmit={(e) => { e.preventDefault(); const r = voiding; void run(async () => { await source.voidBill(bill, r.trim()); setSelected(null); }, `Invoice ${formatInvoiceNo(bill.invoiceNo)} voided.`); }}>
                      <input required minLength={2} maxLength={120} placeholder="Reason (walked out, test order…)" value={voiding} onChange={(e) => setVoiding(e.target.value)} />
                      <button className="btn-sm" disabled={busy}>Void</button><button type="button" className="btn-sm" onClick={() => setVoiding(null)}>Keep</button>
                    </form>)}
              </div>
            </div>
          </>
        ) : (
          <p className="empty">Choose a bill, start a table order or a takeaway.</p>
        )}
      </section>
      {area}
    </div>
  );
}
