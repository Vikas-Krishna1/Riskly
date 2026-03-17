import { useState, useEffect } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import TargetAllocationEditor from './TargetAllocationEditor';
import RebalancingSuggestions from './RebalancingSuggestions';
import './RebalancingAssistant.css';

interface TargetAllocation {
  symbol: string;
  targetPercent: number;
}

interface RebalancingSuggestion {
  symbol: string;
  action: string;
  currentShares: number;
  targetShares: number;
  sharesToTrade: number;
  currentValue: number;
  targetValue: number;
  currentPercent: number;
  targetPercent: number;
  drift: number;
}

interface RebalancingSuggestionsData {
  portfolioId: string;
  totalPortfolioValue: number;
  tolerance: number;
  suggestions: RebalancingSuggestion[];
  summary: {
    totalDrift: number;
    needsRebalancing: boolean;
    holdingsNeedingRebalancing: number;
    totalHoldings: number;
  };
}

interface RebalancingAssistantProps {
  portfolioId: string;
}

export default function RebalancingAssistant({ portfolioId }: RebalancingAssistantProps) {
  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>([]);
  const [tolerance, setTolerance] = useState(5.0);
  const [suggestions, setSuggestions] = useState<RebalancingSuggestionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    fetchTargetAllocations();
  }, [portfolioId]);

  const fetchTargetAllocations = async () => {
    try {
      const data = await portfolioService.getTargetAllocations(portfolioId);
      if (data.allocations && Object.keys(data.allocations).length > 0) {
        const allocations = Object.entries(data.allocations).map(([symbol, percent]) => ({
          symbol,
          targetPercent: percent as number,
        }));
        setTargetAllocations(allocations);
        setTolerance(data.tolerance || 5.0);
      }
    } catch (err) {
      // Silently fail - target allocations are optional
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getRebalancingSuggestions(portfolioId);
      setSuggestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rebalancing suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocationsSaved = () => {
    setShowEditor(false);
    fetchTargetAllocations();
    fetchSuggestions();
  };

  return (
    <div className="rebalancing-assistant">
      <div className="rebalancing-header">
        <h2>Smart Rebalancing Assistant</h2>
        <div className="rebalancing-actions">
          {targetAllocations.length > 0 && (
            <button onClick={fetchSuggestions} className="get-suggestions-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Get Suggestions'}
            </button>
          )}
          <button onClick={() => setShowEditor(!showEditor)} className="edit-targets-btn">
            {showEditor ? 'Cancel' : targetAllocations.length > 0 ? 'Edit Targets' : 'Set Target Allocations'}
          </button>
        </div>
      </div>

      {showEditor && (
        <TargetAllocationEditor
          portfolioId={portfolioId}
          initialAllocations={targetAllocations}
          initialTolerance={tolerance}
          onSave={handleAllocationsSaved}
          onCancel={() => setShowEditor(false)}
        />
      )}

      {error && (
        <div className="rebalancing-error">
          {error}
        </div>
      )}

      {suggestions && !showEditor && (
        <RebalancingSuggestions suggestions={suggestions} />
      )}

      {!suggestions && !showEditor && targetAllocations.length > 0 && (
        <div className="rebalancing-prompt">
          <p>Click "Get Suggestions" to see rebalancing recommendations based on your target allocations.</p>
        </div>
      )}

      {!showEditor && targetAllocations.length === 0 && (
        <div className="rebalancing-prompt">
          <p>Set target allocations to enable rebalancing suggestions. This helps maintain your desired portfolio allocation.</p>
        </div>
      )}
    </div>
  );
}

