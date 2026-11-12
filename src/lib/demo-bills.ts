'use client';
// Owner demo: the bill rules of migration 0011 on browser storage, so the demo behaves like the real
// dashboard. Money uses computeBillAmounts, the tested mirror of the database's bill_amounts view.
import { DomainError, ERROR_MESSAGES, computeBillAmounts, makeBill, type Bill, type BillAmounts, type Order, type PaymentMethod } from '@/contract';
import { readDemoWorkspace, saveDemoWorkspace, type DemoBill, type DemoWorkspace } from './demo-workspace';

const fail = (code: keyof typeof ERROR_MESSAGES): never => { throw new DomainError(code, ERROR_MESSAGES[code]); };
const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const demoTableId = (n: string | number) => `demo-table-${n}`;
const labelOf = (tableId: string) => tableId.replace('demo-table-', '');

function workspace(): DemoWorkspace { return readDemoWorkspace() ?? fail('RESTAURANT_UNAVAILABLE'); }

function amounts(ws: DemoWorkspace, b: DemoBill): BillAmounts {
  if (b.frozen) return b.frozen;
  const subtotalPaise = ws.orders.filter(o => o.billId === b.id && o.status !== 'cancelled').reduce((s, o) => s + o.subtotalPaise, 0);
  const r = ws.restaurant;
  return computeBillAmounts({ subtotalPaise, discountPaise: b.discountPaise, kind: b.kind, serviceChargeOn: b.serviceChargeOn, serviceChargePercent: r.serviceChargePercent ?? 0, packagingPaise: r.packagingPaise ?? 0, taxPercent: r.taxPercent });
}

export function demoBill(ws: DemoWorkspace, b: DemoBill): Bill {
  const { payments, frozen: _f, discountPaise: _d, ...header } = b;
  return makeBill(header, amounts(ws, b), ws.orders.filter(o => o.billId === b.id), payments);
}
export const demoOpenBills = (ws: DemoWorkspace) => ws.bills.filter(b => b.status === 'open').map(b => demoBill(ws, b));

function newBill(ws: DemoWorkspace, fields: Partial<DemoBill>): DemoBill {
  const bill: DemoBill = { id: uid('bill'), invoiceNo: Math.max(0, ...ws.bills.map(b => b.invoiceNo)) + 1, kind: 'dine_in', status: 'open', tableId: null, tableLabel: null,
    customerName: null, customerPhone: null, discountPaise: 0, discountReason: null, serviceChargeOn: true, openedAt: new Date().toISOString(), settledAt: null, voidReason: null, payments: [], frozen: null, ...fields };
  ws.bills.push(bill);
  return bill;
}
const openBill = (ws: DemoWorkspace, id: string) => ws.bills.find(b => b.id === id && b.status === 'open') ?? fail('BILL_CLOSED');

/** Same as add_order: guest QR or staff, to a table (its open bill), a bill, or a new takeaway. */
export function demoAddOrder(target: { tableId: string } | { billId: string } | { takeaway: { customerName?: string; customerPhone?: string } },
  items: { menuItemId: string; qty: number }[], note: string, source: 'qr' | 'staff', placedByName: string | null = null) {
  const ws = workspace();
  if (!items.length) fail('EMPTY_ORDER');
  const lines = items.map(({ menuItemId, qty }) => {
    const m = ws.menu.items.find(i => i.id === menuItemId && i.isAvailable);
    if (!m || !Number.isInteger(qty) || qty < 1 || qty > 50) fail('ITEM_UNAVAILABLE');
    return { id: uid('line'), name: m!.name, isVeg: m!.isVeg, unitPricePaise: m!.pricePaise, qty };
  });
  let bill: DemoBill;
  if ('takeaway' in target) bill = newBill(ws, { kind: 'takeaway', customerName: target.takeaway.customerName?.trim() || null, customerPhone: target.takeaway.customerPhone?.trim() || null });
  else if ('billId' in target) bill = openBill(ws, target.billId);
  else bill = ws.bills.find(b => b.status === 'open' && b.tableId === target.tableId) ?? newBill(ws, { tableId: target.tableId, tableLabel: labelOf(target.tableId) });
  const subtotalPaise = lines.reduce((s, l) => s + l.unitPricePaise * l.qty, 0);
  const taxPaise = Math.round(subtotalPaise * ws.restaurant.taxPercent / 100);
  const orderNo = Math.max(1040, ...ws.orders.map(o => o.orderNo)) + 1;
  const order: Order = { id: uid('order'), orderNo, tableId: bill.tableId, tableLabel: bill.tableLabel, status: 'new', paymentStatus: 'unpaid', paymentMethod: null,
    note: note.trim() || null, subtotalPaise, taxPaise, totalPaise: subtotalPaise + taxPaise, createdAt: new Date().toISOString(), lines,
    billId: bill.id, source, placedByName };
  ws.orders = [order, ...ws.orders].slice(0, 200);
  saveDemoWorkspace(ws);
  return { order, orderNo, billId: bill.id };
}

function close(ws: DemoWorkspace, b: DemoBill, method: PaymentMethod) {
  b.frozen = amounts(ws, b);
  b.status = 'settled'; b.settledAt = new Date().toISOString();
  ws.orders = ws.orders.map(o => o.billId === b.id && o.status !== 'cancelled' && o.paymentStatus === 'unpaid' ? { ...o, paymentStatus: 'paid', paymentMethod: method } : o);
}

/** Same as add_bill_payment: against the total the cashier saw; closes the bill when covered. */
export function demoPay(billId: string, method: PaymentMethod, amountPaise: number, expectedTotalPaise: number) {
  const ws = workspace(); const b = openBill(ws, billId); const a = amounts(ws, b);
  const paid = b.payments.reduce((s, p) => s + p.amountPaise, 0);
  if (a.totalPaise !== expectedTotalPaise) fail('BILL_CHANGED');
  if (a.totalPaise <= 0) fail('BILL_EMPTY');
  if (!Number.isInteger(amountPaise) || amountPaise <= 0 || amountPaise > a.totalPaise - paid) fail('INVALID_PAYMENT_AMOUNT');
  b.payments.push({ id: uid('pay'), method, amountPaise, createdAt: new Date().toISOString() });
  if (paid + amountPaise >= a.totalPaise) close(ws, b, method);
  saveDemoWorkspace(ws);
}

/** Same as mark_order_paid: one round paid; the last unpaid round settles the rest. */
export function demoMarkOrderPaid(orderId: string, method: PaymentMethod) {
  const ws = workspace(); const o = ws.orders.find(x => x.id === orderId && x.paymentStatus === 'unpaid'); if (!o) return;
  const b = ws.bills.find(x => x.id === o.billId && x.status === 'open');
  if (b) {
    const a = amounts(ws, b); const paid = b.payments.reduce((s, p) => s + p.amountPaise, 0);
    const others = ws.orders.some(x => x.billId === b.id && x.id !== o.id && x.status !== 'cancelled' && x.paymentStatus === 'unpaid');
    const amount = others ? Math.min(o.totalPaise, a.totalPaise - paid) : a.totalPaise - paid;
    if (amount > 0) b.payments.push({ id: uid('pay'), method, amountPaise: amount, createdAt: new Date().toISOString() });
    ws.orders = ws.orders.map(x => x.id === o.id ? { ...x, paymentStatus: 'paid', paymentMethod: method } : x);
    if (paid + Math.max(amount, 0) >= a.totalPaise) close(ws, b, method);
  } else ws.orders = ws.orders.map(x => x.id === o.id ? { ...x, paymentStatus: 'paid', paymentMethod: method } : x);
  saveDemoWorkspace(ws);
}

export function demoUpdateBill(billId: string, patch: { discountPaise?: number; discountReason?: string; serviceChargeOn?: boolean }) {
  const ws = workspace(); const b = openBill(ws, billId);
  if (patch.discountPaise !== undefined) {
    if (patch.discountPaise > 0 && (patch.discountReason ?? '').trim().length < 2) fail('REASON_REQUIRED');
    b.discountPaise = patch.discountPaise; b.discountReason = patch.discountPaise > 0 ? (patch.discountReason ?? '').trim() : null;
  }
  if (patch.serviceChargeOn !== undefined) b.serviceChargeOn = patch.serviceChargeOn;
  saveDemoWorkspace(ws);
}

export function demoMoveBill(billId: string, tableId: string) {
  const ws = workspace(); const b = openBill(ws, billId);
  if (ws.bills.some(x => x.status === 'open' && x.tableId === tableId && x.id !== b.id)) fail('TABLE_BUSY');
  b.tableId = tableId; b.tableLabel = labelOf(tableId);
  ws.orders = ws.orders.map(o => o.billId === b.id ? { ...o, tableId, tableLabel: b.tableLabel } : o);
  saveDemoWorkspace(ws);
}

export function demoMergeBills(fromId: string, intoId: string) {
  const ws = workspace(); const from = openBill(ws, fromId); const into = openBill(ws, intoId);
  ws.orders = ws.orders.map(o => o.billId === from.id ? { ...o, billId: into.id, tableId: into.tableId ?? o.tableId, tableLabel: into.tableLabel ?? o.tableLabel } : o);
  into.payments.push(...from.payments); from.payments = [];
  from.status = 'void'; from.voidReason = `Merged into invoice ${into.invoiceNo}`; from.settledAt = new Date().toISOString();
  saveDemoWorkspace(ws);
}

export function demoVoidBill(billId: string, reason: string) {
  const ws = workspace(); const b = openBill(ws, billId);
  if (reason.trim().length < 2) fail('REASON_REQUIRED');
  if (b.payments.length) fail('BILL_HAS_PAYMENTS');
  ws.orders = ws.orders.map(o => o.billId === b.id ? { ...o, status: 'cancelled' } : o);
  b.status = 'void'; b.voidReason = reason.trim(); b.settledAt = new Date().toISOString();
  saveDemoWorkspace(ws);
}

export function demoCancelItem(lineId: string, qty: number, reason: string) {
  const ws = workspace();
  if (reason.trim().length < 2) fail('REASON_REQUIRED');
  const o = ws.orders.find(x => x.status !== 'cancelled' && x.lines.some(l => l.id === lineId)) ?? fail('ITEM_NOT_FOUND');
  if (o.billId && !ws.bills.some(b => b.id === o.billId && b.status === 'open')) fail('BILL_CLOSED');
  const line = o.lines.find(l => l.id === lineId)!;
  if (!Number.isInteger(qty) || qty < 1 || qty > line.qty) fail('INVALID_QTY');
  const lines = o.lines.map(l => l.id === lineId ? { ...l, qty: l.qty - qty } : l).filter(l => l.qty > 0);
  const subtotalPaise = lines.reduce((s, l) => s + l.unitPricePaise * l.qty, 0);
  const taxPaise = Math.round(subtotalPaise * ws.restaurant.taxPercent / 100);
  ws.orders = ws.orders.map(x => x.id === o.id ? { ...x, lines, subtotalPaise, taxPaise, totalPaise: subtotalPaise + taxPaise, status: subtotalPaise === 0 ? 'cancelled' : x.status } : x);
  saveDemoWorkspace(ws);
}

/** The guest's open bill, like GET /public/r/:slug/orders/:id/bill. */
export function demoBillForOrder(orderId: string | undefined): Bill | null {
  const ws = readDemoWorkspace(); if (!ws || !orderId) return null;
  const o = ws.orders.find(x => x.id === orderId);
  const b = o && ws.bills.find(x => x.id === o.billId && x.status === 'open');
  return b ? demoBill(ws, b) : null;
}
