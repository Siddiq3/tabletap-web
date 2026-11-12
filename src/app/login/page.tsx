"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { setSession } from "@/lib/auth";
import { AuthShell } from "@/components/Brand";

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
    <AuthShell
      title={forgot ? "Reset your password" : "Welcome back"}
      sub={forgot ? "We'll email you a reset link." : undefined}
      foot={<>New restaurant? <Link href="/signup">Create an account</Link><br /><span className="small">Staff? Ask your owner for a PIN.</span></>}
    >
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
        {notice && <p role="status" className="notice">{notice}</p>}
        <button className="btn" disabled={busy}>
          {busy ? "Please wait…" : forgot ? "Send reset link" : "Log in"}
        </button>
        <button type="button" className="link-btn small" style={{ justifySelf: "center" }} onClick={() => { setForgot(!forgot); setError(null); setNotice(null); }}>
          {forgot ? "Back to login" : "Forgot password?"}
        </button>
      </form>
    </AuthShell>
  );
}
