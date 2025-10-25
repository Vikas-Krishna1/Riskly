import "./Home.css";

function Home() {
  return (
    <div className="home">
      {/* ===== HERO ===== */}
      <section className="hero">
        <h1 className="hero-title">Riskly</h1>
        <p className="hero-subtitle">
          Manage your portfolio smarter with AI-powered risk analysis, asset tracking,
          and predictive insights — all in real-time.
        </p>
        <div className="hero-buttons">
          <button className="btn btn-primary">Get Started</button>
          <button className="btn btn-secondary">Learn More</button>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features">
        <h2 className="section-title">Why Choose Riskly?</h2>
        <div className="features-grid">
          <div className="feature">
            <h3>📊 Real-Time Tracking</h3>
            <p>Visualize your portfolio’s volatility and exposure instantly.</p>
          </div>
          <div className="feature">
            <h3>🧠 Predictive AI Insights</h3>
            <p>Forecast risk trends using adaptive market intelligence.</p>
          </div>
          <div className="feature">
            <h3>🔒 Secure by Design</h3>
            <p>Enterprise-grade encryption keeps every dataset private.</p>
          </div>
          <div className="feature">
            <h3>⚡ Instant Decisions</h3>
            <p>React faster with data-driven recommendations.</p>
          </div>
        </div>
      </section>

      {/* ===== DASHBOARD PREVIEW ===== */}
      <section className="dashboard">
        <h2 className="section-title">Your Risk Dashboard</h2>
        <p className="section-subtitle">Track everything in one unified interface.</p>
        <div className="dashboard-cards">
          <div className="card">
            <h3>Portfolio Value</h3>
            <p className="value">$128,530</p>
            <p className="change positive">+2.3% Today</p>
          </div>
          <div className="card">
            <h3>Volatility Index</h3>
            <p className="value">Low</p>
            <p className="change neutral">Stable</p>
          </div>
          <div className="card">
            <h3>AI Risk Rating</h3>
            <p className="value">B+</p>
            <p className="change positive">Improving</p>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta">
        <h2>Start Managing Risk Smarter</h2>
        <p>Join thousands optimizing portfolios with Riskly.</p>
        <button className="btn btn-primary">Sign Up Free</button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Riskly. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
