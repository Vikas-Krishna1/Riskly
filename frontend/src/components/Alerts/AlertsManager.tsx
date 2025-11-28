import { useState, useEffect } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import AlertCreator from './AlertCreator';
import AlertList from './AlertList';
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

interface AlertsManagerProps {
  portfolioId: string;
}

export default function AlertsManager({ portfolioId }: AlertsManagerProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [portfolioId]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getPortfolioAlerts(portfolioId);
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAlerts = async () => {
    try {
      const data = await portfolioService.checkAlerts(portfolioId);
      if (data.triggeredCount > 0) {
        alert(`${data.triggeredCount} alert(s) triggered!`);
      }
      fetchAlerts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to check alerts');
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }
    try {
      await portfolioService.deleteAlert(alertId);
      fetchAlerts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete alert');
    }
  };

  const handleToggle = async (alertId: string, enabled: boolean) => {
    try {
      await portfolioService.updateAlert(alertId, { enabled: !enabled });
      fetchAlerts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update alert');
    }
  };

  if (loading) {
    return <div className="alerts-manager-loading">Loading alerts...</div>;
  }

  if (error) {
    return <div className="alerts-manager-error">Error: {error}</div>;
  }

  return (
    <div className="alerts-manager">
      <div className="alerts-manager-header">
        <h2>Portfolio Alerts</h2>
        <div className="alerts-manager-actions">
          <button onClick={handleCheckAlerts} className="check-alerts-btn">
            Check Alerts
          </button>
          <button onClick={() => setShowCreator(!showCreator)} className="create-alert-btn">
            {showCreator ? 'Cancel' : '+ Create Alert'}
          </button>
        </div>
      </div>

      {showCreator && (
        <AlertCreator
          portfolioId={portfolioId}
          onSuccess={() => {
            setShowCreator(false);
            fetchAlerts();
          }}
          onCancel={() => setShowCreator(false)}
        />
      )}

      <AlertList
        alerts={alerts}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />
    </div>
  );
}

