// Design tokens - dark indigo industrial control-room theme
export const theme = {
  colors: {
    bg: '#0A0C16',
    bgPanel: '#12152A',
    bgPanelHover: '#171B36',
    border: '#232848',
    borderBright: '#3730A3',
    textPrimary: '#E7E9F5',
    textMuted: '#8890B0',
    textFaint: '#5B6285',
    indigo: '#6366F1',
    indigoBright: '#818CF8',
    indigoDim: '#312E81',
    healthy: '#34D399',
    warning: '#FBBF24',
    critical: '#F87171',
    healthyBg: 'rgba(52, 211, 153, 0.12)',
    warningBg: 'rgba(251, 191, 36, 0.12)',
    criticalBg: 'rgba(248, 113, 113, 0.12)',
  },
  font: {
    display: "'Space Grotesk', sans-serif",
    mono: "'IBM Plex Mono', monospace",
  },
  radius: '10px',
};

export const stateColor = (state) => {
  if (state === 'Healthy') return theme.colors.healthy;
  if (state === 'Warning') return theme.colors.warning;
  if (state === 'Critical') return theme.colors.critical;
  return theme.colors.textMuted;
};

export const stateBg = (state) => {
  if (state === 'Healthy') return theme.colors.healthyBg;
  if (state === 'Warning') return theme.colors.warningBg;
  if (state === 'Critical') return theme.colors.criticalBg;
  return 'rgba(136,144,176,0.12)';
};
