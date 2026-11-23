import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth, dashboardPath } from '../context/AuthContext';
import { Logo } from '../components/ui';

const teacherSteps = [
  'Create a batch for your class and share its name with your students.',
  'Upload a chapter as a PDF (QuizAI drafts ten questions) or write your own.',
  'Set a time limit and a deadline, publish, and check the leaderboard.',
];

const studentSteps = [
  "Join your teacher's batch.",
  'Take each quiz before its deadline. It submits itself when time runs out.',
  'See which answers were right, and ask the tutor about the ones that were not.',
];

const features = [
  ['Questions from a PDF', 'Review every generated question before publishing: change the right answer or remove a question.'],
  ['Write your own', 'A simple form for when you already know exactly what you want to ask.'],
  ['Timed quizzes', 'Duration and deadline per quiz. The timer keeps running even if the tab is closed.'],
  ['Leaderboard', 'Filter by batch or quiz and download the results as an Excel sheet.'],
  ['Study tutor', 'Students can ask follow-up questions and get short, plain answers.'],
];

// The "question paper" picture next to the headline (just HTML, no image file)
const QuizPreview = () => (
  <div className="relative mx-auto w-full max-w-md">
    <div className="rounded-lg border border-stone-300 bg-white p-6 shadow-[6px_6px_0_0_#e7e5e4]">
      <div className="mb-5 flex items-center justify-between border-b border-stone-200 pb-3 text-xs text-stone-500">
        <span>Physics · Chapter 3</span>
        <span className="font-mono text-stone-700">07:42</span>
      </div>
      <p className="mb-1 text-xs text-stone-500">Question 4 of 10</p>
      <p className="mb-5 font-serif text-lg text-stone-900">Which of these is measured in newtons?</p>
      <div className="space-y-2 text-sm">
        {['Mass', 'Force', 'Energy', 'Speed'].map((option, i) => {
          const picked = option === 'Force';
          return (
            <div key={option}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                picked ? 'border-brand-600 bg-brand-50 text-stone-900' : 'border-stone-200 text-stone-600'
              }`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                picked ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300'
              }`}>
                {'ABCD'[i]}
              </span>
              {option}
            </div>
          );
        })}
      </div>
    </div>
    {/* teacher's red mark */}
    <div className="absolute -right-3 -top-5 rotate-6 rounded-full border-2 border-red-600/80 px-3 py-1 font-serif text-lg font-semibold text-red-700/90">
      8/10
    </div>
  </div>
);

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-stone-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/"><Logo /></Link>
          {user ? (
            <Link to={dashboardPath(user.role)} className="btn-primary">Go to Dashboard</Link>
          ) : (
            <div className="flex items-center gap-1">
              <Link to="/login" className="btn text-stone-700 hover:text-stone-950">Login</Link>
              <Link to="/register" className="btn-primary">Get Started</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div>
          <h1 className="text-4xl font-semibold leading-[1.1] text-stone-900 sm:text-5xl">
            Turn your class notes into a quiz{' '}
            <span className="bg-[linear-gradient(transparent_60%,#fde68a_60%)]">in a few minutes.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-600">
            Upload a chapter, check the questions, set a time limit and publish it to your batch.
            Students see their score and the correct answers as soon as they submit.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register?role=teacher" className="btn-primary px-5 py-2.5">
              I'm a Teacher <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register?role=student" className="btn-secondary px-5 py-2.5">
              I'm a Student
            </Link>
          </div>
          <p className="mt-4 text-sm text-stone-500">Free to use. Students only need the batch name to join.</p>
        </div>
        <QuizPreview />
      </section>

      {/* How it works */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2">
          {[
            ['If you teach', teacherSteps],
            ["If you're a student", studentSteps],
          ].map(([title, steps]) => (
            <div key={title}>
              <h2 className="mb-6 text-2xl font-semibold text-stone-900">{title}</h2>
              <ol className="space-y-5">
                {steps.map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="font-mono text-sm text-brand-600">0{i + 1}</span>
                    <span className="text-stone-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="mb-8 text-2xl font-semibold text-stone-900">What's included</h2>
        <dl className="divide-y divide-stone-200 border-y border-stone-200">
          {features.map(([title, text]) => (
            <div key={title} className="grid gap-1 py-4 sm:grid-cols-[220px_1fr] sm:gap-8">
              <dt className="font-medium text-stone-900">{title}</dt>
              <dd className="text-stone-600">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:px-6">
          <span>&copy; {new Date().getFullYear()} QuizAI</span>
          <span>Made for small classes and study groups.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
