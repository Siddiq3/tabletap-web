"use client";

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatINR, type Menu, type MenuItem, type PlaceOrderRequest, type PlaceOrderResponse } from '@/contract';
import { CallStaffButton, type CallStaff } from '@/components/CallStaffButton';
import { publicApi } from '@/lib/api';
import './guest-menu.css';

type Props = {
  restaurant: { name: string; slug: string; taxPercent: number; address: string | null };
  table: { id: string; label: string } | null;
  menu: Menu;
  onCallStaff?: CallStaff;
  onPlaceOrder?: (input: PlaceOrderRequest) => Promise<PlaceOrderResponse>;
  onOrderPlaced?: (result: PlaceOrderResponse) => void;
};
function Arrow() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>; }
function DishPhoto({ item }: { item: MenuItem }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item.imageUrl]);
  return <div className="gm-photo">{item.imageUrl && !failed ? <img src={item.imageUrl} alt={item.name} width={120} height={120} loading="lazy" onError={() => setFailed(true)}/> : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M3 17h18M5 16a7 7 0 0 1 14 0M12 6V3m-2 0h4M7 21h10"/></svg>}</div>;
}
export function GuestMenu({ restaurant, table, menu, onPlaceOrder, onOrderPlaced, onCallStaff }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [diet, setDiet] = useState('all');
  const [sort, setSort] = useState('menu');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const dialog = useRef<HTMLDialogElement>(null);
  const cartTitle = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => { document.body.style.overflow = previous; dialog.current?.close(); };
  }, [open]);
  const byId = useMemo(() => new Map(menu.items.map(item => [item.id, item])), [menu.items]);
  const lines = Object.entries(cart).filter(([, qty]) => qty > 0).flatMap(([id, qty]) => { const item = byId.get(id); return item ? [{ item, qty }] : []; });
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.item.pricePaise * line.qty, 0);
  const tax = Math.round(subtotal * restaurant.taxPercent / 100);
  const categories = [...menu.categories.map(c => ({ id: c.id, name: c.name })), { id: 'uncategorized', name: 'More favourites' }].filter(c => menu.items.some(item => (item.categoryId ?? 'uncategorized') === c.id));
  const visible = menu.items.filter(item => (category === 'all' || (item.categoryId ?? 'uncategorized') === category) && (diet === 'all' || (diet === 'veg' ? item.isVeg : !item.isVeg)) && `${item.name} ${item.description ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  const sections = categories.map(c => ({ ...c, items: visible.filter(item => (item.categoryId ?? 'uncategorized') === c.id).sort((a, b) => sort === 'low' ? a.pricePaise - b.pricePaise : sort === 'high' ? b.pricePaise - a.pricePaise : 0) })).filter(c => c.items.length);
  function resetFilters() { setQuery(''); setCategory('all'); setDiet('all'); setSort('menu'); setCollapsed({}); }
  function change(id: string, delta: number) { setCart(c => ({ ...c, [id]: Math.max(0, Math.min(50, (c[id] ?? 0) + delta)) })); }
  async function place() {
    if (!table || !count || placing) return;
    setPlacing(true); setError(null);
    try {
      const result = await (onPlaceOrder ?? publicApi.placeOrder)({ slug: restaurant.slug, tableId: table.id, note, items: lines.map(line => ({ menuItemId: line.item.id, qty: line.qty })) });
      if (onOrderPlaced) { onOrderPlaced(result); return; }
      router.push(`/r/${restaurant.slug}/order/${result.orderId}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not place the order. Please try again.'); setPlacing(false); }
  }
  function control(item: MenuItem) {
    if (!item.isAvailable) return <span className="gm-sold-out">Sold out</span>;
    if (!table) return null;
    const qty = cart[item.id] ?? 0;
    return qty ? <div className="gm-stepper"><button disabled={placing} aria-label={`Remove one ${item.name}`} onClick={() => change(item.id, -1)}>−</button><span aria-live="polite">{qty}</span><button disabled={placing || qty >= 50} aria-label={`Add one ${item.name}`} onClick={() => change(item.id, 1)}>+</button></div> : <button className="btn-ghost gm-add" disabled={placing} aria-label={`Add ${item.name}`} onClick={() => change(item.id, 1)}>Add <span aria-hidden="true">+</span></button>;
  }
  return <div className="guest-menu">
    <header className="gm-header"><div className="gm-restaurant-row"><span className="gm-monogram" aria-hidden="true">{restaurant.name.trim().slice(0, 1)}</span><div><h1>{restaurant.name}</h1></div>{table && <span className="gm-table">Table {table.label.replace(/^T(?=\d)/, '')}</span>}</div>{restaurant.address && <p className="gm-address">{restaurant.address}</p>}
      {table ? <CallStaffButton key={table.id} slug={restaurant.slug} tableId={table.id} onCall={onCallStaff}/> : <p className="gm-menu-only">Scan the QR on your table to order.</p>}
    </header>
    <div className="gm-filters"><label className="menu-input gm-search"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" aria-label="Search dishes" placeholder="Search dishes" value={query} onChange={e => { setQuery(e.target.value); setCollapsed({}); }}/></label>
      <div className="gm-filter-row"><label><span>Category</span><select className="menu-select" aria-label="Menu category" value={category} onChange={e => { setCategory(e.target.value); setCollapsed({}); }}><option value="all">All categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label><span>Preference</span><select className="menu-select" aria-label="Dietary preference" value={diet} onChange={e => { setDiet(e.target.value); setCollapsed({}); }}><option value="all">All dishes</option><option value="veg">Vegetarian</option><option value="nonveg">Non-vegetarian</option></select></label></div>
    </div>
    <div className="gm-result-row"><p role="status">{visible.length} {visible.length === 1 ? 'dish' : 'dishes'}</p><label className="gm-sort"><span>Sort</span><select aria-label="Sort dishes" value={sort} onChange={e => setSort(e.target.value)}><option value="menu">Menu order</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div>
    <main className="gm-dishes">
      {sections.length === 0 && <div className="gm-empty"><h2>{menu.items.length ? 'No dishes found.' : 'The menu is on its way.'}</h2><p>{menu.items.length ? 'Try another search or change your filters.' : 'Please ask the staff.'}</p>{menu.items.length > 0 && <button className="btn-ghost" onClick={resetFilters}>Clear filters</button>}</div>}
      {sections.map(section => <section className="gm-category" key={section.id}><h2><button className="gm-category-toggle" aria-expanded={!collapsed[section.id]} aria-controls={`menu-category-${section.id}`} onClick={() => setCollapsed(c => ({ ...c, [section.id]: !c[section.id] }))}><span>{section.name}<small>{section.items.length}</small></span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ transform: collapsed[section.id] ? 'rotate(-90deg)' : undefined }} aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></h2>
        <div id={`menu-category-${section.id}`} hidden={!!collapsed[section.id]}><div className="gm-items">{section.items.map(item => <article className={`gm-dish${item.isAvailable ? '' : ' gm-unavailable'}`} key={item.id}><div className="gm-dish-copy"><span className={`gm-diet ${item.isVeg ? 'gm-veg' : 'gm-nonveg'}`}><span className={`mark ${item.isVeg ? 'v' : 'n'}`}/>{item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}</span><h3>{item.name}</h3>{item.description && <p>{item.description}</p>}<strong className="gm-price">{formatINR(item.pricePaise)}</strong></div><div className="gm-dish-side"><DishPhoto item={item}/>{control(item)}</div></article>)}</div></div>
      </section>)}
      <p className="gm-footer"><span>Powered by tabletap.</span></p>
    </main>
    {count > 0 && !open && <button className="gm-cartbar" onClick={() => setOpen(true)}><span><strong>{count} {count === 1 ? 'item' : 'items'} · {formatINR(subtotal)}</strong><small>Taxes shown at checkout</small></span><span>View cart <Arrow/></span></button>}
    <dialog ref={dialog} className="gm-cart" aria-labelledby={cartTitle} onClose={() => setOpen(false)} onCancel={e => { if (placing) e.preventDefault(); else setOpen(false); }}>
      <div className="gm-cart-head"><div><h2 id={cartTitle}>Your order · Table {table?.label.replace(/^T(?=\d)/, '')}</h2></div><button className="btn-ghost" disabled={placing} onClick={() => setOpen(false)}>Back to menu</button></div>
      <div className="gm-cart-lines">{lines.map(({ item, qty }) => <div className="gm-cart-line" key={item.id}><div><h3><span className={`mark ${item.isVeg ? 'v' : 'n'}`}/>{item.name}</h3><p>{formatINR(item.pricePaise)} × {qty} <strong>{formatINR(item.pricePaise * qty)}</strong></p></div>{control(item)}</div>)}{!count && <p className="gm-empty-cart">Your cart is empty.</p>}</div>
      <label className="gm-note"><span>Cooking note (optional)</span><textarea disabled={placing} rows={2} maxLength={300} value={note} onChange={e => setNote(e.target.value)} placeholder="Less spicy, no onion…"/></label>
      <div className="gm-bill"><h3>Bill details</h3><div><span>Item total</span><span>{formatINR(subtotal)}</span></div><div><span>GST {restaurant.taxPercent}%</span><span>{formatINR(tax)}</span></div><div className="gm-grand"><span>To pay</span><strong>{formatINR(subtotal + tax)}</strong></div></div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn gm-place" disabled={placing || count === 0} onClick={() => void place()}>{placing ? 'Sending to kitchen…' : 'Place order'}<Arrow/></button>
      <p className="gm-payment-note">{onPlaceOrder ? 'Sample order only. Nothing is sent to a restaurant, and no payment is taken.' : 'Pay by UPI after placing your order, or settle at the counter.'}</p>
    </dialog>
  </div>;
}
