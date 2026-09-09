import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("mahaseva_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data);
        } catch (err) {
          console.error("Token verification failed:", err);
          logout();
        }
      }
      setIsLoading(false);
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const res = await api.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const accessToken = res.data.access_token;
    localStorage.setItem("mahaseva_token", accessToken);
    setToken(accessToken);

    const profileRes = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setUser(profileRes.data);
  };

  const register = async (fullName: string, email: string, phone: string, password: string) => {
    const res = await api.post("/auth/register", {
      full_name: fullName,
      email,
      phone,
      password,
    });

    const accessToken = res.data.access_token;
    localStorage.setItem("mahaseva_token", accessToken);
    setToken(accessToken);

    const profileRes = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setUser(profileRes.data);
  };

  const logout = () => {
    localStorage.removeItem("mahaseva_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
