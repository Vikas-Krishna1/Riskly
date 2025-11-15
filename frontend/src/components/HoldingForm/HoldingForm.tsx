import { useState, FormEvent, ChangeEvent } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import { HoldingAdd, Message, HoldingFormProps } from './types';
import './HoldingForm.css';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function HoldingForm({ portfolioId, onSuccess }: HoldingFormProps) {
  const [formData, setFormData] = useState<HoldingAdd>({
    symbol: '',
    shares: 0,
    purchaseDate: getTodayDateString(),
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (formData.symbol.length < 1 || formData.symbol.length > 5) {
      setMessage({ type: 'error', text: 'Ticker symbol must be 1-5 characters long.' });
      setLoading(false);
      return;
    }

    try {
      await portfolioService.addHolding(portfolioId, {
        ...formData,
        shares: Number(formData.shares),
      });
      
      setMessage({ type: 'success', text: 'Holding added successfully!' });
      setFormData({
        symbol: '',
        shares: 0,
        purchaseDate: getTodayDateString(),
      });
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
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
      [name]: name === 'symbol' ? value.toUpperCase() : value,
    }));
  };

  const isFormValid = formData.symbol.length >= 1 && formData.symbol.length <= 5 && formData.shares > 0 && formData.purchaseDate;

  return (
    <div className="holding-form-container">
      <h3 className="holding-form-title">Add New Holding</h3>
      
      <form onSubmit={handleSubmit} className="holding-form">
        <div className="form-group">
          <label htmlFor="symbol" className="form-label">
            Symbol <span className="required">*</span>
          </label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            required
            maxLength={4}
            className="form-input"
            placeholder="e.g., AAPL"
          />
        </div>

        <div className="form-group">
          <label htmlFor="shares" className="form-label">
            Shares <span className="required">*</span>
          </label>
          <input
            type="number"
            id="shares"
            name="shares"
            value={formData.shares}
            onChange={handleChange}
            required
            min="0"
            step="any"
            className="form-input"
            placeholder="e.g., 10.5"
          />
        </div>

        <div className="form-group">
          <label htmlFor="purchaseDate" className="form-label">
            Purchase Date <span className="required">*</span>
          </label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="submit-button"
        >
          {loading ? 'Adding...' : 'Add Holding'}
        </button>
      </form>
    </div>
  );
}
