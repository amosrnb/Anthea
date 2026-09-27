# Anthea – Hinweise für Coding-Agenten

Verbindliche Spezifikation: `docs/BUILD_PLAN.md` (vor jeder Phase vollständig lesen). Sicherheitsmodell:
`docs/SECURITY.md`, Datenflüsse: `docs/PRIVACY.md`.

## Arbeitsweise

- Eine Phase nach der anderen, ein Branch und ein Pull Request pro Phase; mit Zusammenfassung, Testnachweis und
  Screenshots. Bei Unklarheiten vor der Umsetzung fragen.
- Vor jedem Push: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` (und in `server/`:
  `npm run typecheck`, `npm test`).
- UI auf Deutsch, Code, Kommentare und Commits auf Englisch.
- Der Produktinhaber testet unter Windows im Android-Emulator (Projekt unter `C:\dev\Anthea`, JDK 17, lange Pfade
  aktiviert). Anleitungen für ihn: Schritt für Schritt, ein Schritt pro Nachricht, auf Deutsch. Wenn eine Änderung
  native Module oder `app.config.ts` betrifft, darauf hinweisen, dass `npm run android` erneut nötig ist.

## Entscheidungen des Produktinhabers (zusätzlich zu BUILD_PLAN 13.1)

| Datum | Thema | Entscheidung |
|---|---|---|
| 2026-09-26 | App-ID | Platzhalter `dev.anthea.wallet` bis zur Domain-Entscheidung (13.2) |
| 2026-09-26 | Navigation | bestehender `screen`-State aus `useWallet`, Android-Zurück per `BackHandler`, iOS per Wischen vom linken Rand |
| 2026-09-27 | Titel „Deine Wiederherstellungsphrase“ | bleibt wie er ist (Umbruch „…Wiederherstellungs / phrase“ ist in Ordnung) |
| 2026-09-27 | Verdeckte Seed-Wörter | solange „Zum Anzeigen tippen“ sichtbar ist, dürfen die Wörter nicht lesbar sein; sie werden gar nicht gerendert, nur Platzhalter |
| 2026-09-27 | Verifikation der Phrase | Reihenfolge der drei Antwortoptionen je Zeile immer zufällig (bei jedem Öffnen neu) |
| 2026-09-27 | PIN-Tastenfeld | Tasten kreisrund, nicht oval (bewusste Abweichung vom Prototyp) |
| 2026-09-27 | Empfangsadresse | Umbruch zwischen beliebigen Zeichen wie im Prototyp (`break-all`), nicht nur an den 4er-Gruppen |
| 2026-09-27 | App-Umschalter | `FLAG_SECURE` nur auf Phrasen-Screens (Seed, Prüfen, Import, Anzeigen); sonst schwarze Abdeckung, sobald die App nicht aktiv ist (Android best effort), iOS Weichzeichner |
| 2026-09-27 | Senden: „Einfügen“ / „QR scannen“ | „Einfügen“ liest die echte Zwischenablage; „QR scannen“ zeigt bis Phase 7 den Hinweis „QR-Scan folgt in einer späteren Version“ |
