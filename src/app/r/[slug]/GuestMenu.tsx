"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR, type Menu, type MenuItem } from "@/contract";
import { publicApi } from "@/lib/api";

type Props = {
  restaurant: { name: string; slug: string; taxPercent: number; address: string | null };
  table: { id: string; label: string } | null;
  menu: Menu;
};

export function GuestMenu({ restaurant, table, menu }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(menu.items.map((i) => [i.id, i])), [menu.items]);
  const lines = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ item: byId.get(id)!, qty }))
    .filter((l) => l.item);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.item.pricePaise * l.qty, 0);
  const tax = Math.round((subtotal * restaurant.taxPercent) / 100);

  const sections = [
    ...menu.categories.map((c) => ({ id: c.id, name: c.name })),
    { id: null as string | null, name: "More" },
  ]
    .map((s) => ({ ...s, items: menu.items.filter((i) => i.categoryId === s.id) }))
    .filter((s) => s.items.length > 0);

  const change = (id: string, delta: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(50, (c[id] ?? 0) + delta)) }));

  async function place() {
    if (!table) return;
    setPlacing(true);
    setError(null);
    try {
      const data = await publicApi.placeOrder({
        slug: restaurant.slug,
        tableId: table.id,
        note,
        items: lines.map((l) => ({ menuItemId: l.item.id, qty: l.qty })),
      });
      router.push(`/r/${restaurant.slug}/order/${data.orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place the order. Try again.");
      setPlacing(false);
    }
  }

  const control = (item: MenuItem) => {
    if (!item.isAvailable) return <span className="muted small" style={{ alignSelf: "center", fontWeight: 700 }}>Sold out</span>;
    const q = cart[item.id] ?? 0;
    if (!table) return null;
    if (!q) return <button className="add" onClick={() => change(item.id, 1)}>ADD</button>;
    return (
      <div className="stepper">
        <button aria-label={`Remove one ${item.name}`} onClick={() => change(item.id, -1)}>−</button>
        <span>{q}</span>
        <button aria-label={`Add one ${item.name}`} onClick={() => change(item.id, 1)}>+</button>
      </div>
    );
  };

  return (
    <div className="cust">
      <header className="cust-head">
        <div className="row">
          <div>
            <h1 style={{ fontSize: 24 }}>{restaurant.name}</h1>
            {restaurant.address && <p className="muted small" style={{ margin: 0 }}>{restaurant.address}</p>}
          </div>
          {table && <span className="pill" style={{ color: "var(--accent)" }}>Table {table.label}</span>}
        </div>
        {!table && (
          <p className="t-note" style={{ marginTop: 10 }}>
            You are viewing the menu only. Scan the QR code on your table to order.
          </p>
        )}
      </header>

      {sections.length > 1 && (
        <nav className="cats" aria-label="Menu sections">
          {sections.map((s) => <a key={s.id ?? "more"} href={`#sec-${s.id ?? "more"}`}>{s.name}</a>)}
        </nav>
      )}

      {sections.length === 0 && <p className="empty" style={{ margin: 16 }}>The menu is being updated. Please ask the staff.</p>}

      {sections.map((s) => (
        <section className="menu-section" id={`sec-${s.id ?? "more"}`} key={s.id ?? "more"}>
          <h2>{s.name}</h2>
          {s.items.map((item) => (
            <div className="item" key={item.id}>
              <div>
                <h3><span className={`mark ${item.isVeg ? "v" : "n"}`} title={item.isVeg ? "Veg" : "Non-veg"} />{item.name}</h3>
                {item.description && <p>{item.description}</p>}
                <div className="price">{formatINR(item.pricePaise)}</div>
              </div>
              {control(item)}
            </div>
          ))}
        </section>
      ))}

      {count > 0 && !open && (
        <button className="cartbar" onClick={() => setOpen(true)}>
          <span>{count} item{count > 1 ? "s" : ""} · {formatINR(subtotal)}</span>
          <span>View cart →</span>
        </button>
      )}

      {open && (
        <div className="sheet" role="dialog" aria-label="Your order">
          <div className="sheet-inner">
            <div className="row">
              <h2 style={{ fontSize: 20 }}>Your order · Table {table?.label}</h2>
              <button className="btn-ghost" onClick={() => setOpen(false)}>Back to menu</button>
            </div>
            {lines.map(({ item, qty }) => (
              <div className="item" key={item.id}>
                <div>
                  <h3><span className={`mark ${item.isVeg ? "v" : "n"}`} />{item.name}</h3>
                  <div className="price">{formatINR(item.pricePaise * qty)}</div>
                </div>
                {control(item)}
              </div>
            ))}
            <label className="field">
              <span>Cooking note (optional)</span>
              <textarea id="note" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Less spicy, no onion" />
            </label>
            <div className="totals">
              <div className="muted"><span>Item total</span><span>{formatINR(subtotal)}</span></div>
              <div className="muted"><span>GST {restaurant.taxPercent}%</span><span>{formatINR(tax)}</span></div>
              <div className="grand"><span>To pay</span><span>{formatINR(subtotal + tax)}</span></div>
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn w-full" disabled={placing || count === 0} onClick={place}>
              {placing ? "Sending to kitchen…" : "Place order"}
            </button>
            <p className="muted small" style={{ margin: 0 }}>You can pay by UPI after placing the order, or at the counter.</p>
          </div>
        </div>
      )}
    </div>
  );
}
