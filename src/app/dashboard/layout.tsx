"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, type Membership } from "@/contract";
import { api } from "@/lib/api-client";
import { signOut } from "@/lib/auth";
import { DashNav } from "./DashNav";
import { MemberContext } from "./MemberContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [member, setMember] = useState<Membership | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.me()
      .then((me) => (me.membership ? setMember(me.membership) : router.replace("/onboarding")))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) router.replace("/login");
        else setError(e instanceof Error ? e.message : "Could not load your restaurant.");
      });
  }, [router]);

  if (error) return <main className="page narrow"><p className="error">{error}</p></main>;
  if (!member) return <main className="page"><p className="muted">Loading your restaurant…</p></main>;

  const { restaurant, role } = member;
  return (
    <MemberContext.Provider value={member}>
      <header className="dash-top">
        <div className="page">
          <div className="row">
            <div>
              <h1 style={{ fontSize: 20 }}>{restaurant.name}</h1>
              <span className="muted small">
                {role} · {restaurant.plan === "trial" ? "Free trial" : `${restaurant.plan} plan`}
              </span>
            </div>
            <span className="row" style={{ gap: 6 }}>
              <a className="btn-sm" href={`/r/${restaurant.slug}`} target="_blank" rel="noreferrer">View guest menu</a>
              <button className="btn-sm" onClick={async () => { await signOut(); router.replace("/login"); }}>Log out</button>
            </span>
          </div>
          <DashNav role={role} />
        </div>
      </header>
      <main className="page">{children}</main>
    </MemberContext.Provider>
  );
}
