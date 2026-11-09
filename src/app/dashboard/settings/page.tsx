"use client";

import { useState } from "react";
import { isValidUpiId } from "@/contract";
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
    setBusy(true);
    try {
      const restaurant = await api.updateRestaurant({ name, address, upiId: upi, taxPercent });
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
        <small>
          Use a business UPI ID from your bank, PhonePe Business or Paytm Business. Personal UPI IDs can get limited by
          banks when they receive many payments.
        </small>
        <small>Leave empty to stop showing UPI payment to guests.</small>
      </label>
      <label className="field">
        <span>GST %</span>
        <input type="number" inputMode="decimal" min={0} max={28} step={0.01} required value={tax} onChange={(e) => setTax(e.target.value)} />
        <small>Applies to new orders. Orders already placed keep their GST.</small>
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {saved && <p style={{ color: "var(--good)", fontWeight: 700, margin: 0 }} role="status">Saved.</p>}
      <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
    </form>
  );
}
