'use client';
import { useCallback, useEffect, useState } from 'react';
import type { StaffCall } from '@/contract';
import { StaffCallSound } from './StaffCallSound';
import { api } from '@/lib/api-client';
import { subscribeToOrders } from '@/lib/feed';

export function StaffCallList({ calls, error, busy, onResolve }: { calls: StaffCall[]; error?: string | null; busy?: string | null; onResolve: (id: string) => void }) {
  return <section className="staff-calls" aria-label="Guest assistance requests"><h2>Guest calls <span className="muted">({calls.length})</span></h2><div role="status" aria-live="polite">{calls.length ? `${calls.length} table${calls.length === 1 ? '' : 's'} waiting for assistance.` : 'No tables waiting for assistance.'}</div>{error && <p className="error" role="alert">{error}</p>}{calls.map(call => <div className="staff-call-row" key={call.id}><div><strong>Table {call.tableLabel.replace(/^T(?=\d)/, '')}</strong><p className="muted small" style={{ margin: '4px 0 0' }}>Requested assistance at {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div><button className="btn-sm btn-dark" disabled={busy === call.id} onClick={() => onResolve(call.id)}>{busy === call.id ? 'Saving…' : 'Mark handled'}</button></div>)}</section>;
}
export function StaffCalls({ restaurantId }: { restaurantId: string }) {
  const [calls, setCalls] = useState<StaffCall[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const { calls } = await api.staffCalls();
      setCalls(calls); setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load guest calls. Retrying…'); }
  }, []);
  useEffect(() => { void load(); const unsubscribe = subscribeToOrders(restaurantId, () => void load(), "staff-calls"); const timer = setInterval(() => void load(), 5000); return () => { unsubscribe(); clearInterval(timer); }; }, [restaurantId, load]);
  async function resolve(id: string) { setBusy(id); try { await api.resolveStaffCall(id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not resolve this call.'); } finally { setBusy(null); } }
  return <div className="stack"><StaffCallSound calls={calls}/><StaffCallList calls={calls} error={error} busy={busy} onResolve={id => void resolve(id)}/></div>;
}
