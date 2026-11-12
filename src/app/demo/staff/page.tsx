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
  return <div className="staff-demo"><main className="page narrow stack" style={{ maxWidth: 620, paddingTop: 36 }}><section className="zone"><h1>Staff alert demo</h1><p>Keep this tab open, then tap “Call staff” on the <Link href="/demo" target="_blank" rel="noreferrer">customer demo</Link>. The table appears here.</p><StaffCallSound calls={calls}/><StaffCallList calls={calls} error={error} onResolve={id => { void resolveDemoStaffCall(id).catch(e => setError(e.message)); }}/></section><button className="btn-ghost" onClick={() => { try { resetDemoStaffCalls(); setError(null); } catch { setError('Could not reset sample calls.'); } }}>Reset sample calls</button></main></div>;
}
