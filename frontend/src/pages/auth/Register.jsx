import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Presentation } from 'lucide-react';
import axios, { getErrorMessage } from '../../api/axios';
import { useAuth, dashboardPath } from '../../context/AuthContext';
import { Alert } from '../../components/ui';
import AuthCard from './AuthCard';

const roles = [
  { value: 'student', label: 'Student', icon: GraduationCap },
  { value: 'teacher', label: 'Teacher', icon: Presentation },
];

const Register = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // "/register?role=teacher" pre-selects the teacher role
    role: searchParams.get('role') === 'teacher' ? 'teacher' : 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const { name, email, password, role } = formData;
      await axios.post('/auth/register', { name, email, password, role });
      // Account created -> go to login with the email already filled in
      navigate('/login', { state: { email, message: 'Account created! Please sign in.' } });
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="link">Sign in here</Link>
        </>
      }
    >
      <Alert message={error} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role picker */}
        <div>
          <span className="label">I am a...</span>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setFormData({ ...formData, role: role.value })}
                className={`flex items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium transition-colors ${
                  formData.role === role.value
                    ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-600'
                    : 'border-stone-300 text-stone-600 hover:border-stone-400'
                }`}
              >
                <role.icon className="h-5 w-5" />
                {role.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" name="name" value={formData.name} onChange={handleChange}
            className="input" placeholder="Your name" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Email address</label>
          <input id="email" type="email" name="email" value={formData.email} onChange={handleChange}
            className="input" placeholder="you@example.com" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" name="password" value={formData.password} onChange={handleChange}
              className="input" placeholder="Min. 6 characters" minLength={6} required />
          </div>
          <div>
            <label className="label" htmlFor="confirmPassword">Confirm password</label>
            <input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword}
              onChange={handleChange} className="input" placeholder="Repeat password" required />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Creating account...' : `Create ${formData.role} account`}
        </button>
      </form>
    </AuthCard>
  );
};

export default Register;
