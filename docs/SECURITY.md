# Anthea – Sicherheitsmodell

Dieses Dokument beschreibt das Sicherheitsmodell von Anthea v1 (Quelle: `docs/BUILD_PLAN.md`, Abschnitte 2, 5 und 7) und
den Umsetzungsstand. Es wird mit jeder Phase fortgeschrieben; die Threat-Model-Checkliste wird in Phase 10 abgehakt.

**Stand:** Phase 0. Die App ist eine Portierung der Oberfläche mit Mock-Daten. Es gibt noch **keine** echten Schlüssel,
keine Verschlüsselung und keine Netzwerkzugriffe. Der Build darf nicht mit echten Werten verwendet werden.

## 1. Grundsätze

1. **Non-Custodial:** Private Schlüssel entstehen und bleiben ausschließlich auf dem Gerät. Niemand sonst, auch nicht
   Anthea, kann Gelder bewegen oder wiederherstellen.
2. **Der Seed verlässt nie das Gerät:** keine Übertragung, kein Logging, kein Clipboard, kein Screenshot, kein
   Cloud-Backup, kein Einbetten in Fehlermeldungen. Das gilt auch für private Schlüssel und die PIN.
3. **Keine Geheimnisse in der App:** Kostenpflichtige API-Keys liegen nur als Secrets im Daten-Proxy (`server/`).
4. **Keine Telemetrie:** keine Analytics, keine Crash-Reporter, keine Remote-Logs, keine Remote-Fonts (Nunito ist lokal
   gebündelt).
5. **Beträge nie als Float:** On-Chain-Beträge sind `bigint` in Basiseinheiten; Floats nur für die Fiat-Anzeige.
6. **Nur geprüfte Kryptografie-Bibliotheken** (`@scure/*`, `@noble/*`, `react-native-quick-crypto`), keine eigene
   Kryptografie, kein `Math.random()` für Sicherheitsrelevantes.
7. **Kompromittierter Proxy ≠ Geldverlust:** Guthaben, Gebühren, Simulation, Broadcast und Status laufen direkt vom
   Gerät über RPC; Swaps direkt zu LI.FI bzw. Jupiter. Ein manipulierter Proxy kann nur Anzeigewerte verfälschen.

## 2. Schlüsselableitung (Phase 1)

| Familie | Pfad | Hinweis |
|---|---|---|
| Mnemonic | BIP39, 128 Bit Entropie (12 Wörter) bei Neuanlage; Import 12 oder 24 Wörter | keine BIP39-Passphrase in v1 |
| EVM | `m/44'/60'/0'/0/0` | eine Adresse für alle EVM-Netze |
| Solana | `m/44'/501'/0'/0'` (SLIP-0010, ed25519) | kompatibel mit Phantom/Solflare |
| Bitcoin | BIP84: Empfang `m/84'/0'/0'/0/i`, Wechselgeld `m/84'/0'/0'/1/i`; Testnetz Coin-Type `1'` | Gap-Limit 20, nach Nutzung neue Adresse |

Pflicht-Testvektoren: `test test … junk` → EVM `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`; `abandon … about` → erste
BIP84-Adresse `bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu`; Solana gegen einen dokumentierten Vektor; offizielle
BIP39-Vektoren (Trezor).

## 3. Vault: Verschlüsselung des Seeds (Phase 1)

Eine 6-stellige PIN hat nur 10⁶ Möglichkeiten. Ein nur PIN-verschlüsselter Seed wäre offline schnell geknackt. Deshalb
hängt der Schlüssel zusätzlich an einem Gerätegeheimnis:

1. `deviceSecret`: 32 zufällige Bytes in `expo-secure-store` (iOS Keychain `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, keine
   iCloud-Synchronisation; Android Keystore-gestützt). Verlässt das Gerät nie.
2. `pinKey = scrypt(PIN, salt, N=2^17, r=8, p=1)` über `react-native-quick-crypto`, Ziel ca. 0,5–1 s auf einem
   Mittelklasse-Gerät. Parameter im Vault-Header (versioniert für Migration).
3. `vaultKey = HKDF-SHA256(pinKey ‖ deviceSecret, info="anthea-vault-v1")`.
4. Verschlüsselt wird die **Entropie** (nicht der Wort-String) mit AES-256-GCM, zufällige Nonce, Header als Associated
   Data.
5. Der Blob liegt im Secure Storage.
6. Backups: Android `allowBackup=false` (bereits in `app.config.ts` gesetzt) bzw. Data-Extraction-Rules; iOS schließt
   nicht geheime Wallet-Dateien vom iCloud-Backup aus.

Einziger Weg an Schlüsselmaterial ist `withSigner(pin, family, index, fn)`: Seed entschlüsseln, nur den benötigten
Schlüssel ableiten, `fn` ausführen, danach alle Byte-Arrays mit Nullen überschreiben (best effort).

## 4. PIN, Sperre und Sitzung (Phase 2)

- Fehlversuchszähler im Secure Storage (überlebt Neustarts). Ab 5 Fehlversuchen steigende Wartezeiten: 1 min, 5 min,
  15 min, 1 h, danach jeweils 1 h. **Es wird nie automatisch gelöscht.**
- Auto-Lock nach 1/5/15 min Inaktivität; beim Wechsel in den Hintergrund startet der Timer. Der App-Switcher zeigt immer
  eine Abdeckung.
- Nach dem Entsperren hält die Sitzung nur **öffentliche** Daten. Für jede Signatur und für „Phrase anzeigen“ wird der
  Seed neu mit der PIN entschlüsselt.
- PIN ändern: alte PIN prüfen, Vault mit neuer PIN neu verschlüsseln, atomar schreiben.
- Wallet zurücksetzen: Vault, `deviceSecret`, Zähler, Caches und Einstellungen löschen.

## 5. Weitere Schutzmaßnahmen

| Maßnahme | Phase | Stand |
|---|---|---|
| Screenshot-Schutz auf Seed-, Verify-, Import- und Reveal-Screens (Android `FLAG_SECURE`; iOS Aufnahme abdecken, Screenshot-Warnung) | 2 | offen |
| Seed-Eingabefelder ohne Autokorrektur, Vorschläge, Autofill und Kontextmenü | 0/2 | Props gesetzt (`SEED_INPUT_PROPS`), Prüfung auf Geräten offen |
| Adressen kopieren erlaubt, Seed nie; Clipboard nach 60 s leeren, falls unverändert | 6/7 | offen |
| Keine dynamisch nachgeladenen Skripte, kein `eval`, keine Remote-Assets | 0 | eingehalten (Fonts lokal) |
| Produktions-Build ohne Dev-Menü und Debug-Logs; Bundle-Scan nach verbotenen Mustern in CI | 10 | offen |
| Vor dem Signieren Chain-ID, `from`, Empfänger/Vertrag, Betrag und Gebühr gegen den Review-Screen prüfen | 7/9 | offen |
| Swap-Vertrags-Allowlist, exakte Token-Freigaben, abgelaufene Quotes nie signieren | 9 | offen |
| Address-Poisoning-Erkennung gegen den echten Empfängerverlauf | 7 | Prototyp-Logik vorhanden |

## 6. Datenhaltung

| Daten | Ort | Schutz |
|---|---|---|
| Seed-Entropie (Vault) | Secure Storage | PIN + `deviceSecret` |
| `deviceSecret` | Keychain / Keystore | hardwaregestützt, nur dieses Gerät |
| PIN-Fehlversuche, Sperrzeit | Secure Storage | Plattform |
| Öffentliche Adressen, BTC-Adressindex | Secure Storage | Plattform |
| Einstellungen, Watchlist, eigene RPCs | MMKV | nicht geheim |
| Lokaler Aktivitäts- und Empfängerverlauf | MMKV | vom Backup ausgeschlossen |
| Markt-/Preis-Cache | MMKV | nicht geheim |
| Beim Proxy | nichts Persistentes außer Marktdaten-Cache | — |

## 7. Daten-Proxy (`server/`)

- Zustandslos; Keys nur als Worker-Secrets.
- Eingaben strikt validiert (Chain-, Range-Whitelist, Adressformat); alles andere 400/404/405.
- Kein Request-Logging (`observability` aus), Fehler ohne Details und ohne Adressen/IPs.
- Rate-Limit pro IP nur im Speicher; adressbezogene Antworten nicht oder höchstens 30 s im Speicher gecacht.
- Stand Phase 0: nur `GET /v1/health`; unbekannte Pfade 404, andere Methoden 405, unerwartete Fehler 500 ohne Logging.

## 8. Prototyp-Hilfen, die vor dem Release entfernt werden (Phase 2)

Diese Hilfen stammen aus dem Web-Prototyp und existieren in Phase 0 bewusst noch. In einem echten Build dürfen sie
nicht vorkommen:

- URL-Parameter `?start=`, `?testnet=`, `?privacy=` (nur in der Web-Vorschau ausgewertet, `src/config.ts`).
- „Beliebige 6 Ziffern werden akzeptiert“, wenn das Onboarding übersprungen wurde.
- `importDemo` („Testphrase“), `pasteTo` (fügt absichtlich eine Poisoning-Adresse ein), `scanTo` (feste Adresse).
- `pinFirst`: die PIN liegt im Klartext im React-State.
- Feste Mock-Seed-Wörter in `src/data.ts`.

## 9. Threat-Model-Checkliste (Phase 10)

- [ ] Gestohlenes entsperrtes Gerät
- [ ] Gestohlenes gesperrtes Gerät
- [ ] Backup-Extraktion
- [ ] Bösartiger RPC (Plausibilitätsprüfungen, Gebühren-Obergrenze mit Warnung)
- [ ] Kompromittierter Proxy (nur Anzeigewerte betroffen; kritische Werte im Review stammen aus RPC/Quote)
- [ ] Manipulierte Swap-API (Allowlist)
- [ ] Clipboard-Hijacking
- [ ] Phishing-Tokens

## 10. Sicherheitslücken melden

Bis zur öffentlichen Veröffentlichung bitte direkt an den Produktinhaber melden; eine Kontaktadresse folgt mit der
Domain (BUILD_PLAN 13.2).
