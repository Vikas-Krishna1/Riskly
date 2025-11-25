import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import './PerformanceAttribution.css';

interface AttributionData {
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
}

interface PerformanceAttributionProps {
  attribution: AttributionData;
  totalPortfolioValue: number;
}

// Color palette for sectors
const SECTOR_COLORS: { [key: string]: string } = {
  'Technology': '#3b82f6',
  'Healthcare': '#10b981',
  'Financial Services': '#f59e0b',
  'Consumer Cyclical': '#ef4444',
  'Communication Services': '#8b5cf6',
  'Industrials': '#06b6d4',
  'Consumer Defensive': '#ec4899',
  'Energy': '#f97316',
  'Utilities': '#84cc16',
  'Real Estate': '#6366f1',
  'Basic Materials': '#14b8a6',
  'Unknown': '#64748b',
};

// Get color for sector
const getSectorColor = (sector: string): string => {
  return SECTOR_COLORS[sector] || SECTOR_COLORS['Unknown'];
};

export default function PerformanceAttribution({
  attribution,
  totalPortfolioValue,
}: PerformanceAttributionProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Prepare data for stacked bar chart by sector (positive and negative contributions)
  const sectorData = attribution.bySector.map((sector) => ({
    sector: sector.sector,
    contribution: sector.contributionToReturn,
    positiveContribution: sector.contributionToReturn >= 0 ? sector.contributionToReturn : 0,
    negativeContribution: sector.contributionToReturn < 0 ? sector.contributionToReturn : 0,
    contributionPercent: sector.contributionPercent,
    totalGainLoss: sector.totalGainLoss,
    holdingCount: sector.holdingCount,
    color: getSectorColor(sector.sector),
  }));

  // Prepare data for individual holdings chart (positive and negative contributions)
  const holdingData = attribution.byHolding.map((holding) => ({
    symbol: holding.symbol,
    sector: holding.sector,
    contribution: holding.contributionToReturn,
    positiveContribution: holding.contributionToReturn >= 0 ? holding.contributionToReturn : 0,
    negativeContribution: holding.contributionToReturn < 0 ? holding.contributionToReturn : 0,
    contributionPercent: holding.contributionPercent,
    gainLoss: holding.gainLoss,
    color: getSectorColor(holding.sector),
  }));

  // Custom tooltip for sector chart
  const SectorTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="attribution-tooltip">
          <p className="tooltip-title">{data.sector}</p>
          <p className="tooltip-value">
            Contribution: {formatPercent(data.contribution)}
          </p>
          <p className="tooltip-value">
            Gain/Loss: {formatCurrency(data.totalGainLoss)}
          </p>
          <p className="tooltip-value">
            Holdings: {data.holdingCount}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for holdings chart
  const HoldingTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="attribution-tooltip">
          <p className="tooltip-title">{data.symbol}</p>
          <p className="tooltip-subtitle">{data.sector}</p>
          <p className="tooltip-value">
            Contribution: {formatPercent(data.contribution)}
          </p>
          <p className="tooltip-value">
            Gain/Loss: {formatCurrency(data.gainLoss)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate total contribution
  const totalContribution = attribution.byHolding.reduce(
    (sum, h) => sum + h.contributionToReturn,
    0
  );

  return (
    <div className="performance-attribution-container">
      <h2 className="attribution-section-title">Performance Attribution</h2>
      <p className="attribution-description">
        Understand which holdings and sectors contribute most to your portfolio's returns.
      </p>

      {/* Summary Cards */}
      <div className="attribution-summary">
        <div className="summary-card">
          <div className="summary-label">Total Contribution to Return</div>
          <div className={`summary-value ${totalContribution >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(totalContribution)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Top Contributing Sector</div>
          <div className="summary-value">
            {attribution.bySector[0]?.sector || 'N/A'}
          </div>
          <div className="summary-subtext">
            {formatPercent(attribution.bySector[0]?.contributionToReturn || 0)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Top Contributing Holding</div>
          <div className="summary-value">
            {attribution.byHolding[0]?.symbol || 'N/A'}
          </div>
          <div className="summary-subtext">
            {formatPercent(attribution.byHolding[0]?.contributionToReturn || 0)}
          </div>
        </div>
      </div>

      {/* Sector Attribution Chart - Stacked */}
      <div className="attribution-chart-container">
        <h3 className="chart-title">Contribution to Return by Sector (Stacked)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={sectorData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
            <XAxis
              dataKey="sector"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={formatPercent}
            />
            <Tooltip content={<SectorTooltip />} />
            <Legend />
            <Bar
              dataKey="positiveContribution"
              stackId="stack"
              name="Positive Contribution"
              fill="#22c55e"
            />
            <Bar
              dataKey="negativeContribution"
              stackId="stack"
              name="Negative Contribution"
              fill="#ef4444"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Individual Holdings Attribution Chart - Stacked */}
      <div className="attribution-chart-container">
        <h3 className="chart-title">Contribution to Return by Holding (Stacked)</h3>
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart
            data={holdingData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
            <XAxis
              dataKey="symbol"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={formatPercent}
            />
            <Tooltip content={<HoldingTooltip />} />
            <Legend />
            <Bar
              dataKey="positiveContribution"
              stackId="stack"
              name="Positive Contribution"
              fill="#22c55e"
            />
            <Bar
              dataKey="negativeContribution"
              stackId="stack"
              name="Negative Contribution"
              fill="#ef4444"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Tables */}
      <div className="attribution-tables">
        {/* Sector Breakdown Table */}
        <div className="attribution-table-container">
          <h3 className="table-title">Sector Breakdown</h3>
          <table className="attribution-table">
            <thead>
              <tr>
                <th>Sector</th>
                <th>Contribution to Return</th>
                <th>Portfolio Weight</th>
                <th>Total Gain/Loss</th>
                <th>Holdings</th>
              </tr>
            </thead>
            <tbody>
              {attribution.bySector.map((sector, index) => (
                <tr key={index}>
                  <td>
                    <span
                      className="sector-indicator"
                      style={{ backgroundColor: getSectorColor(sector.sector) }}
                    />
                    {sector.sector}
                  </td>
                  <td className={sector.contributionToReturn >= 0 ? 'positive' : 'negative'}>
                    {formatPercent(sector.contributionToReturn)}
                  </td>
                  <td>{formatPercent(sector.contributionPercent / 100)}</td>
                  <td className={sector.totalGainLoss >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(sector.totalGainLoss)}
                  </td>
                  <td>{sector.holdings.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Individual Holdings Table */}
        <div className="attribution-table-container">
          <h3 className="table-title">Individual Holdings Breakdown</h3>
          <table className="attribution-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Sector</th>
                <th>Contribution to Return</th>
                <th>Portfolio Weight</th>
                <th>Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {attribution.byHolding.map((holding, index) => (
                <tr key={index}>
                  <td className="symbol-cell">{holding.symbol}</td>
                  <td>
                    <span
                      className="sector-indicator"
                      style={{ backgroundColor: getSectorColor(holding.sector) }}
                    />
                    {holding.sector}
                  </td>
                  <td className={holding.contributionToReturn >= 0 ? 'positive' : 'negative'}>
                    {formatPercent(holding.contributionToReturn)}
                  </td>
                  <td>{formatPercent(holding.contributionPercent / 100)}</td>
                  <td className={holding.gainLoss >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(holding.gainLoss)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

