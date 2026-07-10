import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { theme } from '../theme';

export default function Machines() {
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    api.get('/machines').then((res) => setMachines(res.data));
  }, []);

  return (
    <div style={{ padding: 32, fontFamily: theme.font.display }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
        Machines
      </div>
      <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 24 }}>
        {machines.length} registered units
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {machines.map((m) => (
          <Link
            key={m.machine_id}
            to={`/machines/${m.machine_id}`}
            style={{
              textDecoration: 'none',
              background: theme.colors.bgPanel,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius,
              padding: 18,
              display: 'block',
            }}
          >
            <div style={{ fontSize: 11, color: theme.colors.textFaint, fontFamily: theme.font.mono, marginBottom: 6 }}>
              {m.machine_id}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
              {m.machine_name}
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 10 }}>{m.machine_type}</div>
            <div
              style={{
                display: 'inline-block',
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 999,
                background: theme.colors.indigoDim,
                color: theme.colors.indigoBright,
              }}
            >
              {m.status}
            </div>
          </Link>
        ))}
        {machines.length === 0 && (
          <div style={{ color: theme.colors.textFaint, fontSize: 13 }}>
            No machines found. Run database/schema.sql to seed sample machines.
          </div>
        )}
      </div>
    </div>
  );
}
