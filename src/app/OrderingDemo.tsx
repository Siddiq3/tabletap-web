"use client";
import { useState } from "react";
import { Kot } from "./TicketRail";

const STAGES = ["New", "Cooking", "Ready", "Served"];
const ACTION = ["Start cooking", "Mark ready", "Mark served"];

/** Try-it block: the guest adds bowls, sends the order, and the kitchen ticket moves through each stage. */
export function OrderingDemo() {
  const [qty, setQty] = useState(1);
  const [stage, setStage] = useState(-1); // -1 = not sent yet
  const sent = stage >= 0;
  return (
    <div className="try">
      <div className="try-guest">
        <p className="try-side">Guest phone, table 7</p>
        <div className="try-dish">
          <div><b>Paneer tikka bowl</b><span>₹240</span></div>
          <div className="try-qty">
            <button aria-label="Remove one bowl" disabled={sent || qty === 0} onClick={() => setQty((q) => q - 1)}>−</button>
            <span aria-live="polite">{qty}</span>
            <button aria-label="Add one bowl" disabled={sent || qty >= 9} onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
        </div>
        <div className="try-total"><span>Total before GST</span><b>₹{qty * 240}</b></div>
        <button className="lp-cta" disabled={qty === 0 || sent} onClick={() => setStage(0)}>{sent ? "Order sent" : "Place order"}</button>
      </div>
      <div className="try-kitchen">
        <p className="try-side">Kitchen</p>
        <div className="rail-bar" />
        {sent ? (
          <ol className="rail-tickets try-ticket"><Kot key={stage} no={1049} order={{ table: "7", lines: [[qty, "Paneer tikka bowl"]] }} stamp={STAGES[stage]} fresh={stage === 0} /></ol>
        ) : (
          <p className="try-wait">The ticket prints here when the guest places the order.</p>
        )}
        <div className="try-actions" aria-live="polite">
          {sent && stage < 3 && <button className="lp-cta lp-cta-dark" onClick={() => setStage((s) => s + 1)}>{ACTION[stage]}</button>}
          {stage === 3 && <span>Served. The guest saw every step on their phone.</span>}
          {sent && <button className="try-reset" onClick={() => { setStage(-1); setQty(1); }}>Start over</button>}
        </div>
      </div>
    </div>
  );
}
