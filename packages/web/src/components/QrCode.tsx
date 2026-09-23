import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value, size = 220 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: "#0d0d12", light: "#f4f4f8" } })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return <div style={{ width: size, height: size, borderRadius: "var(--radius-md)", background: "var(--color-surface-raised)" }} />;
  }

  return (
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt="Address QR code"
      style={{ borderRadius: "var(--radius-md)", background: "var(--color-text)" }}
    />
  );
}
