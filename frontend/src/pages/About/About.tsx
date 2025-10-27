import "./About.css";

function About() {
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1 className="about-title">Meet the Founders</h1>
        <p className="about-subtitle">
          Riskly was built by two passionate developers driven by innovation, 
          analytics, and design excellence.
        </p>
      </div>

      <div className="about-founders">
        <div className="founder-card">
          <img
            src="https://via.placeholder.com/150"
            alt="Vikas Krishna"
            className="founder-img"
          />
          <h2 className="founder-name">Vikas Krishna</h2>
          <p className="founder-role">Co-Founder & Backend Engineer</p>
          <p className="founder-desc">
            Risky3
          </p>
        </div>

        <div className="founder-card">
          <img
            src="https://via.placeholder.com/150"
            alt="Raymond Flores"
            className="founder-img"
          />
          <h2 className="founder-name">Raymond Flores</h2>
          <p className="founder-role">Co-Founder & Frontend Engineer</p>
          <p className="founder-desc">
            Risky
          </p>
        </div>
      </div>

      <div className="about-footer">
        <p>🚀 Together, they’re shaping the next generation of intelligent portfolio analytics.</p>
      </div>
    </div>
  );
}

export default About;
