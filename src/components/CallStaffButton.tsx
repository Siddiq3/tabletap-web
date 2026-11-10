'use client';
import { useEffect, useState } from 'react';
import type { StaffCall } from '@/contract';
import { useCallSound } from '@/lib/call-sound';
import { publicApi } from '@/lib/api';

export type CallStaff = (slug: string, tableId: string) => Promise<{ call: StaffCall }>;
export function CallStaffButton({ slug, tableId, onCall = publicApi.callStaff }: { slug: string; tableId: string; onCall?: CallStaff }) {
  const { prepare, play } = useCallSound();
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(w => w - 1), 1000); return () => clearTimeout(t); }, [wait]);
  useEffect(() => { setWait(0); setMessage(null); setError(null); }, [slug, tableId]);
  async function call() {
    setBusy(true); setError(null); setMessage(null);
    const soundReady = prepare(); // Resume audio inside the tap, before the network request.
    try { await onCall(slug, tableId); setWait(30); setMessage('Request sent. A team member will be with you.'); if (await soundReady) play('confirmation'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not call staff. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="call-staff"><button type="button" className="btn-ghost call-staff-button" disabled={busy || wait > 0} onClick={() => void call()}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 17h16M6 16v-5a6 6 0 0 1 12 0v5M10 21h4M12 3V1" strokeLinecap="round"/></svg>{busy ? 'Calling staff…' : wait > 0 ? `Staff called · ${wait}s` : 'Call staff'}</button>{message && <p className="muted small" role="status">{message}</p>}{error && <p className="error small" role="alert">{error}</p>}</div>;
}
