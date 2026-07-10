import { useEffect, useState } from 'react';
import api from '../api/client';
import { theme } from '../theme';

export default function Maintenance() {
  const [schedule, setSchedule] = useState([]);
  const [machines, setMachines] = useState([]);
  const [form, setForm] = useState({
    machine_id: '',
    scheduled_date: '',
    maintenance_type: 'Preventive',
    assigned_to: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const loadData = async () => {
    const [scheduleRes, machinesRes] = await Promise.all([api.get('/maintenance'), api.get('/machines')]);
    setSchedule(scheduleRes.data);
    setMachines(machinesRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/maintenance', form);
      setForm({ machine_id: '', scheduled_date: '', maintenance_type: 'Preventive', assigned_to: '', notes: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not schedule maintenance.');
    }
  };

  const statusColor = (status) => {
    if (status === 'Completed') return theme.colors.healthy;
    if (status === 'In Progress') return theme.colors.warning;
    if (status === 'Cancelled') return theme.colors.critical;
    return theme.colors.indigoBright;
  };

  return (
    <div style={{ padding: 32, fontFamily: theme.font.display }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
        Maintenance Scheduling
      </div>
      <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 24 }}>
        Plan and track preventive, predictive, and corrective maintenance
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div
          style={{
            flex: 2,
            background: theme.colors.bgPanel,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 14 }}>
            Scheduled Work
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {schedule.map((s) => (
              <div
                key={s.schedule_id}
                style={{
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: theme.colors.textPrimary, fontWeight: 600 }}>
                    {s.machine_id} · {s.maintenance_type}
                  </div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                    {s.scheduled_date} {s.assigned_to ? `· ${s.assigned_to}` : ''}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: theme.font.mono,
                    color: statusColor(s.status),
                    border: `1px solid ${statusColor(s.status)}`,
                    borderRadius: 999,
                    padding: '3px 10px',
                  }}
                >
                  {s.status}
                </div>
              </div>
            ))}
            {schedule.length === 0 && (
              <div style={{ fontSize: 13, color: theme.colors.textFaint }}>No maintenance scheduled yet.</div>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            background: theme.colors.bgPanel,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 14 }}>
            Schedule New
          </div>

          <label style={labelStyle}>Machine</label>
          <select
            value={form.machine_id}
            onChange={(e) => setForm({ ...form, machine_id: e.target.value })}
            style={inputStyle}
            required
          >
            <option value="">Select machine</option>
            {machines.map((m) => (
              <option key={m.machine_id} value={m.machine_id}>
                {m.machine_id} - {m.machine_name}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={form.scheduled_date}
            onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Type</label>
          <select
            value={form.maintenance_type}
            onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })}
            style={inputStyle}
          >
            <option>Preventive</option>
            <option>Predictive</option>
            <option>Corrective</option>
          </select>

          <label style={labelStyle}>Assigned To</label>
          <input
            value={form.assigned_to}
            onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
            style={inputStyle}
            placeholder="Technician name"
          />

          <label style={labelStyle}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          />

          {error && <div style={{ color: theme.colors.critical, fontSize: 12, marginTop: 8 }}>{error}</div>}

          <button type="submit" style={buttonStyle}>
            Schedule
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  color: theme.colors.textMuted,
  marginBottom: 6,
  marginTop: 12,
  fontFamily: theme.font.mono,
};

const inputStyle = {
  width: '100%',
  padding: '9px 10px',
  borderRadius: 8,
  border: `1px solid ${theme.colors.border}`,
  background: theme.colors.bg,
  color: theme.colors.textPrimary,
  fontSize: 13,
  boxSizing: 'border-box',
  outline: 'none',
};

const buttonStyle = {
  width: '100%',
  marginTop: 18,
  padding: '10px 0',
  borderRadius: 8,
  border: 'none',
  background: theme.colors.indigo,
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
