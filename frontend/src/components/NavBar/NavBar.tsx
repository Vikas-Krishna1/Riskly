import { Link } from "react-router-dom";
import "./NavBar.css";

function NavBar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        Riskly
      </Link>

      <div className="navbar-links">
        <Link to="/home">Home</Link>
        <Link to="/portfolio">Portfolio</Link>
        <Link to="/analytics">Analytics</Link>
        <Link to="/about">About</Link>
      </div>

      <Link to="/login" className="navbar-button">
        Login
      </Link>
    </nav>
  );
}

export default NavBar;
