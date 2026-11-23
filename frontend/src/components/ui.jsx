/**
 * Small reusable UI pieces used by many pages.
 */
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// App name with a small "filled answer bubble" mark (like on an exam answer sheet)
export const Logo = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-brand-600">
      <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
    </span>
    <span className="font-serif text-xl font-semibold tracking-tight text-stone-900">QuizAI</span>
  </span>
);

// Page wrapper: same padding and max width on every page
export const Page = ({ children, className = '' }) => (
  <div className={`mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10 ${className}`}>{children}</div>
);

// Title + subtitle at the top of a page, with optional buttons on the right
export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-8 flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {children && <div className="flex gap-2">{children}</div>}
  </div>
);

// Spinning loader
export const Loading = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-3 py-20 text-sm text-stone-500">
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-brand-600" />
    <p>{text}</p>
  </div>
);

// Red error box or green success box. Renders nothing when there is no message.
export const Alert = ({ type = 'error', message }) => {
  if (!message) return null;
  const isError = type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      className={`mb-4 flex items-start gap-2 rounded-md border-l-4 px-4 py-3 text-sm ${
        isError ? 'border-red-500 bg-red-50 text-red-800' : 'border-brand-600 bg-brand-50 text-brand-800'
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

// Box shown when a list is empty
export const EmptyState = ({ icon: Icon, title, text, children }) => (
  <div className="flex flex-col items-center rounded-lg border border-dashed border-stone-300 px-6 py-10 text-center">
    {Icon && <Icon className="mb-3 h-6 w-6 text-stone-400" />}
    <p className="font-medium text-stone-800">{title}</p>
    {text && <p className="mt-1 max-w-md text-sm text-stone-500">{text}</p>}
    {children && <div className="mt-4">{children}</div>}
  </div>
);

// Number card used on dashboards
export const StatCard = ({ icon: Icon, label, value }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between text-sm text-stone-500">
      {label}
      {Icon && <Icon className="h-4 w-4 text-stone-400" />}
    </div>
    <p className="mt-3 font-mono text-3xl font-semibold text-stone-900">{value}</p>
  </div>
);

// "Good morning" / "Good afternoon" / "Good evening" depending on the time
export const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Show a date nicely, or a fallback text when there is no date
export const formatDate = (date, fallback = 'No deadline') =>
  date ? new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : fallback;
