import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { theme } from '../theme';
import SensorChart from '../components/SensorChart';
import StateBadge from '../components/StateBadge';

export default function MachineDetail() {
  const { machineId } = useParams();
  const [readings, setReadings] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [rul, setRul] = useState(null);
  const [rulError, setRulError] = useState('');
  const [rulLoading, setRulLoading] = useState(false);

  const loadData = async () => {
    const [readingsRes, predictionsRes] = await Promise.all([
      api.get(`/machines/${machineId}/readings?limit=100`),
      api.get(`/machines/${machineId}/predictions?limit=10`),
    ]);
    // reverse so chart draws oldest -> newest, left to right
    setReadings([...readingsRes.data].reverse());
    setPredictions(predictionsRes.data);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [machineId]);

  const runRulPrediction = async () => {
    setRulLoading(true);
    setRulError('');
    try {
      const { data } = await api.post(`/predict-rul/${machineId}`);
      setRul(data.predicted_rul_cycles);
    } catch (err) {
      setRulError(err.response?.data?.detail || 'RUL prediction failed.');
    } finally {
      setRulLoading(false);
    }
  };

  const latest = predictions[0];

  return (
    <div style={{ padding: 32, fontFamily: theme.font.display }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textPrimary }}>{machineId}</div>
      <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 24 }}>
        Sensor history &amp; predictive analytics
      </div>

      <div
        style={{
          background: theme.colors.bgPanel,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 12 }}>
          Sensor Trends
        </div>
        {readings.length > 0 ? (
          <SensorChart data={readings} />
        ) : (
          <div style={{ fontSize: 13, color: theme.colors.textFaint, padding: '40px 0', textAlign: 'center' }}>
            No sensor readings yet. Run simulate/live_sensor_simulator.py to generate live data.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div
          style={{
            flex: 1,
            background: theme.colors.bgPanel,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 12 }}>
            Latest Health Prediction
          </div>
          {latest ? (
            <div>
              <StateBadge state={latest.predicted_state} />
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 10 }}>
                Confidence: {(latest.confidence * 100).toFixed(1)}% · Model: {latest.model_used}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: theme.colors.textFaint }}>No predictions yet.</div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            background: theme.colors.bgPanel,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 12 }}>
            Remaining Useful Life (LSTM)
          </div>
          <button
            onClick={runRulPrediction}
            disabled={rulLoading}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: theme.colors.indigo,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            {rulLoading ? 'Predicting...' : 'Run RUL Prediction'}
          </button>
          {rul !== null && (
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.indigoBright, fontFamily: theme.font.mono }}>
              {rul} <span style={{ fontSize: 13, color: theme.colors.textMuted }}>cycles left</span>
            </div>
          )}
          {rulError && <div style={{ fontSize: 12, color: theme.colors.critical, marginTop: 8 }}>{rulError}</div>}
        </div>
      </div>
    </div>
  );
}
