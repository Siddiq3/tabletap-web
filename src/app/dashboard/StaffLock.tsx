"use client";

import { useEffect, useState } from "react";
import { isValidPin, type StaffMember } from "@/contract";
import { api, confirmPassword } from "@/lib/api-client";
import { startStaffSession } from "@/lib/staff-mode";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

/** "Who's working?": staff tap their name, then enter their PIN. The device owner can continue with their password. */
export function StaffLock({ staff, onOwner }: { staff: StaffMember[]; onOwner: () => void }) {
  const [picked, setPicked] = useState<StaffMember | "owner" | null>(null);
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const back = () => { setPicked(null); setPin(""); setPassword(""); setError(null); };

  async function submitPin(value: string) {
    if (!picked || picked === "owner" || !isValidPin(value)) return;
    setBusy(true);
    setError(null);
    try {
      startStaffSession(await api.startPinSession({ staffId: picked.id, pin: value }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work. Try again.");
      setPin("");
      setBusy(false);
    }
  }

  function press(k: string) {
    if (busy) return;
    if (k === "⌫") return setPin((p) => p.slice(0, -1));
    if (/^\d$/.test(k) && pin.length < 6) setPin(pin + k);
  }

  // Physical keyboards on counter PCs
  useEffect(() => {
    if (!picked || picked === "owner") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") void submitPin(pin);
      else if (e.key === "Backspace") press("⌫");
      else if (/^\d$/.test(e.key)) press(e.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!picked) {
    return (
      <section className="stack lock" aria-labelledby="who">
        <h2 id="who" style={{ fontSize: 28, textAlign: "center" }}>Who&apos;s working?</h2>
        <div className="lock-names">
          {staff.map((s) => (
            <button key={s.id} className="lock-name" onClick={() => setPicked(s)}>
              <b>{s.name}</b>
              <span className="muted small">{s.role}</span>
            </button>
          ))}
        </div>
        <button className="btn-ghost" style={{ justifySelf: "center" }} onClick={() => setPicked("owner")}>Continue as owner</button>
      </section>
    );
  }

  if (picked === "owner") {
    return (
      <form
        className="card stack narrow lock"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await confirmPassword(password);
            onOwner();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Wrong login or password.");
            setBusy(false);
          }
        }}
      >
        <h2 style={{ fontSize: 22 }}>Continue as owner</h2>
        <label className="field">
          <span>Your password</span>
          <input type="password" autoFocus required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Checking…" : "Unlock"}</button>
        <button type="button" className="btn-ghost" onClick={back}>Back</button>
      </form>
    );
  }

  return (
    <section className="stack narrow lock" aria-labelledby="pin-title">
      <h2 id="pin-title" style={{ fontSize: 24, textAlign: "center" }}>Hi {picked.name}, enter your PIN</h2>
      <div className="pin-dots" aria-label={`${pin.length} digits entered`}>
        {Array.from({ length: 6 }, (_, i) => <i key={i} data-on={i < pin.length} />)}
      </div>
      {error && <p className="error" role="alert" style={{ textAlign: "center" }}>{error}</p>}
      <div className="pin-pad">
        {KEYS.map((k, i) =>
          k ? (
            <button key={i} type="button" disabled={busy} onClick={() => press(k)} aria-label={k === "⌫" ? "Delete" : k}>{k}</button>
          ) : <span key={i} />,
        )}
      </div>
      <button className="btn" disabled={busy || !isValidPin(pin)} onClick={() => void submitPin(pin)}>
        {busy ? "Checking…" : "Start"}
      </button>
      <button className="btn-ghost" onClick={back}>Not {picked.name}?</button>
    </section>
  );
}
