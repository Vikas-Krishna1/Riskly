import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { ChangeEvent, FormEvent } from "react";
import "./Dashboard.css";
import { useAuth } from "../../context/AuthContext";

interface Portfolio {
  id: string;
  name: string;
  description: string;
  symbols: string[];
  created_at?: string;
}

interface Holding {
  id: string;
  portfolio_id: string;
  symbol: string;
  name: string;
  quantity: number;
  purchase_price: number;
  added_at?: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

const API_BASE = "http://localhost:8000/api";

function Dashboard() {
  const { token, user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null);
  const [addFormData, setAddFormData] = useState({
    quantity: "",
    purchase_price: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      fetchPortfolios();
    }
  }, [token]);

  useEffect(() => {
    if (selectedPortfolio && token) {
      fetchHoldings(selectedPortfolio.id);
    }
  }, [selectedPortfolio, token]);

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
          setSelectedPortfolio(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching portfolios:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHoldings = async (portfolioId: string) => {
    try {
      const response = await fetch(`${API_BASE}/holdings/portfolio/${portfolioId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHoldings(data);
      }
    } catch (error) {
      console.error("Error fetching holdings:", error);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/holdings/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Error searching holdings:", error);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleSearch(value);
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    setSelectedSearchResult(result);
    setShowAddForm(true);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleAddHolding = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPortfolio || !selectedSearchResult) return;

    try {
      const response = await fetch(`${API_BASE}/holdings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          portfolio_id: selectedPortfolio.id,
          symbol: selectedSearchResult.symbol,
          quantity: parseFloat(addFormData.quantity) || 0,
          purchase_price: parseFloat(addFormData.purchase_price) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Holding added successfully!");
        setShowAddForm(false);
        setSelectedSearchResult(null);
        setAddFormData({ quantity: "", purchase_price: "" });
        fetchHoldings(selectedPortfolio.id);
        fetchPortfolios(); // Refresh portfolios to update symbols
      } else {
        setMessage(data.detail || "Failed to add holding");
      }
    } catch (error) {
      console.error("Error adding holding:", error);
      setMessage("Error adding holding");
    }
  };

  const handleDeleteHolding = async (holdingId: string) => {
    if (!confirm("Are you sure you want to remove this holding?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/holdings/${holdingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage("✅ Holding removed successfully!");
        if (selectedPortfolio) {
          fetchHoldings(selectedPortfolio.id);
        }
      } else {
        setMessage("Failed to remove holding");
      }
    } catch (error) {
      console.error("Error deleting holding:", error);
      setMessage("Error removing holding");
    }
  };

  const totalValue = holdings.reduce(
    (sum, h) => sum + h.quantity * h.purchase_price,
    0
  );

  const totalHoldings = holdings.length;

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.username || user?.email}!</h1>
          <p className="dashboard-subtitle">Manage your investment portfolios</p>
        </div>
        <Link to="/portfolio" className="btn btn-secondary">
          Manage Portfolios
        </Link>
      </div>

      {message && (
        <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Portfolio Selector */}
        <div className="dashboard-card">
          <h2>Select Portfolio</h2>
          {portfolios.length === 0 ? (
            <div className="empty-state">
              <p>No portfolios yet. Create one to get started!</p>
              <Link to="/portfolio" className="btn btn-primary">
                Create Portfolio
              </Link>
            </div>
          ) : (
            <div className="portfolio-selector">
              {portfolios.map((portfolio) => (
                <button
                  key={portfolio.id}
                  className={`portfolio-option ${
                    selectedPortfolio?.id === portfolio.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedPortfolio(portfolio)}
                >
                  <div className="portfolio-option-name">{portfolio.name}</div>
                  <div className="portfolio-option-symbols">
                    {portfolio.symbols.length} holdings
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Holdings Search */}
        {selectedPortfolio && (
          <div className="dashboard-card">
            <h2>Search & Add Holdings</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search stocks (e.g., AAPL, Apple)"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSearch(true)}
                className="search-input"
              />
              {showSearch && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result) => (
                    <div
                      key={result.symbol}
                      className="search-result-item"
                      onClick={() => handleSelectSearchResult(result)}
                    >
                      <div className="search-result-symbol">{result.symbol}</div>
                      <div className="search-result-name">{result.name}</div>
                      {result.exchange && (
                        <div className="search-result-exchange">{result.exchange}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showAddForm && selectedSearchResult && (
              <form className="add-holding-form" onSubmit={handleAddHolding}>
                <h3>Add {selectedSearchResult.symbol} to {selectedPortfolio.name}</h3>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addFormData.quantity}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, quantity: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Purchase Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addFormData.purchase_price}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, purchase_price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Add Holding
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedSearchResult(null);
                      setAddFormData({ quantity: "", purchase_price: "" });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Portfolio Statistics */}
        {selectedPortfolio && (
          <div className="dashboard-card stats-card">
            <h2>Portfolio Summary</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Total Holdings</div>
                <div className="stat-value">{totalHoldings}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Value</div>
                <div className="stat-value">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Portfolio</div>
                <div className="stat-value">{selectedPortfolio.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* Current Holdings */}
        {selectedPortfolio && (
          <div className="dashboard-card holdings-card">
            <h2>Current Holdings</h2>
            {holdings.length === 0 ? (
              <div className="empty-state">
                <p>No holdings yet. Search and add stocks to get started!</p>
              </div>
            ) : (
              <div className="holdings-list">
                {holdings.map((holding) => (
                  <div key={holding.id} className="holding-item">
                    <div className="holding-info">
                      <div className="holding-symbol">{holding.symbol}</div>
                      <div className="holding-name">{holding.name}</div>
                    </div>
                    <div className="holding-details">
                      <div className="holding-quantity">
                        Qty: {holding.quantity.toLocaleString()}
                      </div>
                      <div className="holding-price">
                        ${holding.purchase_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="holding-total">
                        ${(holding.quantity * holding.purchase_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <button
                      className="btn-icon"
                      onClick={() => handleDeleteHolding(holding.id)}
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

