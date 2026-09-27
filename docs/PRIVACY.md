# Anthea – Datenschutz: Wer sieht welche Daten?

Anthea erhebt selbst keine Daten über Nutzer: kein Konto, kein KYC, keine Analytics, kein Tracking, keine
Crash-Reports. Trotzdem muss ein Wallet mit Blockchains und Datendiensten sprechen. Dieses Dokument listet für jeden
Dienst, welche Daten er dabei zwangsläufig sieht. Grundlage sind `docs/BUILD_PLAN.md` (Abschnitte 4.3 und 4.4) und die
Datenschutzangaben für App Store und Google Play (Phase 11).

**Stand:** Phase 2. Die App arbeitet noch mit Mock-Daten. Einzige Verbindung: Beim **Import** einer Phrase fragt sie
bei mempool.space (Bitcoin testnet4) ab, welche abgeleiteten Bitcoin-Adressen schon benutzt wurden (Gap-Limit 20).
mempool.space sieht dabei die IP-Adresse und diese Adressen. Neu erstellte Wallets bauen keine Verbindung auf. Die
Tabelle beschreibt den Zielzustand von v1 und wird mit jeder Phase geprüft.

## Grundsätze

- Schlüssel, Seed und PIN verlassen das Gerät nie (siehe `docs/SECURITY.md`).
- Die App kontaktiert nur die unten aufgeführten Hosts, den Anthea-Proxy und vom Nutzer selbst eingetragene
  RPC-Endpunkte. Das wird vor v1 per Netzwerk-Mitschnitt geprüft.
- Blockchain-Adressen sind pseudonym, aber öffentlich. Wer eine Adresse zusammen mit einer IP-Adresse sieht, kann
  beides verknüpfen. Eigene RPC-Endpunkte (Einstellungen → Netzwerke & RPC) reduzieren das.
- Alle Verbindungen laufen über HTTPS; eigene Endpunkte werden nur mit `https://` akzeptiert.

## Übersicht

| Dienst | Wofür | Was der Dienst sieht | Weg |
|---|---|---|---|
| **Anthea-Proxy** (`anthea-api`, Cloudflare Workers) | Marktdaten, Charts, Wechselkurse, Token-Preise; EVM-Verlauf und Token-Erkennung | IP-Adresse (nur im Speicher für Rate-Limiting), angefragte Coins/Zeiträume; bei Verlauf/Token-Erkennung die EVM-Adresse und Chain. Kein Logging, keine Speicherung, adressbezogene Antworten höchstens 30 s im Speicher | direkt |
| **Cloudflare** (Betreiber der Worker-Plattform) | Hosting des Proxys | technisch alle Anfragen an den Proxy (IP, Pfad inkl. Adresse), gemäß Cloudflare-Datenschutzrichtlinie | direkt |
| **CoinGecko** (kostenpflichtiger Plan) | Preise, Märkte, Charts, Token-Preise | nur Anfragen des Proxys; keine Nutzer-IP, keine Adressen | über Proxy |
| **Etherscan API V2** | EVM-Verlauf und Token-Erkennung (alle EVM-Netze inkl. BNB Chain) | angefragte EVM-Adressen, aber nur mit der IP des Proxys | über Proxy |
| **Blockscout** (Fallback) | EVM-Verlauf bei Proxy-Ausfall | IP-Adresse und EVM-Adresse | direkt |
| **EVM-RPC** (`*.publicnode.com` + keylose Fallbacks; ab Phase 11 zusätzlich ein bezahlter Anbieter) | Guthaben, Gebühren, Simulation, Broadcast, Status | IP-Adresse, eigene Adresse, Empfänger, signierte Transaktionen | direkt |
| **Solana-RPC** (publicnode + Fallbacks; vor Mainnet bezahlter Anbieter) | Guthaben, Token-Konten, Gebühren, Simulation, Broadcast, Verlauf | IP-Adresse, Solana-Adresse, signierte Transaktionen | direkt |
| **mempool.space** / Fallback **blockstream.info** | Bitcoin-Guthaben, Verlauf, Gebühren, Broadcast | IP-Adresse, alle abgeleiteten Bitcoin-Adressen (Gap-Limit-Scan), signierte Transaktionen | direkt |
| **Jupiter Tokens API** (`api.jup.ag`) | Solana-Token-Liste und Verifizierung | IP-Adresse | direkt |
| **LI.FI** (`li.quest`) | Swaps EVM same-chain, EVM↔EVM, EVM↔Solana; Cross-Chain-Status | IP-Adresse, Absender-/Empfängeradresse, Swap-Parameter, Transaktions-Hash | direkt |
| **Jupiter Swap API** (`api.jup.ag`) | Swaps Solana↔Solana | IP-Adresse, Solana-Adresse, Swap-Parameter | direkt |
| **Flashbots Protect** (keyloser privater RPC) | MEV-Schutz für Swaps auf Ethereum-Mainnet | IP-Adresse, signierte Swap-Transaktion | direkt |
| **Eigene RPC-Endpunkte** des Nutzers | ersetzt die Standard-Endpunkte | was der jeweilige Betreiber protokolliert | direkt |
| **Block-Explorer** (z. B. Etherscan, Solscan, mempool.space) | nur wenn der Nutzer „Im Explorer ansehen“ antippt | IP-Adresse, Transaktions-Hash/Adresse; im Browser des Nutzers | extern |
| **Apple App Store / Google Play** | Vertrieb und Updates | Installations- und Kontodaten gemäß Store-Richtlinien; Anthea erhält davon nichts Personenbezogenes | — |

## Was auf dem Gerät bleibt

- Kamera (QR-Scan) wird ausschließlich lokal ausgewertet.
- Zwischenablage: Anthea liest sie nur, wenn der Nutzer „Einfügen“ antippt. Adressen können kopiert werden und werden nach 60 s wieder entfernt, falls unverändert. Der Seed kann
  nie kopiert werden.
- Einstellungen, Watchlist, lokaler Aktivitäts- und Empfängerverlauf sowie Preis-Caches liegen lokal (MMKV, vom Backup
  ausgeschlossen).
- Schriften (Nunito) sind in der App gebündelt; es gibt keine Abrufe bei Google Fonts.

## Entwicklungswerkzeuge

- Development Builds (`expo-dev-client`) verbinden sich mit dem lokalen Metro-Server des Entwicklers. Das betrifft nur
  Entwicklungs-Builds, nicht die Store-Version.
- Die Wrangler-CLI-Telemetrie ist im Proxy-Projekt abgeschaltet (`send_metrics = false`).

## Offene Punkte

- Konkrete Anbieterpläne und Verträge (CoinGecko, Etherscan, RPC, Hosting) hängen von der Budget-Entscheidung ab
  (BUILD_PLAN 13.2, Punkt 4).
- Datenschutzerklärung, Kontaktadresse und Store-Angaben folgen mit Firma und Domain (13.2, Punkte 1 und 2).
