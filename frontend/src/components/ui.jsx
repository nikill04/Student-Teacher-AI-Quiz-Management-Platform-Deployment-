/**
 * Small reusable UI pieces used by many pages.
 */
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// Page wrapper: same padding and max width on every page
export const Page = ({ children, className = '' }) => (
  <div className={`mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 ${className}`}>{children}</div>
);

// Title + subtitle at the top of a page, with optional buttons on the right
export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {children && <div className="flex gap-2">{children}</div>}
  </div>
);

// Spinning loader
export const Loading = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
    <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    <p className="text-sm">{text}</p>
  </div>
);

// Red error box or green success box. Renders nothing when there is no message.
export const Alert = ({ type = 'error', message }) => {
  if (!message) return null;
  const isError = type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      className={`mb-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
        isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

// Friendly box shown when a list is empty
export const EmptyState = ({ icon: Icon, title, text, children }) => (
  <div className="card flex flex-col items-center px-6 py-12 text-center">
    {Icon && (
      <div className="mb-3 rounded-full bg-slate-100 p-3">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
    )}
    <p className="font-semibold text-slate-800">{title}</p>
    {text && <p className="mt-1 max-w-md text-sm text-slate-500">{text}</p>}
    {children && <div className="mt-4">{children}</div>}
  </div>
);

// Number card used on dashboards
const statColors = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
};
export const StatCard = ({ icon: Icon, label, value, color = 'brand' }) => (
  <div className="card flex items-center gap-4 p-5">
    <div className={`rounded-xl p-3 ${statColors[color]}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

// Show a date nicely, or a fallback text when there is no date
export const formatDate = (date, fallback = 'No deadline') =>
  date ? new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : fallback;
