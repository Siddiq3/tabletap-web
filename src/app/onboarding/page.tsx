"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, slugify } from "@/contract";
import { api } from "@/lib/api-client";
import { AuthShell } from "@/components/Brand";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [tables, setTables] = useState("10");
  const [upiId, setUpiId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shownSlug = slugEdited ? slug : slugify(name);

  // Already set up, or not logged in? Send them to the right place.
  useEffect(() => {
    api.me()
      .then((me) => {
        if (me.profile && !me.profile.emailVerified) router.replace("/verify-email");
        else if (me.membership) router.replace("/dashboard/orders");
      })
      .catch((e) => { if (e instanceof ApiError && e.status === 401) router.replace("/login"); });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.createRestaurant({ name, slug: shownSlug, upiId, tableCount: Number(tables) });
      router.replace("/dashboard/menu");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the restaurant. Try again.");
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Set up your restaurant" sub="You can change this anytime.">
      <form className="card stack" onSubmit={submit}>
        <label className="field">
          <span>Restaurant name</span>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Spice Route Kitchen" />
        </label>
        <label className="field">
          <span>Menu link</span>
          <input id="slug" value={shownSlug} onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); }} placeholder="spice-route" />
          <small>Guests will open tabletap/r/{shownSlug || "your-name"}</small>
        </label>
        <label className="field">
          <span>Number of tables</span>
          <input id="tables" type="number" min={1} max={200} required value={tables} onChange={(e) => setTables(e.target.value)} />
        </label>
        <label className="field">
          <span>UPI ID for payments (optional)</span>
          <input id="upiId" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="spiceroute@okaxis" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Setting up…" : "Create my restaurant"}</button>
      </form>
    </AuthShell>
  );
}
