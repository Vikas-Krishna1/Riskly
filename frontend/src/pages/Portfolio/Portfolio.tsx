import { useState, useEffect } from "react";
import type { FormEvent, ChangeEvent } from "react";
import "./Portfolio.css";
import { useAuth } from "../../context/AuthContext";

interface Portfolio {
  id: string;
  name: string;
  description: string;
  symbols: string[];
  user_email: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE = "http://localhost:8000/api";

function Portfolio() {
  const { token } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    symbols: "",
  });

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
      } else {
        setMessage("Failed to fetch portfolios");
      }
    } catch (error) {
      console.error("Error fetching portfolios:", error);
      setMessage("Error loading portfolios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortfolios();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", symbols: "" });
    setEditingPortfolio(null);
    setShowForm(false);
    setMessage("");
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    try {
      const symbolsArray = formData.symbols
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const response = await fetch(`${API_BASE}/portfolios/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          symbols: symbolsArray,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Portfolio created successfully!");
        resetForm();
        fetchPortfolios();
      } else {
        setMessage(data.detail || "Failed to create portfolio");
      }
    } catch (error) {
      console.error("Error creating portfolio:", error);
      setMessage("Error creating portfolio");
    }
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPortfolio) return;

    setMessage("");

    try {
      const symbolsArray = formData.symbols
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const response = await fetch(`${API_BASE}/portfolios/${editingPortfolio.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          symbols: symbolsArray,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Portfolio updated successfully!");
        resetForm();
        fetchPortfolios();
      } else {
        setMessage(data.detail || "Failed to update portfolio");
      }
    } catch (error) {
      console.error("Error updating portfolio:", error);
      setMessage("Error updating portfolio");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this portfolio?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/portfolios/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage("✅ Portfolio deleted successfully!");
        fetchPortfolios();
      } else {
        setMessage("Failed to delete portfolio");
      }
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      setMessage("Error deleting portfolio");
    }
  };

  const startEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setFormData({
      name: portfolio.name,
      description: portfolio.description,
      symbols: portfolio.symbols.join(", "),
    });
    setShowForm(true);
  };

  return (
    <div className="portfolio-container">
      <div className="portfolio-header">
        <h1>My Portfolios</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Create Portfolio
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="portfolio-form-container">
          <h2>{editingPortfolio ? "Edit Portfolio" : "Create New Portfolio"}</h2>
          <form onSubmit={editingPortfolio ? handleUpdate : handleCreate}>
            <div className="form-group">
              <label htmlFor="name">Portfolio Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Tech Stocks"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Portfolio description..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="symbols">Stock Symbols (comma-separated)</label>
              <input
                type="text"
                id="symbols"
                name="symbols"
                value={formData.symbols}
                onChange={handleInputChange}
                placeholder="e.g., AAPL, GOOGL, MSFT"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingPortfolio ? "Update" : "Create"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading portfolios...</div>
      ) : portfolios.length === 0 ? (
        <div className="empty-state">
          <p>No portfolios yet. Create your first portfolio!</p>
        </div>
      ) : (
        <div className="portfolios-grid">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="portfolio-card">
              <div className="portfolio-card-header">
                <h3>{portfolio.name}</h3>
                <div className="portfolio-actions">
                  <button
                    className="btn-icon"
                    onClick={() => startEdit(portfolio)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(portfolio.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {portfolio.description && (
                <p className="portfolio-description">{portfolio.description}</p>
              )}
              <div className="portfolio-symbols">
                <strong>Symbols:</strong>{" "}
                {portfolio.symbols.length > 0 ? (
                  <span className="symbols-list">
                    {portfolio.symbols.join(", ")}
                  </span>
                ) : (
                  <span className="no-symbols">No symbols added</span>
                )}
              </div>
              {portfolio.created_at && (
                <div className="portfolio-meta">
                  Created: {new Date(portfolio.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Portfolio;

