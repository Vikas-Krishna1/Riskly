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
}

interface PortfolioGraphsProps {
  analytics: PortfolioAnalytics;
}

// Dark theme colors matching the site
const COLORS = ['#3b82f6', '#60a5fa', '#818cf8', '#a78bfa', '#34d399', '#22c55e', '#fbbf24', '#fb923c'];

export default function PortfolioGraphs({ analytics }: PortfolioGraphsProps) {
  // Format historical data for the chart
  const historicalData = analytics.historicalValue.map((item) => {
    const dataPoint: any = {
      date: new Date(item.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.Total,
      fullDate: item.Date,
    };
    
    // Add benchmark data if available
    if (analytics.benchmarks) {
      Object.entries(analytics.benchmarks).forEach(([symbol, benchmark]) => {
        const benchmarkPoint = benchmark.historicalValue.find(b => b.Date === item.Date);
        if (benchmarkPoint) {
          dataPoint[`benchmark_${symbol}`] = benchmarkPoint.Value;
        }
      });
    }
    
    return dataPoint;
  });

  // Prepare holdings data for pie chart (by value)
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

  // Calculate total gain/loss
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

  // Custom tooltip for historical chart with benchmarks
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="tooltip-value" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Benchmark colors
  const benchmarkColors: { [key: string]: string } = {
    SPY: '#ef4444', // red
    QQQ: '#8b5cf6', // purple
    DIA: '#f59e0b', // amber
  };

  return (
    <div className="portfolio-graphs-container">
      <h2 className="graphs-section-title">Portfolio Visualizations</h2>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card primary-card">
          <div className="metric-label">Total Portfolio Value</div>
          <div className="metric-value primary">{formatCurrency(analytics.totalPortfolioValue)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Return</div>
          <div className={`metric-value ${analytics.analytics.totalReturn >= 0 ? 'positive' : 'negative'}`}>
            {(analytics.analytics.totalReturn * 100).toFixed(2)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Gain/Loss</div>
          <div className={`metric-value ${totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(totalGainLoss)} ({totalGainLossPercent}%)
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Annualized Return</div>
          <div className={`metric-value ${analytics.analytics.annualizedReturn >= 0 ? 'positive' : 'negative'}`}>
            {(analytics.analytics.annualizedReturn * 100).toFixed(2)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Sharpe Ratio</div>
          <div className="metric-value">
            {analytics.analytics.sharpeRatio.toFixed(3)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Sortino Ratio</div>
          <div className="metric-value">
            {analytics.analytics.sortinoRatio.toFixed(3)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Max Drawdown</div>
          <div className="metric-value negative">
            {(analytics.analytics.maxDrawdown * 100).toFixed(2)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Calmar Ratio</div>
          <div className="metric-value">
            {analytics.analytics.calmarRatio.toFixed(3)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Volatility</div>
          <div className="metric-value">
            {(analytics.analytics.volatility * 100).toFixed(2)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Win Rate</div>
          <div className="metric-value">
            {analytics.analytics.winRate.toFixed(1)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Beta</div>
          <div className="metric-value">
            {analytics.analytics.beta.toFixed(3)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Alpha</div>
          <div className={`metric-value ${analytics.analytics.alpha >= 0 ? 'positive' : 'negative'}`}>
            {(analytics.analytics.alpha * 100).toFixed(2)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Value at Risk (95%)</div>
          <div className="metric-value negative">
            {(analytics.analytics.valueAtRisk * 100).toFixed(2)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Concentration</div>
          <div className="metric-value">
            {(analytics.analytics.concentration * 100).toFixed(1)}%
          </div>
        </div>
        {analytics.bestHolding && (
          <div className="metric-card highlight-card">
            <div className="metric-label">Best Performer</div>
            <div className="metric-value positive">
              {analytics.bestHolding.symbol}: {formatCurrency(analytics.bestHolding.gainLoss)} ({analytics.bestHolding.gainLossPercent.toFixed(2)}%)
            </div>
          </div>
        )}
        {analytics.worstHolding && (
          <div className="metric-card highlight-card">
            <div className="metric-label">Worst Performer</div>
            <div className="metric-value negative">
              {analytics.worstHolding.symbol}: {formatCurrency(analytics.worstHolding.gainLoss)} ({analytics.worstHolding.gainLossPercent.toFixed(2)}%)
            </div>
          </div>
        )}
      </div>

      {/* Benchmark Comparison Section */}
      {analytics.benchmarkComparison && Object.keys(analytics.benchmarkComparison).length > 0 && (
        <>
          <h3 className="benchmark-section-title">Benchmark Comparison</h3>
          <div className="metrics-grid">
            {Object.entries(analytics.benchmarkComparison).map(([symbol, comparison]) => (
              <div key={symbol} className="metric-card benchmark-card">
                <div className="metric-label">vs {comparison.name}</div>
                <div className={`metric-value ${comparison.outperformance >= 0 ? 'positive' : 'negative'}`}>
                  {(comparison.outperformance * 100).toFixed(2)}%
                </div>
                <div className="metric-subtext">
                  Portfolio: {(analytics.analytics.annualizedReturn * 100).toFixed(2)}% | 
                  {comparison.name}: {(comparison.benchmarkAnnualizedReturn * 100).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Historical Portfolio Value Chart */}
      <div className="chart-container">
        <h3 className="chart-title">Portfolio Value Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Portfolio Value"
              activeDot={{ r: 6, fill: '#60a5fa' }}
            />
            {analytics.benchmarks && Object.entries(analytics.benchmarks).map(([symbol, benchmark]) => (
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

      {/* Holdings Distribution and Gain/Loss Charts */}
      <div className="charts-row">
        {/* Holdings Distribution Pie Chart */}
        <div className="chart-container half-width">
          <h3 className="chart-title">Holdings by Value</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={holdingsByValue}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {holdingsByValue.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gain/Loss Bar Chart */}
        <div className="chart-container half-width">
          <h3 className="chart-title">Gain/Loss by Holding</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gainLossData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
              <XAxis dataKey="symbol" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Symbol: ${label}`}
              />
              <Legend />
              <Bar dataKey="gainLoss" name="Gain/Loss">
                {gainLossData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.gainLoss >= 0 ? '#22c55e' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

