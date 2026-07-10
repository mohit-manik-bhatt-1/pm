import { NavLink } from 'react-router-dom';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/machines', label: 'Machines', icon: '⬢' },
  { to: '/alerts', label: 'Alerts', icon: '▲' },
  { to: '/maintenance', label: 'Maintenance', icon: '◷' },
];

export default function Sidebar({ connected }) {
  const { user, logout } = useAuth();

  return (
    <div
      style={{
        width: 220,
        minHeight: '100vh',
        background: theme.colors.bgPanel,
        borderRight: `1px solid ${theme.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        fontFamily: theme.font.display,
      }}
    >
      <div style={{ padding: '0 24px', marginBottom: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.textPrimary, letterSpacing: '-0.02em' }}>
          MachineWatch
        </div>
        <div style={{ fontSize: 11, color: theme.colors.textFaint, fontFamily: theme.font.mono, marginTop: 2 }}>
          PREDICTIVE MAINTENANCE
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: theme.radius,
              textDecoration: 'none',
              color: isActive ? theme.colors.textPrimary : theme.colors.textMuted,
              background: isActive ? theme.colors.indigoDim : 'transparent',
              fontSize: 14,
              fontWeight: isActive ? 600 : 500,
              transition: 'background 0.15s, color 0.15s',
            })}
          >
            <span style={{ fontSize: 14, opacity: 0.85 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      <div style={{ padding: '0 16px', marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: theme.colors.textFaint,
            fontFamily: theme.font.mono,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: connected ? theme.colors.healthy : theme.colors.textFaint,
              boxShadow: connected ? `0 0 6px ${theme.colors.healthy}` : 'none',
            }}
          />
          {connected ? 'LIVE' : 'OFFLINE'}
        </div>

        <div
          style={{
            marginTop: 12,
            padding: '12px',
            borderRadius: theme.radius,
            background: theme.colors.bg,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ fontSize: 13, color: theme.colors.textPrimary, fontWeight: 600 }}>
            {user?.username}
          </div>
          <div style={{ fontSize: 11, color: theme.colors.textFaint, marginBottom: 8 }}>{user?.role}</div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '6px 0',
              fontSize: 12,
              color: theme.colors.textMuted,
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
