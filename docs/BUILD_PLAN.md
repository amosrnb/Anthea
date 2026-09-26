# Anthea – Bauplan für Version 1 (Non-Custodial Wallet)

> **Für den Coding-Agenten:** Dieses Dokument ist die verbindliche Spezifikation. Lies es vollständig, bevor du Code schreibst. Arbeite die Phasen in der angegebenen Reihenfolge ab. Jede Phase endet mit Abnahmekriterien; eine Phase gilt erst als fertig, wenn alle Kriterien erfüllt und die Tests grün sind. Die Produktentscheidungen in Abschnitt 13 sind getroffen und verbindlich; die Punkte unter 13.2 sind noch offen – frage nach, bevor du sie berührst.

Repository: `https://github.com/amosrnb/Anthea` (Branch `main`). Lege dieses Dokument als `docs/BUILD_PLAN.md` ins Repo.

Planversion: 2 (Entscheidungen des Produktinhabers eingearbeitet).

---

## 1. Ziel und Umfang

Anthea ist ein **kommerzielles, Non-Custodial-Krypto-Wallet** für iOS und Android (Design: 390×844 pt, Hochformat, dunkles Theme, deutschsprachige Oberfläche). Alle privaten Schlüssel entstehen und bleiben ausschließlich auf dem Gerät des Nutzers. Nutzer brauchen kein Konto und durchlaufen kein KYC. Es gibt keine Analytics, kein Tracking, keine Crash-Reports.

Anthea betreibt **einen kleinen, zustandslosen Daten-Proxy** (Abschnitt 4.3). Er existiert nur, weil kommerziell lizenzierte Marktdaten und ein vollständiger Transaktionsverlauf API-Keys erfordern, die nicht in einer App ausgeliefert werden dürfen. Der Proxy sieht niemals Schlüssel, Seeds oder signierte Transaktionen, speichert keine Nutzerdaten und führt keine Logs mit Adressen.

### 1.1 Funktionsumfang v1

1. **Onboarding:** Wallet erstellen (12-Wort-Phrase, Warnhinweise, Verifikation von 3 Wörtern), Wallet importieren (12 oder 24 Wörter, BIP39-Prüfsumme), 6-stellige PIN festlegen.
2. **Sperre:** PIN-Entsperrung, Auto-Lock (1/5/15 min), Sperre beim Wechsel in den Hintergrund, PIN-Bestätigung vor jeder Signatur, Phrase anzeigen nur mit PIN.
3. **Märkte:** Live-Preise, 24h-Änderung, Marktkapitalisierung, Volumen, Hoch/Tief, Sparklines, Coin-Detail-Charts (1H/24H/7D/30D/1J) mit Antippen-und-Ziehen für exakte Werte, Suche, Watchlist, Fiat-Währung EUR/USD/GBP/CHF.
4. **Portfolio:** echte Guthaben auf allen unterstützten Netzwerken, Gesamtwert, Wertentwicklung der aktuellen Bestände, Netzwerkfilter, nicht verifizierte Tokens markiert.
5. **Empfangen:** echte Adressen, echter QR-Code, Netzwerkwahl, Warnhinweise.
6. **Senden:** Asset → Empfänger (Validierung, Address-Poisoning-Warnung, QR-Scan) → Betrag (Token/Fiat, Max) → Gebührenstufe → Review mit Simulation → PIN → Broadcast → Status.
7. **Swappen:** über Drittanbieter – LI.FI (EVM same-chain, EVM↔EVM, EVM↔Solana) und Jupiter (Solana↔Solana). Slippage, Mindestempfang, Preisauswirkung, exakte Token-Freigaben, Vertrags-Allowlist.
8. **Aktivität:** vollständiger Transaktionsverlauf mit Status, Detailansicht, Link zum Block-Explorer.
9. **Einstellungen:** Währung, Netzwerke & RPC (eigene HTTPS-Endpunkte), PIN ändern, Auto-Lock, Phrase anzeigen, Datenschutz-Info, Wallet zurücksetzen.
10. **Testnetz-Modus** (Badge „TESTNETZ“ existiert bereits im Design).

### 1.2 Unterstützte Netzwerke v1

| Netzwerk | Familie | Mainnet | Testnet |
|---|---|---|---|
| Ethereum | EVM | Chain-ID 1 | Sepolia (11155111) |
| Base | EVM | 8453 | Base Sepolia (84532) |
| Arbitrum One | EVM | 42161 | Arbitrum Sepolia (421614) |
| Optimism | EVM | 10 | OP Sepolia (11155420) |
| Polygon PoS | EVM | 137 | Amoy (80002) |
| BNB Smart Chain | EVM | 56 | BSC Testnet (97) |
| Solana | SOL | mainnet-beta | devnet |
| Bitcoin | BTC | mainnet | testnet4 oder signet |

Alle Chain-IDs vor der Implementierung gegen offizielle Quellen prüfen.

### 1.3 Ausdrücklich nicht in v1

Kauf/Verkauf gegen Fiat (On-/Off-Ramps erfordern fast immer KYC der Nutzer), NFTs, ENS/SNS-Namen, WalletConnect/dApp-Browser, Hardware-Wallets, mehrere Wallets/Konten, **Biometrie (Face ID/Fingerabdruck)**, Bitcoin-Swaps (im Design als „folgt in einer späteren Version“ markiert), Staking, Push-Benachrichtigungen, Cloud-Backup der Phrase, echte historische Portfolio-Wertentwicklung inkl. Einstandspreisen (v2).

---

## 2. Harte Regeln für die Umsetzung

1. **Kein KYC für Nutzer, kein KYC für eingesetzte Dienste.** Jeder Drittanbieter muss ohne Identitätsprüfung nutzbar sein (Registrierung per E-Mail und Bezahlung sind in Ordnung). Einzige bewusste Ausnahme: die Entwicklerkonten bei Apple und Google für den Vertrieb (Abschnitt 13, Punkt 5). Neue Dienste nur nach Rückfrage.
2. **Der Seed verlässt nie das Gerät.** Keine Übertragung, kein Logging, kein Clipboard, kein Screenshot, kein Cloud-Backup, kein Einbetten in Fehlermeldungen. Gilt auch für private Schlüssel und PIN.
3. **API-Keys nie in der App.** Alle kostenpflichtigen Schlüssel liegen ausschließlich als Secrets im Daten-Proxy. Die App enthält keine Geheimnisse.
4. **Keine Telemetrie.** Keine Analytics-SDKs, keine Crash-Reporter, keine Remote-Logs, keine Remote-Fonts. Der Proxy loggt keine Adressen und keine IPs über das technisch Nötige (Rate-Limiting im Speicher) hinaus.
5. **Beträge nie als Float.** Alle On-Chain-Beträge sind `bigint` in Basiseinheiten (Wei, Lamports, Satoshi, Token-Decimals). Floats nur für die Fiat-Anzeige.
6. **Nur geprüfte Kryptografie-Bibliotheken** (Abschnitt 4). Keine eigene Kryptografie. Kein `Math.random()` für irgendetwas Sicherheitsrelevantes.
7. **Design bleibt visuell gleich.** Die Screens werden nach React Native portiert und müssen dem Prototyp optisch entsprechen (Farben, Abstände, Radien, Schrift Nunito, Gewichte). Neue Zustände (Laden, Fehler, leer) im bestehenden Stil. Freigegebene Ergänzungen sind in diesem Plan ausdrücklich genannt (Chart-Scrubbing, Datenstand-Hinweis, Hinweis unter dem Portfolio-Chart, Quote-abgelaufen-Zustand); alles andere erst nach Rückfrage.
8. **Entwicklung zuerst ausschließlich im Testnetz.** Mainnet wird erst in Phase 11 freigeschaltet.
9. **Abhängigkeiten minimal und gepinnt.** Exakte Versionen, Lockfile committen, jede neue Abhängigkeit im PR begründen.
10. **Deutsch in der UI, Englisch im Code** (Bezeichner, Kommentare, Commits).

---

## 3. Ausgangslage: der bestehende Frontend-Prototyp

- Stack: React 19, TypeScript, Vite (Web). Keine Laufzeit-Abhängigkeiten außer React.
- `src/data.ts`: alle Mock-Daten (Assets, Coins, Adressen, Gebühren, Seed-Wörter, Aktivität, RPC-Liste, Wechselkurse). **Wird vollständig ersetzt**; am Ende von v1 enthält es nur noch Farbkonstanten und statische Konfiguration.
- `src/lib.ts`: Formatierung (`nf`, `pc`, `short`) – übernehmen; `chart()` (Pseudo-Kurven) – wird durch Pfad-Erzeugung aus echten Punkten ersetzt; `qrCells()` (dekorativer Fake-QR) – **muss** durch echten QR-Encoder ersetzt werden; `validateAddress()` (Regex) – wird durch echte Prüfung ersetzt, Warnlogik und Texte bleiben.
- `src/useWallet.tsx`: gesamter Zustand und alle abgeleiteten View-Werte, zurückgegeben als Objekt `w`. Die Screens konsumieren nur `w`. **Das ist die Integrationsschnittstelle:** Die Logik ist plattformunabhängiges TypeScript und wird in die React-Native-App übernommen; die Werte kommen künftig aus echten Services.
- `src/screens/`, `src/ui.tsx`, `src/icons.tsx`, `src/styles.css`: Web-JSX mit Inline-Styles und SVG-Icons – **Vorlage** für die React-Native-Portierung.
- `project/Anthea Wallet.dc.html`, `chats/`: ursprüngliche Design-Quelle und Gesprächsverlauf – bei Unklarheiten zum Aussehen dort nachsehen.
- Prototyp-Hilfen, die es in der echten App nicht geben darf: URL-Parameter `?start=`, `?testnet=`, `?privacy=`; „beliebige 6 Ziffern werden akzeptiert“; `importDemo`; `pasteTo` fügt absichtlich eine Poisoning-Adresse ein; `scanTo` fügt eine feste Adresse ein; `pinFirst` hält die PIN im Klartext im React-State.

---

## 4. Architektur und Technologie-Stack

### 4.1 Plattform: React Native mit Expo

Anthea wird als **React-Native-App mit Expo** (Development Builds / Prebuild, nicht Expo Go) gebaut. Begründung für ein Wallet mit echten Nutzern:

- Native Oberfläche und Performance (Listen, Gesten, Animationen) statt WebView.
- Keine WebView-Angriffsfläche; Keychain/Keystore, Kamera, Screenshot-Schutz und Lebenszyklus sind erstklassig über native Module erreichbar.
- Etablierter Weg: Die großen Self-Custody-Wallets setzen überwiegend auf React Native.
- Die gesamte Logik (`useWallet`, `lib.ts`, später `core/`, `chains/`, `services/`) ist TypeScript und wird übernommen; neu geschrieben wird nur die Darstellungsschicht (div/span/button → View/Text/Pressable, SVG → `react-native-svg`).

Builds erfolgen lokal mit Xcode und Gradle. Der Expo-Cloud-Build-Dienst (EAS) ist optional und nicht erforderlich. Die aktuelle stabile Expo-SDK-Version zum Zeitpunkt der Umsetzung verwenden. Der Vite-Web-Prototyp bleibt bis zum Abschluss der Portierung als visuelle Referenz im Ordner `prototype/` erhalten und wird danach archiviert.

### 4.2 Bibliotheken (App)

| Zweck | Bibliothek | Hinweis |
|---|---|---|
| Laufzeit-Krypto (Zufall, scrypt, Hashes nativ) | `react-native-quick-crypto` | liefert `crypto.getRandomValues` und schnelles scrypt; Hermes allein ist dafür zu langsam |
| BIP39 | `@scure/bip39` | inkl. englischer Wortliste |
| BIP32 (secp256k1) | `@scure/bip32` | EVM und Bitcoin |
| SLIP-0010 (ed25519) | `micro-key-producer` (Modul `slip10`) | Solana-Ableitung |
| Kurven / Hashes / KDF | `@noble/curves`, `@noble/hashes` | HKDF, SHA-256; scrypt über quick-crypto |
| Symmetrische Verschlüsselung | `@noble/ciphers` | AES-256-GCM |
| EVM | `viem` | Clients, Signieren, Multicall, EIP-1559, OP-Stack-Gebühren |
| Solana | `@solana/kit` + `@solana-program/system`, `/token`, `/token-2022` | Ed25519-WebCrypto-Polyfill für React Native gemäß offizieller Solana-Doku |
| Bitcoin | `@scure/btc-signer` | Adressen, PSBT, Signieren |
| Daten-Caching | `@tanstack/react-query` | Polling, Cache, Retry, Fokus-Handling |
| Secure Storage | `expo-secure-store` | iOS: `WHEN_UNLOCKED_THIS_DEVICE_ONLY`; Android: Keystore-gestützt |
| Nicht-geheime Persistenz | `react-native-mmkv` | Einstellungen, Caches, lokaler Verlauf |
| SVG / Charts / QR-Darstellung | `react-native-svg` | bestehende Pfad-Logik weiterverwenden |
| QR-Erzeugung | `qrcode` oder `uqr` (nur Matrix) | Matrix in das bestehende Zellraster rendern |
| QR-Scan | `expo-camera` (Barcode-Scanning) | on-device |
| Screenshot-Schutz | `expo-screen-capture` | Android `FLAG_SECURE`; iOS: Aufnahme abdecken, Screenshot erkennen |
| Blur / Verlauf | `expo-blur`, `expo-linear-gradient` | für Dock und Toasts (`backdropFilter` im Prototyp) |
| Clipboard / Teilen / Haptik | `expo-clipboard`, React Native `Share`, `expo-haptics` | |
| Schrift | `expo-font` + lokal gebündelte Nunito-Dateien (600–900) | keine Google-Fonts-Abrufe |
| Tests | `jest` (`jest-expo`), `@testing-library/react-native`, **Maestro** für E2E | Maestro-CLI lokal ohne Konto |

Paketnamen, Kompatibilität mit der gewählten Expo-SDK und aktuelle Versionen vor der Installation prüfen; Abweichungen melden.

### 4.3 Daten-Proxy „anthea-api“

Ein kleiner, zustandsloser HTTP-Dienst in TypeScript, empfohlen auf **Cloudflare Workers** (Registrierung per E-Mail; vor Abschluss prüfen, dass keine Identitätsprüfung verlangt wird). Alternative: eigener VPS bei einem Anbieter ohne Ausweispflicht.

Aufgaben:

- Marktdaten vom kommerziell lizenzierten Anbieter abrufen, zentral cachen und an alle Apps ausliefern (ein Abruf bedient alle Nutzer → planbare Kosten, keine Rate-Limit-Probleme pro Nutzer).
- Transaktionsverlauf und Token-Erkennung für alle EVM-Netze über Etherscan V2 abrufen (ein Key für alle EVM-Chains inkl. BNB Chain).
- Später optional: bezahlter RPC-Anbieter als primärer Endpunkt (Abschnitt 6, Phase 11).

Endpunkte (Versionierung über Pfad):

```
GET /v1/markets?vs=eur                        # Liste aller Coins der Märkte-Ansicht inkl. Sparkline
GET /v1/chart/:coinId?vs=eur&range=24H        # 1H | 24H | 7D | 30D | 1J
GET /v1/token-prices?chain=base&addresses=... # Preise per Vertragsadresse (inkl. Liquiditätsangabe)
GET /v1/fx                                    # Wechselkurse USD -> EUR/GBP/CHF
GET /v1/evm/history?chain=56&address=0x...&cursor=...
GET /v1/evm/tokens?chain=56&address=0x...     # gehaltene Tokens (Erkennung)
GET /v1/health
```

Regeln:

- Keys (Marktdaten-Anbieter, Etherscan) nur als Worker-Secrets. Keine Keys im Repo.
- Eingaben strikt validieren (Chain-Whitelist, Adressformat, Range-Whitelist); alles andere 400.
- Caching mit TTL (siehe Phase 4); bei Anbieterfehlern letzte gültige Daten mit `asOf`-Zeitstempel ausliefern.
- Jede Antwort enthält `asOf` (Zeitpunkt der Daten beim Anbieter) und `source`.
- Budget-Wächter: zählt Abrufe beim Anbieter pro Monat; bei 90 % des Plan-Kontingents TTLs automatisch verlängern, bei 100 % nur noch Cache ausliefern.
- Rate-Limit pro Client-IP im Speicher (z. B. 60 Anfragen/min), keine persistente Speicherung von IPs.
- Request-Logging deaktiviert; Fehlerlogs ohne Adressen und IPs.
- Adress-bezogene Antworten (history, tokens) werden nicht gecacht oder nur kurz im Speicher (≤ 30 s).
- Kein Nutzerkonto, keine Datenbank mit Nutzerdaten.

Die App verwendet den Proxy nur für Marktdaten, Token-Preise, EVM-Verlauf und EVM-Token-Erkennung. Guthaben, Gebühren, Simulation, Broadcast und Status laufen direkt vom Gerät über RPC. Swaps laufen direkt vom Gerät zu LI.FI bzw. Jupiter. So kann ein kompromittierter Proxy im schlimmsten Fall falsche Anzeigewerte liefern, aber nie Gelder bewegen.

### 4.4 Externe Datenquellen

| Zweck | Quelle | Weg |
|---|---|---|
| Preise, Märkte, Charts | kommerzieller Plan eines Aggregators; Standard: **CoinGecko** (kostenpflichtiger Plan mit kommerzieller Lizenz, inkl. On-Chain-/DEX-Preisen für Tokens per Vertragsadresse). Alternative bei gleicher Eignung: CoinMarketCap. | Proxy |
| EVM-Verlauf, Token-Erkennung | **Etherscan API V2**, kostenpflichtiger Plan (der Free-Tier deckt Base, Optimism und BNB Chain nicht ab); Fallback: Blockscout-Instanzen, wo vorhanden | Proxy |
| EVM-RPC | `*.publicnode.com` + je Netz 2 keylose Fallbacks; später bezahlter RPC als primär | direkt |
| Solana-RPC | publicnode + Fallbacks; vor Mainnet-Start bezahlter RPC als primär (öffentliche Solana-RPCs sind für Produktion ungeeignet) | direkt |
| Solana-Verlauf | RPC (`getSignaturesForAddress`, `getTransaction`) | direkt |
| Bitcoin | `mempool.space/api` (Esplora) + Fallback `blockstream.info/api` | direkt |
| Solana-Token-Liste | Jupiter Tokens API (`api.jup.ag`, keyless) | direkt |
| Swaps EVM + Cross-Chain | LI.FI (`li.quest/v1`), keyless; Limit pro Nutzer-IP ca. 75 Quotes pro 2 Stunden | direkt |
| Swaps Solana | Jupiter Swap API (`api.jup.ag`), keyless; ca. 0,5 Anfragen/s pro IP | direkt |

Alle Limits und Pläne vor der Umsetzung in der offiziellen Doku gegenprüfen und als Konstanten in `src/services/limits.ts` bzw. `server/src/limits.ts` hinterlegen. Swaps bewusst **ohne** Proxy: Die keylosen Limits gelten pro Nutzer-IP und wachsen damit mit der Nutzerzahl, und es gibt keinen Mittelsmann zwischen Nutzer und Swap-Anbieter.

### 4.5 Repository-Struktur

```
/                       # Expo-App
  app.config.ts
  src/
    core/               # reine Logik, keine I/O, 100 % unit-getestet
      mnemonic.ts  derive.ts  vault.ts  amounts.ts  address.ts  uri.ts  poisoning.ts
    chains/
      registry.ts  types.ts
      evm/  solana/  bitcoin/     # je: balances, fees, buildSend, simulate, sign, broadcast, status, history
    services/
      http.ts  rpc.ts  limits.ts  api.ts (Proxy-Client)
      prices/  tokens/  swap/ (lifi.ts, jupiter.ts, allowlist.ts, quote.ts)
    platform/
      secureStore.ts  lifecycle.ts  screenCapture.ts  scanner.ts  clipboard.ts  share.ts  explorer.ts
    state/
      session.ts  settings.ts  activity.ts  queries.ts
    ui/                 # portierte Basiskomponenten aus ui.tsx, icons.tsx
    screens/            # portierte Screens
    useWallet.ts        # Fassade für die Screens
  assets/fonts/  assets/tokens/
server/                 # anthea-api (Cloudflare Worker)
  src/  wrangler.toml  test/
prototype/              # bisheriger Vite-Prototyp (nur Referenz)
docs/  BUILD_PLAN.md  SECURITY.md  PRIVACY.md
```

### 4.6 Kern-Schnittstellen

```ts
type Family = 'evm' | 'sol' | 'btc';

interface ChainConfig {
  key: string;              // 'ethereum' | 'base' | ... | 'solana' | 'bitcoin'
  family: Family;
  name: string;             // Anzeigename aus dem Design, z. B. 'BNB Chain'
  chainId?: number;         // EVM
  testnet: boolean;
  nativeSymbol: string; nativeDecimals: number;
  rpcs: string[];           // primär + Fallbacks
  explorerTx: (hash: string) => string;
  explorerAddress: (addr: string) => string;
}

interface Balance { chainKey: string; token: TokenRef; amount: bigint; verified: boolean }

interface FeeOption { label: 'Langsam' | 'Normal' | 'Schnell'; etaText: string; nativeCost: bigint; params: unknown }

interface ChainAdapter {
  getBalances(account: AccountPublic): Promise<Balance[]>;
  estimateFees(req: SendRequest): Promise<FeeOption[]>;       // immer genau 3 Stufen
  buildSend(req: SendRequest, fee: FeeOption): Promise<UnsignedTx>;
  simulate(tx: UnsignedTx): Promise<{ ok: boolean; error?: string }>;
  sign(tx: UnsignedTx, signer: Signer): Promise<SignedTx>;
  broadcast(tx: SignedTx): Promise<string>;
  status(id: string): Promise<'pending' | 'confirmed' | 'failed'>;
  history(account: AccountPublic, cursor?: string): Promise<{ items: ActivityRecord[]; next?: string }>;
}

interface PricePoint { t: number; price: number }            // t in ms, price in gewählter Fiat-Währung
interface MarketSnapshot { asOf: number; source: string; coins: MarketCoin[] }

// Einziger Weg an Schlüsselmaterial:
function withSigner<T>(pin: string, family: Family, index: number,
                       fn: (signer: Signer) => Promise<T>): Promise<T>;
```

`withSigner` entschlüsselt den Seed, leitet nur den benötigten Schlüssel ab, führt `fn` aus und überschreibt anschließend alle Byte-Arrays mit Nullen (best effort). Kein anderer Code bekommt je den Seed zu sehen.

---

## 5. Sicherheitsmodell

### 5.1 Schlüsselableitung

- Mnemonic: 128 Bit Entropie (12 Wörter) bei Neuanlage; Import akzeptiert 12 und 24 Wörter. Keine BIP39-Passphrase in v1.
- **EVM:** `m/44'/60'/0'/0/0`, eine Adresse für alle EVM-Netze.
- **Solana:** `m/44'/501'/0'/0'` (SLIP-0010 ed25519; kompatibel mit Phantom/Solflare).
- **Bitcoin:** BIP84 Native SegWit, Empfang `m/84'/0'/0'/0/i`, Wechselgeld `m/84'/0'/0'/1/i`; Testnetz Coin-Type `1'`. Gap-Limit 20. Nach Nutzung einer Empfangsadresse neue Adresse anzeigen.

Pflicht-Testvektoren (`core/derive.test.ts`):
- `test test test test test test test test test test test junk` → EVM `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`.
- `abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about` → erste BIP84-Empfangsadresse `bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu`.
- Solana: mit einem öffentlich dokumentierten Vektor bzw. Abgleich gegen eine etablierte Wallet verifizieren, Quelle im Test kommentieren.
- Offizielle BIP39-Testvektoren (Trezor-Referenz).

### 5.2 Verschlüsselung des Seeds („Vault“)

Eine 6-stellige PIN hat nur 1 Million Möglichkeiten; ein nur PIN-verschlüsselter Seed wäre offline schnell geknackt. Daher Zwei-Faktor-Verschlüsselung:

1. Beim Anlegen wird ein zufälliges 32-Byte-`deviceSecret` erzeugt und über `expo-secure-store` gespeichert (iOS Keychain `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, keine iCloud-Synchronisation; Android Keystore-gestützt). Es verlässt das Gerät nie.
2. `pinKey = scrypt(PIN, salt, N=2^17, r=8, p=1)` über `react-native-quick-crypto`; Parameter so wählen, dass die Ableitung auf einem Mittelklasse-Gerät ca. 0,5–1 s dauert. Parameter im Vault-Header speichern (Versionsfeld für Migration).
3. `vaultKey = HKDF-SHA256(pinKey ‖ deviceSecret, info="anthea-vault-v1")`.
4. Verschlüsselt wird die **Entropie** (nicht der Wort-String) mit AES-256-GCM, zufälliger Nonce, Header als Associated Data.
5. Der verschlüsselte Blob liegt ebenfalls im Secure Storage.
6. Android: `allowBackup=false` bzw. Data-Extraction-Rules, die App-Daten von Cloud-Backup und Gerätetransfer ausschließen. iOS: nicht geheime Dateien mit Wallet-Bezug vom iCloud-Backup ausschließen.

### 5.3 PIN-Versuche und Sperre

- Fehlversuchszähler im Secure Storage (überlebt Neustarts). Nach 5 Fehlversuchen steigende Wartezeiten: 1 min, 5 min, 15 min, 1 h, danach jeweils 1 h. **Es wird nie automatisch gelöscht.** Der Text „Falsche PIN. Noch X Versuche.“ zählt dynamisch; während einer Wartezeit zeigt der PIN-Screen „Zu viele Versuche. Erneut möglich in MM:SS“ und das Tastenfeld ist deaktiviert.
- Auto-Lock nach eingestellter Inaktivität; beim Wechsel in den Hintergrund startet der Timer, bei Rückkehr nach Ablauf PIN-Screen. App-Switcher zeigt immer eine Abdeckung.
- Nach dem Entsperren hält die Session nur **öffentliche** Daten. Der Seed wird für jede Signatur und für „Phrase anzeigen“ neu mit der PIN entschlüsselt.
- PIN ändern: alte PIN prüfen, Vault mit neuer PIN neu verschlüsseln, atomar schreiben (neuen Blob schreiben und verifizieren, dann alten ersetzen).
- Wallet zurücksetzen: Vault, `deviceSecret`, Zähler, alle Caches und Einstellungen löschen.

### 5.4 Weitere Schutzmaßnahmen

- Screenshot-Schutz auf Seed-, Verify-, Import- und Reveal-Screens: Android `FLAG_SECURE`. iOS erlaubt kein zuverlässiges Blockieren von Screenshots: dort Bildschirmaufnahmen abdecken und bei erkanntem Screenshot einen Warnhinweis zeigen. Den Design-Text „Screenshots blockiert · Kopieren deaktiviert“ auf iOS ersetzen durch „Kopieren deaktiviert · Keine Screenshots machen“.
- Seed-Eingabefelder: `autoCorrect={false}`, `autoComplete="off"`, `autoCapitalize="none"`, `spellCheck={false}`, `contextMenuHidden`, auf Android `importantForAutofill="no"`; Tastatur-Lernfunktion möglichst unterbinden (`keyboardType="visible-password"` auf Android prüfen).
- Adressen kopieren erlaubt, Seed kopieren nicht. Kopierte Adressen nach 60 s aus dem Clipboard entfernen, falls unverändert.
- Keine dynamisch nachgeladenen Skripte, kein `eval`, keine Remote-Assets.
- Produktions-Build ohne Dev-Menü und Debug-Logs; Test, der das Bundle nach verbotenen Mustern durchsucht.
- Vor dem Signieren: Chain-ID, `from`, Empfänger/Vertrag, Betrag und Gebühr gegen die im Review-Screen gezeigten Werte prüfen.

---

## 6. Phasenplan

### Phase 0 – Projektgrundlagen und Portierung der Oberfläche

1. Bisherigen Vite-Code nach `prototype/` verschieben.
2. Expo-App (TypeScript, strikt: `strict`, `noUncheckedIndexedAccess`) im Repo-Root anlegen, Development Build für iOS und Android lokal lauffähig.
3. ESLint + Prettier, Jest (`jest-expo`), Testing Library, Maestro-Grundgerüst.
4. Nunito (600–900) lokal bündeln.
5. **Portierung der Oberfläche:** `ui.tsx`, `icons.tsx` und alle Screens nach React Native übertragen, weiterhin mit Mock-Daten aus `useWallet`. Navigation über den bestehenden `screen`-State oder React Navigation (Stack + Tabs, Entscheidung begründen; Back-Geste auf iOS und Zurück-Taste auf Android müssen funktionieren). Dock mit `expo-blur`. Safe Areas statt der festen Statusleiste aus dem Prototyp (`StatusBar`-Attrappe entfällt, echte Statusleiste hell).
6. Visueller Abgleich: Screenshot jedes Screens im iOS-Simulator (iPhone 390×844) neben dem Prototyp; Abweichungen beheben.
7. `server/` mit Cloudflare-Worker-Grundgerüst, `/v1/health`, Tests.
8. CI (GitHub Actions): Typecheck, Lint, Unit-Tests für App und Server, `npm audit --omit=dev`.
9. `docs/SECURITY.md` (Sicherheitsmodell aus Abschnitt 5) und `docs/PRIVACY.md` (welcher Anbieter welche Daten sieht) anlegen.

**Abnahme:** Beide Plattformen starten; alle Screens entsprechen optisch dem Prototyp; Klickpfade des Prototyps funktionieren mit Mock-Daten; CI grün.

### Phase 1 – Kryptografischer Kern und Vault

1. `core/mnemonic.ts`: erzeugen (Entropie aus `crypto.getRandomValues` via quick-crypto), validieren inkl. Prüfsumme, NFKD, Wortvorschläge aus der vollständigen BIP39-Liste (ersetzt `WORDS`).
2. `core/derive.ts`: Ableitungen aus 5.1, öffentliche Daten getrennt von privaten.
3. `core/vault.ts`: Schema aus 5.2, versionierter Header.
4. `platform/secureStore.ts`: Interface + `expo-secure-store`-Implementierung + In-Memory-Implementierung nur für Tests.
5. `withSigner` und Session-Handling.
6. `core/amounts.ts`: Parsing deutscher Eingaben („0,5“), Formatierung, bigint ↔ Anzeige mit Decimals.
7. `core/address.ts`: EIP-55-Checksumme, bech32/bech32m inkl. Präfix (`bc1`/`tb1`), Solana-base58 mit genau 32 Byte.

**Abnahme:** Alle Testvektoren grün; Vault-Roundtrip; falsche PIN, fehlendes `deviceSecret` und manipulierter Ciphertext scheitern jeweils; KDF-Dauer auf einem echten Mittelklasse-Android- und einem iPhone gemessen und dokumentiert; Coverage `core/` ≥ 95 %.

### Phase 2 – Onboarding, PIN und Sperre

1. „Wallet erstellen“: echte Mnemonic; Verify-Screen wählt 3 zufällige Positionen und je 2 zufällige falsche Wörter aus der BIP39-Liste.
2. „Importieren“: echte Validierung mit den Texten des Designs; zusätzlich „alle Wörter gültig, Prüfsumme falsch“ → „Prüfsumme ungültig. Prüfe Reihenfolge und Schreibweise.“
3. PIN festlegen/bestätigen → Vault schreiben → Adressen ableiten → Home. Beim Import: Bitcoin-Adress-Scan mit Gap-Limit, danach Toast „Konten abgeleitet · Bitcoin-Scan abgeschlossen“.
4. App-Start: Vault vorhanden → PIN-Screen, sonst Welcome.
5. Fehlversuche/Wartezeiten, Auto-Lock, App-Switcher-Abdeckung, Screenshot-Schutz (5.3, 5.4).
6. Einstellungen: PIN ändern (alte PIN → neue PIN → bestätigen, im bestehenden PIN-Screen-Stil), Auto-Lock, Phrase anzeigen, Wallet zurücksetzen.
7. Alle Prototyp-Hilfen aus Abschnitt 3 entfernen.

**Abnahme (Maestro):** erstellen → sperren → entsperren → Phrase anzeigen → zurücksetzen → mit derselben Phrase importieren ergibt dieselben Adressen. Nach Neustart gesperrt. 5 falsche PINs → Wartezeit, auch nach Neustart.

### Phase 3 – Netzwerkschicht und RPC-Einstellungen

1. `chains/registry.ts` mit allen Netzen aus 1.2 (Mainnet + Testnet), Explorer-URLs.
2. `services/http.ts`: Timeout (10 s), Retry mit exponentiellem Backoff bei 429/5xx, Token-Bucket-Rate-Limiter pro Host, Abbruch bei Screen-Wechsel.
3. `services/rpc.ts`: Endpunkt-Pool, Fallback, Health-Check, Chain-ID-Prüfung beim Hinzufügen eigener EVM-Endpunkte (Abweichung = ablehnen), Genesis-Hash-Prüfung für eigene Solana-Endpunkte.
4. `services/api.ts`: Client für den Proxy mit Basis-URL je Build (Dev/Staging/Prod).
5. RPC-Screen: echte Liste, „Eigenen Endpunkt hinzufügen“ (nur `https://`), entfernen/zurücksetzen, Anzahl Fallbacks. Eigene Endpunkte haben Vorrang vor den Standard-Endpunkten.
6. Testnetz-Schalter: bis Phase 11 ist Testnetz Standard und Mainnet gesperrt; Badge „TESTNETZ“ sichtbar, solange aktiv.

**Abnahme:** Ausfall des ersten Endpunkts wird überbrückt; eigene Endpunkte überleben Neustart; falsche Chain-ID wird abgelehnt.

### Phase 4 – Marktdaten und Charts (Genauigkeit hat Vorrang)

**Proxy:**
1. Anbieter-Adapter (Standard CoinGecko, kostenpflichtiger Plan) mit Interface, damit der Anbieter austauschbar bleibt.
2. `/v1/markets`: Liste der Coins der Märkte-Ansicht (Standard: BTC, ETH, USDC, BNB, SOL, XRP, POL, ARB, JUP plus alle verifizierten Tokens der Registry) in USD inkl. 24h-Änderung, Marktkapitalisierung, Volumen, Hoch/Tief 24h und 7-Tage-Sparkline. TTL 60 s.
3. `/v1/fx`: USD → EUR/GBP/CHF vom selben Anbieter, TTL 10 min. Live-Preise werden mit dem aktuellen Kurs umgerechnet.
4. `/v1/chart`: je angefragter Fiat-Währung direkt vom Anbieter (historische Kurse korrekt, keine Umrechnung mit heutigem Wechselkurs). Auflösung: 1H und 24H ≈ 5-min-Punkte, 7D stündlich, 30D stündlich oder 4-stündlich, 1J täglich. TTL: 1H/24H 5 min, 7D 15 min, 30D 1 h, 1J 6 h.
5. `/v1/token-prices`: Preise per Vertragsadresse inkl. Liquidität des Haupt-Pools. TTL 60 s.
6. Budget-Wächter gemäß 4.3; Budget-Rechnung für den gewählten Plan in `server/README.md` dokumentieren.

**App – verbindliche Regeln für akkurate, nicht verwirrende Preisdaten:**
1. **Eine Quelle für alle Preise.** Märkte-Liste, Coin-Detail, Portfolio, Fiat-Werte beim Senden und Swappen verwenden dieselben Proxy-Daten. Swap-Quotes zeigen zusätzlich den Kurs des Swap-Anbieters, klar als „Kurs“ der Route beschriftet.
2. **Chart und Zahl passen zusammen.** Der letzte Chart-Punkt ist immer der angezeigte aktuelle Preis (aktuellen Preis als letzten Punkt anhängen). Die Änderung im Zeitraum = letzter Punkt vs. erster Punkt des Zeitraums. Bei „24H“ ist das die rollierende 24h-Änderung.
3. **Keine verfälschende Glättung.** Die bisherige Kurvenglättung schneidet Spitzen ab, sodass Hoch/Tief im Chart nicht zu „HOCH 24H“/„TIEF 24H“ passen. Ersetzen durch gerade Segmente mit runden Linienverbindungen bei ausreichend vielen Punkten; die Y-Skala umfasst exakt Minimum und Maximum der Daten.
4. **Antippen und Ziehen (freigegebene Ergänzung):** Beim Berühren des Charts erscheinen eine vertikale Linie, ein Punkt und darüber Preis und Zeitpunkt des nächstgelegenen Datenpunkts; die große Preisangabe zeigt währenddessen diesen Wert. Haptik beim Start. Gilt für Coin-Detail und Portfolio-Chart.
5. **Datenstand ehrlich zeigen (freigegebene Ergänzung):** „· Live“ nur, wenn `asOf` jünger als 2 min ist; sonst „· Stand HH:MM“. Offline: letzter Cache mit „Stand“.
6. **Keine fragwürdigen Preise.** Tokens ohne Aggregator-Preis und mit Pool-Liquidität unter 50.000 USD bekommen keinen Preis („Kein Preis“) und zählen nicht zum Gesamtwert. Stablecoins werden nicht auf 1,00 fixiert.
7. **Zahlenformat:** `de-DE`, genügend signifikante Stellen für kleine Preise (z. B. 0,00001234 €), feste Nachkommastellen je Größenordnung, damit Werte beim Aktualisieren nicht springen.
8. Polling nur im Vordergrund und bei sichtbarem Screen (React Query `focusManager`/`AppState`): Märkte 60 s, Charts nach TTL. Letzte Daten in MMKV cachen.
9. Suche lokal; Watchlist persistiert. Coins ohne Netz-Unterstützung (z. B. XRP) zeigen nur Marktdaten.

**Abnahme:** Stichproben stimmen mit der Website des Anbieters überein; bei jedem Coin und Zeitraum ist der letzte Chart-Punkt gleich dem angezeigten Preis und Hoch/Tief des 24H-Charts gleich den Kennzahlen; Scrubbing zeigt korrekte Werte; bei Anbieterausfall zeigt die App „Stand HH:MM“ statt „Live“.

### Phase 5 – Portfolio und Guthaben

1. Token-Registry: pro Netz gebündelte, **verifizierte** Liste (native Coins, USDC, USDT, ARB, POL, JUP u. a.) mit Adresse, Decimals, Symbol, Logo (lokal gebündelt), Anbieter-ID. Adressen aus offiziellen Quellen der Emittenten verifizieren.
2. **EVM:** native Guthaben via `getBalance`, verifizierte ERC-20 via Multicall3 `balanceOf` (direkt per RPC). Token-Erkennung über `/v1/evm/tokens` (Etherscan V2 via Proxy) auf allen EVM-Netzen inkl. BNB Chain; Guthaben erkannter Tokens anschließend per RPC verifizieren. Unbekannte Tokens: „NICHT VERIFIZIERT“, ohne Preis, nicht swapbar, nicht im Gesamtwert, ausblendbar.
3. **Solana:** `getBalance` + `getTokenAccountsByOwner` für SPL Token und Token-2022; Verifizierung über die Jupiter-Token-Liste.
4. **Bitcoin:** Summe über alle abgeleiteten Adressen; unbestätigte Beträge separat.
5. Gesamtwert und Änderung aus echten Guthaben × Preisen. Netzwerk-Chips aus Netzen mit Guthaben.
6. **Portfolio-Chart = Wertentwicklung der aktuellen Bestände.** Für jeden Zeitpunkt: Σ (heutiger Bestand je Asset × damaliger Preis). Die Prozent- und Betragsangabe darüber ist exakt die Änderung dieses Charts im Zeitraum. Einzahlungen erscheinen damit nicht als Gewinn. Unter dem Zeitraum-Umschalter in kleiner, gedämpfter Schrift: „Basierend auf deinen aktuellen Beständen“ (freigegebene Ergänzung). Der Chart beginnt frühestens beim ersten On-Chain-Eingang der Wallet (aus dem Verlauf); ist der Zeitraum länger, wird der kürzere Verlauf mit „seit TT.MM.JJJJ“ angezeigt. Echte historische Wertentwicklung mit Ein-/Auszahlungen und Einstandspreisen ist v2.
7. Refresh: beim Öffnen, Pull-to-Refresh, alle 60 s im Vordergrund, sofort nach eigenen Transaktionen.
8. Leerer Zustand für neue Wallets im Stil des Designs.

**Abnahme:** Testnetz-Guthaben stimmen auf jedem Netz mit dem Block-Explorer überein; ein unbekannter Token erscheint als nicht verifiziert; Chart-Endwert = angezeigter Gesamtwert.

### Phase 6 – Empfangen

1. Echte Adressen; Bitcoin zeigt die erste ungenutzte Empfangsadresse.
2. Echter QR-Code (Fehlerkorrektur mindestens M wegen Logo in der Mitte) im bestehenden Zellraster. Inhalt: reine Adresse; Bitcoin optional BIP21.
3. Kopieren, Teilen (natives Share-Sheet).
4. Netzwerkliste pro Asset aus der Registry.

**Abnahme:** QR-Codes werden von zwei anderen Wallet-Apps korrekt gelesen; Testnetz-Einzahlung erscheint im Portfolio.

### Phase 7 – Senden

1. Empfänger: `core/address.ts` + bestehende Warnlogik; „Bekannter Empfänger“ und Poisoning-Erkennung gegen den echten lokalen Empfängerverlauf; „Einfügen“ aus dem Clipboard; QR-Scan mit `expo-camera`; BIP21/EIP-681/Solana-Pay-URIs parsen (Betrag vorausfüllen, falsches Netz ablehnen).
2. Betrag: Token/Fiat-Umschaltung, Max = Guthaben minus geschätzte Gebühr bei nativen Coins; Warnung > 50 % bleibt.
3. Gebühren (immer „Langsam/Normal/Schnell“ mit Zeit und Fiat-Kosten):
   - EVM: EIP-1559 aus `eth_feeHistory` (Perzentile), Gas via `estimateGas`; Base und Optimism inkl. L1-Datengebühr (viem OP-Stack); BNB mit `gasPrice`.
   - Solana: Basisgebühr + Priority-Fee aus `getRecentPrioritizationFees`; Kosten für das Anlegen eines Associated Token Accounts ausweisen, wenn der Empfänger keinen hat.
   - Bitcoin: `mempool.space /api/v1/fees/recommended`, Coin-Selection, Dust-Grenze, RBF aktiviert, Wechselgeld an neue Change-Adresse.
4. Review mit **echter Simulation** (EVM `eth_call` + `estimateGas`, Solana `simulateTransaction`, Bitcoin PSBT-Validierung). „Simulation: Erfolgreich“ nur bei Erfolg, sonst Fehlertext und Button deaktiviert.
5. PIN-Sheet → `withSigner` → Signieren → Broadcast → Status. Ausstehende Transaktion sofort lokal speichern; Status-Polling bis bestätigt/fehlgeschlagen, auch nach App-Neustart.
6. Fehlerfälle mit verständlichen deutschen Texten: zu wenig native Coins für Gebühr, Nonce-Konflikt, abgelaufener Blockhash (neu bauen, erneut PIN), Broadcast-Fehler.
7. „Im Explorer ansehen“ öffnet den echten Explorer-Link.

**Abnahme:** Im Testnetz erfolgreiche Sends für ETH (Sepolia), ERC-20 auf einem L2-Testnetz, BNB-Testnet, SOL, SPL-Token (inkl. Empfänger ohne Token-Account) und BTC. Max-Send hinterlässt keinen unbrauchbaren Rest. Poisoning-Warnung erscheint bei präparierter Lookalike-Adresse.

### Phase 8 – Aktivität

1. Lokaler Verlauf für alle von Anthea gesendeten Transaktionen und Swaps.
2. Vollständiger Verlauf aus den Netzen:
   - **EVM (alle sechs Netze inkl. BNB Chain):** `/v1/evm/history` → Etherscan V2 (normale Transaktionen, interne Transaktionen, ERC-20-Transfers), paginiert, inkrementell nachgeladen. Fallback bei Proxy-Ausfall: Blockscout, wo vorhanden, sonst lokaler Verlauf plus Hinweis „Vollständiger Verlauf im Explorer“.
   - **Solana:** `getSignaturesForAddress` + `getTransaction`, Transfers und Swaps aus den Instruktionen ableiten.
   - **Bitcoin:** Esplora `/address/{addr}/txs` über alle Adressen, Ein-/Ausgänge saldieren.
3. Zusammenführen und Deduplizieren nach Hash; Gruppierung „HEUTE/GESTERN/Datum“; Statusfarben wie im Design.
4. Spam-Filter: eingehende Transfers nicht verifizierter Tokens und Kleinstbeträge von Lookalike-Adressen standardmäßig ausblenden (einblendbar).
5. TxDetail mit echtem Hash, Gebühr, Zeit, Explorer-Link.

**Abnahme:** Alle in Phase 7 und 9 erzeugten Transaktionen erscheinen mit korrektem Status; externe Einzahlungen erscheinen auf allen Netzen einschließlich BNB-Testnet.

### Phase 9 – Swaps

1. **Routing:** Solana → Solana: Jupiter. Alles andere (EVM same-chain, EVM ↔ EVM, EVM ↔ Solana): LI.FI. Bitcoin: in v1 deaktiviert (bestehender Toast).
2. **Token-Universum:** verifizierte Registry + LI.FI `/tokens` bzw. Jupiter verifiziert. Nicht verifizierte Tokens nicht swapbar.
3. **Quotes und Aktualisierung (verbindlich):**
   - Anfrage erst nach 600 ms Eingabe-Pause; laufende Anfrage bei neuer Eingabe abbrechen.
   - Eine Quote ist 30 s gültig; der Countdown im Design bleibt.
   - Automatische Aktualisierung nach Ablauf nur, solange Swap- oder Review-Screen sichtbar ist und die App im Vordergrund läuft, höchstens 3-mal hintereinander ohne Nutzeraktion.
   - Danach Zustand „Quote abgelaufen“ (freigegebene Ergänzung): Countdown-Balken leer, Zeile „Quote abgelaufen · Tippe zum Aktualisieren“, Weiter-Button deaktiviert. Jede Nutzeraktion setzt den Zähler zurück.
   - Eine abgelaufene Quote wird nie signiert; im Review wird vor der PIN-Abfrage bei Bedarf neu angefragt und bei schlechterem Mindestempfang erneut bestätigt.
   - Bei 429 des Anbieters: Hinweis „Zu viele Anfragen. Bitte in einer Minute erneut versuchen.“ und Backoff.
   - LI.FI mit `integrator=anthea`; Integrator-Gebühr gemäß Entscheidung 13.2 (bis dahin 0 %, wie im Design).
   - Jupiter: `/swap/v1/quote` + `/swap/v1/swap` mit `dynamicComputeUnitLimit` und begrenzter Priority-Fee.
   - Anzeige: Kurs, Mindestempfang, Preisauswirkung (Warnung > 3 %), Gebühren (Netz + Brücke + ggf. Anthea-Gebühr getrennt), Route, geschätzte Dauer – alles aus der Quote.
4. **Vertrags-Allowlist:** offizielle LI.FI-Vertragsadressen je Chain und offizielle Jupiter-Programm-IDs aus den offiziellen Dokumentationen, Quelle im Code kommentiert. Vor dem Signieren: EVM `tx.to` und `approvalAddress` in der Allowlist, `chainId` stimmt, `value` stimmt mit der Quote; Solana: nur Allowlist-Programme oder Standardprogramme (System, Token, Token-2022, ATA, Compute Budget). Abweichung = Abbruch.
5. **Freigaben (EVM):** bei `allowance < fromAmount` genau `fromAmount` freigeben, nie unbegrenzt; USDT-artige Tokens (erst auf 0 setzen) berücksichtigen. Eine PIN-Eingabe deckt Freigabe und Swap gemeinsam ab, beide Schritte sind im Review sichtbar (wie im Design); die zweite Signatur erfolgt erst nach Bestätigung der Freigabe on-chain.
6. **Ausführung:** Simulation vor Signatur; Broadcast direkt per RPC; Same-Chain-Status über die Chain; Cross-Chain-Status über LI.FI `/status` bis `DONE`/`FAILED` („Unterwegs“ → „Angekommen“). Teilerfolg (anderer Ziel-Token) klar anzeigen.
7. **MEV-Schutz auf Ethereum-Mainnet:** Swap-Transaktionen über einen keylosen privaten RPC (z. B. Flashbots Protect) senden; bei Ausfall normaler RPC mit Hinweis.
8. **Testnetz:** Swaps im Testnetz-Modus deaktiviert (Hinweis „Swaps sind im Testnetz nicht verfügbar“). Logik mit aufgezeichneten API-Antworten (Fixtures) testen; echte Verifikation in Phase 11 mit Kleinstbeträgen.

**Abnahme:** Fixture-Tests für Allowlist-Verstoß, exakte Freigabe, Mindestempfang, Nicht-Signieren abgelaufener Quotes; 30 Minuten offener Swap-Screen ohne Eingabe erzeugt höchstens 4 Quote-Anfragen.

### Phase 10 – Härtung

1. Keine Seeds, Schlüssel, PINs in Logs/Fehlern; Bundle-Scan in CI.
2. Threat-Model-Checkliste in `docs/SECURITY.md` abhaken: gestohlenes entsperrtes Gerät, gestohlenes gesperrtes Gerät, Backup-Extraktion, bösartiger RPC (Plausibilitätsprüfungen, Gebühren-Obergrenze mit Warnung), kompromittierter Proxy (nur Anzeigewerte betroffen; kritische Werte im Review stammen aus RPC/Quote), manipulierte Swap-API (Allowlist), Clipboard-Hijacking, Phishing-Tokens.
3. Proxy: Penetrationstest der Eingabevalidierung, Prüfung, dass keine Adressen/IPs geloggt werden.
4. Barrierefreiheit: Screenreader-Labels (VoiceOver/TalkBack), Mindestgrößen von Touch-Zielen, dynamische Schriftgrößen ohne Layoutbruch.
5. Performance: Cold-Start < 2 s bis PIN-Screen, flüssige Listen auf Mittelklasse-Android.
6. Abhängigkeiten auditieren, unnötige entfernen.

### Phase 11 – Mainnet-Freigabe und Auslieferung

1. Bezahlten RPC-Anbieter (ohne Identitätsprüfung) für Solana und die EVM-Netze als primären Endpunkt über den Proxy einbinden, öffentliche Endpunkte als Fallback; eigene Nutzer-Endpunkte haben weiterhin Vorrang.
2. Mainnet freischalten; interne Tests mit Kleinstbeträgen auf jedem Netz (Senden, Empfangen, jeder Swap-Typ, eine Cross-Chain-Route).
3. **Unabhängiges Sicherheitsaudit** von App und Proxy vor der öffentlichen Veröffentlichung.
4. Store-Vorbereitung: Datenschutzangaben (App Store „Privacy Nutrition Label“, Google Play „Data safety“ – ehrlich: keine Datenerhebung durch Anthea; Drittanbieter in `PRIVACY.md` benannt), Google-Play-Erklärung als Non-Custodial-Wallet im Financial-Features-Formular, Screenshots, Beschreibung.
5. Veröffentlichung gemäß Abschnitt 13, Punkt 5.

---

## 7. Datenhaltung (Übersicht)

| Daten | Ort | Schutz |
|---|---|---|
| Seed-Entropie (Vault) | Secure Storage | PIN + deviceSecret |
| deviceSecret | Keychain / Keystore | hardwaregestützt, nur dieses Gerät |
| PIN-Fehlversuche, Sperrzeit | Secure Storage | Plattform |
| Öffentliche Adressen, BTC-Adressindex | Secure Storage | Plattform |
| Einstellungen, Watchlist, eigene RPCs | MMKV | nicht geheim |
| Lokaler Aktivitäts- und Empfängerverlauf | MMKV | vom Backup ausgeschlossen |
| Markt-/Preis-Cache | MMKV | nicht geheim |
| Beim Proxy | nichts Persistentes außer Marktdaten-Cache | — |

---

## 8. Mapping Prototyp → echte Implementierung

| Prototyp | Ersetzt durch |
|---|---|
| `SEED`, `WORDS`, `VERIFY` | `core/mnemonic.ts`, BIP39-Wortliste, Zufallsauswahl |
| `ADDR`, `FRESH` | `core/derive.ts`, Session-Public-Daten |
| `RECENT`, `POISON` | lokaler Empfängerverlauf, `core/poisoning.ts` |
| `ASSETS` | Balances × Preise × Token-Registry |
| `COINS`, `RATES` | Proxy `/v1/markets`, `/v1/fx` |
| `chart()` (Seeds, Glättung) | echte Punkte, gerade Segmente, Scrubbing |
| `FEES` | `ChainAdapter.estimateFees` |
| `RCV`, `SWAPPABLE` | Chain- und Token-Registry |
| `RPCS` | `chains/registry.ts` + Einstellungen |
| `INITIAL_ACTIVITY`, `startStatus`-Timer | `state/activity.ts` + echtes Status-Polling |
| `qrCells()` | echter QR-Encoder |
| `validateAddress()` Regex | `core/address.ts` + bestehende Texte |
| `pinFirst` im React-State | Vault; PIN nur kurz im Eingabepuffer bis zur KDF |
| Swap-Berechnungen (`impact`, `outN`, `swFee`) | Werte aus LI.FI-/Jupiter-Quote |
| DOM/CSS (`div`, `button`, `backdropFilter`, `styles.css`) | React-Native-Komponenten, `expo-blur`, `Pressable`-Zustände |

---

## 9. Teststrategie

- **Unit (Jest):** `core/` vollständig, Adapter mit gemockten RPC-Antworten, Swap-Logik mit Fixtures, Poisoning-Erkennung, Betrags-Parsing (Grenzfälle), Chart-Konsistenz (letzter Punkt = Preis, Hoch/Tief).
- **Proxy:** Unit-Tests mit gemockten Anbietern (Vitest oder Workers-Testumgebung), Tests für Validierung, Cache, Budget-Wächter.
- **Integration:** Adapter gegen echte Testnetze mit einer Test-Wallet, deren Phrase nur als CI-Secret existiert und nur Testnetz-Guthaben hält.
- **E2E (Maestro) auf Simulator/Emulator:** Onboarding, Sperre, Send-Flow; für deterministische EVM-Tests ein lokaler Knoten (Anvil).
- **Manuell auf echten Geräten** (mind. ein iPhone, ein Mittelklasse-Android): Sperrverhalten, Screenshot-Schutz, Kamera-Scan, Hintergrund/Vordergrund, Performance.

---

## 10. Definition of Done für v1

- Alle Phasen-Abnahmen erfüllt, CI grün.
- Keine Mock-Daten mehr außer Farben/statischer Konfiguration.
- Die App kontaktiert nur Hosts aus Abschnitt 4.4, den Proxy und nutzerdefinierte RPCs (per Netzwerk-Mitschnitt geprüft).
- `docs/SECURITY.md` und `docs/PRIVACY.md` vollständig; Audit abgeschlossen und Befunde behoben.
- Mit derselben Phrase in etablierten Wallets (MetaMask/Rabby, Phantom, Sparrow/BlueWallet) importiert ergeben sich dieselben Adressen.

---

## 11. Arbeitsweise für den Agenten

- Ein Pull Request pro Phase (große Phasen gerne aufgeteilt) mit Beschreibung und Testnachweis.
- Nach jeder Phase: kurze Zusammenfassung, offene Punkte, Screenshots der betroffenen Screens.
- Keine stillen Designänderungen außer den freigegebenen Ergänzungen, keine neuen externen Dienste, keine neuen Abhängigkeiten ohne Begründung.
- Bei Widersprüchen gilt: Sicherheit > dieser Plan > Prototyp. Im Zweifel fragen.

---

## 12. Glossar

- **Non-Custodial:** Nur der Nutzer besitzt die Schlüssel; niemand sonst (auch nicht Anthea) kann Gelder bewegen oder wiederherstellen.
- **Vault:** verschlüsselter Container für die Seed-Entropie.
- **Daten-Proxy:** Anthea-eigener Dienst, der lizenzierte Daten abruft und cacht; berührt nie Schlüssel oder Transaktionen.
- **Allowlist:** feste Liste vertrauenswürdiger Vertrags-/Programmadressen für Swaps.
- **Address Poisoning:** Angreifer senden Kleinstbeträge von Adressen, die einer bekannten ähneln, damit der Nutzer die falsche aus dem Verlauf kopiert.

---

## 13. Entscheidungen

### 13.1 Getroffen (verbindlich)

| # | Thema | Entscheidung |
|---|---|---|
| 1 | Plattform | React Native mit Expo, lokale Builds (Abschnitt 4.1) |
| 2 | PIN-Fehlversuche | nur steigende Wartezeiten, **nie löschen** |
| 3 | Biometrie | nicht in v1 |
| 4 | Kommerzielle Nutzung | eigener Daten-Proxy; kostenpflichtiger Marktdaten-Plan mit kommerzieller Lizenz (Standard CoinGecko, austauschbar); Etherscan V2 kostenpflichtig; keine Keys in der App |
| 5 | Vertrieb | **iOS:** Apple verlangt, dass Wallet-Apps von Entwicklern angeboten werden, die als Organisation registriert sind (App Review Guideline 3.1.5(b)(i)) – also Firma plus D-U-N-S-Nummer. **Android:** Google Play nimmt Non-Custodial-Wallets von seiner Lizenzpflicht für Krypto-Apps aus; Entwicklerkonto mit Identitätsprüfung ist trotzdem nötig. Auch Direktinstallation (APK) ist kein KYC-freier Weg mehr: Google führt ab 30.09.2026 in ersten Ländern und ab 2027 weltweit eine Entwicklerverifizierung auch für Apps außerhalb von Google Play ein. Empfehlung: Veröffentlichung über App Store und Google Play unter einer Firma. |
| 6 | Swap-Quotes | begrenzte automatische Aktualisierung + Zustand „Quote abgelaufen“ (Phase 9) |
| 7 | Preise und Charts | Genauigkeitsregeln aus Phase 4; Portfolio-Chart = Wertentwicklung der aktuellen Bestände mit Hinweis, ab erster Aktivität; echte Wertentwicklung in v2 |
| 8 | Verlauf | Etherscan V2 über den Proxy für alle EVM-Netze inkl. BNB Chain; Solana per RPC; Bitcoin per Esplora |
| 9 | App-ID | Reverse-Domain einer Domain, die Anthea gehört, z. B. `com.antheawallet.app` bei Domain `antheawallet.com`; iOS Bundle ID und Android `applicationId` identisch; Anzeigename „Anthea“. Die ID ist nach Veröffentlichung nicht mehr änderbar. |
| 10 | Rechtliches | Swaps werden von Drittanbietern ausgeführt und sind non-custodial. Eine rechtliche Prüfung vor dem öffentlichen Start bleibt empfohlen, besonders falls Anthea eine Swap-Gebühr erhebt. |

### 13.2 Noch offen (Produktinhaber)

1. **Firma:** Gründung bzw. Rechtsträger für das Apple-Organisationskonto (D-U-N-S) und das Google-Konto.
2. **Domain** für App-ID, Proxy-URL, Datenschutzerklärung und Support.
3. **Geschäftsmodell:** Soll Anthea an Swaps verdienen (LI.FI-Integrator-Gebühr bzw. Jupiter-Plattformgebühr, z. B. 0,25–0,85 %)? Bis zur Entscheidung 0 %; die Gebühr wird im Swap-Review immer separat ausgewiesen.
4. **Budget** für Marktdaten-Plan, Etherscan-Plan, RPC-Anbieter und Hosting; danach konkrete Pläne wählen und Budget-Rechnung dokumentieren.
5. **Namensprüfung:** Verfügbarkeit von „Anthea“ in App Store/Google Play und markenrechtliche Kollisionen.
