/** Clipboard access (expo-clipboard). Only addresses are ever read or written; the phrase is never copied (5.4). */
import * as Clipboard from 'expo-clipboard';

export const readClipboardText = (): Promise<string> => Clipboard.getStringAsync();
