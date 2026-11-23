/**
 * AUTH CONTEXT
 * Remembers who is logged in, so any component can use:
 *   const { user, login, logout } = useAuth();
 *
 * user = null                         -> not logged in
 * user = { name, role: 'teacher' }    -> logged in
 *
 * The login token lives in an http-only cookie (the browser handles it) and also in
 * localStorage (see api/axios.js) for browsers that block the cookie.
 * On page load we ask the backend "/auth/check" whether the login is still valid.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import axios, { clearToken } from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false); // server is taking long (free hosting waking up)

  // On first load: ask the backend if we are logged in
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 4000);
    axios
      .get('/auth/check')
      .then((res) => setUser({ name: res.data.name, role: res.data.role }))
      .catch((err) => {
        if (err.response?.status === 401) clearToken(); // saved token expired
        setUser(null);
      })
      .finally(() => {
        clearTimeout(timer);
        setLoading(false);
      });
  }, []);

  // Called by the Login page after a successful login
  const login = (userData) => setUser({ name: userData.name, role: userData.role });

  // Clears the cookie on the backend and forgets the user
  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed', err);
    }
    clearToken();
    setUser(null);
  };

  // Wait until we know if the user is logged in (avoids flashing the wrong page)
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        {slow && (
          <p className="max-w-sm text-sm text-slate-500">
            Waking up the server... On free hosting this can take up to a minute the first time.
          </p>
        )}
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Where each role goes after login
export const dashboardPath = (role) => (role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
