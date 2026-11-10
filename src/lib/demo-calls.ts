'use client';
import { useEffect, useState } from 'react';
import type { StaffCall } from '@/contract';
const KEY = 'tabletap.demo-calls.v1';
const EVENT = 'tabletap-demo-calls';
function read(): StaffCall[] { try { const rows = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(rows) ? rows.filter(c => c && typeof c.id === 'string' && typeof c.tableId === 'string' && typeof c.tableLabel === 'string' && typeof c.createdAt === 'string') : []; } catch { return []; } }
function write(calls: StaffCall[]) { localStorage.setItem(KEY, JSON.stringify(calls.slice(-100))); window.dispatchEvent(new Event(EVENT)); }
export function useDemoStaffCalls() {
  const [calls, setCalls] = useState<StaffCall[]>([]);
  useEffect(() => { const refresh = () => setCalls(read().filter(c => !c.resolvedAt)); refresh(); window.addEventListener('storage', refresh); window.addEventListener(EVENT, refresh); return () => { window.removeEventListener('storage', refresh); window.removeEventListener(EVENT, refresh); }; }, []);
  return calls;
}
export async function requestDemoStaffCall(_slug: string, tableId: string) {
  const calls = read();
  const pending = calls.find(c => c.tableId === tableId && !c.resolvedAt);
  if (pending) return { call: pending };
  const latest = calls.filter(c => c.tableId === tableId).at(-1);
  if (latest && Date.now() - Date.parse(latest.createdAt) < 30000) throw new Error('Please wait 30 seconds before calling staff again.');
  const call: StaffCall = { id: globalThis.crypto?.randomUUID?.() ?? `demo-call-${Date.now()}-${Math.random().toString(36).slice(2)}`, tableId, tableLabel: tableId.replace('demo-table-', ''), createdAt: new Date().toISOString(), resolvedAt: null };
  write([...calls, call]); return { call };
}
export async function resolveDemoStaffCall(id: string) { write(read().map(c => c.id === id ? { ...c, resolvedAt: new Date().toISOString() } : c)); }
export function resetDemoStaffCalls() { write([]); }
