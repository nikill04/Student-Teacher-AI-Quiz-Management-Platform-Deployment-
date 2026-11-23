/**
 * APP LAYOUT (sidebar + page content)
 * Used by both TeacherLayout and StudentLayout.
 *
 * - Desktop: sidebar is always visible on the left.
 * - Mobile: a top bar with a menu button opens the sidebar.
 * (Login/role checks happen in App.jsx -> RequireRole)
 */
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Brain, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AppLayout = ({ role, navigation, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="rounded-lg bg-brand-600 p-1.5">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-900">QuizAI</span>
        <span className="badge-blue ml-auto capitalize">{role}</span>
      </div>

      {/* Links */}
      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary w-full">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-brand-600" />
          <span className="font-bold text-slate-900">QuizAI</span>
        </div>
        <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile sidebar (slides over the page) */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <aside className="relative h-full w-72 bg-white pt-10 shadow-xl">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-2 rounded-lg p-2 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Page content */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
};

export default AppLayout;
