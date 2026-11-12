import Link from "next/link";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`brand ${className}`}>
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="10" fill="currentColor" />
        <path d="M9 12h14M16 8v13c0 3 4 3 5 1" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="10" cy="21" r="2" fill="white" />
      </svg>
      tabletap<span className="brand-dot">.</span>
    </span>
  );
}

/** Logo on top, title, then the form: shared by login, signup, verify, onboarding and reset. */
export function AuthShell({ title, sub, children, foot }: { title: string; sub?: React.ReactNode; children: React.ReactNode; foot?: React.ReactNode }) {
  return (
    <main className="auth">
      <aside className="auth-side">
        <Link href="/" aria-label="Tabletap home" style={{ textDecoration: "none" }}><Brand /></Link>
        <p className="auth-line">Every table orders itself.</p>
      </aside>
      <div className="auth-box">
        <div className="auth-title"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
        {children}
        {foot && <div className="auth-foot">{foot}</div>}
      </div>
    </main>
  );
}
