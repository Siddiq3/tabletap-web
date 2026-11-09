"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { setSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
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
      <h1>{forgot ? "Reset your password" : "Restaurant login"}</h1>
      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            if (forgot) {
              setNotice((await api.forgotPassword(identifier.trim())).message);
            } else {
              const { session } = await api.login({ identifier: identifier.trim(), password });
              await setSession(session);
              router.replace("/dashboard/orders");
            }
          });
        }}
      >
        <label className="field">
          <span>Email, phone or username</span>
          <input id="identifier" required autoComplete="username" autoCapitalize="none" spellCheck={false} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        </label>
        {!forgot && (
          <label className="field">
            <span>Password</span>
            <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p role="status" style={{ margin: 0, fontWeight: 600 }}>{notice}</p>}
        <button className="btn" disabled={busy}>
          {busy ? "Please wait…" : forgot ? "Send reset link" : "Log in"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => { setForgot(!forgot); setError(null); setNotice(null); }}>
          {forgot ? "Back to login" : "Forgot password?"}
        </button>
      </form>
      <p className="muted" style={{ textAlign: "center" }}>
        New restaurant? <Link href="/signup">Create an account</Link>
      </p>
      <p className="muted small" style={{ textAlign: "center" }}>
        Waiters, kitchen and cashiers don&apos;t need an account. Ask the owner to add you under Staff.
      </p>
    </main>
  );
}
