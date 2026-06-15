import { createContext, useContext, useState, useEffect } from "react";
import axios from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await axios.get("/auth/check");
      if (res.data?.success) setToken(true);
      else setToken(null);
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

    /**
   * Login function
   * Called after successful login API call
   */
  const login = () => setToken(true); // We rely on checkAuth to verify token, so we just set it to true here

  /**
   * Logout function
   * Calls backend logout API to clear cookie, then updates state
   */
  const logout = async () => {
    try {
      await axios.post("/auth/logout");
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      setToken(null);   // Clear state regardless of API success
    }
  };

   // Check authentication on component mount (app load)
  useEffect(() => {
    checkAuth();
  }, []);

  // Don't render children until auth check is complete
  // This prevents flash of wrong content on app load
  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// ✅ This is critical!
/**
 * CUSTOM HOOK
 * Easy way to access auth context in any component
 * Usage: const { token, login, logout } = useAuth();
 */
export const useAuth = () => useContext(AuthContext);
