// Visual comparison of the React Native app (rendered via Expo web) with the Vite prototype (BUILD_PLAN Phase 0, item 6).
//
// Both builds are driven through the same click paths at 390×844, screenshotted, and composed side by side.
// Prerequisites: `npx expo export -p web` (→ dist/) and `npm --prefix prototype run build` (→ prototype/dist/).
// Usage: node scripts/visual-compare.mjs [outDir] [--only name,name] [--diff diffDir]
import { Buffer } from 'node:buffer';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const only = flag('--only')?.split(',');
const diffDir = flag('--diff');
const outDir = resolve(args[0] ?? 'docs/screenshots/phase-0');

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

function serve(root) {
  const server = createServer((req, res) => {
    let file = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ server, url: `http://127.0.0.1:${server.address().port}/` })));
}

// Actions shared by both builds. Selectors use roles and visible text, which match the prototype's DOM
// and react-native-web's output (accessibilityRole/accessibilityLabel → role/aria-label).
const btn =
  (name, nth = 0) =>
  async (page) => {
    const all = page.getByRole('button', { name, exact: true });
    await (nth === -1 ? all.last() : all.nth(nth)).click();
  };
const text = (t) => async (page) => page.getByText(t, { exact: true }).first().click();
/** Button whose accessible name starts with `prefix` (settings rows: label followed by value). */
const row = (prefix) => async (page) =>
  page
    .getByRole('button', { name: new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
    .first()
    .click();
const type = (label, value) => async (page) => {
  const input = page.locator('textarea, input').first();
  await input.click();
  await input.pressSequentially(value, { delay: 10 });
  void label;
};
const pin = (digits) => async (page) => {
  for (const d of digits) await btn(d, -1)(page);
};
const wait = (ms) => async (page) => page.waitForTimeout(ms);

// Since Phase 2 the app has no demo start states and a random phrase: the React Native side runs the real onboarding
// (reading its words from test IDs), the prototype side keeps its fixed words and `?start=` shortcuts.
/** Different actions per build; plain actions run on both. */
const per =
  ({ proto = [], rn = [] }) =>
  async (page, isRn) => {
    for (const a of isRn ? rn : proto) await a(page, isRn);
  };
const PIN = '123456';
const words = async (page) => Promise.all(Array.from({ length: 12 }, (_, i) => page.getByTestId(`phrase-word-${i + 1}`).innerText()));
/** RN: picks the right word in each verify row; rows listed in `wrong` get a wrong word and stop the sequence. */
const rnVerify =
  (wrong = []) =>
  async (page) => {
    for (let row = 0; row < 3; row++) {
      const label = page.getByTestId(`verify-row-${row}`);
      const right = page.__phrase[Number((await label.innerText()).replace(/\D/g, '')) - 1];
      const options = label.locator('xpath=..').getByRole('button');
      const texts = (await options.allInnerTexts()).map((t) => t.trim());
      await options.nth(wrong.includes(row) ? texts.findIndex((t) => t !== right) : texts.indexOf(right)).click();
      if (wrong.includes(row)) return;
    }
  };
const rememberPhrase = async (page) => {
  page.__phrase = await words(page);
};
const untilText = (t) => async (page) => page.getByText(t, { exact: true }).first().waitFor({ timeout: 30_000 });

const onboarding = [
  btn('Neues Wallet erstellen'),
  text('Wer die Wörter kennt, besitzt das Geld.'),
  text('Anthea kann sie nicht wiederherstellen.'),
  text('Ich bewahre sie offline und sicher auf.'),
];
const shown = [...onboarding, btn('Wörter anzeigen'), text('Zum Anzeigen tippen'), per({ rn: [rememberPhrase] })];
const verified = [...shown, btn('Ich habe sie notiert'), per({ proto: [btn('harbor'), btn('lemon'), btn('pepper')], rn: [rnVerify()] })];
/** RN only: a real wallet (KDF runs in the browser, hence the waits), ending on the portfolio. */
const rnHome = [
  ...verified,
  btn('Weiter'),
  pin(PIN),
  wait(400),
  pin(PIN),
  async (page) => page.getByRole('button', { name: 'Sperren' }).waitFor({ timeout: 30_000 }),
  wait(2600), // "Wallet bereit" toast
];
const toHome = per({ rn: rnHome });
const toLock = per({ rn: [...rnHome, btn('Sperren')] });
const clipboard = (value) => async (page) => page.evaluate((v) => navigator.clipboard.writeText(v), value);
const unlockPin = per({ proto: [pin(PIN), wait(400)], rn: [pin(PIN), untilText('Wiederherstellungsphrase')] });
const confirmPin = per({ proto: [wait(500), pin(PIN), wait(500)], rn: [wait(500), pin(PIN), untilText('Wird gesendet')] });

/** name → [prototype start param, actions before the shot, settle ms]. */
const SHOTS = [
  ['01-welcome', 'welcome', [], 200],
  ['02-warn', 'welcome', [btn('Neues Wallet erstellen')]],
  ['03-warn-checked', 'welcome', onboarding],
  ['04-seed-hidden', 'welcome', [...onboarding, btn('Wörter anzeigen')]],
  ['05-seed-shown', 'welcome', shown],
  ['06-verify', 'welcome', [...shown, btn('Ich habe sie notiert'), per({ proto: [btn('harbor'), btn('silver')], rn: [rnVerify([1])] })]],
  ['07-pin-set', 'welcome', [...verified, btn('Weiter'), pin('12')]],
  ['08-pin-confirm-error', 'welcome', [...verified, btn('Weiter'), pin(PIN), wait(400), pin('654321'), wait(400)]],
  ['09-import', 'welcome', [btn('Bestehendes Wallet importieren'), type('phrase', 'orbit velvet har')]],
  ['10-lock', 'lock', [toLock]],
  ['11-home', 'home', [toHome]],
  ['12-markets', 'home', [toHome, btn('Märkte')]],
  ['13-coin', 'home', [toHome, btn('Märkte'), text('Ethereum')]],
  ['14-receive', 'home', [toHome, btn('Empfangen')]],
  ['15-send-asset', 'home', [toHome, btn('Senden')]],
  [
    '16-send-to-poisoning',
    'home',
    [toHome, btn('Senden'), text('USDC'), per({ rn: [clipboard('0x71C9e0B7d2F4a9C3e1A8b6D5f0C2e4A7b9d304Ae')] }), btn('Einfügen')],
  ],
  ['17-send-amount', 'home', [toHome, btn('Senden'), text('USDC'), text('0x71C9…04Ae'), btn('Weiter'), btn('1'), btn('2'), btn('0'), btn('0')]],
  ['18-send-review', 'home', [toHome, btn('Senden'), text('USDC'), text('0x71C9…04Ae'), btn('Weiter'), btn('1'), btn('2'), btn('0'), btn('0'), btn('Prüfen')]],
  [
    '19-confirm-sheet',
    'home',
    [
      toHome,
      btn('Senden'),
      text('USDC'),
      text('0x71C9…04Ae'),
      btn('Weiter'),
      btn('1'),
      btn('2'),
      btn('0'),
      btn('Prüfen'),
      btn('Mit PIN bestätigen'),
      pin('12'),
    ],
    700,
  ],
  [
    '20-status-pending',
    'home',
    [
      toHome,
      btn('Senden'),
      text('USDC'),
      text('0x71C9…04Ae'),
      btn('Weiter'),
      btn('1'),
      btn('2'),
      btn('0'),
      btn('Prüfen'),
      btn('Mit PIN bestätigen'),
      confirmPin,
    ],
    0,
  ],
  [
    '21-status-done',
    'home',
    [
      toHome,
      btn('Senden'),
      text('USDC'),
      text('0x71C9…04Ae'),
      btn('Weiter'),
      btn('1'),
      btn('2'),
      btn('0'),
      btn('Prüfen'),
      btn('Mit PIN bestätigen'),
      confirmPin,
      wait(2700),
    ],
    0,
  ],
  ['22-swap', 'home', [toHome, btn('Swappen', -1)], 300],
  ['23-slippage-sheet', 'home', [toHome, btn('Swappen', -1), text('Slippage 0,5 %'), text('3,0 %')], 700],
  ['24-swap-review', 'home', [toHome, btn('Swappen', -1), btn('Swap prüfen')]],
  ['25-activity', 'home', [toHome, btn('Aktivität')]],
  ['26-tx-detail', 'home', [toHome, btn('Aktivität'), text('USDC → ETH')]],
  ['27-settings', 'home', [toHome, btn('Einstellungen')]],
  ['28-rpc', 'home', [toHome, btn('Einstellungen'), row('Netzwerke & RPC')]],
  ['29-reveal-pin', 'home', [toHome, btn('Einstellungen'), row('Wiederherstellungsphrase anzeigen')]],
  ['30-reveal', 'home', [toHome, btn('Einstellungen'), row('Wiederherstellungsphrase anzeigen'), unlockPin]],
  ['31-reset-sheet', 'home', [toHome, btn('Einstellungen'), text('Wallet zurücksetzen'), text('Ich habe meine Phrase gesichert')], 700],
  ['32-toast', 'home', [toHome, btn('Märkte'), text('Ethereum'), btn('Watchlist')], 350],
].filter(([name]) => !only || only.includes(name));

// The prototype loads Nunito from Google Fonts. Serve the identical bundled files (Nunito v3.602, same as Google's)
// instead, so the comparison works offline and both sides render with exactly the same font.
const FONT_WEIGHTS = { 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
const FONT_CSS = Object.entries(FONT_WEIGHTS)
  .map(
    ([w, n]) =>
      `@font-face{font-family:'Nunito';font-weight:${w};font-display:block;src:url(https://fonts.gstatic.com/local/Nunito_${w}${n}.ttf) format('truetype')}`,
  )
  .join('\n');
async function localFonts(page) {
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: FONT_CSS }));
  await page.route('https://fonts.gstatic.com/local/*', (route) =>
    route.fulfill({ contentType: 'font/ttf', path: resolve('assets/fonts', route.request().url().split('/').pop()) }),
  );
}

// The prototype draws a fake status bar (16 px + one line of 15 px Nunito ≈ 36.5 px); the app uses the real iPhone
// safe area (47 pt). For the pixel diff only, the app's top inset is set to the prototype's value.
const PROTOTYPE_STATUS_BAR = 16 + 15 * 1.364;

async function shoot(browser, base, [, start, actions, settle = 450], alignTop = false) {
  const isRn = base === rn.url;
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const page = await context.newPage();
  await localFonts(page);
  await page.goto(isRn ? base : `${base}?start=${start}`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  if (alignTop) await page.getByTestId('device').evaluate((el, top) => (el.style.paddingTop = top + 'px'), PROTOTYPE_STATUS_BAR);
  for (const a of actions) {
    await a(page, isRn);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(settle);
  const png = await page.screenshot();
  await context.close();
  return png;
}

const b64 = (buf) => 'data:image/png;base64,' + buf.toString('base64');

async function compose(browser, name, proto, rn) {
  const page = await browser.newPage({ viewport: { width: 850, height: 900 } });
  await page.setContent(`<body style="margin:0;background:#1b1b20;font:700 15px system-ui;color:#ddd">
    <div style="display:flex;gap:30px;padding:10px 20px 16px">
      <figure style="margin:0"><figcaption style="padding:6px 0">Prototyp (Vite)</figcaption><img src="${b64(proto)}" width="390" height="844"></figure>
      <figure style="margin:0"><figcaption style="padding:6px 0">React Native (Expo Web) · ${name}</figcaption><img src="${b64(rn)}" width="390" height="844"></figure>
    </div></body>`);
  const png = await page.screenshot({ fullPage: true });
  await page.close();
  return png;
}

/** Share of pixels differing by more than a small threshold, plus a highlighted diff image. */
async function diff(browser, proto, rn) {
  const page = await browser.newPage();
  const result = await page.evaluate(
    async ([a, b]) => {
      const load = (src) => new Promise((ok) => Object.assign(new Image(), { onload: (e) => ok(e.target), src }));
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const c = Object.assign(document.createElement('canvas'), { width: ia.width, height: ia.height });
      const x = c.getContext('2d');
      x.drawImage(ia, 0, 0);
      const da = x.getImageData(0, 0, c.width, c.height);
      x.drawImage(ib, 0, 0);
      const db = x.getImageData(0, 0, c.width, c.height);
      let n = 0;
      for (let i = 0; i < da.data.length; i += 4) {
        const d = Math.abs(da.data[i] - db.data[i]) + Math.abs(da.data[i + 1] - db.data[i + 1]) + Math.abs(da.data[i + 2] - db.data[i + 2]);
        const hit = d > 60;
        if (hit) n++;
        const g = (da.data[i] + da.data[i + 1] + da.data[i + 2]) / 12;
        db.data.set(hit ? [255, 40, 90, 255] : [g, g, g, 255], i);
      }
      x.putImageData(db, 0, 0);
      return { pct: (100 * n) / (c.width * c.height), url: c.toDataURL() };
    },
    [b64(proto), b64(rn)],
  );
  await page.close();
  return { pct: result.pct, png: Buffer.from(result.url.split(',')[1], 'base64') };
}

const proto = await serve(resolve('prototype/dist'));
const rn = await serve(resolve('dist'));
const browser = await chromium.launch();
mkdirSync(outDir, { recursive: true });
if (diffDir) mkdirSync(diffDir, { recursive: true });
try {
  for (const shot of SHOTS) {
    const [a, b] = [await shoot(browser, proto.url, shot), await shoot(browser, rn.url, shot)];
    writeFileSync(join(outDir, shot[0] + '.png'), await compose(browser, shot[0], a, b));
    let note = '';
    if (diffDir) {
      const d = await diff(browser, a, await shoot(browser, rn.url, shot, true));
      writeFileSync(join(diffDir, shot[0] + '.png'), d.png);
      note = ` · ${d.pct.toFixed(1)} % px differ`;
    }
    console.log(`✓ ${shot[0]}${note}`);
  }
} finally {
  await browser.close();
  proto.server.close();
  rn.server.close();
}
