"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Bill, DiningTable } from "@/contract";
import { api } from "@/lib/api-client";
import { subscribeToOrders } from "@/lib/feed";
import { BillsView, type BillsSource } from "@/components/BillsView";
import { useMember } from "../MemberContext";

/** Live bills from the API. QR orders, staff orders and takeaways all land here. */
export function BillsBoard() {
  const { restaurant, role } = useMember();
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setBills((await api.bills()).bills); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load bills."); }
  }, []);

  useEffect(() => {
    void load();
    api.tables().then((r) => setTables(r.tables.filter((t) => t.isActive))).catch(() => {});
    const unsubscribe = subscribeToOrders(restaurant.id, () => void load(), "bills");
    const t = setInterval(() => void load(), 15_000); // fallback if the live connection drops
    return () => { unsubscribe(); clearInterval(t); };
  }, [restaurant.id, load]);

  const source = useMemo<BillsSource>(() => ({
    loadItems: async () => (await api.menu()).items,
    addOrder: (target, items, note) => api.addOrder({ ...target, items, note }),
    pay: (bill, method, amountPaise) => api.payBill(bill.id, { method, amountPaise, expectedTotalPaise: bill.totalPaise }).then(() => {}),
    update: (bill, patch) => api.updateBill(bill.id, patch).then(() => {}),
    move: (bill, tableId) => api.moveBill(bill.id, tableId).then(() => {}),
    merge: (bill, intoBillId) => api.mergeBill(bill.id, intoBillId).then(() => {}),
    voidBill: (bill, reason) => api.voidBill(bill.id, reason).then(() => {}),
    cancelItem: (line, qty, reason) => api.cancelItem(line.id!, { qty, reason }).then(() => {}),
    refresh: () => void load(),
  }), [load]);

  if (!bills) return <p className="muted" style={{ marginTop: 16 }}>{error ?? "Loading bills…"}</p>;
  return (
    <div style={{ marginTop: 16 }}>
      {error && <p className="error no-print" role="alert">{error}</p>}
      <BillsView
        bills={bills}
        tables={tables}
        restaurant={restaurant}
        canSettle={role === "owner" || role === "manager" || role === "cashier"}
        canManage={role === "owner" || role === "manager"}
        source={source}
      />
    </div>
  );
}
