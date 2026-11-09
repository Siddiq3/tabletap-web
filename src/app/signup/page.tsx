"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PASSWORD_MIN, isValidUsername, normalizeIndianPhone } from "@/contract";
import { api } from "@/lib/api-client";
import { setSession } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [f, setF] = useState({ fullName: "", username: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = (k: keyof typeof f) => ({ value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value }) });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const username = f.username.trim().toLowerCase();
    if (!isValidUsername(username)) return setError("Username must be 3 to 30 characters: a–z, 0–9, _ or . and at least one letter.");
    if (!f.email.trim() && !f.phone.trim()) return setError("Enter your email or phone number, so you can log in with it.");
    if (f.phone.trim() && !normalizeIndianPhone(f.phone)) return setError("Enter a 10-digit Indian mobile number.");
    if (f.password.length < PASSWORD_MIN) return setError(`Password must be at least ${PASSWORD_MIN} characters.`);
    setBusy(true);
    try {
      const { session } = await api.signup({
        fullName: f.fullName.trim(), username, password: f.password,
        email: f.email.trim() || undefined, phone: f.phone.trim() || undefined,
      });
      await setSession(session);
      // With an email: verify it first (the code is already on its way), then onboarding.
      router.replace(f.email.trim() ? "/verify-email?sent=1" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account. Try again.");
      setBusy(false);
    }
  }

  return (
    <main className="page narrow stack" style={{ paddingTop: 40 }}>
      <h1>Create your account</h1>
      <p className="muted" style={{ margin: 0 }}>For restaurant owners. Next you&apos;ll set up your restaurant.</p>
      <form className="card stack" onSubmit={submit}>
        <label className="field">
          <span>Full name</span>
          <input id="fullName" required maxLength={80} autoComplete="name" {...field("fullName")} />
        </label>
        <label className="field">
          <span>Username</span>
          <input id="username" required maxLength={30} autoComplete="username" autoCapitalize="none" spellCheck={false} {...field("username")} placeholder="spiceroute" />
          <small>Letters, numbers, _ and . You can log in with this.</small>
        </label>
        <label className="field">
          <span>Email</span>
          <input id="email" type="email" autoComplete="email" {...field("email")} />
        </label>
        <label className="field">
          <span>Phone</span>
          <input id="phone" type="tel" inputMode="tel" autoComplete="tel" {...field("phone")} placeholder="98765 43210" />
          <small>Email or phone: at least one. Only email can reset a forgotten password for now.</small>
        </label>
        <label className="field">
          <span>Password</span>
          <input id="password" type="password" required minLength={PASSWORD_MIN} maxLength={72} autoComplete="new-password" {...field("password")} />
          <small>At least {PASSWORD_MIN} characters.</small>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      </form>
      <p className="muted" style={{ textAlign: "center" }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
