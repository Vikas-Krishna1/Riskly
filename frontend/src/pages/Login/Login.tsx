import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("https://riskly.onrender.com/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important for HTTP-only cookie
        body: JSON.stringify({ email, password }), // Send only email + password
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Login successful!");
        setEmail("");
        setPassword("");

        // Optional: fetch /me
        const meRes = await fetch("https://riskly.onrender.com/users/me", {
          credentials: "include",
        });
        const meData = await meRes.json();
        console.log("Logged in user:", meData);

        await sleep(1500);
        navigate("/home");
      } else {
        setMessage(`❌ ${data.detail || "Invalid credentials"}`);
      }
    } catch (error) {
      console.error(error);
      setMessage("⚠️ Server error. Try again later.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Sign In</h2>
        <p className="login-subtitle">Welcome back! Enter your credentials.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              placeholder="Enter email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="login-button">
            Sign In
          </button>
          {message && <p className="login-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;