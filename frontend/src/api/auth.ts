const API_URL = "http://localhost:8000";

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }

  return data;
};

// Updated login function - now takes 3 parameters
export const login = (email: string, username: string, password: string) =>
  apiCall("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, username, password }), // ← All 3 fields
  });

export const register = (email: string, username: string, password: string) =>
  apiCall("/users/register", {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });

export const getCurrentUser = () => apiCall("/users/me");

export const logout = () =>
  apiCall("/users/logout", { method: "POST" });