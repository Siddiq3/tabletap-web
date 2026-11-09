"use client";

import { useCallback, useEffect, useState } from "react";
import { isValidPin, type StaffMember, type StaffRole } from "@/contract";
import { api, confirmPassword } from "@/lib/api-client";
import { setPinLock, staffChanged, useStaffMode } from "@/lib/staff-mode";
import { useMember } from "../MemberContext";

const ROLES: { value: StaffRole; label: string }[] = [
  { value: "waiter", label: "Waiter" },
  { value: "kitchen", label: "Kitchen" },
  { value: "cashier", label: "Cashier" },
  { value: "manager", label: "Manager" },
];

const pinInput = {
  type: "password", inputMode: "numeric", autoComplete: "off", pattern: "\\d{4,6}", minLength: 4, maxLength: 6,
} as const;

export default function StaffPage() {
  const { role } = useMember();
  const isOwner = role === "owner";
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ name: string; role: StaffRole; pin: string }>({ name: "", role: "waiter", pin: "" });
  const [pinFor, setPinFor] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStaff((await api.staffList()).staff);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load staff.");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (role !== "owner" && role !== "manager") {
    return <p className="muted" style={{ marginTop: 16 }}>Only the owner or a manager can manage staff.</p>;
  }

  async function run(fn: () => Promise<unknown>, message?: string) {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      await fn();
      await load();
      staffChanged();
      if (message) setDone(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // Only the owner's own login manages managers (the API checks this too).
  const canManage = (s: StaffMember) => isOwner || s.role !== "manager";

  return (
    <div className="stack" style={{ marginTop: 16, maxWidth: 760 }}>
      <DeviceLock />

      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isValidPin(form.pin)) return setError("PIN must be 4 to 6 digits.");
          void run(async () => {
            await api.createStaff({ name: form.name.trim(), role: form.role, pin: form.pin });
            setForm({ name: "", role: form.role, pin: "" });
          }, `${form.name.trim()} added. They can now tap their name and enter their PIN.`);
        }}
      >
        <h2 style={{ fontSize: 20 }}>Add staff</h2>
        <p className="muted small" style={{ margin: 0 }}>
          Staff don&apos;t need an account or email. They use a PIN on a device where you&apos;re logged in.
        </p>
        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input required maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ravi" />
          </label>
          <label className="field">
            <span>Role</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}>
              {ROLES.filter((r) => isOwner || r.value !== "manager").map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>PIN (4–6 digits)</span>
            <input {...pinInput} required value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} />
          </label>
          <button className="btn" disabled={busy}>Add</button>
        </div>
      </form>

      {error && <p className="error" role="alert">{error}</p>}
      {done && <p role="status" style={{ color: "var(--good)", fontWeight: 700, margin: 0 }}>{done}</p>}

      <section className="card stack">
        <h2 style={{ fontSize: 20 }}>Staff</h2>
        {!staff && <p className="muted">Loading…</p>}
        {staff?.length === 0 && <p className="muted">No staff yet. Add your waiters, kitchen and cashier above.</p>}
        {staff?.map((s) => (
          <div key={s.id} className="stack" style={{ gap: 8, borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
            <div className="row">
              <span>
                <b>{s.name}</b> <span className="muted small">· {s.role}{s.isActive ? "" : " · deactivated"}</span>
              </span>
              {canManage(s) && (
                <span className="row" style={{ gap: 6 }}>
                  {s.isActive && (
                    <button className="btn-sm" disabled={busy} onClick={() => { setPinFor(pinFor === s.id ? null : s.id); setNewPin(""); }}>
                      Reset PIN
                    </button>
                  )}
                  <button
                    className="btn-sm"
                    disabled={busy}
                    onClick={() => void run(() => api.updateStaff(s.id, { isActive: !s.isActive }), s.isActive ? `${s.name} deactivated.` : `${s.name} is active again.`)}
                  >
                    {s.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </span>
              )}
            </div>
            {pinFor === s.id && (
              <form
                className="row"
                style={{ justifyContent: "flex-start" }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isValidPin(newPin)) return setError("PIN must be 4 to 6 digits.");
                  void run(async () => { await api.setStaffPin(s.id, newPin); setPinFor(null); }, `New PIN set for ${s.name}.`);
                }}
              >
                <input {...pinInput} aria-label={`New PIN for ${s.name}`} autoFocus value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} style={{ maxWidth: 140 }} />
                <button className="btn-sm btn-dark" disabled={busy}>Save PIN</button>
              </form>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

/** Per-device switch. Turning it off needs the device account's password. */
function DeviceLock() {
  const { pinLock } = useStaffMode();
  const [asking, setAsking] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="card stack">
      <div className="row">
        <span>
          <b>Use this device for staff (PIN lock)</b>
          <br />
          <span className="muted small">
            Shows &ldquo;Who&apos;s working?&rdquo; and locks after 10 minutes without a tap. Turn on for the kitchen
            tablet or counter screen, not your own laptop.
          </span>
        </span>
        <button
          className="switch"
          role="switch"
          aria-checked={pinLock}
          aria-label="Use this device for staff (PIN lock)"
          onClick={() => (pinLock ? setAsking(true) : setPinLock(true))}
        />
      </div>
      {asking && (
        <form
          className="row"
          style={{ justifyContent: "flex-start" }}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await confirmPassword(password);
              setPinLock(false);
              setAsking(false);
              setPassword("");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Wrong login or password.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <input type="password" aria-label="Owner or manager password" placeholder="Your password" autoFocus required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ maxWidth: 220 }} />
          <button className="btn-sm btn-dark" disabled={busy}>{busy ? "Checking…" : "Turn off"}</button>
          <button type="button" className="btn-sm" onClick={() => { setAsking(false); setError(null); }}>Cancel</button>
          {error && <span className="error small" role="alert">{error}</span>}
        </form>
      )}
    </section>
  );
}
