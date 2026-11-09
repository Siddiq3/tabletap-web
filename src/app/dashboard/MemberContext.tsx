"use client";

import { createContext, useContext } from "react";
import type { Membership } from "@/contract";

export const MemberContext = createContext<Membership | null>(null);

export function useMember(): Membership {
  const m = useContext(MemberContext);
  if (!m) throw new Error("useMember must be used inside the dashboard");
  return m;
}
