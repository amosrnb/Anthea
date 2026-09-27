import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import App from '../App';
import { SEED } from '../data';
import type { WalletProps } from '../useWallet';

const renderApp = (props: Partial<WalletProps> = {}) => render(<App walletProps={{ startScreen: 'welcome', testnet: true, privacyMode: false, ...props }} />);
const tap = async (text: string) => fireEvent.press(screen.getByText(text));
const tapLabel = async (label: string) => fireEvent.press(screen.getAllByLabelText(label).at(-1)!);
async function pin(digits: string) {
  for (const d of digits) await tapLabel(d);
  await act(async () => jest.advanceTimersByTime(250));
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('onboards a new wallet through the prototype click path', async () => {
  await renderApp();
  expect(screen.getByText('Deine Schlüssel. Dein Gerät.')).toBeOnTheScreen();

  await tap('Neues Wallet erstellen');
  await tap('Wer die Wörter kennt, besitzt das Geld.');
  await tap('Anthea kann sie nicht wiederherstellen.');
  await tap('Ich bewahre sie offline und sicher auf.');
  expect(screen.getByRole('checkbox', { name: /Ich bewahre/ })).toBeChecked();
  await tap('Wörter anzeigen');

  expect(screen.getByText('Deine Wiederherstellungsphrase')).toBeOnTheScreen();
  for (const word of SEED) expect(screen.queryByText(word)).toBeNull(); // hidden words are not rendered at all
  await tap('Zum Anzeigen tippen');
  for (const word of SEED) expect(screen.getByText(word)).toBeOnTheScreen();
  await tap('Ich habe sie notiert');
  await tap(SEED[2]!);
  await tap(SEED[6]!);
  await tap(SEED[10]!);
  await tap('Weiter');

  expect(screen.getByText('PIN festlegen')).toBeOnTheScreen();
  await pin('246810');
  expect(screen.getByText('PIN bestätigen')).toBeOnTheScreen();
  await pin('246810');

  expect(screen.getByText('GESAMTWERT')).toBeOnTheScreen();
  expect(screen.getByText('Wallet bereit')).toBeOnTheScreen();
  expect(screen.getByText('TESTNETZ')).toBeOnTheScreen();
});

it('switches tabs via the dock and opens coin details from the markets list', async () => {
  await renderApp({ startScreen: 'home' });
  await tapLabel('Märkte');
  expect(screen.getByPlaceholderText('Coin suchen')).toBeOnTheScreen();
  await fireEvent.changeText(screen.getByPlaceholderText('Coin suchen'), 'sol');
  expect(screen.queryByText('Bitcoin')).toBeNull();
  await tap('Solana');
  expect(screen.getByText('MARKTKAP.')).toBeOnTheScreen();
  await tapLabel('Watchlist');
  expect(screen.getByText('Aus Watchlist entfernt')).toBeOnTheScreen();

  await tapLabel('Zurück');
  await tapLabel('Aktivität');
  await tap('USDC → ETH');
  expect(screen.getByText('Transaktion')).toBeOnTheScreen();
  await tapLabel('Zurück');
  await tapLabel('Einstellungen');
  expect(screen.getByText('Wallet zurücksetzen')).toBeOnTheScreen();
});

it('sends with PIN confirmation and shows the status screen', async () => {
  await renderApp({ startScreen: 'home' });
  await tap('Senden');
  await tap('USDC');
  await tap('Einfügen');
  expect(screen.getByText(/Möglicher Address-Poisoning-Angriff/)).toBeOnTheScreen();
  await tap('0x71C9…04Ae');
  await tap('Weiter');
  for (const d of '250') await tapLabel(d);
  await tap('Prüfen');
  expect(screen.getByText('250,00 USDC')).toBeOnTheScreen();
  await tap('Mit PIN bestätigen');
  expect(screen.getByText('Signatur auf diesem Gerät')).toBeOnTheScreen();
  await pin('123456');
  expect(screen.getByText('Wird gesendet')).toBeOnTheScreen();
  await act(async () => jest.advanceTimersByTime(2700));
  expect(screen.getByText('Gesendet')).toBeOnTheScreen();
  await tap('Fertig');
  expect(screen.getByText('GESAMTWERT')).toBeOnTheScreen();
});

it('reviews a swap and resets the wallet from settings', async () => {
  await renderApp({ startScreen: 'home' });
  await tapLabel('Swappen');
  await tap('Slippage 0,5 %');
  await tap('1,0 %');
  await tap('Übernehmen');
  await tap('Swap prüfen');
  expect(screen.getByText('LI.FI Diamond · Allowlist')).toBeOnTheScreen();
  await tapLabel('Zurück');
  await tapLabel('Schließen');

  await tapLabel('Einstellungen');
  await tap('Wallet zurücksetzen');
  await tap('Endgültig zurücksetzen');
  expect(screen.getByText('Wallet zurücksetzen?')).toBeOnTheScreen(); // needs the checkbox first
  await tap('Ich habe meine Phrase gesichert');
  await tap('Endgültig zurücksetzen');
  expect(screen.getByText('Deine Schlüssel. Dein Gerät.')).toBeOnTheScreen();
});

it('handles the Android back button: back within flows, exit on root screens', async () => {
  let onBack: Parameters<typeof BackHandler.addEventListener>[1] | undefined;
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    onBack = handler;
    return { remove: jest.fn() };
  });
  await renderApp({ startScreen: 'home' });
  await tap('Empfangen');
  expect(screen.getByText('NETZWERK')).toBeOnTheScreen();

  let handled: boolean | null | undefined;
  await act(async () => void (handled = onBack?.({} as never)));
  expect(handled).toBe(true);
  expect(screen.getByText('GESAMTWERT')).toBeOnTheScreen();

  await act(async () => void (handled = onBack?.({} as never)));
  expect(handled).toBe(false); // Portfolio is a root screen: Android leaves the app
});

it('lets the receive address wrap anywhere without changing its characters', async () => {
  await renderApp({ startScreen: 'home' });
  await tap('Empfangen');
  const shown = screen.getByText(/^0/).props.children as string;
  expect(shown).toContain('\u200B');
  expect(shown.replaceAll('\u200B', '').replaceAll(' ', '')).toBe('0xB4a27C1e9D3f58A0b6E2c4D8f1A3e5C7b9D09Fc1');
});
