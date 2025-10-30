import { useState, useEffect } from "react";
import { user, loading, subscribe } from "../auth/authState";
import * as authActions from "../auth/authActions";

export const useAuth = () => {
  // Dummy state just to trigger re-renders
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = subscribe(() => {
      forceUpdate({}); // Re-render this component
    });

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    login: authActions.login,
    register: authActions.register,
    logout: authActions.logout,
    isAuthenticated: !!user,
    refetchUser: authActions.fetchUser,
  };
};