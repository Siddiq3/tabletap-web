"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { upiLink } from "@/contract";

/** note: what the payer sees in their UPI app (defaults to "Order N"). caption: line under the QR. */
type Props = { upiId: string; payeeName: string; totalPaise: number; orderNo?: number; note?: string; caption?: string; size?: number };

/** QR of the standard upi:// link, amount pre-filled from the order total the API returned. */
export function UpiQr({ upiId, payeeName, totalPaise, orderNo, note, caption = "After paying, show your payment screen to the staff.", size = 280 }: Props) {
  const label = note ?? `Order ${orderNo}`;
  const link = upiLink(upiId, payeeName, totalPaise, label);
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(link, { margin: 2, width: size * 2, errorCorrectionLevel: "M" })
      .then((d) => live && setImg(d))
      .catch(() => live && setImg(null));
    return () => { live = false; };
  }, [link, size]);

  return (
    <figure className="upi-qr">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} width={size} height={size} alt={`UPI QR code to pay ${label}`} />
      ) : (
        <div style={{ width: size, height: size }} aria-hidden />
      )}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
