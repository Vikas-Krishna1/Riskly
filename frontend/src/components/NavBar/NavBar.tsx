import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "./NavBar.css";
import { useAuth } from "../../hooks/useAuth";
import { portfolioService } from "../PortfolioForm/portfolioService";

function NavBar() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Fetch active alerts count
  useEffect(() => {
    if (isAuthenticated) {
      const fetchAlerts = async () => {
        try {
          const alerts = await portfolioService.getActiveAlerts();
          setAlertCount(alerts.length);
        } catch (err) {
          // Silently fail - alerts are optional
        }
      };
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <nav className="navbar">
        <div className="navbar-loading">
          <div className="loading-spinner-small"></div>
          <span>Loading...</span>
        </div>
      </nav>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const isActive = (path: string) => {
    if (path === "/home" && location.pathname === "/") return true;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/home" className="navbar-logo">
        <span className="logo-icon">📊</span>
        <span className="logo-text">Riskly</span>
      </Link>

      {/* Desktop Navigation Links */}
      <div className={`navbar-links ${isMenuOpen ? "mobile-open" : ""}`}>
        <Link
          to="/home"
          className={`nav-link ${isActive("/home") || location.pathname === "/" ? "active" : ""}`}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Home</span>
        </Link>
        
        {isAuthenticated && (
          <Link
            to={`/${user?.id}/portfolios`}
            className={`nav-link ${isActive("/portfolios") ? "active" : ""}`}
          >
            <span className="nav-icon">💼</span>
            <span className="nav-text">Portfolios</span>
          </Link>
        )}
        
        <Link
          to="/portfolios/public"
          className={`nav-link ${isActive("/portfolios/public") ? "active" : ""}`}
        >
          <span className="nav-icon">🌐</span>
          <span className="nav-text">Public Portfolios</span>
        </Link>
        
        <Link
          to="/about"
          className={`nav-link ${isActive("/about") ? "active" : ""}`}
        >
          <span className="nav-icon">ℹ️</span>
          <span className="nav-text">About</span>
        </Link>
      </div>

      {/* User Section */}
      {isAuthenticated ? (
        <div className="navbar-user-section" ref={userMenuRef}>
          {alertCount > 0 && (
            <Link to={`/${user?.id}/portfolios`} className="alert-badge-link">
              <span className="alert-badge">{alertCount}</span>
            </Link>
          )}
          <button
            className="user-menu-trigger"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-label="User menu"
          >
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="user-name">{user?.username}</span>
            <span className={`dropdown-arrow ${isUserMenuOpen ? "open" : ""}`}>▼</span>
          </button>

          {isUserMenuOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-avatar-large">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="user-info">
                  <div className="user-name-large">{user?.username}</div>
                  <div className="user-email">{user?.email || "User"}</div>
                </div>
              </div>
              <div className="user-dropdown-divider"></div>
              <Link
                to={`/${user?.id}/profile`}
                className="user-dropdown-item"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <span className="dropdown-icon">👤</span>
                <span>Profile</span>
              </Link>
              <Link
                to={`/${user?.id}/portfolios`}
                className="user-dropdown-item"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <span className="dropdown-icon">💼</span>
                <span>My Portfolios</span>
              </Link>
              <div className="user-dropdown-divider"></div>
              <button className="user-dropdown-item logout" onClick={handleLogout}>
                <span className="dropdown-icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="navbar-actions">
          <Link to="/login" className="navbar-button login">
            Login
          </Link>
          <Link to="/register" className="navbar-button signup">
            Sign Up
          </Link>
        </div>
      )}

      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger ${isMenuOpen ? "open" : ""}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
    </nav>
  );
}

export default NavBar;
