import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { OrderingDemo } from "./OrderingDemo";
import { Kot, TicketRail } from "./TicketRail";
import { RevealOnScroll } from "./RevealOnScroll";
import { Brand } from "@/components/Brand";
import "./landing.css";

export const metadata = {
  title: "Tabletap — QR ordering for restaurants",
  description: "Guests scan the table QR, order from their phone and pay by UPI. Your kitchen gets the ticket instantly. Free for 14 days.",
};

const dishes = [
  { name: "Paneer tikka bowl", price: "₹240", img: "/images/menu/paneer.jpg", qty: 2 },
  { name: "Butter chicken", price: "₹320", img: "/images/menu/curry.jpg", qty: 0 },
  { name: "Lemon iced tea", price: "₹90", img: "/images/menu/tea.jpg", qty: 1 },
];

function Phone() {
  return (
    <div className="phone" aria-hidden="true">
      <div className="phone-head"><b>The Green Table</b><span>Table 7</span></div>
      {dishes.map((d) => (
        <div className="phone-dish" key={d.name}>
          <Image src={d.img} alt="" width={96} height={96} />
          <div><b>{d.name}</b><span>{d.price}</span></div>
          <span className={d.qty ? "phone-qty" : "phone-add"}>{d.qty ? `− ${d.qty} +` : "Add"}</span>
        </div>
      ))}
      <div className="phone-cart"><span>3 items, ₹570</span><b>Place order</b></div>
    </div>
  );
}

/** Acrylic table stand. The QR is real: it opens the live demo menu. */
function Stand({ qr }: { qr: string }) {
  return (
    <div className="stand" aria-hidden="true">
      <p>Scan to order</p>
      <div className="stand-qr" dangerouslySetInnerHTML={{ __html: qr }} />
      <b>Table 7</b>
    </div>
  );
}

const bill: [string, string][] = [
  ["QR code for every table", "incl."],
  ["Menu with photos, edit anytime", "incl."],
  ["Live kitchen tickets with sound", "incl."],
  ["UPI and cash payments", "incl."],
  ["Call staff button for guests", "incl."],
  ["Order tracking for guests", "incl."],
  ["Staff roles and PINs", "incl."],
];

const questions = [
  ["Do guests need to download an app?", "No. The QR opens your menu in the phone’s browser."],
  ["Can I change the menu after printing QR codes?", "Yes. Edit dishes, prices and sold-out items anytime. The QR codes stay the same."],
  ["How do payments work?", "Guests pay straight to your UPI ID from their order page, or in cash. Staff mark the order paid."],
  ["Can staff share one tablet?", "Yes. Each person unlocks it with their own PIN, and sees what their role allows."],
];

export default async function Home() {
  const demoUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/demo?table=7`;
  const qr = await QRCode.toString(demoUrl, { type: "svg", margin: 0, color: { dark: "#0B2A20", light: "#00000000" } });

  return (
    <div className="landing">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=IBM+Plex+Mono:wght@400;600&display=swap" precedence="default" />
      <RevealOnScroll />
      <a className="lp-skip" href="#main">Skip to content</a>

      <section className="hero">
        <header className="lp-top lp-wrap">
          <Link href="/" aria-label="Tabletap home"><Brand className="lp-brand" /></Link>
          <nav aria-label="Main navigation" className="lp-nav"><a href="#how">How it works</a><a href="#try">Try it</a><a href="#bill">What you get</a></nav>
          <div className="lp-nav-actions"><Link href="/login">Log in</Link><Link className="lp-cta lp-cta-sm" href="/signup">Start free</Link></div>
        </header>
        <div className="hero-copy lp-wrap" id="main">
          <h1>Every table orders itself.</h1>
          <div className="hero-sub">
            <p>Guests scan the QR on their table, order from their phone and pay by UPI. Your kitchen gets the ticket the moment they tap Place order.</p>
            <div className="hero-actions">
              <Link className="lp-cta" href="/signup">Start free trial</Link>
              <Link className="lp-line" href="/demo">Order as a guest</Link>
            </div>
            <p className="hero-fine">Free for 14 days. Guests don’t install anything.</p>
          </div>
        </div>
        <TicketRail />
      </section>

      <section id="how" className="how lp-wrap">
        <h2>Three taps from table to kitchen.</h2>
        <ol className="how-steps" data-reveal>
          <li>
            <div className="how-visual"><Stand qr={qr} /></div>
            <h3><span>1</span>Guest scans the table QR</h3>
            <p>Your menu opens in their browser with the table number already filled in.</p>
          </li>
          <li>
            <div className="how-visual"><Phone /></div>
            <h3><span>2</span>Orders from the phone</h3>
            <p>Photos, prices, a cooking note. No waving for a waiter.</p>
          </li>
          <li>
            <div className="how-visual how-visual-kot"><div className="rail-bar" /><ol className="rail-tickets"><Kot no={1049} order={{ table: "7", lines: [[2, "Paneer tikka bowl"], [1, "Lemon iced tea"]], note: "Less spicy" }} stamp="New" /></ol></div>
            <h3><span>3</span>Kitchen gets the ticket</h3>
            <p>It lands on the live board with a sound. The guest watches it go from cooking to served.</p>
          </li>
        </ol>
      </section>

      <section id="try" className="trysec">
        <div className="lp-wrap trysec-in">
          <div className="trysec-copy">
            <h2>Place an order. Watch the ticket.</h2>
            <p>This is the real flow, shrunk down. Add a bowl, send it, then run the kitchen.</p>
            <Link className="lp-line lp-line-dark" href="/demo/owner">Try the full owner demo</Link>
          </div>
          <OrderingDemo />
        </div>
      </section>

      <section id="bill" className="billsec lp-wrap">
        <div className="billsec-copy">
          <h2>Everything’s on the bill.</h2>
          <p>One plan with every feature. Set it up tonight, print your table QRs, and take your first order tomorrow.</p>
          <Link className="lp-cta" href="/signup">Start free trial</Link>
        </div>
        <div className="bill" role="table" aria-label="What’s included" data-reveal>
          <div className="bill-top"><b>tabletap</b><span>Restaurant plan</span></div>
          {bill.map(([item, price]) => <div className="bill-row" role="row" key={item}><span role="cell">{item}</span><i aria-hidden="true" /><span role="cell">{price}</span></div>)}
          <div className="bill-row bill-total" role="row"><span role="cell">First 14 days</span><i aria-hidden="true" /><span role="cell">₹0</span></div>
          <p className="bill-thanks">Thank you. Visit again.</p>
        </div>
      </section>

      <section className="faq lp-wrap">
        <h2>Questions owners ask</h2>
        <div>{questions.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>

      <section className="closer">
        <div className="lp-wrap closer-in">
          <h2>Put a QR on table one tonight.</h2>
          <Link className="lp-cta" href="/signup">Start free trial</Link>
        </div>
      </section>

      <footer className="lp-foot lp-wrap">
        <Brand className="lp-brand" />
        <nav aria-label="Footer navigation"><a href="#how">How it works</a><Link href="/demo">Guest demo</Link><Link href="/login">Log in</Link><Link href="/signup">Start free</Link></nav>
        <span>© {new Date().getFullYear()} Tabletap</span>
      </footer>
    </div>
  );
}
