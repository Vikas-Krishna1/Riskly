import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './PortfolioGraphs.css';

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

interface PortfolioGraphsProps {
  analytics: PortfolioAnalytics;
}

// Chart colors
const COLORS = ['#3ba3f7', '#26c6da', '#14b8a6', '#2dd4bf', '#fbbf24', '#fb923c', '#8b5cf6', '#f43f5e'];
const benchmarkColors: { [key: string]: string } = {
  SPY: '#ef4444',
  QQQ: '#8b5cf6',
  DIA: '#f59e0b',
};

// Collapsible Section Component
interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AnalyticsSection({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="analytics-section">
      <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="section-header-content">
          <span className="section-icon">{icon}</span>
          <h3 className="section-title">{title}</h3>
        </div>
        <span className={`section-toggle ${isOpen ? 'expanded' : ''}`}>▼</span>
      </div>
      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
}

export default function PortfolioGraphs({ analytics }: PortfolioGraphsProps) {
  // Format historical data for the chart
  const historicalData = analytics.historicalValue.map((item) => {
    const dataPoint: Record<string, string | number> = {
      date: new Date(item.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.Total,
      fullDate: item.Date,
    };

    if (analytics.benchmarks) {
      Object.entries(analytics.benchmarks).forEach(([symbol, benchmark]) => {
        const benchmarkPoint = benchmark.historicalValue.find((b) => b.Date === item.Date);
        if (benchmarkPoint) {
          dataPoint[`benchmark_${symbol}`] = benchmarkPoint.Value;
        }
      });
    }

    return dataPoint;
  });

  // Prepare holdings data for pie chart
  const holdingsByValue = analytics.holdings
    .map((holding) => ({
      name: holding.symbol,
      value: holding.currentValue,
    }))
    .sort((a, b) => b.value - a.value);

  // Prepare gain/loss data for bar chart
  const gainLossData = analytics.holdings
    .map((holding) => ({
      symbol: holding.symbol,
      gainLoss: holding.gainLoss,
      gainLossPercent: ((holding.gainLoss / holding.purchaseValue) * 100).toFixed(2),
    }))
    .sort((a, b) => b.gainLoss - a.gainLoss);

  // Calculate totals
  const totalGainLoss = analytics.holdings.reduce((sum, h) => sum + h.gainLoss, 0);
  const totalPurchaseValue = analytics.holdings.reduce((sum, h) => sum + h.purchaseValue, 0);
  const totalGainLossPercent = totalPurchaseValue > 0 ? ((totalGainLoss / totalPurchaseValue) * 100).toFixed(2) : '0.00';

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-value" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="portfolio-analytics">
      {/* Header */}
      <div className="analytics-header">
        <h2 className="analytics-title">Portfolio Analytics</h2>
        <p className="analytics-subtitle">Comprehensive performance metrics and visualizations</p>
      </div>

      {/* Key Metrics Overview - Always Visible */}
      <div className="key-metrics">
        <div className="key-metric-card primary">
          <div className="key-metric-label">Portfolio Value</div>
          <div className="key-metric-value brand">{formatCurrency(analytics.totalPortfolioValue)}</div>
        </div>
        <div className="key-metric-card">
          <div className="key-metric-label">Total Return</div>
          <div className={`key-metric-value ${analytics.analytics.totalReturn >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(analytics.analytics.totalReturn)}
          </div>
        </div>
        <div className="key-metric-card">
          <div className="key-metric-label">Gain/Loss</div>
          <div className={`key-metric-value ${totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(totalGainLoss)}
          </div>
        </div>
        <div className="key-metric-card">
          <div className="key-metric-label">Sharpe Ratio</div>
          <div className="key-metric-value">{analytics.analytics.sharpeRatio.toFixed(2)}</div>
        </div>
      </div>

      {/* Performance Metrics Section */}
      <AnalyticsSection title="Performance Metrics" icon="📈" defaultOpen={true}>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Annualized Return</div>
            <div className={`metric-value ${analytics.analytics.annualizedReturn >= 0 ? 'positive' : 'negative'}`}>
              {formatPercent(analytics.analytics.annualizedReturn)}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Daily Return</div>
            <div className={`metric-value ${analytics.analytics.dailyReturn >= 0 ? 'positive' : 'negative'}`}>
              {formatPercent(analytics.analytics.dailyReturn)}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Win Rate</div>
            <div className="metric-value">{analytics.analytics.winRate.toFixed(1)}%</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Alpha</div>
            <div className={`metric-value ${analytics.analytics.alpha >= 0 ? 'positive' : 'negative'}`}>
              {formatPercent(analytics.analytics.alpha)}
            </div>
          </div>
        </div>
      </AnalyticsSection>

      {/* Risk Metrics Section */}
      <AnalyticsSection title="Risk Analysis" icon="⚡" defaultOpen={false}>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Volatility</div>
            <div className="metric-value">{formatPercent(analytics.analytics.volatility)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Max Drawdown</div>
            <div className="metric-value negative">{formatPercent(analytics.analytics.maxDrawdown)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Value at Risk (95%)</div>
            <div className="metric-value negative">{formatPercent(analytics.analytics.valueAtRisk)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Expected Shortfall</div>
            <div className="metric-value negative">{formatPercent(analytics.analytics.expectedShortfall)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Beta</div>
            <div className="metric-value">{analytics.analytics.beta.toFixed(3)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Concentration</div>
            <div className="metric-value">{formatPercent(analytics.analytics.concentration)}</div>
          </div>
        </div>
      </AnalyticsSection>

      {/* Risk-Adjusted Returns Section */}
      <AnalyticsSection title="Risk-Adjusted Returns" icon="⚖️" defaultOpen={false}>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Sharpe Ratio</div>
            <div className="metric-value">{analytics.analytics.sharpeRatio.toFixed(3)}</div>
            <div className="metric-subtext">Risk-adjusted return</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Sortino Ratio</div>
            <div className="metric-value">{analytics.analytics.sortinoRatio.toFixed(3)}</div>
            <div className="metric-subtext">Downside risk-adjusted</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Calmar Ratio</div>
            <div className="metric-value">{analytics.analytics.calmarRatio.toFixed(3)}</div>
            <div className="metric-subtext">Return / Max Drawdown</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Treynor Ratio</div>
            <div className="metric-value">{analytics.analytics.treynorRatio.toFixed(3)}</div>
            <div className="metric-subtext">Systematic risk-adjusted</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Information Ratio</div>
            <div className="metric-value">{analytics.analytics.informationRatio.toFixed(3)}</div>
            <div className="metric-subtext">Active return / Tracking error</div>
          </div>
        </div>
      </AnalyticsSection>

      {/* Benchmark Comparison Section */}
      {analytics.benchmarkComparison && Object.keys(analytics.benchmarkComparison).length > 0 && (
        <AnalyticsSection title="Benchmark Comparison" icon="🎯" defaultOpen={false}>
          <div className="benchmark-grid">
            {Object.entries(analytics.benchmarkComparison).map(([symbol, comparison]) => (
              <div key={symbol} className="benchmark-card">
                <div className="benchmark-name">
                  <span className={`benchmark-indicator ${symbol.toLowerCase()}`}></span>
                  vs {comparison.name}
                </div>
                <div className={`benchmark-value ${comparison.outperformance >= 0 ? 'positive' : 'negative'}`}>
                  {comparison.outperformance >= 0 ? '+' : ''}{formatPercent(comparison.outperformance)}
                </div>
                <div className="benchmark-detail">
                  Portfolio: {formatPercent(analytics.analytics.annualizedReturn)} • {comparison.name}: {formatPercent(comparison.benchmarkAnnualizedReturn)}
                </div>
              </div>
            ))}
          </div>
        </AnalyticsSection>
      )}

      {/* Top Performers Section */}
      {(analytics.bestHolding || analytics.worstHolding) && (
        <AnalyticsSection title="Top Performers" icon="🏆" defaultOpen={true}>
          <div className="performers-row">
            {analytics.bestHolding && (
              <div className="performer-card best">
                <span className="performer-icon">📈</span>
                <div className="performer-info">
                  <div className="performer-label">Best Performer</div>
                  <div className="performer-symbol">{analytics.bestHolding.symbol}</div>
                  <div className="performer-value positive">
                    {formatCurrency(analytics.bestHolding.gainLoss)} ({analytics.bestHolding.gainLossPercent.toFixed(1)}%)
                  </div>
                </div>
              </div>
            )}
            {analytics.worstHolding && (
              <div className="performer-card worst">
                <span className="performer-icon">📉</span>
                <div className="performer-info">
                  <div className="performer-label">Worst Performer</div>
                  <div className="performer-symbol">{analytics.worstHolding.symbol}</div>
                  <div className="performer-value negative">
                    {formatCurrency(analytics.worstHolding.gainLoss)} ({analytics.worstHolding.gainLossPercent.toFixed(1)}%)
                  </div>
                </div>
              </div>
            )}
          </div>
        </AnalyticsSection>
      )}

      {/* Charts Section */}
      <AnalyticsSection title="Historical Performance" icon="📊" defaultOpen={true}>
        <div className="chart-container">
          <h4 className="chart-title">Portfolio Value Over Time</h4>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 179, 237, 0.1)" />
              <XAxis
                dataKey="date"
                stroke="#7a8fa6"
                tick={{ fill: '#7a8fa6', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis
                stroke="#7a8fa6"
                tick={{ fill: '#7a8fa6', fontSize: 11 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3ba3f7"
                strokeWidth={2}
                dot={false}
                name="Portfolio Value"
                activeDot={{ r: 5, fill: '#3ba3f7' }}
              />
              {analytics.benchmarks &&
                Object.entries(analytics.benchmarks).map(([symbol, benchmark]) => (
                  <Line
                    key={symbol}
                    type="monotone"
                    dataKey={`benchmark_${symbol}`}
                    stroke={benchmarkColors[symbol] || '#94a3b8'}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name={benchmark.name}
                    activeDot={{ r: 4 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AnalyticsSection>

      {/* Holdings Distribution Section */}
      <AnalyticsSection title="Holdings Analysis" icon="🥧" defaultOpen={false}>
        <div className="charts-row">
          <div className="chart-container">
            <h4 className="chart-title">Holdings by Value</h4>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={holdingsByValue}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {holdingsByValue.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h4 className="chart-title">Gain/Loss by Holding</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gainLossData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 179, 237, 0.1)" />
                <XAxis dataKey="symbol" stroke="#7a8fa6" tick={{ fill: '#7a8fa6', fontSize: 11 }} />
                <YAxis
                  stroke="#7a8fa6"
                  tick={{ fill: '#7a8fa6', fontSize: 11 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Symbol: ${label}`}
                />
                <Bar dataKey="gainLoss" name="Gain/Loss" radius={[4, 4, 0, 0]}>
                  {gainLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gainLoss >= 0 ? '#14b8a6' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </AnalyticsSection>
    </div>
  );
}
