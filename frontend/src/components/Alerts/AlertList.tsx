import './AlertsManager.css';

interface Alert {
  id: string;
  portfolioId: string;
  alertType: string;
  symbol?: string;
  threshold: number;
  condition: string;
  riskMetric?: string;
  enabled: boolean;
  notes?: string;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
  lastChecked?: string;
}

interface AlertListProps {
  alerts: Alert[];
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

export default function AlertList({ alerts, onDelete, onToggle }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="alert-list-empty">
        <p>No alerts configured. Create one to get started!</p>
      </div>
    );
  }

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'PRICE':
        return 'Price Alert';
      case 'PORTFOLIO_VALUE':
        return 'Portfolio Value';
      case 'RISK_METRIC':
        return 'Risk Metric';
      case 'REBALANCING':
        return 'Rebalancing';
      default:
        return type;
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'ABOVE':
        return '>';
      case 'BELOW':
        return '<';
      case 'EQUALS':
        return '=';
      default:
        return condition;
    }
  };

  return (
    <div className="alert-list">
      <h3>Active Alerts ({alerts.length})</h3>
      <div className="alert-items">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`alert-item ${alert.triggered ? 'triggered' : ''} ${!alert.enabled ? 'disabled' : ''}`}
          >
            <div className="alert-header">
              <div className="alert-info">
                <span className="alert-type">{getAlertTypeLabel(alert.alertType)}</span>
                {alert.triggered && <span className="triggered-badge">TRIGGERED</span>}
                {!alert.enabled && <span className="disabled-badge">DISABLED</span>}
              </div>
              <div className="alert-actions">
                <button
                  onClick={() => onToggle(alert.id, alert.enabled)}
                  className="toggle-btn"
                  title={alert.enabled ? 'Disable' : 'Enable'}
                >
                  {alert.enabled ? '✓' : '✗'}
                </button>
                <button
                  onClick={() => onDelete(alert.id)}
                  className="delete-btn"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="alert-details">
              {alert.symbol && (
                <div className="alert-detail">
                  <strong>Symbol:</strong> {alert.symbol}
                </div>
              )}
              {alert.riskMetric && (
                <div className="alert-detail">
                  <strong>Metric:</strong> {alert.riskMetric}
                </div>
              )}
              <div className="alert-detail">
                <strong>Condition:</strong> {getConditionLabel(alert.condition)} ${alert.threshold.toFixed(2)}
              </div>
              {alert.notes && (
                <div className="alert-detail">
                  <strong>Notes:</strong> {alert.notes}
                </div>
              )}
              {alert.triggeredAt && (
                <div className="alert-detail triggered-time">
                  <strong>Triggered:</strong> {new Date(alert.triggeredAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

