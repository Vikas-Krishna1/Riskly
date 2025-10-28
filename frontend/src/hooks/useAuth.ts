import { useState, useEffect, useCallback } from "react";
import * as authApi from "../api/auth";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Extract the fetch logic into a reusable function
  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const loginUser = async (email: string, username: string, password: string) => {
    try {
      await authApi.login(email, username, password);
      await fetchUser(); // Re-fetch user after login
      return true;
    } catch {
      return false;
    }
  };

  const registerUser = async (email: string, username: string, password: string) => {
    try {
      await authApi.register(email, username, password);
      await fetchUser(); // Re-fetch user after register
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
    refetchUser: fetchUser, // Expose this for manual re-fetching
  };
};