import { useState, useEffect } from "react";
import * as authApi from "../api/auth";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Updated: Now takes 3 parameters
  const loginUser = async (email: string, username: string, password: string) => {
    try {
      await authApi.login(email, username, password); // ← 3 parameters
      const userData = await authApi.getCurrentUser();
      setUser(userData);
      return true;
    } catch {
      return false;
    }
  };

  // Updated: Now takes 3 parameters
  const registerUser = async (email: string, username: string, password: string) => {
    try {
      await authApi.register(email, username, password);
      const userData = await authApi.getCurrentUser();
      setUser(userData);
      return true;
    } catch (error) {
      return false;
    }
  };

  const logoutUser = async () => {
    await authApi.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    isAuthenticated: !!user,
  };
};