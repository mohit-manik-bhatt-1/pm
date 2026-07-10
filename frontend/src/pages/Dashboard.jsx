import { useEffect, useState } from 'react';
import api from '../api/client';
import { theme, stateColor } from '../theme';
import StatCard from '../components/StatCard';
import StateBadge from '../components/StateBadge';
import { useLiveFeed } from '../context/useLiveFeed';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [machines, setMachines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const { lastMessage, connected } = useLiveFeed();
  const [liveTicks, setLiveTicks] = useState([]);

  const loadData = async () => {
    const [summaryRes, machinesRes, alertsRes] = await Promise.all([
      api.get('/analytics/summary'),
      api.get('/machines'),
      api.get('/alerts?unresolved_only=true'),
    ]);
    setSummary(summaryRes.data);
    setMachines(machinesRes.data);
    setAlerts(alertsRes.data);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // periodic refresh as a fallback
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!lastMessage) return;
    setLiveTicks((prev) => [lastMessage, ...prev].slice(0, 8));
    if (lastMessage.type === 'alert') {
      loadData();
    }
  }, [lastMessage]);

  return (
    <div style={{ padding: 32, fontFamily: theme.font.display }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textPrimary }}>Dashboard</div>
        <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 4 }}>
          Fleet-wide health at a glance
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatCard label="Total Machines" value={summary?.total_machines ?? '—'} />
        <StatCard
          label="Unresolved Alerts"
          value={summary?.unresolved_alerts ?? '—'}
          accent={summary?.unresolved_alerts > 0 ? theme.colors.critical : theme.colors.healthy}
        />
        <StatCard
          label="Healthy Predictions"
          value={summary?.state_distribution?.Healthy ?? 0}
          accent={theme.colors.healthy}
        />
        <StatCard
          label="Critical Predictions"
          value={summary?.state_distribution?.Critical ?? 0}
          accent={theme.colors.critical}
        />
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Machines overview */}
        <div
          style={{
            flex: 2,
            background: theme.colors.bgPanel,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>
            Machines
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: theme.colors.textFaint, fontSize: 11, fontFamily: theme.font.mono }}>
                <th style={{ paddingBottom: 8 }}>ID</th>
                <th style={{ paddingBottom: 8 }}>Name</th>
                <th style={{ paddingBottom: 8 }}>Type</th>
                <th style={{ paddingBottom: 8 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => (
                <tr key={m.machine_id} style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                  <td style={{ padding: '10px 0', fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.mono }}>
                    {m.machine_id}
                  </td>
                  <td style={{ padding: '10px 0', fontSize: 13, color: theme.colors.textPrimary }}>{m.machine_name}</td>
                  <td style={{ padding: '10px 0', fontSize: 13, color: theme.colors.textMuted }}>{m.machine_type}</td>
                  <td style={{ padding: '10px 0', fontSize: 13, color: theme.colors.textMuted }}>{m.status}</td>
                </tr>
              ))}
              {machines.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '16px 0', color: theme.colors.textFaint, fontSize: 13 }}>
                    No machines yet. Run database/schema.sql to seed sample machines.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Live feed + alerts */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              background: theme.colors.bgPanel,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 12 }}>
              Live Feed {connected ? '' : '(reconnecting...)'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {liveTicks.length === 0 && (
                <div style={{ fontSize: 12, color: theme.colors.textFaint }}>
                  Waiting for live data — run simulate/live_sensor_simulator.py
                </div>
              )}
              {liveTicks.map((tick, i) => (
                <div key={i} style={{ fontSize: 12, fontFamily: theme.font.mono, color: theme.colors.textMuted }}>
                  {tick.type === 'alert' ? (
                    <span style={{ color: theme.colors.critical }}>⚠ {tick.machine_id}: {tick.message}</span>
                  ) : (
                    <span>{tick.machine_id} · temp {tick.temperature_c}°C · vib {tick.vibration_mm_s}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: theme.colors.bgPanel,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 12 }}>
              Active Alerts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alerts.slice(0, 6).map((a) => (
                <div key={a.alert_id} style={{ fontSize: 12 }}>
                  <StateBadge state={a.severity === 'High' || a.severity === 'Critical' ? 'Critical' : 'Warning'} />
                  <div style={{ color: theme.colors.textMuted, marginTop: 4 }}>{a.message}</div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div style={{ fontSize: 12, color: theme.colors.textFaint }}>No active alerts. All clear.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
