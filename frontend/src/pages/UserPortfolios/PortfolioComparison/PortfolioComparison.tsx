import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { portfolioService } from '../../../components/PortfolioForm/portfolioService';
import { Portfolio } from '../../../components/PortfolioForm/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import './PortfolioComparison.css';

interface PortfolioComparisonData {
  portfolioId: string;
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
  };
  historicalValue: {
    Date: string;
    Total: number;
  }[];
}

interface ComparisonResponse {
  portfolios: PortfolioComparisonData[];
  count: number;
}

const PORTFOLIO_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PortfolioComparison() {
  const { userId } = useParams<{ userId: string }>();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const data = await portfolioService.getAll();
        setPortfolios(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolios');
      } finally {
        setLoadingPortfolios(false);
      }
    };
    fetchPortfolios();
  }, []);

  const handlePortfolioToggle = (portfolioId: string) => {
    setSelectedPortfolios((prev) => {
      if (prev.includes(portfolioId)) {
        return prev.filter((id) => id !== portfolioId);
      } else {
        if (prev.length >= 5) {
          alert('Maximum 5 portfolios can be compared at once');
          return prev;
        }
        return [...prev, portfolioId];
      }
    });
  };

  const handleCompare = async () => {
    if (selectedPortfolios.length < 2) {
      alert('Please select at least 2 portfolios to compare');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.comparePortfolios(selectedPortfolios);
      setComparisonData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare portfolios');
    } finally {
      setLoading(false);
    }
  };

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

  // Prepare chart data with all portfolios
  const prepareChartData = () => {
    if (!comparisonData) return [];

    // Get all unique dates
    const allDates = new Set<string>();
    comparisonData.portfolios.forEach((portfolio) => {
      portfolio.historicalValue.forEach((point) => {
        allDates.add(point.Date);
      });
    });

    const sortedDates = Array.from(allDates).sort();

    // Create data points for each date
    return sortedDates.map((date) => {
      const dataPoint: any = {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date,
      };

      comparisonData.portfolios.forEach((portfolio, index) => {
        const point = portfolio.historicalValue.find((p) => p.Date === date);
        if (point) {
          dataPoint[`portfolio_${index}`] = point.Total;
        }
      });

      return dataPoint;
    });
  };

  const chartData = prepareChartData();

  // Prepare metrics comparison data
  const prepareMetricsData = () => {
    if (!comparisonData) return [];

    const metrics = [
      { key: 'totalPortfolioValue', label: 'Total Value', formatter: formatCurrency },
      { key: 'totalReturn', label: 'Total Return', formatter: formatPercent, isPercent: true },
      { key: 'annualizedReturn', label: 'Annualized Return', formatter: formatPercent, isPercent: true },
      { key: 'sharpeRatio', label: 'Sharpe Ratio', formatter: (v: number) => v.toFixed(3) },
      { key: 'sortinoRatio', label: 'Sortino Ratio', formatter: (v: number) => v.toFixed(3) },
      { key: 'volatility', label: 'Volatility', formatter: formatPercent, isPercent: true },
      { key: 'maxDrawdown', label: 'Max Drawdown', formatter: formatPercent, isPercent: true },
      { key: 'calmarRatio', label: 'Calmar Ratio', formatter: (v: number) => v.toFixed(3) },
    ];

    return metrics.map((metric) => {
      const data: any = { metric: metric.label };
      comparisonData.portfolios.forEach((portfolio, index) => {
        const value =
          metric.key === 'totalPortfolioValue'
            ? portfolio.totalPortfolioValue
            : portfolio.analytics[metric.key as keyof typeof portfolio.analytics];
        data[`portfolio_${index}`] = metric.formatter(value);
        data[`portfolio_${index}_raw`] = value;
      });
      return data;
    });
  };

  const metricsData = prepareMetricsData();

  if (loadingPortfolios) {
    return <div className="comparison-container">Loading portfolios...</div>;
  }

  return (
    <div className="comparison-container">
      <header className="comparison-header">
        <h1>Portfolio Comparison</h1>
        <p className="comparison-subtitle">Compare up to 5 portfolios side-by-side</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <section className="portfolio-selection">
        <h2>Select Portfolios to Compare</h2>
        <div className="portfolio-checkboxes">
          {portfolios.length === 0 ? (
            <p className="no-portfolios">No portfolios available. Create portfolios first.</p>
          ) : (
            portfolios.map((portfolio) => (
              <label key={portfolio.id} className="portfolio-checkbox">
                <input
                  type="checkbox"
                  checked={selectedPortfolios.includes(portfolio.id)}
                  onChange={() => handlePortfolioToggle(portfolio.id)}
                />
                <span className="checkbox-label">
                  {portfolio.name}
                  {portfolio.description && (
                    <span className="portfolio-desc"> - {portfolio.description}</span>
                  )}
                </span>
              </label>
            ))
          )}
        </div>
        <button
          className="compare-button"
          onClick={handleCompare}
          disabled={selectedPortfolios.length < 2 || loading}
        >
          {loading ? 'Comparing...' : 'Compare Portfolios'}
        </button>
      </section>

      {comparisonData && (
        <>
          {/* Side-by-Side Metrics Comparison */}
          <section className="metrics-comparison">
            <h2>Metrics Comparison</h2>
            <div className="metrics-table-container">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {comparisonData.portfolios.map((portfolio, index) => (
                      <th key={portfolio.portfolioId} style={{ color: PORTFOLIO_COLORS[index] }}>
                        {portfolio.portfolioName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricsData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="metric-label">{row.metric}</td>
                      {comparisonData.portfolios.map((_, index) => {
                        const value = row[`portfolio_${index}`];
                        const rawValue = row[`portfolio_${index}_raw`];
                        const isPercentMetric = row.metric.includes('Return') || row.metric.includes('Drawdown') || row.metric.includes('Volatility');
                        const isPositive = isPercentMetric && rawValue >= 0;
                        const isNegative = isPercentMetric && rawValue < 0;
                        
                        return (
                          <td
                            key={index}
                            className={`metric-value ${isPositive ? 'positive' : ''} ${isNegative ? 'negative' : ''}`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Overlay Charts */}
          <section className="charts-comparison">
            <h2>Performance Overlay</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  {comparisonData.portfolios.map((portfolio, index) => (
                    <Line
                      key={portfolio.portfolioId}
                      type="monotone"
                      dataKey={`portfolio_${index}`}
                      stroke={PORTFOLIO_COLORS[index]}
                      strokeWidth={2}
                      dot={false}
                      name={portfolio.portfolioName}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Bar Chart Comparison */}
          <section className="bar-chart-comparison">
            <h2>Key Metrics Bar Comparison</h2>
            <div className="charts-row">
              <div className="chart-container half-width">
                <h3>Total Return</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={comparisonData.portfolios.map((p, i) => ({
                      name: p.portfolioName,
                      value: p.analytics.totalReturn,
                      color: PORTFOLIO_COLORS[i],
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => formatPercent(value)}
                    />
                    <Tooltip formatter={(value: number) => formatPercent(value)} />
                    <Bar dataKey="value">
                      {comparisonData.portfolios.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PORTFOLIO_COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container half-width">
                <h3>Sharpe Ratio</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={comparisonData.portfolios.map((p, i) => ({
                      name: p.portfolioName,
                      value: p.analytics.sharpeRatio,
                      color: PORTFOLIO_COLORS[i],
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => value.toFixed(3)} />
                    <Bar dataKey="value">
                      {comparisonData.portfolios.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PORTFOLIO_COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

