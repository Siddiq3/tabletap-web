"use client";

import { createContext, useContext } from "react";
import type { Membership } from "@/contract";

export const MemberContext = createContext<{ member: Membership; setMember: (m: Membership) => void } | null>(null);

function useCtx() {
  const m = useContext(MemberContext);
  if (!m) throw new Error("useMember must be used inside the dashboard");
  return m;
}

export const useMember = (): Membership => useCtx().member;
/** After settings change, so every dashboard page sees the new restaurant details. */
export const useSetMember = () => useCtx().setMember;
