'use client';
import Link from 'next/link';
import { useState } from 'react';
import { StaffCallSound } from '@/components/StaffCallSound';
import { StaffCallList } from '@/components/StaffCalls';
import { resetDemoStaffCalls, resolveDemoStaffCall, useDemoStaffCalls } from '@/lib/demo-calls';
import '../demo.css';
export default function DemoStaff() {
  const calls = useDemoStaffCalls();
  const [error, setError] = useState<string | null>(null);
  return <main className="page narrow stack" style={{ maxWidth: 620, paddingTop: 36 }}><h1>Staff alert demo</h1><p className="muted">Keep this tab open, then tap “Call staff” on the <Link href="/demo" target="_blank" rel="noreferrer">customer demo</Link>. The table will appear here. This preview syncs tabs in the same browser; real restaurant calls use the backend.</p><StaffCallSound calls={calls}/><StaffCallList calls={calls} error={error} onResolve={id => { void resolveDemoStaffCall(id).catch(e => setError(e.message)); }}/><button className="btn-ghost" onClick={() => { try { resetDemoStaffCalls(); setError(null); } catch { setError('Could not reset sample calls.'); } }}>Reset sample calls</button></main>;
}
