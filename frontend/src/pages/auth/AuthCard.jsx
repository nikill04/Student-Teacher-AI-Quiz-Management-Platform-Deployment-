// Shared frame for the Login and Register pages
import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui';

const AuthCard = ({ title, subtitle, children, footer }) => (
  <div className="flex min-h-screen flex-col items-center px-4 py-10 sm:justify-center">
    <div className="w-full max-w-md">
      <Link to="/" className="mb-8 inline-block">
        <Logo />
      </Link>
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
        <p className="mb-6 mt-1 text-stone-500">{subtitle}</p>
        {children}
      </div>
      <p className="mt-6 text-sm text-stone-600">{footer}</p>
    </div>
  </div>
);

export default AuthCard;
