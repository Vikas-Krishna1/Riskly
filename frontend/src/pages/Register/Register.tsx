import React, { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import "./Register.css"; // 👈 same style format as Login.css
import { useAuth } from "../../hooks/useAuth";

const Register: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const { register } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const success = await register(email, username, password);

    if (success) {
      setMessage("✅ Registration successful!");
    } else {
      setMessage("❌ Registration failed. Email or username may already exist.");
    }
  };

  return (
    <div className="body">
    <div className="register-container">
      <h1 className="register-title">Create Account</h1>
      <form className="register-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            placeholder="Enter username..."
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value)
            }
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            placeholder="Enter email..."
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            placeholder="Enter password..."
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            placeholder="Confirm password..."
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setConfirmPassword(e.target.value)
            }
            required
          />
        </div>

        <button className="register-btn" type="submit">
          Sign Up
        </button>

        {message && <p className="register-message">{message}</p>}
      </form>
    </div>
    </div>
  );
};

export default Register;
