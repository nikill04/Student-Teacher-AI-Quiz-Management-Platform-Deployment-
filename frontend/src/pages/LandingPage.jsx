import { Link } from 'react-router-dom';
import { Brain, BookOpen, BarChart3, MessageCircle, Upload, Timer, Users, ArrowRight } from 'lucide-react';
import { useAuth, dashboardPath } from '../context/AuthContext';

const features = [
  { icon: Upload, title: 'AI Quiz from PDF', text: 'Upload your notes as a PDF and get 10 ready-to-use questions in seconds.' },
  { icon: BookOpen, title: 'Manual Quiz Builder', text: 'Write your own questions with a simple form when you want full control.' },
  { icon: Users, title: 'Batches', text: 'Group students into batches and publish quizzes to a whole batch at once.' },
  { icon: Timer, title: 'Timed Quizzes', text: 'Set a duration and a deadline. Quizzes submit automatically when time is up.' },
  { icon: BarChart3, title: 'Leaderboard & Export', text: 'See rankings per batch or quiz and export them to Excel with one click.' },
  { icon: MessageCircle, title: 'AI Tutor', text: 'Students can ask the AI tutor any study question and get a simple answer.' },
];

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-600 p-1.5">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">QuizAI</span>
          </Link>
          {user ? (
            <Link to={dashboardPath(user.role)} className="btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary border-transparent">Login</Link>
              <Link to="/register" className="btn-primary">Get Started</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <span className="badge-blue mb-6">AI-powered quizzes for classrooms</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Create quizzes in seconds. <span className="text-indigo-600">Learn smarter.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Teachers turn study material into quizzes with AI. Students take timed quizzes,
            see instant results and get help from an AI tutor.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register?role=teacher" className="btn-primary px-6 py-3 text-base">
              I'm a Teacher <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register?role=student" className="btn-secondary px-6 py-3 text-base">
              I'm a Student <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Everything you need</h2>
          <p className="mt-2 text-slate-600">Simple tools for teachers and students.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6 transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-3">
                <feature.icon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:px-6 md:grid-cols-2">
          <div className="card p-8">
            <h3 className="mb-4 text-xl font-bold text-slate-900">For Teachers</h3>
            <ol className="space-y-3 text-slate-600">
              <li>1. Create a batch for your class</li>
              <li>2. Upload a PDF or write questions yourself</li>
              <li>3. Publish and watch the leaderboard</li>
            </ol>
          </div>
          <div className="card p-8">
            <h3 className="mb-4 text-xl font-bold text-slate-900">For Students</h3>
            <ol className="space-y-3 text-slate-600">
              <li>1. Join your teacher's batch</li>
              <li>2. Take quizzes before the deadline</li>
              <li>3. Review answers and ask the AI tutor</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">QuizAI</span>
          </div>
          <p>&copy; {new Date().getFullYear()} QuizAI. Built for smarter assessments.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
