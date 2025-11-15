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
}

interface PortfolioGraphsProps {
  analytics: PortfolioAnalytics;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export default function PortfolioGraphs({ analytics }: PortfolioGraphsProps) {
  // Format historical data for the chart
  const historicalData = analytics.historicalValue.map((item) => ({
    date: new Date(item.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.Total,
    fullDate: item.Date,
  }));

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

  // Custom tooltip for historical chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="portfolio-graphs-container">
      <h2 className="graphs-section-title">Portfolio Visualizations</h2>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Portfolio Value</div>
          <div className="metric-value primary">{formatCurrency(analytics.totalPortfolioValue)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Gain/Loss</div>
          <div className={`metric-value ${totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(totalGainLoss)} ({totalGainLossPercent}%)
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg. Daily Return</div>
          <div className="metric-value">
            {(analytics.analytics.dailyReturn * 100).toFixed(4)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Volatility</div>
          <div className="metric-value">
            {(analytics.analytics.volatility * 100).toFixed(4)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Sharpe Ratio</div>
          <div className="metric-value">
            {analytics.analytics.sharpeRatio.toFixed(4)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Number of Holdings</div>
          <div className="metric-value">
            {analytics.holdings.length}
          </div>
        </div>
      </div>

      {/* Historical Portfolio Value Chart */}
      <div className="chart-container">
        <h3 className="chart-title">Portfolio Value Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="date"
              stroke="#666"
              tick={{ fill: '#666', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#666"
              tick={{ fill: '#666', fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0088FE"
              strokeWidth={2}
              dot={false}
              name="Portfolio Value"
              activeDot={{ r: 6 }}
            />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="symbol" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} />
              <YAxis
                stroke="#666"
                tick={{ fill: '#666', fontSize: 12 }}
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
                    fill={entry.gainLoss >= 0 ? '#00C49F' : '#FF8042'}
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

