"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PASSWORD_MIN } from "@/contract";
import { updatePassword, waitForRecoverySession } from "@/lib/auth";

/** Landing page of Supabase's reset email (PASSWORD_RESET_URL on the backend). */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void waitForRecoverySession().then(setReady); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < PASSWORD_MIN) return setError(`Password must be at least ${PASSWORD_MIN} characters.`);
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      router.replace("/dashboard/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the password.");
      setBusy(false);
    }
  }

  return (
    <main className="page narrow stack" style={{ paddingTop: 64 }}>
      <h1>Choose a new password</h1>
      {ready === null && <p className="muted">Checking your link…</p>}
      {ready === false && (
        <p className="error">This reset link has expired or was already used. <a href="/login">Request a new one</a>.</p>
      )}
      {ready && (
        <form className="card stack" onSubmit={submit}>
          <label className="field">
            <span>New password</span>
            <input id="password" type="password" required minLength={PASSWORD_MIN} maxLength={72} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <small>At least {PASSWORD_MIN} characters.</small>
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save and log in"}</button>
        </form>
      )}
    </main>
  );
}
