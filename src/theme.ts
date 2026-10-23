import { useSettings } from './store';

export const colors = {
  ink: '#071b19',
  forest: '#0e302a',
  forestLight: '#17433a',
  gold: '#e7b65e',
  cream: '#f7f1e6',
  paper: '#fffaf0',
  muted: '#aab8ae',
  green: '#258b68',
};

export type AppPalette = {
  background: string;
  surface: string;
  elevated: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
  tabBar: string;
  statusBar: 'light' | 'dark';
};

export const palettes: Record<'Dark' | 'Light' | 'Sepia' | 'Ocean', AppPalette> = {
  Dark: { background: '#071b19', surface: '#10261f', elevated: '#17352d', text: '#fffaf0', mutedText: '#aab8ae', border: '#2d4438', accent: '#e7b65e', tabBar: '#071b19', statusBar: 'light' },
  Light: { background: '#f2eee4', surface: '#fffaf0', elevated: '#e7e1d4', text: '#20352b', mutedText: '#65736a', border: '#d3ccbd', accent: '#a8792c', tabBar: '#fffaf0', statusBar: 'dark' },
  Sepia: { background: '#2d2118', surface: '#3d2d20', elevated: '#523e2c', text: '#f4e5c7', mutedText: '#c5ad87', border: '#70583c', accent: '#e5bb70', tabBar: '#251b14', statusBar: 'light' },
  Ocean: { background: '#071d27', surface: '#102f3a', elevated: '#174553', text: '#eef8f5', mutedText: '#a9c4c8', border: '#28505a', accent: '#e7b65e', tabBar: '#071d27', statusBar: 'light' },
};

export function usePalette() {
  const appearance = useSettings((state) => state.appearance);
  return palettes[appearance];
}
