"use client";

import { useEffect, useState, type ReactNode } from "react";
import { formatINR, type MenuItem } from "@/contract";

export const tableName = (label: string) => `Table ${label.replace(/^T(?=\d)/, "")}`;

/** Menu picker for staff adding items to a table (the guest asked the waiter instead of using the QR). */
export function AddItems({ title, children, loadItems, submit, onDone, onCancel }: {
  title: string;
  /** Extra fields above the menu (takeaway customer details). */
  children?: ReactNode;
  loadItems: () => Promise<MenuItem[]>;
  submit: (items: { menuItemId: string; qty: number }[], note: string) => Promise<{ orderNo: number; billId?: string }>;
  onDone: (msg: string, billId?: string) => void;
  onCancel: () => void;
}) {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { loadItems().then((all) => setItems(all.filter((i) => i.isAvailable))).catch((e) => setError(e instanceof Error ? e.message : "Could not load the menu.")); }, [loadItems]);
  const chosen = Object.entries(qty).filter(([, q]) => q > 0);
  const total = chosen.reduce((s, [id, q]) => s + (items?.find((i) => i.id === id)?.pricePaise ?? 0) * q, 0);
  const shown = (items ?? []).filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()));
  const change = (id: string, d: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(50, (q[id] ?? 0) + d)) }));

  async function add() {
    setBusy(true); setError(null);
    try {
      const r = await submit(chosen.map(([menuItemId, q]) => ({ menuItemId, qty: q })), note);
      onDone(`Order #${r.orderNo} sent to the kitchen.`, r.billId);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not add the items."); setBusy(false); }
  }

  return (
    <section className="card stack add-items">
      <div className="row"><h2 style={{ fontSize: 20 }}>{title}</h2><button className="btn-sm" onClick={onCancel} disabled={busy}>Cancel</button></div>
      {children}
      <label className="field"><span>Search dishes</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Paneer, naan, tea…" /></label>
      {!items && !error && <p className="muted">Loading menu…</p>}
      <div className="add-items-list">
        {shown.map((i) => (
          <div className="add-item" key={i.id}>
            <span><span className={`mark ${i.isVeg ? "v" : "n"}`} />{i.name}<small className="muted"> {formatINR(i.pricePaise)}</small></span>
            <span className="qty">
              <button aria-label={`Remove one ${i.name}`} disabled={!qty[i.id] || busy} onClick={() => change(i.id, -1)}>−</button>
              <b aria-live="polite">{qty[i.id] ?? 0}</b>
              <button aria-label={`Add one ${i.name}`} disabled={busy} onClick={() => change(i.id, 1)}>+</button>
            </span>
          </div>
        ))}
        {items && shown.length === 0 && <p className="empty">No dish matches “{query}”.</p>}
      </div>
      <label className="field"><span>Note for the kitchen (optional)</span><input maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Less spicy" /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" disabled={busy || chosen.length === 0} onClick={() => void add()}>
        {busy ? "Sending to kitchen…" : chosen.length ? `Add ${chosen.reduce((s, [, q]) => s + q, 0)} items · ${formatINR(total)} + GST` : "Choose dishes to add"}
      </button>
    </section>
  );
}

