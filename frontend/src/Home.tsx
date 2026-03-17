import { Link } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import "./Home.css";

function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      {/* ===== HERO ===== */}
      <section className="hero">
        <h1 className="hero-title">Riskly</h1>
        <p className="hero-subtitle">
          Advanced portfolio analytics with AI-powered insights. Track performance, 
          analyze risk, and get personalized investment recommendations.
        </p>
        <div className="hero-buttons">
          {!isAuthenticated ? (
            <>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
              <Link to="/about" className="btn btn-secondary">Learn More</Link>
            </>
          ) : (
            <Link to="/about" className="btn btn-primary">Learn More</Link>
          )}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features">
        <h2 className="section-title">Why Choose Riskly?</h2>
        <p className="section-subtitle">
          Comprehensive portfolio analysis with professional-grade metrics and AI-powered insights
        </p>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3>Advanced Analytics</h3>
            <p>Track 16+ professional metrics including Sharpe Ratio, Sortino Ratio, Beta, Alpha, and more.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Advice</h3>
            <p>Get personalized investment recommendations based on your portfolio's performance and risk profile.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📈</div>
            <h3>Visual Analytics</h3>
            <p>Interactive charts showing portfolio value over time, holdings distribution, and gain/loss analysis.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <h3>Real-Time Data</h3>
            <p>Live market data integration with yfinance for accurate, up-to-date portfolio valuations.</p>
          </div>
        </div>
      </section>

      {/* ===== METRICS SHOWCASE ===== */}
      <section className="metrics-showcase">
        <h2 className="section-title">Comprehensive Portfolio Metrics</h2>
        <p className="section-subtitle">
          Professional-grade analytics to help you make informed investment decisions
        </p>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <h3>Return Metrics</h3>
            <ul className="metric-list">
              <li>Total Return</li>
              <li>Annualized Return</li>
              <li>Daily Return</li>
              <li>Win Rate</li>
            </ul>
          </div>
          <div className="metric-card">
            <div className="metric-icon">📉</div>
            <h3>Risk Metrics</h3>
            <ul className="metric-list">
              <li>Volatility</li>
              <li>Max Drawdown</li>
              <li>Value at Risk (VaR)</li>
              <li>Expected Shortfall</li>
            </ul>
          </div>
          <div className="metric-card">
            <div className="metric-icon">⚖️</div>
            <h3>Risk-Adjusted Returns</h3>
            <ul className="metric-list">
              <li>Sharpe Ratio</li>
              <li>Sortino Ratio</li>
              <li>Calmar Ratio</li>
              <li>Treynor Ratio</li>
            </ul>
          </div>
          <div className="metric-card">
            <div className="metric-icon">🎯</div>
            <h3>Market Analysis</h3>
            <ul className="metric-list">
              <li>Beta (Market Correlation)</li>
              <li>Alpha (Excess Return)</li>
              <li>Information Ratio</li>
              <li>Portfolio Concentration</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      {!isAuthenticated && (
        <section className="cta">
          <h2>Start Managing Your Portfolio Smarter</h2>
          <p>Join investors using professional-grade analytics and AI insights to optimize their portfolios.</p>
          <Link to="/register" className="btn btn-primary">Sign Up Free</Link>
        </section>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Riskly. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
