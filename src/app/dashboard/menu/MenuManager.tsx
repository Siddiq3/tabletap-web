"use client";

import { useCallback, useEffect, useState } from "react";
import { formatINR, rupeesToPaise, type Menu } from "@/contract";
import { api } from "@/lib/api-client";

export function MenuManager() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // add-dish form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isVeg, setIsVeg] = useState(true);
  const [description, setDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const load = useCallback(async () => {
    try {
      const m = await api.menu();
      setMenu(m);
      setCategoryId((cur) => cur || m.categories[0]?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the menu.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function run(fn: () => Promise<unknown>, after?: () => void) {
    setSaving(true);
    setError(null);
    try {
      await fn();
      after?.();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function addDish(e: React.FormEvent) {
    e.preventDefault();
    const pricePaise = rupeesToPaise(price);
    if (!name.trim()) return setError("Enter the dish name.");
    if (pricePaise === null) return setError("Enter a price in rupees, like 240.");
    void run(
      () => api.addItem({ name: name.trim(), pricePaise, isVeg, categoryId: categoryId || null, description: description.trim() || null }),
      () => { setName(""); setPrice(""); setDescription(""); },
    );
  }

  function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return setError("Enter a category name, like Starters.");
    void run(() => api.addCategory(newCategory.trim()), () => setNewCategory(""));
  }

  if (!menu) return <p className="muted" style={{ marginTop: 16 }}>{error ?? "Loading menu…"}</p>;

  const groups = [...menu.categories.map((c) => ({ id: c.id as string | null, name: c.name })), { id: null, name: "No category" }]
    .map((g) => ({ ...g, items: menu.items.filter((i) => i.categoryId === g.id) }))
    .filter((g) => g.id !== null || g.items.length > 0);

  return (
    <div className="stack" style={{ marginTop: 16 }}>
      {error && <p className="error">{error}</p>}

      <form className="card stack" onSubmit={addDish}>
        <h2 style={{ fontSize: 18 }}>Add a dish</h2>
        {menu.categories.length === 0 && (
          <p className="muted small" style={{ margin: 0 }}>Tip: add categories first (Starters, Mains, Drinks).</p>
        )}
        <div className="form-grid">
          <label className="field"><span>Dish name</span><input id="item-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Paneer Tikka" /></label>
          <label className="field"><span>Price (₹)</span><input id="item-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="240" /></label>
          <label className="field">
            <span>Category</span>
            <select id="item-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {menu.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="">No category</option>
            </select>
          </label>
          <label className="field">
            <span>Type</span>
            <select id="item-type" value={isVeg ? "veg" : "nonveg"} onChange={(e) => setIsVeg(e.target.value === "veg")}>
              <option value="veg">Veg</option>
              <option value="nonveg">Non-veg</option>
            </select>
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span>Short description (optional)</span>
            <input id="item-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Charcoal-grilled, mint chutney" />
          </label>
          <button className="btn" disabled={saving}>{saving ? "Saving…" : "Add dish"}</button>
        </div>
      </form>

      <form className="card form-grid" onSubmit={addCategory}>
        <label className="field"><span>New category</span><input id="cat-name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Starters" /></label>
        <button className="btn" disabled={saving}>Add category</button>
      </form>

      <div className="card">
        <div className="row"><h2 style={{ fontSize: 18 }}>Your menu</h2><span className="muted small num">{menu.items.length} dishes</span></div>
        {menu.items.length === 0 && <p className="empty" style={{ marginTop: 12 }}>No dishes yet. Add your first dish above.</p>}
        {groups.map((g) => (
          <section key={g.id ?? "none"} style={{ marginTop: 14 }}>
            <p className="label" style={{ margin: "0 0 4px" }}>{g.name}</p>
            {g.items.length === 0 && <p className="muted small">No dishes in this category yet.</p>}
            {g.items.map((item) => (
              <div className="menurow" key={item.id}>
                <span><span className={`mark ${item.isVeg ? "v" : "n"}`} />{item.name}</span>
                <span className="num" style={{ fontWeight: 700 }}>{formatINR(item.pricePaise)}</span>
                <button
                  className="switch"
                  role="switch"
                  aria-checked={item.isAvailable}
                  aria-label={`${item.name} available`}
                  title={item.isAvailable ? "Available" : "Sold out"}
                  disabled={saving}
                  onClick={() => void run(() => api.updateItem(item.id, { isAvailable: !item.isAvailable }))}
                />
                <button className="btn-sm" disabled={saving} onClick={() => void run(() => api.deleteItem(item.id))}>Delete</button>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
