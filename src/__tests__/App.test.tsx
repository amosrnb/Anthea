import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import App from '../App';
import { ABOUT, makeDeps, PIN } from './helpers';

jest.mock('expo-screen-capture', () => ({
  preventScreenCaptureAsync: jest.fn(async () => undefined),
  allowScreenCaptureAsync: jest.fn(async () => undefined),
  enableAppSwitcherProtectionAsync: jest.fn(async () => undefined),
  addScreenshotListener: jest.fn(() => ({ remove: jest.fn() })),
}));
jest.mock('expo-clipboard', () => ({ getStringAsync: jest.fn(async () => '') }));

const tap = async (text: string | RegExp) => fireEvent.press(screen.getByText(text));
const tapLabel = async (label: string) => fireEvent.press(screen.getAllByLabelText(label).at(-1)!);
async function pin(digits: string, prefix = 'pin-key') {
  for (const d of digits) await fireEvent.press(screen.getByTestId(`${prefix}-${d}`));
  await act(async () => new Promise((r) => setTimeout(r, 250)));
}

async function renderApp(wallet = false) {
  const env = await makeDeps({ wallet });
  await render(<App deps={env.deps} />);
  await waitFor(() => expect(screen.queryByText(wallet ? 'Anthea ist gesperrt' : 'Deine Schlüssel. Dein Gerät.')).toBeOnTheScreen());
  return env;
}
async function unlock() {
  const env = await renderApp(true);
  await pin(PIN);
  await waitFor(() => expect(screen.getByText('GESAMTWERT')).toBeOnTheScreen());
  return env;
}

it('creates a wallet through the real onboarding', async () => {
  const env = await renderApp();
  await tap('Neues Wallet erstellen');
  await tap('Wer die Wörter kennt, besitzt das Geld.');
  await tap('Anthea kann sie nicht wiederherstellen.');
  await tap('Ich bewahre sie offline und sicher auf.');
  await tap('Wörter anzeigen');

  expect(screen.queryByTestId('phrase-word-1')).toBeNull(); // hidden words are not rendered
  await tap('Zum Anzeigen tippen');
  const words = Array.from({ length: 12 }, (_, i) => screen.getByTestId(`phrase-word-${i + 1}`).props.children as string);
  await tap('Ich habe sie notiert');

  for (let row = 0; row < 3; row++) {
    const pos = Number(String(screen.getByTestId(`verify-row-${row}`).props.children).replace('WORT #', ''));
    await tap(words[pos - 1]!);
  }
  await tap('Weiter');
  await pin('246810');
  await pin('246810');
  await waitFor(() => expect(screen.getByText('GESAMTWERT')).toBeOnTheScreen());
  expect(screen.getByText('Wallet bereit')).toBeOnTheScreen();
  expect((await env.keyring.revealPhrase('246810')).join(' ')).toBe(words.join(' '));
});

it('imports a phrase and shows its real receive address with a QR code', async () => {
  await renderApp();
  await tap('Bestehendes Wallet importieren');
  expect(screen.queryByText('Testphrase')).toBeNull(); // prototype helper removed
  await fireEvent.changeText(screen.getByLabelText('Wiederherstellungsphrase'), ABOUT);
  expect(screen.getByText('Prüfsumme gültig')).toBeOnTheScreen();
  await tap('Importieren');
  await pin(PIN);
  await pin(PIN);
  await waitFor(() => expect(screen.getByText('Konten abgeleitet · Bitcoin-Scan abgeschlossen')).toBeOnTheScreen());
  await tap('Empfangen');
  expect(screen.getByLabelText('QR-Code der Adresse')).toBeOnTheScreen();
  expect(screen.getByText(/^0/).props.children.replace(/[​ ]/g, '')).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
});

it('locks, rejects a wrong PIN and unlocks again', async () => {
  await unlock();
  await tapLabel('Sperren');
  expect(screen.getByText('Anthea ist gesperrt')).toBeOnTheScreen();
  await pin('000000');
  await waitFor(() => expect(screen.getByText('Falsche PIN. Noch 4 Versuche.')).toBeOnTheScreen());
  await pin(PIN);
  await waitFor(() => expect(screen.getByText('GESAMTWERT')).toBeOnTheScreen());
});

it('shows the phrase after the PIN, then resets the wallet', async () => {
  const env = await unlock();
  await tapLabel('Einstellungen');
  await fireEvent.press(screen.getByRole('button', { name: /^Wiederherstellungsphrase anzeigen/ }));
  await pin(PIN);
  await waitFor(() => expect(screen.getByTestId('phrase-word-12')).toHaveTextContent('about'));
  await tap('Fertig');
  await tap('Wallet zurücksetzen');
  await tap('Ich habe meine Phrase gesichert');
  await tap('Endgültig zurücksetzen');
  await waitFor(() => expect(screen.getByText('Deine Schlüssel. Dein Gerät.')).toBeOnTheScreen());
  expect(await env.keyring.hasWallet()).toBe(false);
});

it('sends (mock) only after the PIN in the signing sheet', async () => {
  await unlock();
  await tap('Senden');
  await tap('USDC');
  await tap('0x71C9…04Ae');
  await tap('Weiter');
  for (const d of '25') await tapLabel(d);
  await tap('Prüfen');
  await tap('Mit PIN bestätigen');
  await pin(PIN, 'confirm-key');
  await waitFor(() => expect(screen.getByText('Wird gesendet')).toBeOnTheScreen());
});

it('handles the Android back button: back within flows, exit on root screens', async () => {
  let onBack: Parameters<typeof BackHandler.addEventListener>[1] | undefined;
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    onBack = handler;
    return { remove: jest.fn() };
  });
  await unlock();
  await tap('Empfangen');
  let handled: boolean | null | undefined;
  await act(async () => void (handled = onBack?.({} as never)));
  expect(handled).toBe(true);
  expect(screen.getByText('GESAMTWERT')).toBeOnTheScreen();
  await act(async () => void (handled = onBack?.({} as never)));
  expect(handled).toBe(false);
  jest.restoreAllMocks();
});
