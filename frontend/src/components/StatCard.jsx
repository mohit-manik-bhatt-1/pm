import { theme } from '../theme';

export default function StatCard({ label, value, sublabel, accent }) {
  return (
    <div
      style={{
        background: theme.colors.bgPanel,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius,
        padding: '20px 22px',
        flex: 1,
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 12, color: theme.colors.textMuted, fontFamily: theme.font.mono, marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: accent || theme.colors.textPrimary,
          fontFamily: theme.font.display,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: 12, color: theme.colors.textFaint, marginTop: 8 }}>{sublabel}</div>
      )}
    </div>
  );
}
