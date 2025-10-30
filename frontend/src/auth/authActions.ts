import * as authApi from "../api/auth";
import { setState, notifyListeners, user } from "./authState";

// Fetch current user
export const fetchUser = async () => {
  setState(user, true); // Set loading to true
  
  try {
    const userData = await authApi.getCurrentUser();
    setState(userData, false);
  } catch {
    setState(null, false);
  }
};

// Login
export const login = async (email: string, username: string, password: string) => {
  try {
    await authApi.login(email, username, password);
    await fetchUser();
    return true;
  } catch {
    return false;
  }
};

// Register
export const register = async (email: string, username: string, password: string) => {
  try {
    await authApi.register(email, username, password);
    await fetchUser();
    return true;
  } catch {
    return false;
  }
};

// Logout
export const logout = async () => {
  await authApi.logout();
  setState(null, false);
};

// Initialize on app load
fetchUser();