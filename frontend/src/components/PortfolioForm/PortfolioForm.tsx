import { useState, FormEvent, ChangeEvent } from 'react';
import './PortfolioForm.css';

interface PortfolioFormData {
  name: string;
  description: string;
}

interface Message {
  type: 'success' | 'error' | '';
  text: string;
}

export default function PortfolioForm() {
  const [formData, setFormData] = useState<PortfolioFormData>({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: 'Portfolio created successfully!' });
        setFormData({ name: '', description: '' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to create portfolio' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
            {formData.description.length}/500 characters
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