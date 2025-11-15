import { useState, useEffect } from 'react';
import { AIAnalysisModalProps, AIAnalysisResponse } from './types';
import { portfolioService } from '../PortfolioForm/portfolioService';
import AIAnalysisContent from './AIAnalysisContent';
import './AIAnalysisModal.css';

export default function AIAnalysisModal({ isOpen, onClose, portfolioId }: AIAnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);

  useEffect(() => {
    if (isOpen && !analysis) {
      fetchAIAnalysis();
    }
  }, [isOpen]);

  const fetchAIAnalysis = async () => {
    if (!portfolioId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await portfolioService.getAIAnalysis(portfolioId);
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch AI analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setAnalysis(null);
    fetchAIAnalysis();
  };

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-header">
          <div className="ai-modal-title-section">
            <h2 className="ai-modal-title">
              <span className="ai-icon">🤖</span>
              AI Portfolio Analysis
            </h2>
            {analysis && (
              <span className="portfolio-name-badge">{analysis.portfolioName}</span>
            )}
          </div>
          <div className="ai-modal-actions">
            {analysis && (
              <button
                className="refresh-button"
                onClick={handleRefresh}
                title="Refresh Analysis"
              >
                🔄
              </button>
            )}
            <button className="close-button" onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="ai-modal-body">
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Analyzing your portfolio with AI...</p>
              <p className="loading-subtext">This may take a few moments</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <p className="error-message">{error}</p>
              <button className="retry-button" onClick={fetchAIAnalysis}>
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && analysis && (
            <AIAnalysisContent analysis={analysis.analysis} />
          )}
        </div>
      </div>
    </div>
  );
}

