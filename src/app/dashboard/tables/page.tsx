"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { api } from "@/lib/api-client";
import { useMember } from "../MemberContext";

type Card = { id: string; label: string; img: string };

export default function TablesPage() {
  const { restaurant } = useMember();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    api.tables()
      .then(({ slug, tables }) =>
        Promise.all(
          tables.filter((t) => t.isActive).map(async (t) => ({
            id: t.id,
            label: t.label,
            img: await QRCode.toDataURL(`${base}/r/${slug}?t=${t.id}`, { margin: 1, width: 320, errorCorrectionLevel: "M" }),
          })),
        ),
      )
      .then(setCards)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load tables."));
  }, []);

  if (!cards) return <p className="muted" style={{ marginTop: 16 }}>{error ?? "Making your QR codes…"}</p>;

  return (
    <div className="stack" style={{ marginTop: 16 }}>
      <div className="row no-print">
        <p className="muted" style={{ margin: 0 }}>
          One QR per table. Print and stick them on.
        </p>
        <button className="btn-ghost" onClick={() => window.print()}>Print QR sheet</button>
      </div>
      <div className="qr-grid">
        {cards.map((c) => (
          <div className="qr-card" key={c.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.img} alt={`QR code for table ${c.label}`} />
            <b>{c.label}</b>
            <span style={{ fontSize: 12 }}>Scan to order · {restaurant.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
