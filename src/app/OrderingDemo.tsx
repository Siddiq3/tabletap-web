"use client";
import { useState } from "react";
export function OrderingDemo() {
  const [quantity, setQuantity] = useState(0);
  const [stage, setStage] = useState(0);
  const labels = ["New order", "Preparing", "Ready to serve", "Served"];
  return <div className="lp-demo-board">
    <div className="lp-demo-board-top"><strong>The Green Table</strong><span>Sample restaurant</span></div>
    <div className="lp-demo-columns"><div className="lp-demo-guest"><span className="lp-demo-side-label">Guest view · Table 07</span><h3>Something delicious?</h3><div className="lp-demo-item"><div><strong>Garden goodness bowl</strong><span>₹240 · Vegetarian</span></div><button className="tt-btn lp-demo-add" aria-label="Add garden goodness bowl" disabled={stage > 0} onClick={() => setQuantity(q => q + 1)}>+</button></div><div className="lp-demo-total"><span>{quantity} {quantity === 1 ? "bowl" : "bowls"}</span><strong>₹{quantity * 240}</strong></div><button className="tt-btn lp-button" disabled={quantity === 0 || stage > 0} onClick={() => setStage(1)}>{stage > 0 ? "Order sent ✓" : "Send to kitchen"}</button><p>Illustrative subtotal, before GST.</p></div>
    <div className="lp-demo-kitchen"><span className="lp-demo-side-label">Kitchen view</span>{stage === 0 ? <div className="lp-demo-empty"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M3 17h18M5 16a7 7 0 0 1 14 0M12 6V3m-2 0h4M7 21h10"/></svg><strong>Ready when they are.</strong><span>Add a bowl and send your first order.</span></div> : <div className="lp-demo-ticket" key={stage}><div><strong>Table 07</strong><span className="tt-badge lp-live-badge">{labels[stage - 1]}</span></div><p>{quantity} × Garden goodness bowl</p><span className="lp-demo-ticket-note">Freshly ordered, straight from the table.</span>{stage < 4 ? <button className="tt-btn lp-kitchen-action" onClick={() => setStage(s => s + 1)}>{["", "Start preparing", "Mark ready", "Mark served"][stage]}</button> : <strong className="lp-demo-served">All served. Enjoy the good company.</strong>}</div>}</div></div>
    <div className="lp-demo-board-bottom" aria-live="polite"><span>{stage === 0 ? "Try the flow, one tap at a time." : `Table 07: ${labels[stage - 1].toLowerCase()}.`}</span><button onClick={() => { setQuantity(0); setStage(0); }}>Reset demo</button></div>
  </div>;
}
