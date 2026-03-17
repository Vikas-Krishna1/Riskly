import { useState, useEffect } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import ScenarioBuilder from './ScenarioBuilder';
import ScenarioResults from './ScenarioResults';
import './ScenarioSimulator.css';

interface ScenarioSimulatorProps {
  portfolioId: string;
}

export default function ScenarioSimulator({ portfolioId }: ScenarioSimulatorProps) {
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const handleSimulate = async (scenarioData: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await portfolioService.simulateScenario(portfolioId, scenarioData);
      setScenarioResult(result);
      setShowBuilder(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to simulate scenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scenario-simulator">
      <div className="scenario-header">
        <h2>Risk Scenario Simulator</h2>
        <button onClick={() => setShowBuilder(!showBuilder)} className="new-scenario-btn">
          {showBuilder ? 'Cancel' : '+ New Scenario'}
        </button>
      </div>

      {showBuilder && (
        <ScenarioBuilder
          portfolioId={portfolioId}
          onSimulate={handleSimulate}
          onCancel={() => setShowBuilder(false)}
        />
      )}

      {error && (
        <div className="scenario-error">
          {error}
        </div>
      )}

      {loading && (
        <div className="scenario-loading">
          Simulating scenario...
        </div>
      )}

      {scenarioResult && !showBuilder && (
        <ScenarioResults result={scenarioResult} />
      )}

      {!scenarioResult && !showBuilder && !loading && (
        <div className="scenario-prompt">
          <p>Test your portfolio's resilience under different market scenarios.</p>
          <p>Click "New Scenario" to run a stress test.</p>
        </div>
      )}
    </div>
  );
}

