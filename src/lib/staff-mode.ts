"use client";
// Shared-device state. The PIN session lives in memory only, so a page reload locks the device.
// The "use this device for staff" switch is per device (localStorage), off by default on the web.
import { useSyncExternalStore } from "react";
import type { PinSessionResponse } from "@/contract";

const KEY = "tabletap.pinLock";

type State = { session: PinSessionResponse | null; pinLock: boolean; staffVersion: number };
let state: State = { session: null, pinLock: readPinLock(), staffVersion: 0 };
const listeners = new Set<() => void>();

function readPinLock(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const SERVER: State = { session: null, pinLock: false, staffVersion: 0 };
export const useStaffMode = () => useSyncExternalStore(subscribe, () => state, () => SERVER);

/** For the API client: X-Staff-Session while a staff member is working. */
export const getStaffSession = () => state.session?.token ?? null;
export const startStaffSession = (session: PinSessionResponse) => set({ session });
/** Switch staff, idle lock, or the server said the session ended. */
export const endStaffSession = () => { if (state.session) set({ session: null }); };

export function setPinLock(on: boolean) {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* still applies until reload */ }
  set({ pinLock: on, session: on ? state.session : null });
}

/** Staff were added/changed: the lock screen reloads its list of names. */
export const staffChanged = () => set({ staffVersion: state.staffVersion + 1 });
