'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';
import { BOARD_STAGES, NEXT_STATUS, STATUS_LABEL, formatINR, isValidUpiId, isValidUsername, rupeesToPaise, slugify } from '@/contract';
import { DemoStaffManager } from './DemoStaffManager';
import { SAMPLE_MENU } from '@/lib/demo-fixtures';
import { changeDemoOrder, clearDemoWorkspace, saveDemoWorkspace, useDemoWorkspace } from '@/lib/demo-workspace';
import { resetDemoStaffCalls, resolveDemoStaffCall, useDemoStaffCalls } from '@/lib/demo-calls';
import { StaffCallList } from '@/components/StaffCalls';
import { StaffCallSound } from '@/components/StaffCallSound';

const PROFILE = 'tabletap.owner-demo.profile.v1';
const SESSION = 'tabletap.owner-demo.session.v1';
type Profile = { name: string; username: string; email: string; verified: boolean };
type Stage = 'account' | 'login' | 'verify' | 'setup' | 'dashboard';
type Tab = 'Menu' | 'Tables' | 'Orders' | 'Staff' | 'Staff calls';

export function OwnerDemo() {
  const workspace = useDemoWorkspace();
  const calls = useDemoStaffCalls();
  const [stage, setStage] = useState<Stage>('account');
  const [profile, setProfile] = useState<Profile>({ name: 'Demo Owner', username: 'demo_owner', email: 'owner@example.test', verified: false });
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [tables, setTables] = useState('5');
  const [upi, setUpi] = useState('');
  const [tab, setTab] = useState<Tab>('Menu');
  const [dish, setDish] = useState({ name: '', price: '', categoryId: '', description: '', isVeg: true });
  const [categoryName, setCategoryName] = useState('');
  const [table, setTable] = useState('1');
  const [qr, setQr] = useState('');
  const [origin, setOrigin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      const stored = JSON.parse(localStorage.getItem(PROFILE) ?? 'null') as Profile | null;
      if (stored && typeof stored.email === 'string') { setProfile(stored); setStage(sessionStorage.getItem(SESSION) === 'on' ? stored.verified ? localStorage.getItem('tabletap.owner-demo.workspace.v1') ? 'dashboard' : 'setup' : 'verify' : 'login'); }
    } catch { setError('Browser storage is unavailable. Enable it to run the owner demo.'); }
    setReady(true);
  }, []);
  useEffect(() => { if (!origin) return; let active = true; void QRCode.toDataURL(`${origin}/demo?table=${table}`, { margin: 2, width: 260 }).then(value => { if (active) setQr(value); }).catch(() => { if (active) setError('Could not generate the sample QR. Use the table link instead.'); }); return () => { active = false; }; }, [origin, table]);
  function attempt(action: () => void) { setError(null); try { action(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save the sample data.'); } }
  function createAccount(e: FormEvent) {
    e.preventDefault(); attempt(() => {
      if (!profile.name.trim() || !isValidUsername(profile.username.trim())) throw new Error('Enter a name and a valid username (3–30 letters, numbers, dots or underscores).');
      const saved = { ...profile, name: profile.name.trim(), username: profile.username.trim(), verified: false };
      localStorage.setItem(PROFILE, JSON.stringify(saved)); sessionStorage.setItem(SESSION, 'on'); setProfile(saved); setStage('verify');
    });
  }
  function verify(e: FormEvent) { e.preventDefault(); attempt(() => { if (code !== '123456') throw new Error('For this demo, enter 123456.'); const saved = { ...profile, verified: true }; localStorage.setItem(PROFILE, JSON.stringify(saved)); setProfile(saved); setStage('setup'); }); }
  function setup(e: FormEvent) {
    e.preventDefault(); attempt(() => {
      const count = Number(tables);
      if (restaurantName.trim().length < 2 || restaurantName.trim().length > 80 || slugify(restaurantName).length < 3) throw new Error('Enter a restaurant name with at least 3 letters.');
      if (!Number.isInteger(count) || count < 1 || count > 200) throw new Error('Choose between 1 and 200 tables.');
      if (upi.trim() && !isValidUpiId(upi.trim())) throw new Error('Use a UPI ID like restaurant@okaxis, or leave it empty.');
      saveDemoWorkspace({ restaurant: { name: restaurantName.trim(), slug: slugify(restaurantName), address: 'Your sample restaurant', taxPercent: 5, upiId: null }, tableCount: count, menu: { categories: [], items: [] }, orders: [], staff: [], demoUpiId: upi.trim() }); resetDemoStaffCalls(); setStage('dashboard'); setTab('Menu');
    });
  }
  function restart() { attempt(() => { clearDemoWorkspace(); resetDemoStaffCalls(); localStorage.removeItem(PROFILE); sessionStorage.removeItem(SESSION); sessionStorage.removeItem('tabletap.guest-demo.v1'); setProfile({ name: 'Demo Owner', username: 'demo_owner', email: 'owner@example.test', verified: false }); setRestaurantName(''); setCode(''); setPassword(''); setStage('account'); }); }
  const guestLink = `/demo?table=${table}`;
  if (!ready) return <main className="page narrow">Opening the owner demo…</main>;
  return <main className="owner-demo page"><header className="od-header"><Link className="od-brand" href="/">tabletap.</Link><span>Owner demo · Sample data only</span><button className="btn-ghost" onClick={restart}>Restart owner demo</button></header>
    <p className="od-notice">This is a local walkthrough. No real account, email, order, or payment is created. Use sample details; the fixed demo password is <strong>tabletap123</strong>. Tabs sync in this browser.</p>
    {error && <p className="error" role="alert">{error}</p>}
    {stage !== 'dashboard' && <ol className="od-progress" aria-label="Setup progress">{['Create account', 'Verify email', 'Set up restaurant', 'Run your restaurant'].map((label, i) => <li key={label} aria-current={i === (stage === 'account' || stage === 'login' ? 0 : stage === 'verify' ? 1 : 2) ? 'step' : undefined}>{i + 1}. {label}</li>)}</ol>}
    {stage === 'account' && <section className="od-form"><h1>Create your owner account</h1><p className="muted">Start here, then verify your sample email and set up your restaurant.</p><form className="card stack" onSubmit={createAccount}><label className="field"><span>Full name</span><input required maxLength={80} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}/></label><label className="field"><span>Username</span><input required maxLength={30} value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value.toLowerCase() }))}/></label><label className="field"><span>Sample email</span><input required type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}/></label><label className="field"><span>Demo password</span><input type="text" readOnly value="tabletap123"/><small>Fixed for this walkthrough. Don’t enter a real password.</small></label><button className="btn">Create demo account</button></form></section>}
    {stage === 'login' && <section className="od-form"><h1>Welcome back, {profile.name}.</h1><form className="card stack" onSubmit={e => { e.preventDefault(); attempt(() => { if (password !== 'tabletap123') throw new Error('Use the demo password tabletap123.'); sessionStorage.setItem(SESSION, 'on'); setStage(!profile.verified ? 'verify' : workspace ? 'dashboard' : 'setup'); }); }}><p className="muted">Sample account: {profile.email}</p><label className="field"><span>Demo password</span><input type="password" required value={password} onChange={e => setPassword(e.target.value)}/></label><button className="btn">Log in to demo</button></form></section>}
    {stage === 'verify' && <section className="od-form"><h1>Verify your sample email</h1><p className="muted">For {profile.email}. No email is sent; enter <strong>123456</strong>.</p><form className="card stack" onSubmit={verify}><label className="field"><span>Verification code</span><input required inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}/></label><button className="btn">Verify demo email</button></form></section>}
    {stage === 'setup' && <section className="od-form"><h1>Set up your restaurant</h1><form className="card stack" onSubmit={setup}><label className="field"><span>Restaurant name</span><input required maxLength={80} placeholder="Spice Route Kitchen" value={restaurantName} onChange={e => setRestaurantName(e.target.value)}/></label><p className="muted small">Menu slug: {slugify(restaurantName) || 'your-restaurant'}</p><label className="field"><span>Number of tables</span><input required type="number" min={1} max={200} value={tables} onChange={e => setTables(e.target.value)}/></label><label className="field"><span>Sample UPI ID (optional)</span><input value={upi} onChange={e => setUpi(e.target.value)} placeholder="restaurant@okaxis"/><small>Saved for this preview only. No payment links will be activated.</small></label><button className="btn">Create demo restaurant</button></form></section>}
    {stage === 'dashboard' && workspace && <><div className="od-dashboard-head"><div><h1>{workspace.restaurant.name}</h1><p className="muted">{profile.name} · Owner · {workspace.tableCount} tables</p></div><div className="row"><Link className="btn" href={guestLink} target="_blank" rel="noreferrer">Open guest menu</Link><button className="btn-ghost" onClick={() => { sessionStorage.removeItem(SESSION); setPassword(''); setStage('login'); }}>Log out</button></div></div><nav className="od-tabs" aria-label="Owner dashboard">{(['Menu', 'Tables', 'Orders', 'Staff', 'Staff calls'] as Tab[]).map(value => <button key={value} aria-pressed={tab === value} className={tab === value ? 'btn' : 'btn-ghost'} onClick={() => { setTab(value); setError(null); }}>{value}{value === 'Orders' ? ` (${workspace.orders.length})` : value === 'Staff calls' ? ` (${calls.length})` : ''}</button>)}</nav>
      {tab === 'Menu' && <div className="od-menu-layout"><section className="stack"><h2>Build your menu</h2><p className="muted">Add your first category and dish, or load the sample dishes to get going.</p><button className="btn-ghost" onClick={() => attempt(() => saveDemoWorkspace({ ...workspace, menu: { categories: SAMPLE_MENU.categories, items: SAMPLE_MENU.items } }))}>Load sample menu</button><form className="card stack" onSubmit={e => { e.preventDefault(); attempt(() => { if (!categoryName.trim()) throw new Error('Enter a category name.'); saveDemoWorkspace({ ...workspace, menu: { ...workspace.menu, categories: [...workspace.menu.categories, { id: `category-${Date.now()}`, name: categoryName.trim(), sortOrder: workspace.menu.categories.length }] } }); setCategoryName(''); }); }}><h3>Add a category</h3><label className="field"><span>Category name</span><input required maxLength={40} value={categoryName} onChange={e => setCategoryName(e.target.value)}/></label><button className="btn">Add category</button></form><form className="card stack" onSubmit={e => { e.preventDefault(); attempt(() => { const pricePaise = rupeesToPaise(dish.price); if (!dish.name.trim() || pricePaise === null) throw new Error('Enter a dish name and valid price.'); saveDemoWorkspace({ ...workspace, menu: { ...workspace.menu, items: [...workspace.menu.items, { id: `dish-${Date.now()}`, name: dish.name.trim(), pricePaise, categoryId: dish.categoryId || null, description: dish.description.trim() || null, isVeg: dish.isVeg, isAvailable: true, imageUrl: null }] } }); setDish({ name: '', price: '', categoryId: '', description: '', isVeg: true }); }); }}><h3>Add a dish</h3><label className="field"><span>Dish name</span><input required maxLength={80} value={dish.name} onChange={e => setDish(d => ({ ...d, name: e.target.value }))}/></label><label className="field"><span>Price (₹)</span><input required inputMode="decimal" value={dish.price} onChange={e => setDish(d => ({ ...d, price: e.target.value }))}/></label><label className="field"><span>Category</span><select aria-label="Dish category" value={dish.categoryId} onChange={e => setDish(d => ({ ...d, categoryId: e.target.value }))}><option value="">No category</option>{workspace.menu.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="field"><span>Description</span><input maxLength={200} value={dish.description} onChange={e => setDish(d => ({ ...d, description: e.target.value }))}/></label><label><input type="checkbox" checked={dish.isVeg} onChange={e => setDish(d => ({ ...d, isVeg: e.target.checked }))}/> Vegetarian</label><button className="btn">Add dish</button></form></section><section className="stack"><h2>Your dishes ({workspace.menu.items.length})</h2>{!workspace.menu.items.length && <p className="empty">Add a dish or load the sample menu to see it here.</p>}{workspace.menu.items.map(item => <article className="od-menu-row" key={item.id}><div><strong>{item.name}</strong><p className="muted small">{formatINR(item.pricePaise)} · {item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}</p></div><button className="btn-sm" aria-label={`${item.isAvailable ? 'Mark sold out' : 'Make available'}: ${item.name}`} onClick={() => attempt(() => saveDemoWorkspace({ ...workspace, menu: { ...workspace.menu, items: workspace.menu.items.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i) } }))}>{item.isAvailable ? 'Mark sold out' : 'Make available'}</button></article>)}</section></div>}
      {tab === 'Tables' && <section className="od-form"><h2>Try a table QR</h2><p className="muted">Open or scan this QR to start the customer view at the selected table.</p><label className="field"><span>Choose table</span><select aria-label="Choose table" value={table} onChange={e => setTable(e.target.value)}>{Array.from({ length: workspace.tableCount }, (_, i) => <option key={i} value={String(i + 1)}>Table {i + 1}</option>)}</select></label><div className="od-qr card">{qr && <img src={qr} alt={`Demo menu QR for table ${table}`} width={260} height={260}/>}<h3>Table {table}</h3><Link href={guestLink} target="_blank" rel="noreferrer">Open table {table} guest menu</Link></div><p className="muted small">Order and menu sync in tabs of this browser. The local demo does not share data between different phones or the Expo app.</p></section>}
      {tab === 'Orders' && <section><h2>Your orders</h2><p className="muted">Keep this tab open and place an order in the guest tab. Move it through each stage here.</p>{!workspace.orders.length && <p className="empty">No orders yet. Open the guest menu and place your first sample order.</p>}<div className="od-orders">{BOARD_STAGES.map(status => <section className="col" key={status}><h3>{STATUS_LABEL[status]}</h3>{workspace.orders.filter(order => order.status === status).map(order => <article className="ticket" key={order.id}><strong>Table {order.tableLabel} · #{order.orderNo}</strong>{order.lines.map((line, i) => <span key={i}>{line.qty} × {line.name}</span>)}{order.note && <p className="t-note">{order.note}</p>}<strong>{formatINR(order.totalPaise)}</strong><span>{order.paymentStatus === 'paid' ? `Paid ${order.paymentMethod}` : 'Payment due'}</span>{order.paymentStatus !== 'paid' && <div className="row"><button className="btn-sm" onClick={() => attempt(() => changeDemoOrder(order.id, { paymentStatus: 'paid', paymentMethod: 'cash' }))}>Mark cash paid</button><button className="btn-sm" onClick={() => attempt(() => changeDemoOrder(order.id, { paymentStatus: 'paid', paymentMethod: 'upi' }))}>Mark UPI paid</button></div>}{NEXT_STATUS[order.status] && <button className="btn" onClick={() => attempt(() => changeDemoOrder(order.id, { status: NEXT_STATUS[order.status]!.to }))}>{NEXT_STATUS[order.status]!.action}</button>}</article>)}</section>)}</div></section>}
      {tab === 'Staff' && <DemoStaffManager staff={workspace.staff}/>}
      {tab === 'Staff calls' && <section className="stack"><h2>Guest assistance</h2><StaffCallSound calls={calls}/><StaffCallList calls={calls} error={error} onResolve={id => { void resolveDemoStaffCall(id).catch(e => setError(e.message)); }}/></section>}
    </>}
  </main>;
}
