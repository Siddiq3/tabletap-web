import type { Order } from "@/contract";

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

/** Kitchen order ticket: what to cook, for which table, with notes. No prices. */
export function Kot({ order, where }: { order: Order; where: string }) {
  return (
    <article className="kot-ticket" aria-label={`KOT ${order.orderNo}`}>
      <header><b>KOT #{order.orderNo}</b><span>{time(order.createdAt)}</span></header>
      <p className="kot-where">{where}</p>
      <p className="kot-by">{order.source === "staff" ? `Added by ${order.placedByName ?? "staff"}` : "Guest QR order"}</p>
      <ul>{order.lines.map((l, i) => <li key={l.id ?? i}><b>{l.qty} ×</b> {l.name}{l.isVeg ? "" : " (non-veg)"}</li>)}</ul>
      {order.note && <p className="kot-note">Note: {order.note}</p>}
    </article>
  );
}
