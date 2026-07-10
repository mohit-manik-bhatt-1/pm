import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { theme } from '../theme';

const SERIES = [
  { key: 'temperature_c', name: 'Temp (°C)', color: '#F87171' },
  { key: 'vibration_mm_s', name: 'Vibration (mm/s)', color: '#FBBF24' },
  { key: 'pressure_psi', name: 'Pressure (psi)', color: '#818CF8' },
  { key: 'current_a', name: 'Current (A)', color: '#34D399' },
];

export default function SensorChart({ data, activeSeries }) {
  const seriesToShow = activeSeries ? SERIES.filter((s) => activeSeries.includes(s.key)) : SERIES;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={theme.colors.border} strokeDasharray="3 3" />
        <XAxis
          dataKey="cycle"
          stroke={theme.colors.textFaint}
          tick={{ fontSize: 11, fontFamily: theme.font.mono }}
          label={{ value: 'Cycle', position: 'insideBottomRight', offset: -5, fill: theme.colors.textFaint, fontSize: 11 }}
        />
        <YAxis stroke={theme.colors.textFaint} tick={{ fontSize: 11, fontFamily: theme.font.mono }} />
        <Tooltip
          contentStyle={{
            background: theme.colors.bgPanel,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 8,
            fontSize: 12,
            fontFamily: theme.font.mono,
          }}
          labelStyle={{ color: theme.colors.textPrimary }}
        />
        <Legend wrapperStyle={{ fontSize: 12, fontFamily: theme.font.mono }} />
        {seriesToShow.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
