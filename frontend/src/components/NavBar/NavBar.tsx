import { Link } from "react-router-dom";
import "./NavBar.css";

function NavBar() {
  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo">
        Riskly
      </Link>

      {/* Links */}
      <div className="navbar-links">
        <Link to="/home">Home</Link>
        <Link to="/portfolio">Portfolio</Link>
        <Link to="/analytics">Analytics</Link>
        <Link to="/about">About</Link>
      </div>

      {/* Buttons */}
      <div className="navbar-actions">
        <Link to="/login" className="navbar-button login">
          Login
        </Link>
        <Link to="/register" className="navbar-button signup">
          Sign Up
        </Link>
      </div>
    </nav>
  );
}

export default NavBar;
