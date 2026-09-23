import { useId, useMemo, useRef, useState } from "react";
import type { PricePoint } from "../lib/mock";
import { formatUsd } from "../lib/mock";
import styles from "./PriceChart.module.css";

interface PriceChartProps {
  history: PricePoint[];
  rangeLabel: string;
  positive: boolean;
}

const WIDTH = 320;
const HEIGHT = 160;
const PADDING_Y = 12;

function formatTimestamp(timestamp: number, rangeLabel: string): string {
  const date = new Date(timestamp);
  if (rangeLabel === "1D") {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (rangeLabel === "1Y") {
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Single-series line/area price chart. Test data only — see `lib/mock.ts`. */
export function PriceChart({ history, rangeLabel, positive }: PriceChartProps) {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const seriesColor = positive ? "var(--color-success)" : "var(--color-danger)";

  const { linePath, areaPath, points, minPrice, maxPrice } = useMemo(() => {
    const prices = history.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || 1;
    const usableHeight = HEIGHT - PADDING_Y * 2;

    const pts = history.map((point, i) => {
      const x = (i / (history.length - 1 || 1)) * WIDTH;
      const y = PADDING_Y + usableHeight - ((point.price - min) / span) * usableHeight;
      return { x, y, point };
    });

    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
    const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

    return { linePath: line, areaPath: area, points: pts, minPrice: min, maxPrice: max };
  }, [history]);

  function handlePointerMove(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const index = Math.round(ratio * (points.length - 1));
    setHoverIndex(index);
  }

  const hovered = hoverIndex !== null ? (points[hoverIndex] ?? null) : null;
  const lastPoint = points[points.length - 1] ?? null;

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${rangeLabel} price chart, ranging from ${formatUsd(minPrice)} to ${formatUsd(maxPrice)}`}
        onPointerMove={(e) => handlePointerMove(e.clientX)}
        onPointerLeave={() => setHoverIndex(null)}
        onPointerDown={(e) => handlePointerMove(e.clientX)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={seriesColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={seriesColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={WIDTH}
            y1={PADDING_Y + (HEIGHT - PADDING_Y * 2) * f}
            y2={PADDING_Y + (HEIGHT - PADDING_Y * 2) * f}
            className={styles.gridline}
          />
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={seriesColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {lastPoint && (
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={4}
            fill={seriesColor}
            stroke="var(--color-surface)"
            strokeWidth={2}
          />
        )}

        {hovered && (
          <g>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PADDING_Y}
              y2={HEIGHT - PADDING_Y}
              className={styles.crosshair}
            />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill={seriesColor} stroke="var(--color-surface)" strokeWidth={2} />
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className={styles.tooltip}
          style={{ left: `${(hovered.x / WIDTH) * 100}%` }}
        >
          <span className={styles.tooltipValue}>{formatUsd(hovered.point.price)}</span>
          <span className={styles.tooltipDate}>{formatTimestamp(hovered.point.timestamp, rangeLabel)}</span>
        </div>
      )}

      <table className="visually-hidden">
        <caption>{rangeLabel} price history</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Price</th>
          </tr>
        </thead>
        <tbody>
          {history.map((point) => (
            <tr key={point.timestamp}>
              <td>{formatTimestamp(point.timestamp, rangeLabel)}</td>
              <td>{formatUsd(point.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
