import { useState, useEffect } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import './RebalancingAssistant.css';

interface TargetAllocation {
  symbol: string;
  targetPercent: number;
}

interface TargetAllocationEditorProps {
  portfolioId: string;
  initialAllocations: TargetAllocation[];
  initialTolerance: number;
  onSave: () => void;
  onCancel: () => void;
}

export default function TargetAllocationEditor({
  portfolioId,
  initialAllocations,
  initialTolerance,
  onSave,
  onCancel,
}: TargetAllocationEditorProps) {
  const [allocations, setAllocations] = useState<TargetAllocation[]>(initialAllocations);
  const [tolerance, setTolerance] = useState(initialTolerance);
  const [newSymbol, setNewSymbol] = useState('');
  const [newPercent, setNewPercent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddAllocation = () => {
    if (!newSymbol || !newPercent) return;
    
    const percent = parseFloat(newPercent);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      alert('Please enter a valid percentage between 0 and 100');
      return;
    }

    const total = allocations.reduce((sum, a) => sum + a.targetPercent, 0) + percent;
    if (total > 100) {
      alert(`Total allocation would be ${total.toFixed(1)}%. Please keep it under 100%.`);
      return;
    }

    setAllocations([...allocations, { symbol: newSymbol.toUpperCase(), targetPercent: percent }]);
    setNewSymbol('');
    setNewPercent('');
  };

  const handleRemoveAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleUpdatePercent = (index: number, percent: number) => {
    if (isNaN(percent) || percent < 0 || percent > 100) return;
    
    const total = allocations.reduce((sum, a, i) => sum + (i === index ? percent : a.targetPercent), 0);
    if (total > 100) {
      alert(`Total allocation would be ${total.toFixed(1)}%. Please keep it under 100%.`);
      return;
    }

    const updated = [...allocations];
    updated[index].targetPercent = percent;
    setAllocations(updated);
  };

  const handleSave = async () => {
    if (allocations.length === 0) {
      alert('Please add at least one target allocation');
      return;
    }

    const total = allocations.reduce((sum, a) => sum + a.targetPercent, 0);
    if (total > 100) {
      alert(`Total allocation is ${total.toFixed(1)}%. Please keep it under 100%.`);
      return;
    }

    setSubmitting(true);
    try {
      await portfolioService.setTargetAllocations(portfolioId, {
        allocations: allocations.map(a => ({
          symbol: a.symbol,
          targetPercent: a.targetPercent,
        })),
        tolerance: tolerance,
      });
      onSave();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save target allocations');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAllocation = allocations.reduce((sum, a) => sum + a.targetPercent, 0);

  return (
    <div className="target-allocation-editor">
      <h3>Set Target Allocations</h3>
      
      <div className="tolerance-setting">
        <label>
          Rebalancing Tolerance (%):
          <input
            type="number"
            step="0.1"
            min="0"
            max="50"
            value={tolerance}
            onChange={(e) => setTolerance(parseFloat(e.target.value) || 0)}
          />
        </label>
        <p className="tolerance-help">Holdings within this percentage of target won't trigger rebalancing suggestions.</p>
      </div>

      <div className="allocations-list">
        <h4>Target Allocations</h4>
        {allocations.map((allocation, index) => (
          <div key={index} className="allocation-item">
            <span className="allocation-symbol">{allocation.symbol}</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={allocation.targetPercent}
              onChange={(e) => handleUpdatePercent(index, parseFloat(e.target.value) || 0)}
              className="allocation-percent-input"
            />
            <span className="allocation-percent">%</span>
            <button
              onClick={() => handleRemoveAllocation(index)}
              className="remove-allocation-btn"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="total-allocation">
        <strong>Total: {totalAllocation.toFixed(1)}%</strong>
        {totalAllocation > 100 && <span className="error-text"> (Exceeds 100%)</span>}
      </div>

      <div className="add-allocation">
        <input
          type="text"
          placeholder="Symbol (e.g., AAPL)"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && handleAddAllocation()}
          className="new-symbol-input"
        />
        <input
          type="number"
          step="0.1"
          min="0"
          max="100"
          placeholder="%"
          value={newPercent}
          onChange={(e) => setNewPercent(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddAllocation()}
          className="new-percent-input"
        />
        <button onClick={handleAddAllocation} className="add-allocation-btn">
          Add
        </button>
      </div>

      <div className="editor-actions">
        <button onClick={onCancel} disabled={submitting} className="cancel-btn">
          Cancel
        </button>
        <button onClick={handleSave} disabled={submitting || totalAllocation > 100} className="save-btn">
          {submitting ? 'Saving...' : 'Save Targets'}
        </button>
      </div>
    </div>
  );
}

