import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import "./Login.css"; // Import external CSS
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  function sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const success = await login(email, username, password);
      
      if (success) {
        setMessage("✅ Login successful!");
        setUsername("");
        setEmail("");
        setPassword("");
        await sleep(2000);
        navigate('/home');
        // Optional: redirect
        // window.location.href = "/dashboard";
      } else {
        setMessage("❌ Invalid credentials");
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
      <p className="login-subtitle">Welcome back! Enter your credentials to continue.</p>
      <form className="login-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value)
            }
            placeholder="Enter username"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            placeholder="Enter email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            placeholder="Enter password"
            required
          />
        </div>

        <button className="login-button" type="submit">
          Sign In
        </button>

        {message && <p className="login-message">{message}</p>}
      </form>
    </div>
    </div>
  );
}

export default Login;
