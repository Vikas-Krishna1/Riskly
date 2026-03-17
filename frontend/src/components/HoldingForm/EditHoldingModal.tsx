import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import { Holding, HoldingUpdate } from './types';
import './EditHoldingModal.css';

interface EditHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  holding: Holding | null;
  onSuccess?: () => void;
}

const formatDateForInput = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EditHoldingModal({ 
  isOpen, 
  onClose, 
  portfolioId, 
  holding, 
  onSuccess 
}: EditHoldingModalProps) {
  const [formData, setFormData] = useState<HoldingUpdate>({
    symbol: '',
    shares: undefined,
    purchaseDate: undefined,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ 
    type: '', 
    text: '' 
  });

  // Initialize form data when holding changes
  useEffect(() => {
    if (holding) {
      setFormData({
        symbol: holding.symbol,
        shares: holding.shares,
        purchaseDate: formatDateForInput(holding.purchaseDate),
      });
      setMessage({ type: '', text: '' });
    }
  }, [holding]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!holding) {
      setMessage({ type: 'error', text: 'No holding selected' });
      setLoading(false);
      return;
    }

    // Validate that at least one field is being updated
    if (!formData.symbol && formData.shares === undefined && !formData.purchaseDate) {
      setMessage({ type: 'error', text: 'Please update at least one field' });
      setLoading(false);
      return;
    }

    // Validate symbol if provided
    if (formData.symbol && (formData.symbol.length < 1 || formData.symbol.length > 10)) {
      setMessage({ type: 'error', text: 'Ticker symbol must be 1-10 characters long.' });
      setLoading(false);
      return;
    }

    // Validate shares if provided
    if (formData.shares !== undefined && formData.shares <= 0) {
      setMessage({ type: 'error', text: 'Shares must be greater than 0' });
      setLoading(false);
      return;
    }

    try {
      const updateData: HoldingUpdate = {};
      if (formData.symbol && formData.symbol !== holding.symbol) {
        updateData.symbol = formData.symbol;
      }
      if (formData.shares !== undefined && formData.shares !== holding.shares) {
        updateData.shares = formData.shares;
      }
      if (formData.purchaseDate && formData.purchaseDate !== formatDateForInput(holding.purchaseDate)) {
        updateData.purchaseDate = formData.purchaseDate;
      }

      await portfolioService.updateHolding(portfolioId, holding.id, updateData);
      
      setMessage({ type: 'success', text: 'Holding updated successfully!' });
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'symbol' ? value.toUpperCase() : (name === 'shares' ? parseFloat(value) || undefined : value),
    }));
  };

  if (!isOpen || !holding) return null;

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h2 className="edit-modal-title">Edit Holding</h2>
          <button className="edit-modal-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-modal-form">
          <div className="form-group">
            <label htmlFor="symbol" className="form-label">
              Symbol
            </label>
            <input
              type="text"
              id="symbol"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              maxLength={10}
              className="form-input"
              placeholder="e.g., AAPL"
            />
            <small className="form-hint">Leave unchanged to keep current value</small>
          </div>

          <div className="form-group">
            <label htmlFor="shares" className="form-label">
              Shares
            </label>
            <input
              type="number"
              id="shares"
              name="shares"
              value={formData.shares ?? ''}
              onChange={handleChange}
              min="0"
              step="any"
              className="form-input"
              placeholder="e.g., 10.5"
            />
            <small className="form-hint">Leave empty to keep current value</small>
          </div>

          <div className="form-group">
            <label htmlFor="purchaseDate" className="form-label">
              Purchase Date
            </label>
            <input
              type="date"
              id="purchaseDate"
              name="purchaseDate"
              value={formData.purchaseDate ?? ''}
              onChange={handleChange}
              className="form-input"
            />
            <small className="form-hint">Leave empty to keep current date</small>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="edit-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Updating...' : 'Update Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

