import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.bg,
        fontFamily: theme.font.display,
      }}
    >
      <div
        style={{
          width: 380,
          background: theme.colors.bgPanel,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius,
          padding: 32,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
          MachineWatch
        </div>
        <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 28, fontFamily: theme.font.mono }}>
          Predictive Maintenance Console
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
            placeholder="engineer_01"
            required
          />

          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="••••••••"
            required
          />

          {error && (
            <div style={{ color: theme.colors.critical, fontSize: 13, marginBottom: 12 }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 20, fontSize: 13, color: theme.colors.textMuted, textAlign: 'center' }}>
          No account?{' '}
          <Link to="/register" style={{ color: theme.colors.indigoBright, textDecoration: 'none' }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  color: theme.colors.textMuted,
  marginBottom: 6,
  marginTop: 14,
  fontFamily: theme.font.mono,
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${theme.colors.border}`,
  background: theme.colors.bg,
  color: theme.colors.textPrimary,
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
};

const buttonStyle = {
  width: '100%',
  marginTop: 22,
  padding: '11px 0',
  borderRadius: 8,
  border: 'none',
  background: theme.colors.indigo,
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};
