import Link from "next/link";

export default function Home() {
  return (
    <main className="page narrow stack" style={{ paddingTop: 64 }}>
      <h1 style={{ fontSize: 40 }}>Tabletap</h1>
      <p className="muted" style={{ fontSize: 18, margin: 0 }}>
        QR ordering for restaurants. Guests scan, order and pay from the table. Your kitchen sees every order live.
      </p>
      <Link className="btn" href="/login">Start 14-day free trial</Link>
      <Link className="btn-ghost" style={{ textAlign: "center" }} href="/login">Restaurant login</Link>
    </main>
  );
}
