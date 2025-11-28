import apiClient from "./axios";

// Updated login function - now takes 3 parameters
export const login = (email: string, username: string, password: string) =>
  apiClient.post("/users/login", { email, username, password }).then((response) => response.data);

export const register = (email: string, username: string, password: string) =>
  apiClient.post("/users/register", { email, username, password }).then((response) => response.data);

export const getCurrentUser = () =>
  apiClient.get("/users/me").then((response) => response.data);

export const logout = () =>
  apiClient.post("/users/logout").then((response) => response.data);