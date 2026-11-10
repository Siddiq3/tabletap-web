'use client';
import { useState, type FormEvent } from 'react';
import { isValidPin, type StaffRole } from '@/contract';
import { readDemoWorkspace, saveDemoWorkspace, type DemoStaff } from '@/lib/demo-workspace';

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'waiter', label: 'Waiter' }, { value: 'kitchen', label: 'Kitchen' },
  { value: 'cashier', label: 'Cashier' }, { value: 'manager', label: 'Manager' },
];
const pinProps = { type: 'password', inputMode: 'numeric', autoComplete: 'off', minLength: 4, maxLength: 6, pattern: '[0-9]{4,6}' } as const;

export function DemoStaffManager({ staff }: { staff: DemoStaff[] }) {
  const [form, setForm] = useState<{ name: string; role: StaffRole; pin: string }>({ name: '', role: 'waiter', pin: '' });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ name: string; role: StaffRole }>({ name: '', role: 'waiter' });
  const [pinFor, setPinFor] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [testStaffId, setTestStaffId] = useState('');
  const [testPin, setTestPin] = useState('');
  const [pinResult, setPinResult] = useState<string | null>(null);

  function update(change: (rows: DemoStaff[]) => DemoStaff[], message: string): boolean {
    setError(null); setNotice(null); setPinResult(null);
    try {
      const current = readDemoWorkspace();
      if (!current) throw new Error('Set up your sample restaurant first.');
      saveDemoWorkspace({ ...current, staff: change(current.staff) });
      setNotice(message); return true;
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save your sample staff.'); return false; }
  }
  function add(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length > 40) return setError('Staff name must be 1 to 40 characters.');
    if (!isValidPin(form.pin)) return setError('PIN must be 4 to 6 digits.');
    const person: DemoStaff = { id: globalThis.crypto?.randomUUID?.() ?? `demo-staff-${Date.now()}`, name: form.name.trim(), role: form.role, isActive: true, demoPin: form.pin };
    if (update(rows => [...rows, person], `${person.name} added as ${person.role}.`)) { setForm({ name: '', role: form.role, pin: '' }); setTestStaffId(person.id); setTestPin(''); }
  }
  function test(e: FormEvent) {
    e.preventDefault();
    const person = readDemoWorkspace()?.staff.find(s => s.id === testStaffId);
    if (!person?.isActive) return setPinResult('Choose an active staff member.');
    if (person.demoPin !== testPin) return setPinResult('Incorrect demo PIN. Please try again.');
    setPinResult(`PIN accepted for ${person.name} · ${person.role}.`);
    setTestPin('');
  }
  return <section className="stack">
    <div><h2>Your team</h2><p className="muted">Add staff with a role and PIN. They don’t need an email or a separate owner account.</p></div>
    <p className="od-notice" style={{ margin: 0 }}>Use sample PINs only. This demo stores them in your browser so you can test changes; it does not create staff in the Expo preview or a live restaurant.</p>
    {error && <p className="error" role="alert">{error}</p>}{notice && <p role="status" style={{ color: 'var(--good)', fontWeight: 600 }}>{notice}</p>}
    <div className="od-menu-layout">
      <div className="stack">
        <form className="card stack" onSubmit={add}><h3>Add staff</h3><label className="field"><span>Staff name</span><input required maxLength={40} value={form.name} placeholder="Meera" onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/></label><label className="field"><span>Role</span><select aria-label="Staff role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as StaffRole }))}>{ROLES.map(role => <option value={role.value} key={role.value}>{role.label}</option>)}</select></label><label className="field"><span>Demo PIN (4–6 digits)</span><input {...pinProps} required value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}/></label><button className="btn">Add staff</button></form>
        {staff.some(s => s.isActive) && <form className="card stack" onSubmit={test}><h3>Test a staff PIN</h3><p className="muted small">Check a sample PIN here. This validates the PIN without changing your owner role.</p><label className="field"><span>Staff member</span><select aria-label="Staff member to test" required value={testStaffId} onChange={e => { setTestStaffId(e.target.value); setPinResult(null); setTestPin(''); }}><option value="">Choose staff</option>{staff.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name} · {s.role}</option>)}</select></label><label className="field"><span>PIN to test</span><input {...pinProps} required value={testPin} onChange={e => setTestPin(e.target.value.replace(/\D/g, ''))}/></label><button className="btn-ghost">Check PIN</button>{pinResult && <p role="status">{pinResult}</p>}</form>}
      </div>
      <div className="stack" style={{ alignContent: 'start' }}><h3>Staff ({staff.length})</h3>{!staff.length && <p className="empty">No staff yet. Add your waiters, kitchen, cashier, or manager.</p>}{staff.map(person => <article key={person.id} className="card stack" aria-label={`Staff record for ${person.name}`}><div className="row"><div><strong>{person.name}</strong><p className="muted small" style={{ margin: '5px 0 0' }}>{ROLES.find(r => r.value === person.role)?.label} · {person.isActive ? 'Active' : 'Deactivated'}</p></div></div><div className="row" style={{ justifyContent: 'flex-start', gap: 8 }}><button className="btn-sm" onClick={() => { setEditId(editId === person.id ? null : person.id); setEdit({ name: person.name, role: person.role }); setPinFor(null); }}>Edit staff</button>{person.isActive && <button className="btn-sm" onClick={() => { setPinFor(pinFor === person.id ? null : person.id); setNewPin(''); setEditId(null); }}>Reset PIN</button>}<button className="btn-sm" onClick={() => { if (update(rows => rows.map(s => s.id === person.id ? { ...s, isActive: !s.isActive } : s), `${person.name} ${person.isActive ? 'deactivated' : 'reactivated'}.`)) { setPinFor(null); setEditId(null); setTestPin(''); if (person.isActive && testStaffId === person.id) setTestStaffId(''); } }}>{person.isActive ? 'Deactivate' : 'Reactivate'}</button></div>
        {editId === person.id && <form className="stack" onSubmit={e => { e.preventDefault(); if (!edit.name.trim()) return setError('Enter a staff name.'); if (update(rows => rows.map(s => s.id === person.id ? { ...s, name: edit.name.trim(), role: edit.role } : s), 'Staff details updated.')) setEditId(null); }}><label className="field"><span>Edit staff name</span><input required maxLength={40} value={edit.name} onChange={e => setEdit(v => ({ ...v, name: e.target.value }))}/></label><label className="field"><span>Edit role</span><select aria-label={`Edit role for ${person.name}`} value={edit.role} onChange={e => setEdit(v => ({ ...v, role: e.target.value as StaffRole }))}>{ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label><button className="btn-sm btn-dark">Save staff changes</button></form>}
        {pinFor === person.id && <form className="stack" onSubmit={e => { e.preventDefault(); if (!isValidPin(newPin)) return setError('PIN must be 4 to 6 digits.'); if (update(rows => rows.map(s => s.id === person.id ? { ...s, demoPin: newPin } : s), `New demo PIN set for ${person.name}.`)) { setPinFor(null); setNewPin(''); setTestPin(''); } }}><label className="field"><span>New demo PIN for {person.name}</span><input {...pinProps} required value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}/></label><button className="btn-sm btn-dark">Save PIN</button></form>}
      </article>)}</div>
    </div>
  </section>;
}
