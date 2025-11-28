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
import SharePortfolioModal from '../../../components/SharePortfolio/SharePortfolioModal';
import './SinglePortfolio.css';

// Metric descriptions for tooltips
const METRIC_DESCRIPTIONS: Record<string, { title: string; description: string; interpretation: string }> = {
  totalValue: {
    title: 'Total Portfolio Value',
    description: 'The current market value of all holdings in your portfolio.',
    interpretation: 'Higher is generally better, but focus on growth rate over absolute value.',
  },
  dailyReturn: {
    title: 'Average Daily Return',
    description: 'The mean percentage change in portfolio value per trading day.',
    interpretation: 'Positive values indicate growth. Compare to benchmarks like S&P 500 (~0.04% daily).',
  },
  totalReturn: {
    title: 'Total Return',
    description: 'The overall percentage gain or loss since portfolio inception.',
    interpretation: 'Positive = profit, Negative = loss. Compare to your investment timeline.',
  },
  annualizedReturn: {
    title: 'Annualized Return',
    description: 'Your return normalized to a yearly basis for comparison.',
    interpretation: 'Good: >10%, Excellent: >15%. S&P 500 averages ~10% annually.',
  },
  volatility: {
    title: 'Volatility (Std Dev)',
    description: 'Measures how much your portfolio value fluctuates day-to-day.',
    interpretation: 'Lower = more stable. <15% is conservative, >25% is aggressive.',
  },
  sharpeRatio: {
    title: 'Sharpe Ratio',
    description: 'Risk-adjusted return measuring excess return per unit of risk.',
    interpretation: '<1 = subpar, 1-2 = good, 2-3 = very good, >3 = excellent.',
  },
  sortinoRatio: {
    title: 'Sortino Ratio',
    description: 'Like Sharpe but only penalizes downside volatility, not upside.',
    interpretation: 'Higher is better. >2 is good, >3 is excellent.',
  },
  maxDrawdown: {
    title: 'Maximum Drawdown',
    description: 'The largest peak-to-trough decline in portfolio value.',
    interpretation: 'Lower is better. <10% is conservative, >30% is high risk.',
  },
  beta: {
    title: 'Beta',
    description: 'Measures portfolio sensitivity to market movements.',
    interpretation: '<1 = less volatile than market, >1 = more volatile, 1 = matches market.',
  },
  alpha: {
    title: 'Alpha',
    description: 'Excess return compared to the benchmark after adjusting for risk.',
    interpretation: 'Positive = outperforming, Negative = underperforming. >0 is the goal.',
  },
  valueAtRisk: {
    title: 'Value at Risk (95%)',
    description: 'Maximum expected loss in a single day with 95% confidence.',
    interpretation: 'Lower absolute value is better. Represents your worst-case daily scenario.',
  },
  expectedShortfall: {
    title: 'Expected Shortfall (CVaR)',
    description: 'Average loss when losses exceed the VaR threshold.',
    interpretation: 'Worse than VaR scenarios. Lower absolute value indicates less tail risk.',
  },
  calmarRatio: {
    title: 'Calmar Ratio',
    description: 'Annualized return divided by maximum drawdown.',
    interpretation: '>1 is acceptable, >3 is good. Measures return per unit of drawdown risk.',
  },
  treynorRatio: {
    title: 'Treynor Ratio',
    description: 'Excess return per unit of systematic (market) risk.',
    interpretation: 'Higher is better. Useful for comparing diversified portfolios.',
  },
  informationRatio: {
    title: 'Information Ratio',
    description: 'Measures consistent outperformance vs benchmark.',
    interpretation: '>0.5 is good, >1 is excellent. Shows skill in beating the benchmark.',
  },
  winRate: {
    title: 'Win Rate',
    description: 'Percentage of trading days with positive returns.',
    interpretation: '>50% means more winning days than losing. ~53% is typical for markets.',
  },
  concentration: {
    title: 'Concentration (HHI)',
    description: 'Herfindahl-Hirschman Index measuring portfolio concentration.',
    interpretation: '<0.15 = diversified, 0.15-0.25 = moderate, >0.25 = concentrated.',
  },
};

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

type AnalyticsTab = 'overview' | 'performance' | 'risk' | 'planning' | 'alerts';

// Metric Card Component with tooltip
const MetricCard = ({ 
  metricKey, 
  value, 
  format = 'number',
  prefix = '',
  suffix = '',
  colorCode = false 
}: { 
  metricKey: string; 
  value: number; 
  format?: 'number' | 'percent' | 'currency' | 'ratio';
  prefix?: string;
  suffix?: string;
  colorCode?: boolean;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const metric = METRIC_DESCRIPTIONS[metricKey];
  
  const formatValue = () => {
    switch (format) {
      case 'percent':
        return `${prefix}${(value * 100).toFixed(2)}%${suffix}`;
      case 'currency':
        return `${prefix}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
      case 'ratio':
        return `${prefix}${value.toFixed(3)}${suffix}`;
      default:
        return `${prefix}${value.toFixed(4)}${suffix}`;
    }
  };

  const getColorClass = () => {
    if (!colorCode) return '';
    if (format === 'percent' || format === 'currency' || metricKey === 'alpha') {
      return value >= 0 ? 'positive' : 'negative';
    }
    if (metricKey === 'sharpeRatio' || metricKey === 'sortinoRatio') {
      return value >= 1 ? 'positive' : value < 0 ? 'negative' : '';
    }
    return '';
  };

  return (
    <div 
      className="metric-card"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="metric-header">
        <span className="metric-label">{metric?.title || metricKey}</span>
        <span className="metric-info-icon">ⓘ</span>
      </div>
      <div className={`metric-value ${getColorClass()}`}>
        {formatValue()}
      </div>
      {showTooltip && metric && (
        <div className="metric-tooltip">
          <div className="tooltip-title">{metric.title}</div>
          <div className="tooltip-description">{metric.description}</div>
          <div className="tooltip-interpretation">
            <strong>How to interpret:</strong> {metric.interpretation}
          </div>
        </div>
      )}
    </div>
  );
};

const SinglePortfolio = () => {
  const { portfolioId, token } = useParams<{ userId?: string; portfolioId?: string; token?: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingHoldingId, setDeletingHoldingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    holdings: true,
    charts: true,
    attribution: false,
  });

  const fetchPortfolio = useCallback(async () => {
    // Check if this is a shared portfolio view
    const shareToken = token || portfolioId;
    if (!shareToken) {
      setError('Portfolio ID or share token is missing.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      let data;
      // If we have a token in the URL params, it's a shared view
      if (token) {
        setIsSharedView(true);
        data = await portfolioService.getSharedPortfolio(token);
      } else if (portfolioId) {
        setIsSharedView(false);
        data = await portfolioService.getById(portfolioId);
      } else {
        throw new Error('Invalid portfolio access');
      }
      setPortfolio(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, token]);

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
      await fetchPortfolio();
      if (analytics) {
        await handleAnalyze();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete holding');
    } finally {
      setDeletingHoldingId(null);
    }
  };

  const handleEditSuccess = async () => {
    await fetchPortfolio();
    if (analytics) {
      await handleAnalyze();
    }
    setShowEditModal(false);
    setEditingHolding(null);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="single-portfolio-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="single-portfolio-container">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="single-portfolio-container">
        <div className="empty-state">
          <span className="empty-icon">📁</span>
          <p>Portfolio not found.</p>
        </div>
      </div>
    );
  }

  const tabs: { id: AnalyticsTab; label: string; icon: string; description: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊', description: 'Summary & key metrics' },
    { id: 'performance', label: 'Performance', icon: '📈', description: 'Returns & charts' },
    { id: 'risk', label: 'Risk Analysis', icon: '🛡️', description: 'Health & volatility' },
    { id: 'planning', label: 'Planning', icon: '🎯', description: 'Rebalance & optimize' },
    { id: 'alerts', label: 'Alerts', icon: '🔔', description: 'Notifications' },
  ];

  return (
    <div className="single-portfolio-container">
      {/* Header Section */}
      <header className="portfolio-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1>{portfolio.name}</h1>
            <p className="portfolio-description">{portfolio.description}</p>
          </div>
          <div className="header-actions">
            <button 
              className="analyze-button" 
              onClick={handleAnalyze} 
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <span className="button-spinner"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span className="button-icon">🔬</span>
                  {analytics ? 'Refresh Analysis' : 'Analyze Portfolio'}
                </>
              )}
            </button>
            {analytics && (
              <button
                className="ai-advice-button"
                onClick={() => setShowAIModal(true)}
                title="Get AI-powered investment advice"
              >
                <span className="button-icon">🤖</span>
                AI Advisor
              </button>
            )}
            {!isSharedView && (
              <button
                className="share-button"
                onClick={() => setShowShareModal(true)}
                title="Share this portfolio"
              >
                <span className="button-icon">🔗</span>
                Share
              </button>
            )}
          </div>
        </div>
      </header>

      {showShareModal && portfolio && (
        <SharePortfolioModal
          portfolioId={portfolio.id}
          isPublic={portfolio.isPublic || false}
          shareToken={portfolio.shareToken}
          onClose={() => setShowShareModal(false)}
          onUpdate={fetchPortfolio}
        />
      )}

      {/* Holdings Management Section */}
      <section className="holdings-management-section">
        <div className="holdings-grid">
          <div className="holdings-panel">
            <div className="panel-header">
              <h2>
                <span className="panel-icon">💼</span>
                Holdings
                <span className="holdings-count">{portfolio.holdings?.length || 0}</span>
              </h2>
            </div>
            <div className="panel-content">
              {portfolio.holdings && portfolio.holdings.length > 0 ? (
                <ul className="holdings-list">
                  {portfolio.holdings.map((holding) => (
                    <li key={holding.id} className="holding-item">
                      <div className="holding-info">
                        <span className="holding-symbol">{holding.symbol}</span>
                        <span className="holding-details">
                          {holding.shares} shares @ ${holding.purchasePrice.toFixed(2)}
                        </span>
                        <span className="holding-date">
                          {new Date(holding.purchaseDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="holding-actions">
                        <button
                          className="icon-button edit"
                          onClick={() => handleEditHolding(holding)}
                          title="Edit holding"
                          disabled={deletingHoldingId === holding.id}
                        >
                          ✏️
                        </button>
                        <button
                          className="icon-button delete"
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
                <div className="empty-holdings">
                  <span className="empty-icon">📭</span>
                  <p>No holdings yet. Add your first position!</p>
                </div>
              )}
            </div>
          </div>

          <div className="add-holding-panel">
            <HoldingForm portfolioId={portfolio.id} onSuccess={fetchPortfolio} />
          </div>
        </div>
      </section>

      {/* Transaction History - Always visible */}
      {portfolioId && (
        <TransactionHistory portfolioId={portfolioId} />
      )}

      {/* Analytics Section - Only shown after analysis */}
      {analytics && (
        <section className="analytics-dashboard">
          {/* Executive Summary Banner */}
          <div className="executive-summary">
            <div className="summary-header">
              <h2>
                <span className="summary-icon">📋</span>
                Executive Summary
              </h2>
              <span className="last-updated">
                Analysis as of {new Date().toLocaleString()}
              </span>
            </div>
            <div className="summary-cards">
              <div className="summary-card primary">
                <span className="card-label">Portfolio Value</span>
                <span className="card-value">
                  ${analytics.totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className={`summary-card ${analytics.analytics.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                <span className="card-label">Total Return</span>
                <span className="card-value">
                  {analytics.analytics.totalReturn >= 0 ? '+' : ''}{(analytics.analytics.totalReturn * 100).toFixed(2)}%
                </span>
              </div>
              <div className="summary-card">
                <span className="card-label">Sharpe Ratio</span>
                <span className="card-value">{analytics.analytics.sharpeRatio.toFixed(2)}</span>
                <span className="card-subtext">
                  {analytics.analytics.sharpeRatio >= 2 ? 'Excellent' : analytics.analytics.sharpeRatio >= 1 ? 'Good' : 'Below avg'}
                </span>
              </div>
              <div className="summary-card">
                <span className="card-label">Risk Level</span>
                <span className="card-value">
                  {analytics.analytics.volatility < 0.15 ? 'Low' : analytics.analytics.volatility < 0.25 ? 'Medium' : 'High'}
                </span>
                <span className="card-subtext">{(analytics.analytics.volatility * 100).toFixed(1)}% volatility</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="analytics-tabs">
            <div className="tabs-header">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                  <span className="tab-description">{tab.description}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="tab-panel overview-panel">
                  <div className="panel-intro">
                    <h3>Key Performance Indicators</h3>
                    <p>Hover over any metric to learn what it means and how to interpret it.</p>
                  </div>

                  <div className="metrics-section">
                    <h4 className="metrics-category">
                      <span className="category-icon">💰</span>
                      Return Metrics
                    </h4>
                    <div className="metrics-grid">
                      <MetricCard metricKey="totalReturn" value={analytics.analytics.totalReturn} format="percent" colorCode />
                      <MetricCard metricKey="annualizedReturn" value={analytics.analytics.annualizedReturn} format="percent" colorCode />
                      <MetricCard metricKey="dailyReturn" value={analytics.analytics.dailyReturn} format="percent" colorCode />
                      <MetricCard metricKey="winRate" value={analytics.analytics.winRate} format="percent" />
                    </div>
                  </div>

                  <div className="metrics-section">
                    <h4 className="metrics-category">
                      <span className="category-icon">⚖️</span>
                      Risk-Adjusted Returns
                    </h4>
                    <div className="metrics-grid">
                      <MetricCard metricKey="sharpeRatio" value={analytics.analytics.sharpeRatio} format="ratio" colorCode />
                      <MetricCard metricKey="sortinoRatio" value={analytics.analytics.sortinoRatio} format="ratio" colorCode />
                      <MetricCard metricKey="calmarRatio" value={analytics.analytics.calmarRatio} format="ratio" />
                      <MetricCard metricKey="treynorRatio" value={analytics.analytics.treynorRatio} format="ratio" />
                    </div>
                  </div>

                  <div className="metrics-section">
                    <h4 className="metrics-category">
                      <span className="category-icon">📉</span>
                      Risk Metrics
                    </h4>
                    <div className="metrics-grid">
                      <MetricCard metricKey="volatility" value={analytics.analytics.volatility} format="percent" />
                      <MetricCard metricKey="maxDrawdown" value={analytics.analytics.maxDrawdown} format="percent" />
                      <MetricCard metricKey="valueAtRisk" value={analytics.analytics.valueAtRisk} format="percent" />
                      <MetricCard metricKey="expectedShortfall" value={analytics.analytics.expectedShortfall} format="percent" />
                    </div>
                  </div>

                  <div className="metrics-section">
                    <h4 className="metrics-category">
                      <span className="category-icon">🎯</span>
                      Benchmark Comparison
                    </h4>
                    <div className="metrics-grid">
                      <MetricCard metricKey="alpha" value={analytics.analytics.alpha} format="percent" colorCode />
                      <MetricCard metricKey="beta" value={analytics.analytics.beta} format="ratio" />
                      <MetricCard metricKey="informationRatio" value={analytics.analytics.informationRatio} format="ratio" />
                      <MetricCard metricKey="concentration" value={analytics.analytics.concentration} format="ratio" />
                    </div>
                  </div>

                  {/* Collapsible Holdings Analysis */}
                  <div className="collapsible-section">
                    <button 
                      className="section-toggle"
                      onClick={() => toggleSection('holdings')}
                    >
                      <span className="toggle-icon">{expandedSections.holdings ? '▼' : '▶'}</span>
                      <span className="toggle-label">Holdings Performance</span>
                      <span className="toggle-count">{analytics.holdings.length} positions</span>
                    </button>
                    {expandedSections.holdings && (
                      <div className="section-content">
                        <table className="holdings-table">
                          <thead>
                            <tr>
                              <th>Symbol</th>
                              <th>Shares</th>
                              <th>Cost Basis</th>
                              <th>Current Value</th>
                              <th>Gain/Loss</th>
                              <th>Return %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.holdings.map((holding) => {
                              const returnPct = ((holding.currentValue - holding.purchaseValue) / holding.purchaseValue) * 100;
                              return (
                                <tr key={holding.symbol}>
                                  <td className="symbol-cell">{holding.symbol}</td>
                                  <td>{holding.shares}</td>
                                  <td>${holding.purchaseValue.toFixed(2)}</td>
                                  <td>${holding.currentValue.toFixed(2)}</td>
                                  <td className={holding.gainLoss >= 0 ? 'positive' : 'negative'}>
                                    ${holding.gainLoss.toFixed(2)}
                                  </td>
                                  <td className={returnPct >= 0 ? 'positive' : 'negative'}>
                                    {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="tab-panel performance-panel">
                  <div className="panel-intro">
                    <h3>Performance Analysis</h3>
                    <p>Visual insights into your portfolio's historical performance and attribution.</p>
                  </div>

                  <PortfolioGraphs analytics={analytics} />

                  {analytics.attribution && (
                    <div className="collapsible-section">
                      <button 
                        className="section-toggle"
                        onClick={() => toggleSection('attribution')}
                      >
                        <span className="toggle-icon">{expandedSections.attribution ? '▼' : '▶'}</span>
                        <span className="toggle-label">Performance Attribution</span>
                        <span className="toggle-hint">See what's driving your returns</span>
                      </button>
                      {expandedSections.attribution && (
                        <div className="section-content">
                          <PerformanceAttribution
                            attribution={analytics.attribution}
                            totalPortfolioValue={analytics.totalPortfolioValue}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Risk Analysis Tab */}
              {activeTab === 'risk' && (
                <div className="tab-panel risk-panel">
                  <div className="panel-intro">
                    <h3>Risk Analysis</h3>
                    <p>Understand your portfolio's risk profile, diversification, and stress test scenarios.</p>
                  </div>

                  {portfolioId && <PortfolioHealthScore portfolioId={portfolioId} />}
                  {portfolioId && <CorrelationAnalysis portfolioId={portfolioId} />}
                  {portfolioId && <ScenarioSimulator portfolioId={portfolioId} />}
                  {portfolioId && <BacktestingEngine portfolioId={portfolioId} />}
                </div>
              )}

              {/* Planning Tab */}
              {activeTab === 'planning' && (
                <div className="tab-panel planning-panel">
                  <div className="panel-intro">
                    <h3>Portfolio Planning Tools</h3>
                    <p>Optimize your portfolio allocation, rebalance holdings, and plan for tax efficiency.</p>
                  </div>

                  {portfolioId && <RebalancingAssistant portfolioId={portfolioId} />}
                  {portfolioId && <TaxOptimization portfolioId={portfolioId} />}
                </div>
              )}

              {/* Alerts Tab */}
              {activeTab === 'alerts' && (
                <div className="tab-panel alerts-panel">
                  <div className="panel-intro">
                    <h3>Alerts & Notifications</h3>
                    <p>Set up custom alerts for price movements, portfolio thresholds, and rebalancing triggers.</p>
                  </div>

                  {portfolioId && <AlertsManager portfolioId={portfolioId} />}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Modals */}
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
