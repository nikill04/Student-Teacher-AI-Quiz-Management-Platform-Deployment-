import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import axios, { getErrorMessage } from '../../api/axios';
import { useAuth, dashboardPath } from '../../context/AuthContext';
import { Alert } from '../../components/ui';
import AuthCard from './AuthCard';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  // The Register page sends us here with a success message and the email
  const [formData, setFormData] = useState({ email: location.state?.email || '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in? Go straight to the dashboard
  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/auth/login', formData);
      login(res.data.user); // remember the user in AuthContext
      navigate(dashboardPath(res.data.user.role));
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your QuizAI account"
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/register" className="link">Register here</Link>
        </>
      }
    >
      <Alert type="success" message={location.state?.message} />
      <Alert message={error} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label" htmlFor="email">Email address</label>
          <input id="email" type="email" name="email" value={formData.email} onChange={handleChange}
            className="input" placeholder="you@example.com" required autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" name="password" value={formData.password} onChange={handleChange}
            className="input" placeholder="Your password" required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          <LogIn className="h-4 w-4" />
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </AuthCard>
  );
};

export default Login;
