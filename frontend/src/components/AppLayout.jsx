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
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './ui';

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
      <div className="px-6 pb-6 pt-6">
        <Logo />
      </div>

      {/* Links */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md border-l-[3px] px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'border-brand-600 bg-stone-100 font-medium text-stone-900'
                  : 'border-transparent text-stone-600 hover:bg-stone-100/70 hover:text-stone-900'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-stone-200 p-4">
        <div className="mb-3 flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-stone-900 font-serif font-semibold text-white">
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-stone-900">{user.name}</p>
            <p className="text-xs capitalize text-stone-500">{role}</p>
          </div>
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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-stone-200 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button onClick={() => setMenuOpen(true)} className="rounded-md p-2 hover:bg-stone-100" aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile sidebar (slides over the page) */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-stone-900/30" onClick={() => setMenuOpen(false)} />
          <aside className="relative h-full w-72 bg-white pt-10 shadow-xl">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-2 rounded-lg p-2 hover:bg-stone-100"
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
