"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendLoginCode, verifyLoginCode } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page narrow stack" style={{ paddingTop: 64 }}>
      <h1>Restaurant login</h1>
      {step === "email" ? (
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => { await sendLoginCode(email.trim()); setStep("code"); });
          }}
        >
          <label className="field">
            <span>Email</span>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <small>No password. We email you a 6-digit code.</small>
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send login code"}</button>
        </form>
      ) : (
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => { await verifyLoginCode(email.trim(), code.trim()); router.replace("/dashboard/orders"); });
          }}
        >
          <label className="field">
            <span>Code sent to {email}</span>
            <input id="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Log in"}</button>
          <button type="button" className="btn-ghost" onClick={() => { setStep("email"); setCode(""); }}>Use a different email</button>
        </form>
      )}
    </main>
  );
}
