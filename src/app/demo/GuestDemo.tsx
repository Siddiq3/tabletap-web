'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SAMPLE_MENU, SAMPLE_RESTAURANT } from '@/lib/demo-fixtures';
import { addDemoOrder, changeDemoOrder, useDemoWorkspace } from '@/lib/demo-workspace';
import { requestDemoStaffCall } from '@/lib/demo-calls';
import { GuestMenu } from '../r/[slug]/GuestMenu';
import { OrderTracker } from '../r/[slug]/order/[id]/OrderTracker';
import { NEXT_STATUS, type Order, type PlaceOrderRequest, type PlaceOrderResponse, type PaymentMethod } from '@/contract';

const KEY = 'tabletap.guest-demo.v1';
type Snapshot = { order: Order | null; tracking: boolean; table: string; sequence: number };
const fresh = (): Snapshot => ({ order: null, tracking: false, table: '7', sequence: 1041 });

export function GuestDemo() {
  const workspace = useDemoWorkspace();
  const restaurant = workspace?.restaurant ?? SAMPLE_RESTAURANT;
  const menu = workspace?.menu ?? SAMPLE_MENU;
  const [state, setState] = useState<Snapshot>(fresh);
  const [ready, setReady] = useState(false);
  const [menuKey, setMenuKey] = useState(0);
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Snapshot | null;
      if (stored && typeof stored.table === 'string' && typeof stored.sequence === 'number' && (!stored.order || (Array.isArray(stored.order.lines) && typeof stored.order.totalPaise === 'number'))) setState(stored);
    } catch { /* Storage can be blocked; the in-memory demo still works. */ }
    const table = new URLSearchParams(window.location.search).get('table');
    if (table && /^\d+$/.test(table) && Number(table) >= 1) setState(s => ({ ...s, table, tracking: false }));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* In-memory fallback. */ } } }, [state, ready]);

  async function placeOrder(input: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    if (!input.items.length) throw new Error('Add a dish to your order first.');
    const lines = input.items.map(({ menuItemId, qty }) => {
      const item = menu.items.find(i => i.id === menuItemId && i.isAvailable);
      if (!item || !Number.isInteger(qty) || qty < 1 || qty > 50) throw new Error('A dish is unavailable. Please update your cart.');
      return { name: item.name, isVeg: item.isVeg, unitPricePaise: item.pricePaise, qty };
    });
    const subtotalPaise = lines.reduce((sum, line) => sum + line.qty * line.unitPricePaise, 0);
    const taxPaise = Math.round(subtotalPaise * restaurant.taxPercent / 100);
    const orderNo = Math.max(state.sequence, ...(workspace?.orders.map(o => o.orderNo + 1) ?? []));
    const order: Order = { id: `sample-${Date.now()}-${Math.random().toString(36).slice(2)}`, orderNo, tableId: `demo-table-${state.table}`, tableLabel: state.table, status: 'new', paymentStatus: 'unpaid', paymentMethod: null, note: input.note?.trim() || null, subtotalPaise, taxPaise, totalPaise: subtotalPaise + taxPaise, createdAt: new Date().toISOString(), lines };
    if (workspace) addDemoOrder(order);
    setState(s => ({ ...s, order, sequence: orderNo + 1, tracking: true }));
    window.scrollTo({ top: 0 });
    return { orderId: order.id, orderNo: order.orderNo, totalPaise: order.totalPaise };
  }
  function more() { setState(s => ({ ...s, tracking: false })); setMenuKey(k => k + 1); window.scrollTo({ top: 0 }); }
  const order = workspace?.orders.find(o => o.id === state.order?.id) ?? state.order;
  function updateOrder(patch: Partial<Order>) { if (!order) return; const updated = { ...order, ...patch }; if (workspace) changeDemoOrder(order.id, patch); setState(s => ({ ...s, order: updated })); }
  function pay(method: PaymentMethod) { updateOrder({ paymentStatus: 'paid', paymentMethod: method }); }
  const next = order && NEXT_STATUS[order.status];
  useEffect(() => { if (workspace && Number(state.table) > workspace.tableCount) setState(s => ({ ...s, table: '1' })); }, [workspace, state.table]);
  return <div className="guest-demo">
    <div className="gd-banner"><div><Link href="/" className="gd-brand">tabletap.</Link><strong>Customer demo</strong><Link href="/demo/staff" target="_blank" rel="noreferrer">Open staff alert view</Link></div><p>Sample restaurant · No real orders or payments</p><button className="btn-ghost" onClick={() => { setState(fresh()); setMenuKey(k => k + 1); }}>Reset demo</button></div>
    {!ready ? <p className="gd-loading">Opening the sample menu…</p> : state.tracking && order ? <>
      <OrderTracker initial={order} restaurant={restaurant} demo onCallStaff={requestDemoStaffCall} onOrderMore={more}/>
      <aside className="gd-controls" aria-label="Demo controls"><h2>Try the kitchen response</h2><p>These test controls simulate what staff do. Your guests only see their order status and payment confirmation.</p><div className="gd-control-buttons">{next && <button className="btn" onClick={() => updateOrder({ status: next.to })}>Simulate {next.to}</button>}{order.paymentStatus !== 'paid' && <><button className="btn-ghost" onClick={() => pay('upi')}>Simulate UPI payment</button><button className="btn-ghost" onClick={() => pay('cash')}>Simulate cash payment</button></>}</div>{order.status === 'served' && order.paymentStatus === 'paid' && <p role="status">Meal served and sample bill paid. You’ve completed the customer journey.</p>}</aside>
    </> : <>
      <details className="gd-intro"><summary>Demo options · Table {state.table}</summary><h2>You’re at the table.</h2><p>This is what opens after a guest scans a table QR. Add a dish, review the bill, and send your sample order.</p><label>Try another table<select aria-label="Choose sample table" value={state.table} onChange={e => { setState(s => ({ ...s, table: e.target.value })); setMenuKey(k => k + 1); }}>{(workspace ? Array.from({ length: workspace.tableCount }, (_, i) => String(i + 1)) : ['1', '3', '7']).map(table => <option key={table} value={table}>Table {table}</option>)}</select></label>{order && <button className="btn-ghost" onClick={() => setState(s => ({ ...s, tracking: true }))}>Back to order #{order.orderNo}</button>}</details>
      <GuestMenu key={menuKey} restaurant={restaurant} table={{ id: `demo-table-${state.table}`, label: state.table }} menu={menu} onCallStaff={requestDemoStaffCall} onPlaceOrder={placeOrder} onOrderPlaced={() => {}}/>
    </>}
  </div>;
}
