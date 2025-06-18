import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole } from "../types/user";
import api from "../utils/axios";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          // Set the token in axios headers
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${storedToken}`;

          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<LoginResponse>("/users/login", {
        email,
        password,
      });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Set the token in axios headers
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setToken(token);
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear the token from axios headers
    delete api.defaults.headers.common["Authorization"];

    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
