import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import Plot from "react-plotly.js";
import "./Analytics.css";
import { useAuth } from "../../context/AuthContext";

interface Portfolio {
  id: string;
  name: string;
}

interface AnalyticsData {
  portfolio_id: string;
  portfolio_name: string;
  metrics: {
    expected_return: number;
    volatility: number;
    sharpe_ratio: number;
    individual_returns: Record<string, number>;
    individual_volatilities: Record<string, number>;
  };
  correlation_matrix: Record<string, Record<string, number>>;
  sector_breakdown: Record<string, {
    weight: number;
    value: number;
    holdings: string[];
  }>;
  current_value: number;
  total_cost: number;
  total_return: number;
  ai_report?: string;
}

const API_BASE = "http://localhost:8000/api";

function Analytics() {
  const { token } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [includeAIReport, setIncludeAIReport] = useState(true);

  useEffect(() => {
    if (token) {
      fetchPortfolios();
    }
  }, [token]);

  useEffect(() => {
    if (selectedPortfolio && token) {
      fetchAnalytics();
    }
  }, [selectedPortfolio, token, includeAIReport]);

  const fetchPortfolios = async () => {
    try {
      const response = await fetch(`${API_BASE}/portfolios/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolios(data);
        if (data.length > 0 && !selectedPortfolio) {
          setSelectedPortfolio(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching portfolios:", error);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedPortfolio) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/analytics/portfolio/${selectedPortfolio}?include_ai_report=${includeAIReport}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Error loading analytics data");
    } finally {
      setLoading(false);
    }
  };

  const prepareCorrelationHeatmap = () => {
    if (!analyticsData?.correlation_matrix) return null;

    const symbols = Object.keys(analyticsData.correlation_matrix);
    if (symbols.length === 0) return null;

    const z = symbols.map((symbol) =>
      symbols.map((other) => analyticsData.correlation_matrix[symbol]?.[other] || 0)
    );

    return {
      z,
      x: symbols,
      y: symbols,
      type: "heatmap",
      colorscale: "RdBu",
      zmid: 0,
      colorbar: {
        title: "Correlation",
      },
    };
  };

  const prepareSectorChart = () => {
    if (!analyticsData?.sector_breakdown) return null;

    const sectors = Object.keys(analyticsData.sector_breakdown);
    const weights = sectors.map((s) => analyticsData.sector_breakdown[s].weight);

    return {
      values: weights,
      labels: sectors,
      type: "pie",
      hole: 0.4,
    };
  };

  const prepareReturnsChart = () => {
    if (!analyticsData?.metrics?.individual_returns) return null;

    const symbols = Object.keys(analyticsData.metrics.individual_returns);
    const returns = symbols.map((s) => analyticsData.metrics.individual_returns[s]);

    return {
      x: symbols,
      y: returns,
      type: "bar",
      marker: {
        color: returns.map((r) => (r >= 0 ? "#26a69a" : "#ef5350")),
      },
    };
  };

  const correlationData = prepareCorrelationHeatmap();
  const sectorData = prepareSectorChart();
  const returnsData = prepareReturnsChart();

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Portfolio Risk Analytics</h1>
        <p className="analytics-subtitle">AI-powered risk analysis and visualization</p>
      </div>

      <div className="analytics-controls">
        <div className="control-group">
          <label htmlFor="portfolio-select">Select Portfolio:</label>
          <select
            id="portfolio-select"
            value={selectedPortfolio}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setSelectedPortfolio(e.target.value)
            }
            className="portfolio-select"
          >
            <option value="">-- Select Portfolio --</option>
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={includeAIReport}
              onChange={(e) => setIncludeAIReport(e.target.checked)}
            />
            Include AI Risk Report
          </label>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing portfolio... This may take a moment.</p>
        </div>
      )}

      {analyticsData && !loading && (
        <div className="analytics-content">
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Expected Return</div>
              <div className="metric-value">
                {analyticsData.metrics.expected_return}%
              </div>
              <div className="metric-description">Annual projected return</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Volatility</div>
              <div className="metric-value">
                {analyticsData.metrics.volatility}%
              </div>
              <div className="metric-description">Portfolio risk level</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Sharpe Ratio</div>
              <div className="metric-value">
                {analyticsData.metrics.sharpe_ratio}
              </div>
              <div className="metric-description">Risk-adjusted performance</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Total Return</div>
              <div className="metric-value">
                ${analyticsData.total_return.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="metric-description">
                Current: ${analyticsData.current_value.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            {correlationData && (
              <div className="chart-card">
                <h3>Correlation Heatmap</h3>
                <p className="chart-description">
                  Shows how holdings move together (diversification quality)
                </p>
                <Plot
                  data={[correlationData]}
                  layout={{
                    title: "Portfolio Correlation Matrix",
                    height: 400,
                    margin: { l: 100, r: 50, t: 50, b: 100 },
                  }}
                  config={{ displayModeBar: false }}
                />
              </div>
            )}

            {sectorData && (
              <div className="chart-card">
                <h3>Sector Breakdown</h3>
                <p className="chart-description">
                  Portfolio allocation by industry sector
                </p>
                <Plot
                  data={[sectorData]}
                  layout={{
                    title: "Sector Allocation",
                    height: 400,
                  }}
                  config={{ displayModeBar: false }}
                />
              </div>
            )}

            {returnsData && (
              <div className="chart-card">
                <h3>Individual Stock Returns</h3>
                <p className="chart-description">
                  Annualized returns by holding
                </p>
                <Plot
                  data={[returnsData]}
                  layout={{
                    title: "Expected Returns by Stock",
                    height: 400,
                    xaxis: { title: "Stock Symbol" },
                    yaxis: { title: "Return (%)" },
                  }}
                  config={{ displayModeBar: false }}
                />
              </div>
            )}
          </div>

          {/* AI Risk Report */}
          {analyticsData.ai_report && (
            <div className="ai-report-card">
              <h3>🤖 AI Risk Analysis Report</h3>
              <div className="ai-report-content">
                {analyticsData.ai_report.split("\n").map((line, idx) => (
                  <p key={idx}>{line || <br />}</p>
                ))}
              </div>
            </div>
          )}

          {/* Sector Breakdown Table */}
          {analyticsData.sector_breakdown && (
            <div className="sector-table-card">
              <h3>Sector Breakdown Details</h3>
              <table className="sector-table">
                <thead>
                  <tr>
                    <th>Sector</th>
                    <th>Allocation</th>
                    <th>Value</th>
                    <th>Holdings</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analyticsData.sector_breakdown).map(
                    ([sector, data]) => (
                      <tr key={sector}>
                        <td>{sector}</td>
                        <td>{data.weight}%</td>
                        <td>${data.value.toLocaleString()}</td>
                        <td>{data.holdings.join(", ")}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedPortfolio && !loading && (
        <div className="empty-state">
          <p>Select a portfolio to view analytics</p>
        </div>
      )}
    </div>
  );
}

export default Analytics;

