import { useState } from 'react';
import './AlertsManager.css';

interface AlertCreatorProps {
  portfolioId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AlertCreator({ portfolioId, onSuccess, onCancel }: AlertCreatorProps) {
  const [alertType, setAlertType] = useState('PRICE');
  const [symbol, setSymbol] = useState('');
  const [threshold, setThreshold] = useState('');
  const [condition, setCondition] = useState('ABOVE');
  const [riskMetric, setRiskMetric] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const alertData: any = {
        portfolioId,
        alertType,
        threshold: parseFloat(threshold),
        condition,
        enabled: true,
      };

      if (alertType === 'PRICE' && symbol) {
        alertData.symbol = symbol.toUpperCase();
      }

      if (alertType === 'RISK_METRIC' && riskMetric) {
        alertData.riskMetric = riskMetric;
      }

      if (notes) {
        alertData.notes = notes;
      }

      const { portfolioService } = await import('../PortfolioForm/portfolioService');
      await portfolioService.createAlert(alertData);
      onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create alert');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="alert-creator">
      <h3>Create New Alert</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Alert Type</label>
          <select value={alertType} onChange={(e) => setAlertType(e.target.value)}>
            <option value="PRICE">Price Alert</option>
            <option value="PORTFOLIO_VALUE">Portfolio Value Alert</option>
            <option value="RISK_METRIC">Risk Metric Alert</option>
            <option value="REBALANCING">Rebalancing Alert</option>
          </select>
        </div>

        {alertType === 'PRICE' && (
          <div className="form-group">
            <label>Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., AAPL"
              required
            />
          </div>
        )}

        {alertType === 'RISK_METRIC' && (
          <div className="form-group">
            <label>Risk Metric</label>
            <select value={riskMetric} onChange={(e) => setRiskMetric(e.target.value)} required>
              <option value="">Select metric</option>
              <option value="VAR">Value at Risk (VaR)</option>
              <option value="DRAWDOWN">Max Drawdown</option>
              <option value="VOLATILITY">Volatility</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Condition</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="ABOVE">Above</option>
            <option value="BELOW">Below</option>
            <option value="EQUALS">Equals</option>
          </select>
        </div>

        <div className="form-group">
          <label>Threshold</label>
          <input
            type="number"
            step="0.01"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder={alertType === 'PRICE' ? 'e.g., 150.00' : 'e.g., 10000'}
            required
          />
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this alert"
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      </form>
    </div>
  );
}

