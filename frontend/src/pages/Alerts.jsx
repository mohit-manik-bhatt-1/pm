import { useEffect, useState } from 'react';
import api from '../api/client';
import { theme, stateColor } from '../theme';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [showResolved, setShowResolved] = useState(false);

  const loadAlerts = async () => {
    const { data } = await api.get(`/alerts?unresolved_only=${!showResolved}`);
    setAlerts(data);
  };

  useEffect(() => {
    loadAlerts();
  }, [showResolved]);

  const resolveAlert = async (alertId) => {
    await api.patch(`/alerts/${alertId}/resolve`);
    loadAlerts();
  };

  const severityColor = (sev) => {
    if (sev === 'Critical' || sev === 'High') return theme.colors.critical;
    if (sev === 'Medium') return theme.colors.warning;
    return theme.colors.textMuted;
  };

  return (
    <div style={{ padding: 32, fontFamily: theme.font.display }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textPrimary }}>Alerts</div>
          <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 4 }}>
            {alerts.length} {showResolved ? 'total' : 'unresolved'} alert(s)
          </div>
        </div>
        <label style={{ fontSize: 13, color: theme.colors.textMuted, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          Show resolved
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alerts.map((a) => (
          <div
            key={a.alert_id}
            style={{
              background: theme.colors.bgPanel,
              border: `1px solid ${theme.colors.border}`,
              borderLeft: `3px solid ${severityColor(a.severity)}`,
              borderRadius: theme.radius,
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: severityColor(a.severity), fontFamily: theme.font.mono, marginBottom: 4 }}>
                {a.severity.toUpperCase()} · {a.machine_id}
              </div>
              <div style={{ fontSize: 14, color: theme.colors.textPrimary }}>{a.message}</div>
              <div style={{ fontSize: 11, color: theme.colors.textFaint, marginTop: 4 }}>
                {new Date(a.created_at).toLocaleString()}
              </div>
            </div>
            {!a.is_resolved && (
              <button
                onClick={() => resolveAlert(a.alert_id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  background: 'transparent',
                  color: theme.colors.textMuted,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Resolve
              </button>
            )}
          </div>
        ))}
        {alerts.length === 0 && (
          <div style={{ color: theme.colors.textFaint, fontSize: 13 }}>No alerts to show.</div>
        )}
      </div>
    </div>
  );
}
