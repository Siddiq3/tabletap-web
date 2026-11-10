import Link from "next/link";
import Image from "next/image";
import { OrderingDemo } from "./OrderingDemo";
import "./landing.css";

export const metadata = {
  title: "Tabletap — Good food. Effortless service.",
  description: "Let guests scan, order and pay while your team keeps every order moving. Try Tabletap free for 14 days.",
};

function Arrow() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}
function Brand() {
  return <span className="lp-brand"><svg width="31" height="31" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect width="32" height="32" rx="10" fill="currentColor"/><path d="M9 12h14M16 8v13c0 3 4 3 5 1" stroke="white" strokeWidth="2.8" strokeLinecap="round"/><circle cx="10" cy="21" r="2" fill="white"/></svg>tabletap<span className="lp-brand-dot">.</span></span>;
}
const questions = [
  ["Do my guests need to download an app?", "No. Guests scan the table’s QR code and your menu opens in their phone’s browser. They can browse, add dishes, and place their order right there."],
  ["Can I change my menu after printing the QR codes?", "Yes. Update dishes, prices, categories, and availability from your dashboard. Your table QR codes stay the same."],
  ["How do payments work?", "Add your restaurant’s UPI ID during setup. Guests can open their UPI app from the order page, and your team can mark UPI or cash payments as paid."],
  ["Can my staff use a shared device?", "Yes. Add your team with their roles and PINs. On a shared device, each staff member can unlock their own session, with access based on their role."],
];

export default function Home() {
  return <div className="landing" data-theme="light">
    <a className="lp-skip" href="#main">Skip to content</a>
    <header className="lp-header lp-wrap">
      <Link href="/" aria-label="Tabletap home"><Brand /></Link>
      <nav aria-label="Main navigation" className="lp-nav"><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#trial">Free trial</a></nav>
      <div className="lp-nav-actions"><Link className="lp-login" href="/login">Log in</Link><Link className="tt-btn lp-button lp-button-small" href="/signup">Get started <Arrow /></Link></div>
    </header>
    <main id="main">
      <section className="lp-hero lp-wrap">
        <div className="lp-hero-copy">
          <h1>Good food.<br />Great company.<br /><span>Effortless service.</span></h1>
          <p>Less running between tables. More time for your guests. Bring your menu, orders, and payments together with one simple scan.</p>
          <div className="lp-hero-actions"><Link className="tt-btn lp-button" href="/signup">Start your free trial <Arrow /></Link><a className="lp-demo-link" href="#demo"><span className="lp-play"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="m4 2 6 4-6 4Z" fill="currentColor"/></svg></span>See it in action</a></div>
          <div className="lp-trial-note"><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>14 days to make yourself at home</div>
        </div>
        <div className="lp-hero-scene" aria-label="An example guest menu and incoming kitchen order">
          <div className="lp-scene-backdrop"><Image className="lp-food-photo" src="/images/fresh-bowl.jpg" alt="Fresh, colourful bowls ready to be served" width={1000} height={1000} priority sizes="(max-width: 700px) 90vw, 45vw"/><span className="lp-photo-caption">Made for the way you serve.</span></div>
          <div className="lp-phone">
            <div className="lp-phone-speaker"/><div className="lp-phone-top"><span>12:30</span><span>Table 07</span></div>
            <div className="lp-menu-heading"><span>The Green Table</span><h2>A little fresh.<br />A lot of flavour.</h2><p>Good things, made to order.</p></div>
            <div className="lp-menu-tabs"><span>Favourites</span><span>Bowls</span><span>Drinks</span></div>
            <Image className="lp-menu-photo" src="/images/menu-bowl.jpg" alt="Garden bowl on the example menu" width={400} height={300}/>
            <div className="lp-menu-dish"><div><span className="lp-veg"/><h3>Garden goodness bowl</h3><p>Fresh greens, grains & all the good stuff.</p><strong>₹240</strong></div><span className="lp-add-preview">+ Add</span></div>
            <div className="lp-menu-cart"><span>1 item added</span><span>View order <Arrow /></span></div><span className="lp-preview-label">Example guest menu</span>
          </div>
          <div className="lp-order-toast"><span className="lp-order-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6m-6 4h6"/></svg></span><div><strong>A fresh order just landed</strong><span>Table 07 · Straight to your kitchen</span></div><span className="lp-toast-dot"/></div>
          <div className="lp-scene-tag"><span>Scan. Order. Enjoy.</span><svg width="39" height="30" viewBox="0 0 39 30" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 2c17-2 9 26 31 19m-8-5 9 5-7 7"/></svg></div>
        </div>
      </section>
      <div className="lp-benefit-bar"><div className="lp-wrap"><span>A smoother service,<br />from the first scan.</span><span>Guests order on their phones</span><i/><span>Orders go straight to the kitchen</span><i/><span>UPI & cash, your way</span></div></div>
      <section id="how-it-works" className="lp-section lp-wrap">
        <div className="lp-section-intro"><h2>A little scan.<br />A whole lot simpler.</h2><p>From “what looks good?” to “that was delicious.”<br />Keep every table moving, without the back-and-forth.</p></div>
        <div className="lp-steps">
          <article><span className="lp-step-number">01</span><h3>A seat. A scan.</h3><p>Put a QR code on each table. Your guests scan it to open your menu. No downloads, no fuss.</p><div className="lp-step-foot">Your menu, on their phone <Arrow /></div></article>
          <article><span className="lp-step-number">02</span><h3>Orders find their way.</h3><p>Guests pick their favourites and add a cooking note. Their order arrives on your live kitchen board.</p><div className="lp-step-foot">From the table to the team <Arrow /></div></article>
          <article><span className="lp-step-number">03</span><h3>Happy guests. All settled.</h3><p>Keep guests updated as you cook. They pay by UPI or cash, and your staff marks the bill paid.</p><div className="lp-step-foot">A good finish to a good meal <Arrow /></div></article>
        </div>
      </section>
      <section id="demo" className="lp-demo-section"><div className="lp-wrap lp-demo-layout"><div className="lp-demo-copy"><h2>One order.<br />Everyone in sync.</h2><p>Give it a try. Add a dish, send it to the kitchen, and see how your team keeps things moving.</p><span className="lp-demo-disclaimer">An interactive preview. No account needed.</span><Link className="lp-demo-link" style={{ display: "flex", marginTop: 18 }} href="/demo">Try the customer menu <Arrow /></Link></div><OrderingDemo /></div></section>
      <section id="features" className="lp-section lp-wrap"><div className="lp-section-intro"><h2>Your restaurant.<br />Your rhythm.</h2><p>Thoughtful tools for the everyday bustle.<br />From the first table to the last bill.</p></div>
        <div className="lp-feature-layout"><div className="lp-feature-visual"><div className="lp-availability-header"><span>Today’s menu</span><span className="tt-badge lp-live-badge">Live</span></div><h3>A menu that keeps<br />up with your kitchen.</h3><div className="lp-stock-row"><span>Garden goodness bowl<small>Bowls · ₹240</small></span><span>Available <i/></span></div><div className="lp-stock-row"><span>Classic cold coffee<small>Drinks · ₹120</small></span><span>Available <i/></span></div><div className="lp-stock-row lp-stock-off"><span>Chef’s special<small>Today’s favourites</small></span><span>Sold out <i/></span></div><p>Example menu · Changes appear for your guests.</p></div>
        <div className="lp-feature-list"><article><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 5h16M4 12h10M4 19h7m5-4 3-3 3 3m-3-3v9"/></svg><div><h3>Fresh menu. Same QR.</h3><p>Change a price, add a special, or mark a dish sold out. Your printed QR codes stay right where they are.</p></div></article><article><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6M2 21v-3a6 6 0 0 1 12 0v3m3-8a5 5 0 0 1 5 5v3"/></svg><div><h3>A place for everyone on your team.</h3><p>Owners, managers, kitchen, and floor staff. Give each person their own role and a PIN for shared devices.</p></div></article><article><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18m-13 5h4"/></svg><div><h3>Payments that feel familiar.</h3><p>Guests pay straight to your restaurant’s UPI ID. Taking cash? Your staff can record that too.</p></div></article></div></div>
      </section>
      <section id="trial" className="lp-wrap lp-trial"><div><h2>Let’s set your<br />tables up for better.</h2><p>Your menu. Your team. A calmer kind of service.<br />Try Tabletap free for 14 days.</p><Link className="tt-btn lp-button" href="/signup">Start your 14-day free trial <Arrow /></Link></div><div className="lp-trial-includes"><h3>Make it yours.</h3><ul>{["Your own digital menu", "Table QR codes, ready to print", "Live orders & guest tracking", "Staff roles & PIN access", "UPI and cash payment tracking"].map(item => <li key={item}><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>{item}</li>)}</ul></div></section>
      <section className="lp-section lp-wrap lp-faq"><h2>A few things<br />you might be wondering.</h2><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className="lp-footer lp-wrap"><div><Link href="/" aria-label="Tabletap home"><Brand /></Link><p>Good food deserves effortless service.</p></div><nav aria-label="Footer navigation"><a href="#how-it-works">How it works</a><Link href="/login">Restaurant login</Link><Link href="/signup">Get started</Link></nav><span>© {new Date().getFullYear()} Tabletap</span></footer>
  </div>;
}
