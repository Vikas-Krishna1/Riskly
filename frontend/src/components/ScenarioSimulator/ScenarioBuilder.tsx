import { useState, useEffect } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import './ScenarioSimulator.css';

interface ScenarioBuilderProps {
  portfolioId: string;
  onSimulate: (scenarioData: any) => void;
  onCancel: () => void;
}

export default function ScenarioBuilder({ portfolioId, onSimulate, onCancel }: ScenarioBuilderProps) {
  const [scenarioType, setScenarioType] = useState('MARKET_CRASH');
  const [marketCrashPercent, setMarketCrashPercent] = useState(-20);
  const [customAdjustments, setCustomAdjustments] = useState<Record<string, number>>({});
  const [holdings, setHoldings] = useState<any[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [newAdjustment, setNewAdjustment] = useState('');

  useEffect(() => {
    fetchHoldings();
  }, [portfolioId]);

  const fetchHoldings = async () => {
    try {
      const portfolio = await portfolioService.getById(portfolioId);
      if (portfolio.holdings) {
        setHoldings(portfolio.holdings);
      }
    } catch (err) {
      // Silently fail
    }
  };

  const handleAddCustomAdjustment = () => {
    if (!newSymbol || !newAdjustment) return;
    const adjustment = parseFloat(newAdjustment);
    if (isNaN(adjustment)) {
      alert('Please enter a valid percentage');
      return;
    }
    setCustomAdjustments({
      ...customAdjustments,
      [newSymbol.toUpperCase()]: adjustment,
    });
    setNewSymbol('');
    setNewAdjustment('');
  };

  const handleRemoveAdjustment = (symbol: string) => {
    const updated = { ...customAdjustments };
    delete updated[symbol];
    setCustomAdjustments(updated);
  };

  const handleSimulate = () => {
    const scenarioData: any = {
      scenarioType,
    };

    if (scenarioType === 'MARKET_CRASH') {
      scenarioData.marketCrashPercent = marketCrashPercent;
    } else if (scenarioType === 'CUSTOM') {
      scenarioData.customAdjustments = customAdjustments;
    }

    onSimulate(scenarioData);
  };

  return (
    <div className="scenario-builder">
      <h3>Build Scenario</h3>
      
      <div className="form-group">
        <label>Scenario Type</label>
        <select value={scenarioType} onChange={(e) => setScenarioType(e.target.value)}>
          <option value="MARKET_CRASH">Market Crash</option>
          <option value="RECESSION">Recession</option>
          <option value="SECTOR_ROTATION">Sector Rotation</option>
          <option value="INTEREST_RATE_SHOCK">Interest Rate Shock</option>
          <option value="CUSTOM">Custom Scenario</option>
        </select>
      </div>

      {scenarioType === 'MARKET_CRASH' && (
        <div className="form-group">
          <label>Market Decline Percentage</label>
          <input
            type="number"
            step="1"
            value={marketCrashPercent}
            onChange={(e) => setMarketCrashPercent(parseFloat(e.target.value) || 0)}
            placeholder="-20"
          />
          <p className="help-text">Enter negative value for decline (e.g., -20 for 20% drop)</p>
        </div>
      )}

      {scenarioType === 'CUSTOM' && (
        <div className="custom-adjustments">
          <h4>Custom Adjustments</h4>
          <div className="add-adjustment">
            <input
              type="text"
              placeholder="Symbol (e.g., AAPL)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomAdjustment()}
            />
            <input
              type="number"
              step="0.1"
              placeholder="% Change"
              value={newAdjustment}
              onChange={(e) => setNewAdjustment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomAdjustment()}
            />
            <button onClick={handleAddCustomAdjustment}>Add</button>
          </div>
          {Object.entries(customAdjustments).length > 0 && (
            <div className="adjustments-list">
              {Object.entries(customAdjustments).map(([symbol, adjustment]) => (
                <div key={symbol} className="adjustment-item">
                  <span>{symbol}: {adjustment > 0 ? '+' : ''}{adjustment}%</span>
                  <button onClick={() => handleRemoveAdjustment(symbol)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {scenarioType !== 'CUSTOM' && scenarioType !== 'MARKET_CRASH' && (
        <div className="scenario-info">
          <p>This scenario will apply predefined adjustments based on sector classifications.</p>
        </div>
      )}

      <div className="builder-actions">
        <button onClick={onCancel} className="cancel-btn">Cancel</button>
        <button onClick={handleSimulate} className="simulate-btn">Run Simulation</button>
      </div>
    </div>
  );
}

