
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { portfolioService } from '../../../components/PortfolioForm/portfolioService';
import { Portfolio, Holding } from '../../../components/PortfolioForm/types';
import HoldingForm from '../../../components/HoldingForm/HoldingForm';
import EditHoldingModal from '../../../components/HoldingForm/EditHoldingModal';
import PortfolioGraphs from '../../../components/PortfolioGraphs/PortfolioGraphs';
import PerformanceAttribution from '../../../components/PerformanceAttribution/PerformanceAttribution';
import AIAnalysisModal from '../../../components/AIAnalysis/AIAnalysisModal';
import TransactionHistory from '../../../components/TransactionHistory/TransactionHistory';
import PortfolioHealthScore from '../../../components/PortfolioHealthScore/PortfolioHealthScore';
import AlertsManager from '../../../components/Alerts/AlertsManager';
import RebalancingAssistant from '../../../components/RebalancingAssistant/RebalancingAssistant';
import CorrelationAnalysis from '../../../components/CorrelationAnalysis/CorrelationAnalysis';
import ScenarioSimulator from '../../../components/ScenarioSimulator/ScenarioSimulator';
import TaxOptimization from '../../../components/TaxOptimization/TaxOptimization';
import BacktestingEngine from '../../../components/Backtesting/BacktestingEngine';
import './SinglePortfolio.css';

// Define the type for the analytics data
interface PortfolioAnalytics {
  portfolioName: string;
  totalPortfolioValue: number;
  analytics: {
    dailyReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    sortinoRatio: number;
    calmarRatio: number;
    totalReturn: number;
    annualizedReturn: number;
    winRate: number;
    concentration: number;
    valueAtRisk: number;
    expectedShortfall: number;
    beta: number;
    alpha: number;
    informationRatio: number;
    treynorRatio: number;
  };
  holdings: {
    symbol: string;
    shares: number;
    purchasePrice: number;
    currentPrice: number;
    currentValue: number;
    purchaseValue: number;
    gainLoss: number;
  }[];
  historicalValue: {
    Date: string;
    Total: number;
  }[];
  benchmarks?: {
    [key: string]: {
      name: string;
      totalReturn: number;
      annualizedReturn: number;
      volatility: number;
      historicalValue: {
        Date: string;
        Value: number;
      }[];
    };
  };
  benchmarkComparison?: {
    [key: string]: {
      name: string;
      outperformance: number;
      totalOutperformance: number;
      benchmarkReturn: number;
      benchmarkAnnualizedReturn: number;
    };
  };
  bestHolding?: {
    symbol: string;
    gainLoss: number;
    gainLossPercent: number;
  };
  worstHolding?: {
    symbol: string;
    gainLoss: number;
    gainLossPercent: number;
  };
  attribution?: {
    byHolding: {
      symbol: string;
      sector: string;
      industry: string;
      contributionToReturn: number;
      contributionPercent: number;
      gainLoss: number;
      currentValue: number;
      purchaseValue: number;
    }[];
    bySector: {
      sector: string;
      contributionToReturn: number;
      contributionPercent: number;
      totalGainLoss: number;
      totalCurrentValue: number;
      totalPurchaseValue: number;
      holdings: string[];
      holdingCount: number;
    }[];
  };
}

const SinglePortfolio = () => {
  const { portfolioId } = useParams<{ userId: string; portfolioId: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingHoldingId, setDeletingHoldingId] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!portfolioId) {
      setError('Portfolio ID is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await portfolioService.getById(portfolioId);
      setPortfolio(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleAnalyze = async () => {
    if (!portfolioId) return;
    setAnalyzing(true);
    setError(null);
    try {
      const data = await portfolioService.getAnalytics(portfolioId);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEditHolding = (holding: Holding) => {
    setEditingHolding(holding);
    setShowEditModal(true);
  };

  const handleDeleteHolding = async (holdingId: string, symbol: string) => {
    if (!portfolioId) return;
    
    if (!confirm(`Are you sure you want to delete ${symbol}? This action cannot be undone.`)) {
      return;
    }

    setDeletingHoldingId(holdingId);
    setError(null);
    
    try {
      await portfolioService.deleteHolding(portfolioId, holdingId);
      await fetchPortfolio(); // Refresh portfolio data
      if (analytics) {
        // Refresh analytics if they're loaded
        await handleAnalyze();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete holding');
    } finally {
      setDeletingHoldingId(null);
    }
  };

  const handleEditSuccess = async () => {
    await fetchPortfolio(); // Refresh portfolio data
    if (analytics) {
      // Refresh analytics if they're loaded
      await handleAnalyze();
    }
    setShowEditModal(false);
    setEditingHolding(null);
  };

  if (loading) {
    return <div className="loading-message">Loading portfolio...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!portfolio) {
    return <div className="info-message">Portfolio not found.</div>;
  }

  return (
    <div className="single-portfolio-container">
      <header className="portfolio-header">
        <h1>{portfolio.name}</h1>
        <p className="portfolio-description">{portfolio.description}</p>
      </header>

      <main className="portfolio-main-content">
        <section className="holdings-section">
          <h2 className="section-title">Holdings</h2>
          {portfolio.holdings && portfolio.holdings.length > 0 ? (
            <ul className="holdings-list">
              {portfolio.holdings.map((holding) => (
                <li key={holding.id} className="holding-item">
                  <div className="holding-info">
                    <span className="holding-symbol">{holding.symbol}</span>
                    <span className="holding-details">{holding.shares} shares @ ${holding.purchasePrice.toFixed(2)}</span>
                    <span className="holding-date">Purchased: {new Date(holding.purchaseDate).toLocaleDateString()}</span>
                  </div>
                  <div className="holding-actions">
                    <button
                      className="edit-holding-button"
                      onClick={() => handleEditHolding(holding)}
                      title="Edit holding"
                      disabled={deletingHoldingId === holding.id}
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-holding-button"
                      onClick={() => handleDeleteHolding(holding.id, holding.symbol)}
                      title="Delete holding"
                      disabled={deletingHoldingId === holding.id}
                    >
                      {deletingHoldingId === holding.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-holdings-message">This portfolio has no holdings yet.</p>
          )}
        </section>

        <aside className="form-section">
          <HoldingForm portfolioId={portfolio.id} onSuccess={fetchPortfolio} />
        </aside>
      </main>

      {portfolioId && (
        <TransactionHistory portfolioId={portfolioId} />
      )}

      <div className="analyze-button-container">
        <button className="analyze-button" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? 'Analyzing...' : 'Analyze Portfolio'}
        </button>
      </div>

      {analytics && (
        <>
          <section className="analytics-section">
            <div className="analytics-header">
              <h2 className="section-title">Portfolio Analytics</h2>
              <button
                className="ai-advice-button"
                onClick={() => setShowAIModal(true)}
                title="Get AI-powered investment advice"
              >
                <span className="ai-button-icon">🤖</span>
                Get AI Advice
              </button>
            </div>
            <div className="analytics-summary">
              <p><strong>Total Value:</strong> ${analytics.totalPortfolioValue.toFixed(2)}</p>
              <p><strong>Avg. Daily Return:</strong> {(analytics.analytics.dailyReturn * 100).toFixed(4)}%</p>
              <p><strong>Volatility:</strong> {(analytics.analytics.volatility * 100).toFixed(4)}%</p>
              <p><strong>Sharpe Ratio:</strong> {analytics.analytics.sharpeRatio.toFixed(4)}</p>
            </div>

            <h3 className="subsection-title">Analyzed Holdings</h3>
            <ul className="holdings-list">
              {analytics.holdings.map((holding) => (
                <li key={holding.symbol} className="holding-item">
                  <span className="holding-symbol">{holding.symbol}</span>
                  <span className="holding-details">
                    {holding.shares} shares | Current Value: ${holding.currentValue.toFixed(2)} | Gain/Loss: ${holding.gainLoss.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <PortfolioGraphs analytics={analytics} />

          {portfolioId && (
            <PortfolioHealthScore portfolioId={portfolioId} />
          )}

          {portfolioId && (
            <AlertsManager portfolioId={portfolioId} />
          )}

          {portfolioId && (
            <RebalancingAssistant portfolioId={portfolioId} />
          )}

          {portfolioId && (
            <CorrelationAnalysis portfolioId={portfolioId} />
          )}

          {portfolioId && (
            <ScenarioSimulator portfolioId={portfolioId} />
          )}

          {portfolioId && (
            <TaxOptimization portfolioId={portfolioId} />
          )}

          {portfolioId && (
            <BacktestingEngine portfolioId={portfolioId} />
          )}

          {analytics.attribution && (
            <PerformanceAttribution
              attribution={analytics.attribution}
              totalPortfolioValue={analytics.totalPortfolioValue}
            />
          )}
        </>
      )}

      {portfolioId && (
        <AIAnalysisModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          portfolioId={portfolioId}
        />
      )}

      {portfolioId && editingHolding && (
        <EditHoldingModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingHolding(null);
          }}
          portfolioId={portfolioId}
          holding={editingHolding}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default SinglePortfolio;
