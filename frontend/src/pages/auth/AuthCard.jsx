// Shared frame for the Login and Register pages
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

const AuthCard = ({ title, subtitle, children, footer }) => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white p-4">
    <div className="w-full max-w-md">
      <div className="card p-8">
        <div className="mb-8 text-center">
          <Link to="/" className="mb-4 inline-flex rounded-2xl bg-brand-600 p-3">
            <Brain className="h-7 w-7 text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-slate-500">{subtitle}</p>
        </div>
        {children}
        <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>
      </div>
      <div className="mt-6 text-center">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-800">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  </div>
);

export default AuthCard;
