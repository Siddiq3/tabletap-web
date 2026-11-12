import { formatINR, formatInvoiceNo, type Bill } from "@/contract";
import { UpiQr } from "./UpiQr";

export type InvoiceRestaurant = {
  name: string; address: string | null; taxPercent: number; upiId: string | null;
  gstin?: string | null; fssai?: string | null; serviceChargePercent?: number;
};

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const money = (p: number) => formatINR(p);
const pct = (n: number) => `${Number(n.toFixed(2))}%`;
export const billTitle = (b: Pick<Bill, "kind" | "tableLabel" | "customerName">) =>
  b.kind === "takeaway" ? `Takeaway${b.customerName ? ` · ${b.customerName}` : ""}` : `Table ${(b.tableLabel ?? "").replace(/^T(?=\d)/, "")}`;

/**
 * The customer's bill. With a GSTIN it is a GST tax invoice (GSTIN, SAC 996331, CGST + SGST);
 * without one it is a plain bill. Ends with a UPI QR for whatever is still due.
 */
export function Invoice({ bill, restaurant }: { bill: Bill; restaurant: InvoiceRestaurant }) {
  const gst = !!restaurant.gstin;
  const half = restaurant.taxPercent / 2;
  return (
    <article className="invoice" aria-label={`Invoice ${formatInvoiceNo(bill.invoiceNo)}`}>
      <header>
        <b>{restaurant.name}</b>
        {restaurant.address && <span>{restaurant.address}</span>}
        {gst && <span>GSTIN {restaurant.gstin}</span>}
        {restaurant.fssai && <span>FSSAI Lic. {restaurant.fssai}</span>}
        <strong className="inv-title">{gst ? "TAX INVOICE" : "BILL"}</strong>
      </header>
      <div className="inv-meta">
        <span>Invoice {formatInvoiceNo(bill.invoiceNo)}</span><span>{when(bill.settledAt ?? new Date().toISOString())}</span>
      </div>
      <div className="inv-meta">
        <span>{billTitle(bill)}</span><span>Orders {bill.orders.map((o) => `#${o.orderNo}`).join(", ")}</span>
      </div>
      {bill.customerPhone && <div className="inv-meta inv-small"><span>Phone {bill.customerPhone}</span></div>}
      {gst && <div className="inv-meta inv-small"><span>Restaurant service · SAC 996331</span></div>}
      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>
          {bill.lines.map((l) => (
            <tr key={`${l.name}|${l.unitPricePaise}|${l.isVeg}`}><td>{l.name}</td><td>{l.qty}</td><td>{money(l.unitPricePaise)}</td><td>{money(l.unitPricePaise * l.qty)}</td></tr>
          ))}
        </tbody>
      </table>
      <dl>
        <div><dt>Subtotal</dt><dd>{money(bill.subtotalPaise)}</dd></div>
        {bill.discountPaise > 0 && <div><dt>Discount{bill.discountReason ? ` (${bill.discountReason})` : ""}</dt><dd>− {money(bill.discountPaise)}</dd></div>}
        {bill.serviceChargePaise > 0 && <div><dt>Service charge{restaurant.serviceChargePercent ? ` ${pct(restaurant.serviceChargePercent)}` : ""}</dt><dd>{money(bill.serviceChargePaise)}</dd></div>}
        {bill.packagingPaise > 0 && <div><dt>Packaging</dt><dd>{money(bill.packagingPaise)}</dd></div>}
        {bill.taxPaise > 0 && (gst ? (
          <>
            <div><dt>CGST {pct(half)}</dt><dd>{money(bill.cgstPaise)}</dd></div>
            <div><dt>SGST {pct(half)}</dt><dd>{money(bill.sgstPaise)}</dd></div>
          </>
        ) : <div><dt>GST {pct(restaurant.taxPercent)}</dt><dd>{money(bill.taxPaise)}</dd></div>)}
        {bill.roundOffPaise !== 0 && <div><dt>Round off</dt><dd>{bill.roundOffPaise > 0 ? "+" : "−"} {money(Math.abs(bill.roundOffPaise))}</dd></div>}
        <div className="inv-total"><dt>Total</dt><dd>{money(bill.totalPaise)}</dd></div>
        {bill.payments.map((p) => <div key={p.id} className="inv-small"><dt>Paid {p.method.toUpperCase()}</dt><dd>{money(p.amountPaise)}</dd></div>)}
        {bill.paidPaise > 0 && bill.duePaise > 0 && <div className="inv-total"><dt>Balance due</dt><dd>{money(bill.duePaise)}</dd></div>}
      </dl>
      {bill.status === "void" && <p className="inv-void">VOID{bill.voidReason ? ` · ${bill.voidReason}` : ""}</p>}
      {bill.status === "open" && restaurant.upiId && bill.duePaise > 0 && (
        <div className="inv-pay">
          <b>Scan to pay {money(bill.duePaise)}</b>
          <UpiQr upiId={restaurant.upiId} payeeName={restaurant.name} totalPaise={bill.duePaise} note={`Invoice ${formatInvoiceNo(bill.invoiceNo)}`} caption={`Any UPI app · ${restaurant.upiId}`} size={150} />
        </div>
      )}
      <p className="inv-thanks">Thank you. Visit again.</p>
    </article>
  );
}
