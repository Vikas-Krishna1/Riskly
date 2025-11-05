import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [message,   setMessage]   = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (!res.ok) return setMessage(data.detail || "Login failed");

    login(data.access_token, data.user);
    setMessage("✅ Login successful!");
    navigate("/dashboard");
  };

  return (
    <div className="body">
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-title">Sign In</h2>

          <input placeholder="Username"  value={username} onChange={(e)=>setUsername(e.target.value)} />
          <input placeholder="Email"     value={email}    onChange={(e)=>setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />

          <button className="login-button" type="submit">Sign In</button>
          {message && <p className="login-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;
