import { Link } from "react-router-dom";
import "./NavBar.css";
import { useAuth } from "../../hooks/useAuth";

function NavBar() {
  const {user, loading, isAuthenticated, logout } = useAuth(); 
  
  
  if (loading) {
    return (
      <nav className="navbar">
        <div className="navbar-loading">Loading...</div>
      </nav>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      console.log("User logged out!");
    } catch (e) {
      console.log("User failed to log out: " + e);
    }
  };
  
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

      {/* User Section */}
      {isAuthenticated ? (
        <div className="navbar-user">
          <span className="user-welcome">
            Welcome, <span className="username">{user?.username}</span>!
          </span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
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
    </nav>
  );
}

export default NavBar;