'use client';
import { useMemo, useState } from 'react';
import { isValidGstin, rupeesToPaise } from '@/contract';
import { BillsView, type BillsSource } from '@/components/BillsView';
import { demoAddOrder, demoCancelItem, demoMergeBills, demoMoveBill, demoOpenBills, demoPay, demoTableId, demoUpdateBill, demoVoidBill } from '@/lib/demo-bills';
import { readDemoWorkspace, saveDemoWorkspace, type DemoWorkspace } from '@/lib/demo-workspace';

/** Owner demo: the real bills screen on browser storage (same rules as the database). */
export function DemoBills({ workspace }: { workspace: DemoWorkspace }) {
  const bills = demoOpenBills(workspace);
  const tables = Array.from({ length: workspace.tableCount }, (_, i) => ({ id: demoTableId(i + 1), label: String(i + 1) }));
  const r = workspace.restaurant;
  const [form, setForm] = useState({ gstin: r.gstin ?? '', service: String(r.serviceChargePercent ?? 0), packaging: String((r.packagingPaise ?? 0) / 100) });
  const [msg, setMsg] = useState<string | null>(null);
  const source = useMemo<BillsSource>(() => ({
    loadItems: async () => readDemoWorkspace()?.menu.items ?? [],
    addOrder: async (target, items, note) => { const r = demoAddOrder(target, items, note, 'staff', 'Demo Owner'); return { orderNo: r.orderNo, billId: r.billId }; },
    pay: async (bill, method, amount) => demoPay(bill.id, method, amount, bill.totalPaise),
    update: async (bill, patch) => demoUpdateBill(bill.id, patch),
    move: async (bill, tableId) => demoMoveBill(bill.id, tableId),
    merge: async (bill, into) => demoMergeBills(bill.id, into),
    voidBill: async (bill, reason) => demoVoidBill(bill.id, reason),
    cancelItem: async (line, qty, reason) => demoCancelItem(line.id!, qty, reason),
    refresh: () => {},
  }), []);
  function saveSettings(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const gstin = form.gstin.trim().toUpperCase(); const service = Number(form.service); const packaging = rupeesToPaise(form.packaging || '0');
    if (gstin && !isValidGstin(gstin)) return setMsg('GSTIN should be 15 characters, like 29ABCDE1234F1Z5.');
    if (!Number.isFinite(service) || service < 0 || service > 20) return setMsg('Service charge must be 0 to 20%.');
    if (packaging === null || packaging > 100000) return setMsg('Packaging charge must be ₹0 to ₹1,000.');
    const ws = readDemoWorkspace(); if (!ws) return;
    saveDemoWorkspace({ ...ws, restaurant: { ...ws.restaurant, gstin: gstin || null, serviceChargePercent: service, packagingPaise: packaging } });
    setMsg('Saved. Open bills use the new settings.');
  }
  return <section className="stack">
    <div><h2>Bills</h2><p className="muted">Every round a table orders, by QR or through a waiter, joins one bill with its own invoice number. Takeaways get their own bill.</p></div>
    <details className="card"><summary><b>Bill settings</b> <span className="muted small">GSTIN, service charge, packaging</span></summary>
      <form className="form-grid" style={{ marginTop: 12 }} onSubmit={saveSettings}>
        <label className="field"><span>GSTIN (makes it a tax invoice)</span><input maxLength={15} value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} placeholder="29ABCDE1234F1Z5" /></label>
        <label className="field"><span>Service charge % (dine-in)</span><input inputMode="decimal" value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} /></label>
        <label className="field"><span>Packaging ₹ (takeaway)</span><input inputMode="decimal" value={form.packaging} onChange={e => setForm(f => ({ ...f, packaging: e.target.value }))} /></label>
        <button className="btn-ghost">Save</button>
      </form>
      {msg && <p role="status" className="small">{msg}</p>}
    </details>
    <BillsView bills={bills} tables={tables} restaurant={workspace.restaurant} canSettle canManage source={source} />
  </section>;
}
