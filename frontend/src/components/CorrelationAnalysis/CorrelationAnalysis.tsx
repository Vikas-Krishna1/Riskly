import { useState, useEffect } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import CorrelationMatrix from './CorrelationMatrix';
import DiversificationScore from './DiversificationScore';
import './CorrelationAnalysis.css';

interface CorrelationData {
  symbol: string;
  [key: string]: string | number;
}

interface CorrelationAnalysisData {
  portfolioId: string;
  symbols: string[];
  correlationMatrix: CorrelationData[];
  diversificationScore: number;
  averageCorrelation: number;
  highlyCorrelated: Array<{
    symbol1: string;
    symbol2: string;
    correlation: number;
  }>;
  sectorInfo: Record<string, { sector: string; industry: string }>;
  sectorDistribution: Record<string, number>;
  suggestions: string[];
  dataPoints: number;
}

interface CorrelationAnalysisProps {
  portfolioId: string;
}

export default function CorrelationAnalysis({ portfolioId }: CorrelationAnalysisProps) {
  const [data, setData] = useState<CorrelationAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCorrelationAnalysis();
  }, [portfolioId]);

  const fetchCorrelationAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysisData = await portfolioService.getCorrelationAnalysis(portfolioId);
      setData(analysisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch correlation analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="correlation-analysis">
        <div className="loading">Loading correlation analysis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="correlation-analysis">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="correlation-analysis">
      <div className="correlation-header">
        <h2>Correlation Analysis & Diversification</h2>
        <button onClick={fetchCorrelationAnalysis} className="refresh-btn">Refresh</button>
      </div>

      <DiversificationScore
        score={data.diversificationScore}
        averageCorrelation={data.averageCorrelation}
        dataPoints={data.dataPoints}
      />

      <CorrelationMatrix
        symbols={data.symbols}
        correlationMatrix={data.correlationMatrix}
      />

      {data.highlyCorrelated.length > 0 && (
        <div className="highly-correlated">
          <h3>Highly Correlated Holdings</h3>
          <p className="correlation-warning">
            The following pairs show high correlation (&gt;0.7), indicating potential redundancy:
          </p>
          <ul>
            {data.highlyCorrelated.map((pair, index) => (
              <li key={index}>
                <strong>{pair.symbol1}</strong> ↔ <strong>{pair.symbol2}</strong>
                {' '}({pair.correlation.toFixed(3)})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sector-distribution">
        <h3>Sector Distribution</h3>
        <div className="sector-list">
          {Object.entries(data.sectorDistribution).map(([sector, count]) => (
            <div key={sector} className="sector-item">
              <span className="sector-name">{sector}</span>
              <span className="sector-count">{count} holding(s)</span>
            </div>
          ))}
        </div>
      </div>

      {data.suggestions && data.suggestions.length > 0 && (
        <div className="correlation-suggestions">
          <h3>Diversification Suggestions</h3>
          <ul>
            {data.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

