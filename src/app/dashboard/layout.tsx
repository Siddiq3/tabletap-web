"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, STAFF_IDLE_LOCK_MS, type Membership, type StaffMember } from "@/contract";
import { api } from "@/lib/api-client";
import { signOut } from "@/lib/auth";
import { endStaffSession, useStaffMode } from "@/lib/staff-mode";
import { DashNav } from "./DashNav";
import { MemberContext } from "./MemberContext";
import { StaffLock } from "./StaffLock";
import { Brand } from "@/components/Brand";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [device, setDevice] = useState<Membership | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { session, pinLock, staffVersion } = useStaffMode();
  const [staff, setStaff] = useState<StaffMember[] | null>(null); // null = not loaded yet
  const [ownerUnlocked, setOwnerUnlocked] = useState(false);

  useEffect(() => {
    api.me()
      .then((me) => {
        if (me.profile && !me.profile.emailVerified) router.replace("/verify-email");
        else if (me.membership) setDevice(me.membership);
        else router.replace("/onboarding");
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) router.replace("/login");
        else setError(e instanceof Error ? e.message : "Could not load your restaurant.");
      });
  }, [router]);

  const canLock = !!device && (device.role === "owner" || device.role === "manager");
  // Names for "Who's working?". Loaded with the device's own role (no staff session active).
  useEffect(() => {
    if (!canLock || !pinLock || session) return;
    api.staffList().then((r) => setStaff(r.staff.filter((s) => s.isActive)))
      // Fail closed: without the list we can't tell whether to lock.
      .catch(() => setError("Could not load your staff list. Check the connection and reload the page."));
  }, [canLock, pinLock, session, staffVersion]);

  const lockApplies = canLock && pinLock && !!staff?.length;
  const locked = lockApplies && !session && !ownerUnlocked;

  const lock = useCallback(() => {
    endStaffSession();
    setOwnerUnlocked(false);
  }, []);

  // Back to "Who's working?" after 10 minutes without a tap or key.
  useEffect(() => {
    if (!lockApplies || locked) return;
    let timer = setTimeout(lock, STAFF_IDLE_LOCK_MS);
    const reset = () => { clearTimeout(timer); timer = setTimeout(lock, STAFF_IDLE_LOCK_MS); };
    window.addEventListener("pointerdown", reset);
    window.addEventListener("keydown", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [lockApplies, locked, lock]);

  if (error) return <main className="page narrow"><p className="error">{error}</p></main>;
  // With the PIN lock on, show nothing until we know whether to lock (no flash of the owner's dashboard).
  if (!device || (canLock && pinLock && !session && staff === null)) {
    return <main className="page"><p className="muted">Loading your restaurant…</p></main>;
  }

  // While a staff member is working, their role decides what the dashboard shows (the API enforces it too).
  const member: Membership = session ? { ...device, role: session.staff.role } : device;
  const { restaurant, role } = member;
  // Settings changes only update restaurant details, never the device's role.
  const setMember = (m: Membership) => setDevice((d) => (d ? { ...d, restaurant: m.restaurant } : d));

  return (
    <MemberContext.Provider value={{ member, setMember }}>
      <header className="dash-top">
        <div className="page">
          <div className="row">
            <div className="dash-id">
              <Brand />
              <div style={{ minWidth: 0 }}>
                <h1>{restaurant.name}</h1>
                {!session && <span className="muted small" style={{ textTransform: "capitalize" }}>{role}{restaurant.plan === "trial" ? " · Free trial" : ""}</span>}
              </div>
            </div>
            <span className="row" style={{ gap: 6 }}>
              {session && <span className="staff-badge">{session.staff.name} · {session.staff.role}</span>}
              {lockApplies && !locked && <button className="btn-sm btn-dark" onClick={lock}>Switch staff</button>}
              <a className="btn-sm" href={`/r/${restaurant.slug}`} target="_blank" rel="noreferrer">Guest menu ↗</a>
              {!session && !locked && (
                <button className="btn-sm" onClick={async () => { endStaffSession(); await signOut(); router.replace("/login"); }}>Log out</button>
              )}
            </span>
          </div>
          {!locked && <DashNav role={role} />}
        </div>
      </header>
      <main className="page">
        {locked ? <StaffLock staff={staff!} onOwner={() => setOwnerUnlocked(true)} /> : children}
      </main>
    </MemberContext.Provider>
  );
}
