import { useColorScheme } from 'react-native';

export type Theme = {
  bg: string;
  card: string;
  text: string;
  muted: string;
  primary: string;
  border: string;
  danger: string;
  success: string;
  warn: string;
};

const dark: Theme = {
  bg: '#0B0F14',
  card: '#151B23',
  text: '#E6EDF3',
  muted: '#8B97A5',
  primary: '#E11D2A',
  border: '#222B36',
  danger: '#F87171',
  success: '#34D399',
  warn: '#FBBF24',
};

const light: Theme = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#0B0F14',
  muted: '#5B6573',
  primary: '#E11D2A',
  border: '#E3E7EC',
  danger: '#DC2626',
  success: '#059669',
  warn: '#B45309',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
