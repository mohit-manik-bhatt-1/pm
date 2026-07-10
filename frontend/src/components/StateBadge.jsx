import { theme, stateColor, stateBg } from '../theme';

export default function StateBadge({ state }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: stateColor(state),
        background: stateBg(state),
        fontFamily: theme.font.mono,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: stateColor(state),
        }}
      />
      {state}
    </span>
  );
}
