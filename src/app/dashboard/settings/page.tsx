"use client";

import { useState } from "react";
import { isValidFssai, isValidGstin, isValidUpiId, rupeesToPaise } from "@/contract";
import { api } from "@/lib/api-client";
import { useMember, useSetMember } from "../MemberContext";

export default function SettingsPage() {
  const member = useMember();
  const setMember = useSetMember();
  const r = member.restaurant;
  const [name, setName] = useState(r.name);
  const [address, setAddress] = useState(r.address ?? "");
  const [upiId, setUpiId] = useState(r.upiId ?? "");
  const [tax, setTax] = useState(String(r.taxPercent));
  const [gstin, setGstin] = useState(r.gstin ?? "");
  const [fssai, setFssai] = useState(r.fssai ?? "");
  const [service, setService] = useState(String(r.serviceChargePercent ?? 0));
  const [packaging, setPackaging] = useState(String((r.packagingPaise ?? 0) / 100));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (member.role !== "owner" && member.role !== "manager") {
    return <p className="muted" style={{ marginTop: 16 }}>Only the owner or a manager can change restaurant settings.</p>;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const upi = upiId.trim();
    const taxPercent = Number(tax);
    if (upi && !isValidUpiId(upi)) return setError("UPI ID looks wrong. It should look like name@okaxis.");
    if (tax.trim() === "" || !Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 28) {
      return setError("GST must be between 0 and 28%.");
    }
    const g = gstin.trim().toUpperCase();
    const f = fssai.replace(/\s/g, "");
    const serviceChargePercent = Number(service);
    const packagingPaise = rupeesToPaise(packaging.trim() || "0");
    if (g && !isValidGstin(g)) return setError("GSTIN should be 15 characters, like 29ABCDE1234F1Z5.");
    if (f && !isValidFssai(f)) return setError("FSSAI licence number is 14 digits.");
    if (!Number.isFinite(serviceChargePercent) || serviceChargePercent < 0 || serviceChargePercent > 20) return setError("Service charge must be between 0 and 20%.");
    if (packagingPaise === null || packagingPaise > 100000) return setError("Packaging charge must be between ₹0 and ₹1,000.");
    setBusy(true);
    try {
      const restaurant = await api.updateRestaurant({ name, address, upiId: upi, taxPercent, gstin: g, fssai: f, serviceChargePercent, packagingPaise });
      setMember({ ...member, restaurant });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card stack narrow" style={{ marginTop: 16 }} onSubmit={save}>
      <h2 style={{ fontSize: 20 }}>Restaurant settings</h2>
      <label className="field">
        <span>Restaurant name</span>
        <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field">
        <span>Address (optional)</span>
        <input maxLength={200} value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>
      <label className="field">
        <span>UPI ID for payments</span>
        <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="spiceroute@okaxis" autoComplete="off" spellCheck={false} />
        <small>Use a business UPI ID. Leave empty to hide UPI payment.</small>
      </label>
      <label className="field">
        <span>GST %</span>
        <input type="number" inputMode="decimal" min={0} max={28} step={0.01} required value={tax} onChange={(e) => setTax(e.target.value)} />
        <small>Applies to new orders only.</small>
      </label>
      <h3 style={{ fontSize: 16, marginTop: 8 }}>Bills and invoices</h3>
      <label className="field">
        <span>GSTIN (optional)</span>
        <input maxLength={15} value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="29ABCDE1234F1Z5" autoComplete="off" spellCheck={false} />
        <small>With a GSTIN, bills print as tax invoices with CGST and SGST.</small>
      </label>
      <label className="field">
        <span>FSSAI licence no. (optional)</span>
        <input inputMode="numeric" maxLength={17} value={fssai} onChange={(e) => setFssai(e.target.value)} />
      </label>
      <div className="form-grid">
        <label className="field">
          <span>Service charge % (dine-in)</span>
          <input type="number" inputMode="decimal" min={0} max={20} step={0.01} value={service} onChange={(e) => setService(e.target.value)} />
        </label>
        <label className="field">
          <span>Packaging ₹ (takeaway)</span>
          <input inputMode="decimal" value={packaging} onChange={(e) => setPackaging(e.target.value)} />
        </label>
      </div>
      <small className="muted">Managers can waive the service charge on any bill.</small>
      {error && <p className="error" role="alert">{error}</p>}
      {saved && <p className="notice" role="status">Saved.</p>}
      <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
    </form>
  );
}
