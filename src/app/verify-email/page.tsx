"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, RESEND_CODE_SECONDS, isValidEmailCode } from "@/contract";
import { api } from "@/lib/api-client";
import { signOut } from "@/lib/auth";
import { AuthShell } from "@/components/Brand";

/** "Check your email": owners who signed up with an email enter the 6-digit code before using the dashboard. */
export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const next = async () => {
    const me = await api.me();
    router.replace(me.membership ? "/dashboard/orders" : "/onboarding");
  };

  useEffect(() => {
    // Just signed up: the first code is already on its way, so start the countdown.
    if (new URLSearchParams(location.search).has("sent")) setWait(RESEND_CODE_SECONDS);
    api.me()
      .then((me) => {
        if (!me.profile || me.profile.emailVerified) return void router.replace(me.membership ? "/dashboard/orders" : "/onboarding");
        setEmail(me.profile.email);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) router.replace("/login");
        else setError(e instanceof Error ? e.message : "Could not load your account.");
      });
  }, [router]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmailCode(code)) return setError("Enter the 6-digit code from the email.");
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.verifyEmail(code);
      await next();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Try again.");
      setCode("");
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setWait((await api.resendCode()).retryAfterSeconds);
      setNotice("New code sent.");
    } catch (err) {
      if (err instanceof ApiError && err.retryAfterSeconds) setWait(err.retryAfterSeconds);
      setError(err instanceof Error ? err.message : "Could not send a code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Check your email"
      sub={email ? <>Enter the 6-digit code sent to <b>{email}</b>.</> : "Enter the 6-digit code we emailed you."}
      foot={<>Not there? Check spam, or <button className="link-btn" onClick={async () => { await signOut(); router.replace("/login"); }}>use a different account</button>.</>}
    >
      <form className="card stack" onSubmit={verify}>
        <label className="field">
          <span>Code</span>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            style={{ letterSpacing: 10, fontSize: 24, textAlign: "center", fontWeight: 700 }}
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p role="status" className="notice">{notice}</p>}
        <button className="btn" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Verify"}</button>
        <button type="button" className="btn-ghost" disabled={busy || wait > 0} onClick={() => void resend()}>
          {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
        </button>
      </form>
    </AuthShell>
  );
}
