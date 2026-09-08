import { useEffect, useMemo, useState, type ReactNode } from "react";

import api, { TOKEN_STORAGE_KEY } from "../api";
import { AuthContext, type User } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await api.get<{ user: User }>("/user");
      setUser(response.data.user);
    } catch {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.get<{ user: User }>("/user");
        if (!cancelled) {
          setUser(response.data.user);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ user, loading, logout, refreshUser }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
