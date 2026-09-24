import { useEffect, useRef } from 'react';
import { ACC, IND } from '../data';
import { Icon, LockIcon } from '../icons';
import type { Wallet } from '../useWallet';
import { BackButton, DIM, f, Header, MUTED, Overline, PrimaryCta, TNUM } from '../ui';

const StepHeader = ({ w, label }: { w: Wallet; label: string }) => (
  <Header onBack={w.back} padding="16px 18px 10px">
    <span style={{ font: f(800, 13), color: MUTED }}>{label}</span>
  </Header>
);

const Intro = ({ title, lead }: { title: string; lead: string }) => (
  <div style={{ padding: '14px 22px 0' }}>
    <h2 style={{ margin: 0, font: f(900, 30, 1.1), letterSpacing: '-.8px' }}>{title}</h2>
    <p style={{ margin: '12px 0 0', font: f(700, 14.5, 1.55), color: MUTED }}>{lead}</p>
  </div>
);

const CheckMark = () => <Icon name="check" color="#FFFFFF" size={14} weight={3} />;

/** Abstract blob illustration: rounded squares, two of them floating. */
const BLOBS = [
  { l: 58, t: 78, s: 120, r: 38, bg: IND, anim: 'antheaFloat 5s ease-in-out infinite' },
  { l: 148, t: 52, s: 92, r: 30, bg: '#1A1A1F', anim: 'antheaFloat 6s ease-in-out infinite' },
  { l: 206, t: 146, s: 72, r: 24, bg: '#22222A' },
  { l: 252, t: 72, s: 40, r: 14, bg: IND },
  { l: 78, t: 214, s: 52, r: 18, bg: '#1A1A1F' },
  { l: 286, t: 200, s: 26, r: 9, bg: 'rgba(108,92,231,.5)' }
];

export function Welcome({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <div style={{ position: 'relative', height: 290, marginTop: 16, flex: 'none' }}>
        {BLOBS.map((b, i) => (
          <span key={i} style={{ position: 'absolute', left: b.l, top: b.t, width: b.s, height: b.s, borderRadius: b.r, background: b.bg, animation: b.anim }} />
        ))}
      </div>
      <div style={{ padding: '8px 26px 0' }}>
        <h1 style={{ margin: 0, font: f(900, 38, 1.08), letterSpacing: '-1.2px', textWrap: 'pretty' }}>Deine Schlüssel. Dein Gerät.</h1>
        <p style={{ margin: '14px 0 0', font: f(700, 15, 1.55), color: MUTED, maxWidth: 310 }}>Ethereum, Solana und Bitcoin in einer App. Kein Konto, keine E-Mail, kein KYC.</p>
      </div>
      <div className="cta" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn--primary btn--hover" onClick={w.startCreate}>Neues Wallet erstellen</button>
        <button className="btn btn--secondary btn--hover" onClick={w.startImport}>Bestehendes Wallet importieren</button>
      </div>
    </div>
  );
}

export function Warn({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <StepHeader w={w} label="Schritt 1 von 4" />
      <Intro title="Bevor es losgeht" lead="Anthea erzeugt gleich 12 Wörter. Sie sind der einzige Zugang zu deinem Geld." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '22px 16px 0' }}>
        {w.warnRows.map((r) => (
          <button key={r.text} onClick={r.onClick} role="checkbox" aria-checked={r.on}
            style={{ border: 0, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, background: '#141418', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
            <span style={{ flex: 'none', width: 26, height: 26, borderRadius: 9, background: r.on ? IND : '#2A2A32', display: 'grid', placeItems: 'center' }}>{r.on && <CheckMark />}</span>
            <span style={{ font: f(800, 15, 1.4), color: '#F7F7F5' }}>{r.text}</span>
          </button>
        ))}
      </div>
      <div className="cta"><PrimaryCta onClick={w.warnNext} enabled={w.warnOk}>Wörter anzeigen</PrimaryCta></div>
    </div>
  );
}

const Badge = ({ children }: { children: string }) => (
  <span style={{ font: f(800, 11), color: ACC, background: 'rgba(108,92,231,.14)', borderRadius: 8, padding: '5px 9px' }}>{children}</span>
);

export function Seed({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <StepHeader w={w} label="Schritt 2 von 4" />
      <Intro title="Deine Wiederherstellungsphrase" lead="Schreibe die Wörter in dieser Reihenfolge auf Papier. Nicht fotografieren, nicht in die Cloud." />
      <div style={{ display: 'flex', gap: 6, padding: '16px 22px 0' }}>
        <Badge>Screenshots blockiert</Badge>
        <Badge>Kopieren deaktiviert</Badge>
      </div>
      <button onClick={w.revealSeed} style={{ position: 'relative', margin: '14px 16px 0', border: 0, padding: 16, borderRadius: 24, background: '#141418', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, filter: w.seedShown ? 'none' : 'blur(9px)' }}>
          {w.seedWords.map((s) => (
            <span key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: '#1E1E23' }}>
              <span style={{ width: 18, font: f(800, 12), color: DIM, ...TNUM }}>{s.n}</span>
              <span style={{ font: f(900, 15.5), color: '#F7F7F5', userSelect: 'none' }}>{s.w}</span>
            </span>
          ))}
        </div>
        {!w.seedShown && (
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', font: f(900, 15), color: '#F7F7F5' }}>Zum Anzeigen tippen</span>
        )}
      </button>
      <div className="cta"><PrimaryCta onClick={w.seedNext} enabled={w.seedShown}>Ich habe sie notiert</PrimaryCta></div>
    </div>
  );
}

export function Verify({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <StepHeader w={w} label="Schritt 3 von 4" />
      <Intro title="Kurz prüfen" lead="Wähle das richtige Wort für jede Position." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '24px 22px 0' }}>
        {w.verifyRows.map((v) => (
          <div key={v.pos}>
            <Overline style={{ font: f(800, 12) }}>WORT #{v.pos}</Overline>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 10 }}>
              {v.opts.map((o) => (
                <button key={o.w} onClick={o.onClick} style={{ border: 0, height: 48, borderRadius: 16, background: o.bg, color: o.ink, font: f(900, 15), cursor: 'pointer' }}>{o.w}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="cta"><PrimaryCta onClick={w.verifyNext} enabled={w.verifyOk}>Weiter</PrimaryCta></div>
    </div>
  );
}

export function Import({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <StepHeader w={w} label="Import" />
      <Intro title="Phrase eingeben" lead="12 oder 24 Wörter, durch Leerzeichen getrennt." />
      <div style={{ margin: '18px 16px 0', borderRadius: 24, background: '#141418', padding: 16 }}>
        <textarea value={w.importText} onChange={w.onImport} placeholder="wort1 wort2 wort3 …"
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          style={{ width: '100%', boxSizing: 'border-box', height: 120, resize: 'none', border: 0, outline: 0, background: 'transparent', color: '#F7F7F5', font: f(800, 16, 1.6) }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 6 }}>
          <span style={{ font: f(800, 12.5), color: w.importInk }}>{w.importMsg}</span>
          <button onClick={w.importDemo} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', font: f(800, 12.5), color: ACC }}>Testphrase</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 16px 0' }}>
        {w.importSugg.map((s) => (
          <button key={s.w} onClick={s.onClick} style={{ border: 0, borderRadius: 12, padding: '8px 13px', background: '#1E1E23', color: '#F7F7F5', font: f(800, 13.5), cursor: 'pointer' }}>{s.w}</button>
        ))}
      </div>
      <p style={{ margin: '14px 22px 0', font: f(700, 12, 1.5), color: DIM }}>Autokorrektur und Tastaturvorschläge sind deaktiviert. Vorschläge stammen nur aus der BIP39-Wortliste.</p>
      <div className="cta"><PrimaryCta onClick={w.importNext} enabled={w.importValid}>Importieren</PrimaryCta></div>
    </div>
  );
}

export function Pin({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px 10px', height: 40 }}>
        {w.pinCanBack && <BackButton onClick={w.back} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '26px 30px 0', textAlign: 'center' }}>
        <span style={{ width: 56, height: 56, borderRadius: 19, background: IND, display: 'grid', placeItems: 'center' }}><LockIcon size={24} color="#FFFFFF" weight={2.4} /></span>
        <h2 style={{ margin: '20px 0 0', font: f(900, 26), letterSpacing: '-.6px' }}>{w.pinTitle}</h2>
        <p style={{ margin: '8px 0 0', font: f(700, 14, 1.5), color: MUTED, maxWidth: 290 }}>{w.pinSub}</p>
        <div style={{ display: 'flex', gap: 14, marginTop: 28 }}>
          {w.pinDots.map((bg, i) => <span key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: bg }} />)}
        </div>
        <div role="alert" style={{ height: 22, marginTop: 14, font: f(800, 13), color: '#FF8F80' }}>{w.pinError}</div>
      </div>
      <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px 22px', padding: '0 44px 40px' }}>
        {w.pinKeys.map((k, i) => (
          <button key={i} className="key key--pin" onClick={k.onClick} style={{ ['--bg' as string]: k.bg, height: 66, border: 0, borderRadius: '50%', color: '#F7F7F5', font: f(900, 26), cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            {k.label}{k.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PasswordField({ value, onChange, placeholder, visible, autoFocus }: {
  value: string; onChange: (ev: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; visible?: boolean; autoFocus?: boolean;
}) {
  // Focus without scrolling: native autoFocus would scroll the clipped device frame while a sheet is still sliding in.
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus({ preventScroll: true }); }, [autoFocus]);
  return (
  <input ref={ref} type={visible ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder}
    autoComplete="new-password" autoCapitalize="off" autoCorrect="off" spellCheck={false}
    style={{ width: '100%', boxSizing: 'border-box', height: 56, border: 0, outline: 0, borderRadius: 18, background: '#141418', padding: '0 16px', color: '#F7F7F5', font: f(800, 16) }} />
  );
}

export function Password({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <div style={{ height: 40, padding: '16px 18px 10px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '26px 30px 0', textAlign: 'center' }}>
        <span style={{ width: 56, height: 56, borderRadius: 19, background: IND, display: 'grid', placeItems: 'center' }}><Icon name="key" color="#FFFFFF" size={24} weight={2.4} /></span>
        <h2 style={{ margin: '20px 0 0', font: f(900, 26), letterSpacing: '-.6px' }}>Passwort festlegen</h2>
        <p style={{ margin: '8px 0 0', font: f(700, 14, 1.5), color: MUTED, maxWidth: 300 }}>Damit bestätigst du Transaktionen. Zum Anzeigen der Phrase bleibt die PIN nötig.</p>
      </div>
      <form onSubmit={(ev) => { ev.preventDefault(); w.savePassword(); }} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '26px 16px 0' }}>
        <PasswordField value={w.pwA} onChange={w.onPwA} placeholder="Passwort" visible={w.pwVisible} autoFocus />
        <PasswordField value={w.pwB} onChange={w.onPwB} placeholder="Passwort wiederholen" visible={w.pwVisible} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 6px 0' }}>
          <span role="status" style={{ font: f(800, 12.5), color: w.pwMsgInk }}>{w.pwMsg}</span>
          <button type="button" onClick={w.togglePwVisible} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', font: f(800, 12.5), color: ACC }}>{w.pwVisible ? 'Verbergen' : 'Anzeigen'}</button>
        </div>
        <button type="submit" hidden />
      </form>
      <div className="cta"><PrimaryCta onClick={w.savePassword} enabled={w.pwValid}>Passwort speichern</PrimaryCta></div>
    </div>
  );
}
