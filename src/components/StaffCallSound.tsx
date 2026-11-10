'use client';
import { useEffect, useRef, useState } from 'react';
import type { StaffCall } from '@/contract';
import { useCallSound } from '@/lib/call-sound';

/** Shared by the real inbox and the two-tab demo. Polling the same IDs never replays sound. */
export function StaffCallSound({ calls }: { calls: StaffCall[] }) {
  const { prepare, play } = useCallSound();
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seen = useRef(new Set<string>());
  useEffect(() => {
    const fresh = calls.some(call => !seen.current.has(call.id));
    calls.forEach(call => seen.current.add(call.id));
    if (enabled && fresh && !play('alert')) { setEnabled(false); setError('Tap Enable call sound to resume audio.'); }
  }, [calls, enabled, play]);
  async function toggle() {
    if (enabled) { setEnabled(false); setError(null); return; }
    if (await prepare()) { play('alert'); setEnabled(true); setError(null); }
    else setError('Sound is blocked or unavailable. Visual alerts will still appear.');
  }
  return <div><button className="btn-sm" style={{ minHeight: 44 }} aria-pressed={enabled} onClick={() => void toggle()}>{enabled ? 'Call sound on · mute' : 'Enable call sound'}</button>{error && <p className="muted small" role="status">{error}</p>}</div>;
}
