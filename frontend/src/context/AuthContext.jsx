import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "../config/Api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiRequest(
        "/accounts/me/"
      );

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();

      setUser(data.user || data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (
    username,
    password
  ) => {
    const response = await apiRequest(
      "/accounts/login/",
      {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Invalid username or password."
      );
    }

    setUser(data.user || data);

    return data;
  };

  const logout = async () => {
    try {
      const response = await apiRequest(
        "/accounts/logout/",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.error ||
            "Failed to logout."
        );
      }

      setUser(null);
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refreshUser: fetchCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(
    AuthContext
  );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}