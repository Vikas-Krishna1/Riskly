import { useState, FormEvent, ChangeEvent } from 'react';
import { portfolioService } from './portfolioService';
import { PortfolioCreate } from './types';
import './PortfolioForm.css';

interface Message {
  type: 'success' | 'error' | '';
  text: string;
}

interface PortfolioFormProps {
  onSuccess?: () => void;
}

export default function PortfolioForm({ onSuccess }: PortfolioFormProps) {
  const [formData, setFormData] = useState<PortfolioCreate>({
    name: '',
    description: '',
    isPublic: false
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await portfolioService.create({
        name: formData.name,
        description: formData.description || undefined,
        isPublic: formData.isPublic || false
      });
      
      setMessage({ type: 'success', text: 'Portfolio created successfully!' });
      setFormData({ name: '', description: '' });
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000); // Small delay to show success message
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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="portfolio-form-container">
      <h2 className="portfolio-form-title">Create New Portfolio</h2>
      
      <form onSubmit={handleSubmit} className="portfolio-form">
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            maxLength={100}
            className="form-input"
            placeholder="Enter portfolio name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            maxLength={500}
            rows={4}
            className="form-textarea"
            placeholder="Enter portfolio description (optional)"
          />
          <p className="character-count">
            {formData.description?.length || 0}/500 characters
          </p>
        </div>

        <div className="form-group">
          <label className="form-label-checkbox">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic || false}
              onChange={handleChange}
              className="form-checkbox"
            />
            <span>Make this portfolio public</span>
          </label>
          <p className="form-help-text">
            Public portfolios are visible to everyone in the gallery
          </p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !formData.name}
          className="submit-button"
        >
          {loading ? 'Creating...' : 'Create Portfolio'}
        </button>
      </form>
    </div>
  );
}