# Anthea – Sicherheitsmodell

Dieses Dokument beschreibt das Sicherheitsmodell von Anthea v1 (Quelle: `docs/BUILD_PLAN.md`, Abschnitte 2, 5 und 7) und
den Umsetzungsstand. Es wird mit jeder Phase fortgeschrieben; die Threat-Model-Checkliste wird in Phase 10 abgehakt.

**Stand:** Phase 2. Onboarding, PIN und Sperre arbeiten mit dem echten Kern: zufällige Phrase, Vault, Fehlversuchszähler,
Auto-Lock, „Phrase anzeigen“, „PIN ändern“ und „Wallet zurücksetzen“. Die Empfangsadresse und ihr QR-Code sind echt
(aus Phase 6 vorgezogen, damit „Import ergibt dieselben Adressen“ prüfbar ist). **Netzwerk: Testnetze** (Bitcoin
testnet4); Guthaben, Kurse, Verlauf und Senden zeigen weiterhin Mock-Daten. Einzige Netzwerkverbindung: der
Bitcoin-Adressscan beim Import (mempool.space). Der Build darf nicht mit echten Werten verwendet werden.

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

## 2. Schlüsselableitung (Phase 1, umgesetzt: `src/core/mnemonic.ts`, `src/core/derive.ts`)

| Familie | Pfad | Hinweis |
|---|---|---|
| Mnemonic | BIP39, 128 Bit Entropie (12 Wörter) bei Neuanlage; Import 12 oder 24 Wörter | keine BIP39-Passphrase in v1 |
| EVM | `m/44'/60'/0'/0/0` | eine Adresse für alle EVM-Netze |
| Solana | `m/44'/501'/0'/0'` (SLIP-0010, ed25519) | kompatibel mit Phantom/Solflare |
| Bitcoin | BIP84: Empfang `m/84'/0'/0'/0/i`, Wechselgeld `m/84'/0'/0'/1/i`; Testnetz Coin-Type `1'` | Gap-Limit 20, nach Nutzung neue Adresse |

Pflicht-Testvektoren (alle grün, `src/core/__tests__/derive.test.ts`, `mnemonic.test.ts`):
`test test … junk` → EVM `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`; `abandon … about` → BIP84
`bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu` (plus zweite Empfangs- und erste Wechselgeldadresse aus BIP84);
Solana `abandon … about` → `HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk`, gegengeprüft mit einer unabhängigen
Implementierung (ed25519-hd-key + tweetnacl); alle 24 englischen BIP39-Vektoren der Trezor-Referenz.

Private Schlüssel entstehen nur in `deriveKey`; Zwischenknoten werden überschrieben. `derivePublic` liefert nur
Adressen.

## 3. Vault: Verschlüsselung des Seeds (Phase 1, umgesetzt: `src/core/vault.ts`)

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

Format: `{"h": <Header-JSON>, "c": <Base64-Ciphertext>}`. Der Header (`v`, `kdf`, `N`, `r`, `p`, `salt`, `nonce`) wird
wortgleich gespeichert, weil seine Bytes die Associated Data sind: Jede Änderung, auch an den KDF-Parametern, lässt
die Entschlüsselung scheitern. Falsche PIN, fremdes `deviceSecret` und manipulierter Ciphertext führen zum selben
Fehler (`decrypt-failed`); Fehlermeldungen enthalten nie PINs, Schlüssel oder Klartext. Header mit unplausiblen
Parametern (N > 2^20, r > 32, p > 16) werden abgelehnt.

Einziger Weg an Schlüsselmaterial ist `withSigner(pin, family, index, fn)` (`src/state/keyring.ts`): Vault
entschlüsseln, nur den benötigten Schlüssel ableiten, `fn` ausführen, danach Entropie, Seed und privaten Schlüssel
mit Nullen überschreiben (best effort, auch wenn `fn` wirft). Die entsperrte Sitzung hält nur öffentliche Adressen.
PIN ändern schreibt den neuen Vault zuerst unter einen temporären Schlüssel, prüft ihn und ersetzt erst dann den alten.

### KDF-Dauer (Abnahme Phase 1)

Gemessen im Development Build über das Expo-Entwicklermenü → „Vault-KDF messen“ (scrypt N=2^17, r=8, p=1,
react-native-quick-crypto, drei Läufe). Ziel laut 5.2: ca. 0,5–1 s auf einem Mittelklasse-Gerät.

| Gerät | Messung | Datum |
|---|---|---|
| Android-Emulator (sdk_gphone16k_x86_64, API 37) auf dem Entwickler-PC | 488 ms · 463 ms · 418 ms | 2026-09-27 |
| Echtes Mittelklasse-Android | ausstehend | |
| iPhone | ausstehend | |

## 4. PIN, Sperre und Sitzung (Phase 2, umgesetzt: `src/core/pinPolicy.ts`, `src/state/session.ts`, `src/useWallet.tsx`)

- Fehlversuchszähler im Secure Storage (`anthea.pinAttempts`, überlebt Neustarts). 5 freie Versuche, danach steigende
  Wartezeiten: 1 min, 5 min, 15 min, 1 h, danach jeweils 1 h. **Es wird nie automatisch gelöscht.** Ein unlesbarer
  Zähler gilt als „viele Fehlversuche“ (fail closed). Nur eine richtige PIN oder „Wallet zurücksetzen“ setzt ihn zurück.
  Der Zähler gilt für Entsperren, Signatur-Bestätigung, „Phrase anzeigen“ und „PIN ändern“ gemeinsam.
- Die Wartezeit hängt an der Geräteuhr. Wer die Systemzeit vorstellt, verkürzt sie; die Zahl der Versuche bleibt davon
  unberührt, und jeder Versuch kostet die volle KDF-Zeit. Ein monotoner Zeitgeber über Neustarts hinweg existiert auf
  beiden Plattformen nicht; das Restrisiko ist akzeptiert, weil der Vault ohne `deviceSecret` ohnehin nicht offline
  angreifbar ist.
- Auto-Lock nach 1/5/15 min Inaktivität (Einstellung in MMKV, Standard 5 min). Gemessen wird ab der letzten Berührung;
  im Hintergrund läuft die Zeit weiter, bei Rückkehr wird sofort geprüft. Kaltstart ist immer gesperrt.
- App-Umschalter (Entscheidung 2026-09-27): iOS verdeckt die Vorschau mit einem Weichzeichner (`expo-screen-capture`,
  `enableAppSwitcherProtectionAsync`). Android: `FLAG_SECURE` nur auf den Phrasen-Screens, dort ist die Vorschau
  schwarz; sonst legt die App beim Verlassen eine schwarze Abdeckung über den Inhalt. Das ist **best effort**, weil
  Android den Vorschau-Screenshot teils vor dem Zustandswechsel aufnimmt.
- Nach dem Entsperren hält die Sitzung nur **öffentliche** Daten (Adressen, Bitcoin-xpub). Für jede Signatur und für
  „Phrase anzeigen“ wird der Seed neu mit der PIN entschlüsselt. PIN-Ziffern und Phrase liegen nicht im allgemeinen
  App-State; die Entropie wird nach dem Onboarding überschrieben, Strings (Wörter) lassen sich in JavaScript nicht
  sicher löschen und werden nur so kurz wie möglich gehalten.
- PIN ändern: alte PIN prüfen, Vault mit neuer PIN neu verschlüsseln, unter temporärem Schlüssel schreiben, prüfen,
  dann ersetzen.
- Wallet zurücksetzen: Vault, `deviceSecret`, öffentliche Daten, Zähler und Einstellungen löschen (Caches folgen mit
  den Phasen, die sie einführen).
- Bitcoin: Beim Import werden Empfangs- und Wechseladressen mit Gap-Limit 20 gescannt (`src/core/btcScan.ts`, nur
  öffentliche Ableitung aus dem xpub). Neu erstellte Wallets scannen nicht.

## 5. Weitere Schutzmaßnahmen

| Maßnahme | Phase | Stand |
|---|---|---|
| Screenshot-Schutz auf Seed-, Verify-, Import- und Reveal-Screens (Android `FLAG_SECURE`; iOS Aufnahme abdecken, Screenshot-Warnung) | 2 | umgesetzt (`src/platform/screenCapture.ts`); Android-Berechtigung `DETECT_SCREEN_CAPTURE` bewusst entfernt |
| Seed-Eingabefelder ohne Autokorrektur, Vorschläge, Autofill und Kontextmenü | 0/2 | Props gesetzt (`SEED_INPUT_PROPS`); `keyboardType="visible-password"` (Android) noch offen, weil es mit mehrzeiligen Feldern kollidiert |
| Verdeckte Seed-Wörter werden nicht gerendert (nur Platzhalter) | 0 | umgesetzt |
| Backup/Gerätetransfer: `allowBackup=false` und Data-Extraction-Rules für den Secure Store (Android 12+) | 1 | umgesetzt (expo-secure-store-Plugin) |
| Secure Store nur auf diesem Gerät und im entsperrten Zustand (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) | 1 | umgesetzt |
| Adressen kopieren erlaubt, Seed nie; Clipboard nach 60 s leeren, falls unverändert | 6/7 | offen („Einfügen“ liest die Zwischenablage seit Phase 2 nur auf Knopfdruck) |
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
| Öffentliche Adressen, Bitcoin-xpub und bekannte BTC-Adressen | Secure Storage | Plattform |
| Einstellungen (ab Phase 2: Auto-Lock), Watchlist, eigene RPCs | MMKV | nicht geheim |
| Lokaler Aktivitäts- und Empfängerverlauf | MMKV | vom Backup ausgeschlossen |
| Markt-/Preis-Cache | MMKV | nicht geheim |
| Beim Proxy | nichts Persistentes außer Marktdaten-Cache | — |

## 7. Daten-Proxy (`server/`)

- Zustandslos; Keys nur als Worker-Secrets.
- Eingaben strikt validiert (Chain-, Range-Whitelist, Adressformat); alles andere 400/404/405.
- Kein Request-Logging (`observability` aus), Fehler ohne Details und ohne Adressen/IPs.
- Rate-Limit pro IP nur im Speicher; adressbezogene Antworten nicht oder höchstens 30 s im Speicher gecacht.
- Stand Phase 0: nur `GET /v1/health`; unbekannte Pfade 404, andere Methoden 405, unerwartete Fehler 500 ohne Logging.

## 8. Prototyp-Hilfen (in Phase 2 entfernt)

Entfernt wurden: die URL-Parameter `?start=`, `?testnet=`, `?privacy=` (`src/config.ts`), „beliebige 6 Ziffern werden
akzeptiert“, die Testphrase (`importDemo`), die feste Poisoning-Adresse hinter „Einfügen“ (liest jetzt die echte
Zwischenablage), die PIN im React-State und die festen Mock-Seed-Wörter. „QR scannen“ zeigt bis Phase 7 nur einen
Hinweis. Die Web-Vorschau hält den Vault nur im Speicher (kein Secure Storage im Browser).

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
