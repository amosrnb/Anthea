import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { isChainId, type ChainId } from "@anthea/wallet-core";
import { ScreenHeader } from "../components/ScreenHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { PriceChart } from "../components/PriceChart";
import { CHAIN_META } from "../lib/chains";
import { getMockAsset, getMockPriceHistory, priceChangePct, formatUsd, usdValue, PRICE_RANGES, type PriceRange } from "../lib/mock";
import styles from "./Token.module.css";

export function Token() {
  const { chainId: chainIdParam } = useParams();
  const navigate = useNavigate();
  const [range, setRange] = useState<PriceRange>("1D");

  const chainId: ChainId | null = chainIdParam && isChainId(chainIdParam) ? chainIdParam : null;
  const asset = chainId ? getMockAsset(chainId) : null;
  const meta = chainId ? CHAIN_META[chainId] : null;

  const history = useMemo(() => (chainId ? getMockPriceHistory(chainId, range) : []), [chainId, range]);
  const changePct = useMemo(() => priceChangePct(history), [history]);
  const positive = changePct >= 0;

  if (!chainId || !asset || !meta) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="stack">
      <ScreenHeader title={asset.name} back="/home" />

      <div className={styles.priceHeader}>
        <span className={styles.mark} style={{ background: meta.color }}>
          {asset.symbol.slice(0, 1)}
        </span>
        <div className={styles.priceValue}>{formatUsd(asset.usdPrice)}</div>
        <div className={`${styles.change} ${positive ? styles.positive : styles.negative}`}>
          {positive ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}% · {range}
        </div>
      </div>

      <Card className={styles.chartCard}>
        <PriceChart history={history} rangeLabel={range} positive={positive} />
        <div className={styles.rangeTabs} role="tablist" aria-label="Price range">
          {PRICE_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={r === range}
              className={`${styles.rangeTab} ${r === range ? styles.rangeTabActive : ""}`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </Card>

      <Card className="stack">
        <div className="row-between">
          <span className="muted text-sm">Your balance</span>
          <span className={`${styles.balanceValue} tabular-nums`}>
            {asset.balance} {asset.symbol}
          </span>
        </div>
        <div className="row-between">
          <span className="muted text-sm">Value</span>
          <span className="tabular-nums" style={{ fontWeight: 800 }}>
            {formatUsd(usdValue(asset))}
          </span>
        </div>
      </Card>

      <div className={styles.actions}>
        <Button variant="primary" onClick={() => navigate(`/send?chain=${chainId}`)}>
          Send
        </Button>
        <Button variant="secondary" onClick={() => navigate(`/receive?chain=${chainId}`)}>
          Receive
        </Button>
      </div>
    </div>
  );
}
