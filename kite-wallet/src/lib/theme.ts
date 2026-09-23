export const colors = {
  bg: '#000000',
  ink: '#F7F7F5',
  white: '#FFFFFF',
  muted: '#9A9AA3',
  accent: '#6C5CE7',
  accentPressed: '#7E70EB',
  accentText: '#A79BFF',
  accentTint: 'rgba(108,92,231,.14)',
  pos: '#A8E6A8',
  neg: '#FF8F80',
  control: '#1E1E23',
  controlPressed: '#28282F',
  chip: '#141418',
  surface: '#131316',
  surfacePressed: '#1E1E23',
  raised: '#1A1A1F',
  raisedPressed: '#22222A',
  track: '#232329',
  glass: 'rgba(255,255,255,.05)',
  glassPressed: 'rgba(255,255,255,.1)',
  divider: 'rgba(255,255,255,.06)',
};

export const fonts = {
  800: 'Nunito_800ExtraBold',
  900: 'Nunito_900Black',
} as const;

export type Weight = keyof typeof fonts;
