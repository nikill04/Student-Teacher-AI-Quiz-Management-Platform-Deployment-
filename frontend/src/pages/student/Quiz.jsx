import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, ChevronRight, ChevronLeft, Send } from 'lucide-react';
import axios, { getErrorMessage } from '../../api/axios';
import { Alert, Loading } from '../../components/ui';

const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const StudentQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [current, setCurrent] = useState(0);         // index of the question on screen
  const [answers, setAnswers] = useState({});        // { questionIndex: optionIndex }
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const startTime = useRef(Date.now());
  const alreadySent = useRef(false); // makes sure we submit only once

  // 1. Load the quiz
  useEffect(() => {
    axios
      .get(`/student/quiz/${quizId}`)
      .then((res) => {
        setQuiz(res.data);
        startTime.current = Date.now();
        setSecondsLeft(res.data.duration * 60);
      })
      .catch((err) => {
        // Already done? Show the result instead
        if (err.response?.data?.alreadySubmitted) navigate(`/student/result/${quizId}`, { replace: true });
        else setError(getErrorMessage(err, 'Could not load the quiz'));
      });
  }, [quizId, navigate]);

  // 2. Countdown timer (uses the real clock, so it stays correct even if the tab is in the background)
  useEffect(() => {
    if (!quiz) return;
    const endTime = startTime.current + quiz.duration * 60 * 1000;
    const timer = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.round((endTime - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz]);

  // 3. Time is up -> submit automatically
  useEffect(() => {
    if (secondsLeft === 0) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const handleSubmit = async () => {
    if (alreadySent.current) return;
    alreadySent.current = true;
    setSubmitting(true);

    const seconds = Math.round((Date.now() - startTime.current) / 1000);
    const timeSpent = `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const formattedAnswers = Object.entries(answers).map(([questionIndex, selectedOption]) => ({
      questionIndex: Number(questionIndex),
      selectedOption,
    }));

    try {
      await axios.post('/student/submit', { quizId, timeSpent, answers: formattedAnswers });
      navigate(`/student/result/${quizId}`, { replace: true });
    } catch (err) {
      alreadySent.current = false; // allow trying again
      setSubmitting(false);
      setShowConfirm(false);
      setError(getErrorMessage(err, 'Submission failed. Please try again.'));
    }
  };

  // Could not load the quiz (deadline passed, not in batch, ...)
  if (!quiz) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        {error ? (
          <div className="card p-8 text-center">
            <Alert message={error} />
            <Link to="/student/dashboard" className="btn-primary">Back to Dashboard</Link>
          </div>
        ) : (
          <Loading text="Loading quiz..." />
        )}
      </div>
    );
  }

  const question = quiz.questions[current];
  const total = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const isLast = current === total - 1;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar: title, timer, submit */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate font-bold text-slate-900">{quiz.title}</h1>
            <p className="text-xs text-slate-500">{answeredCount} of {total} answered</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono font-semibold ${
              secondsLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'
            }`}>
              <Clock className="h-4 w-4" />
              {formatTime(secondsLeft ?? 0)}
            </div>
            <button onClick={() => setShowConfirm(true)} disabled={submitting} className="btn-success">
              <Send className="h-4 w-4" /> <span className="hidden sm:inline">Submit</span>
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div className="h-1 bg-indigo-600 transition-all" style={{ width: `${((current + 1) / total) * 100}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Alert message={error} />

        {/* Question */}
        <div className="card p-6 sm:p-8">
          <p className="mb-2 text-sm font-semibold text-indigo-600">Question {current + 1} of {total}</p>
          <h2 className="mb-6 text-xl font-semibold text-slate-900">{question.question}</h2>

          <div className="space-y-3">
            {question.options.map((option, index) => {
              const selected = answers[current] === index;
              return (
                <button
                  key={index}
                  onClick={() => setAnswers({ ...answers, [current]: index })}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors ${
                    selected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-slate-800">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Previous / Next */}
          <div className="mt-8 flex justify-between">
            <button onClick={() => setCurrent(current - 1)} disabled={current === 0} className="btn-secondary">
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            {isLast ? (
              <button onClick={() => setShowConfirm(true)} disabled={submitting} className="btn-success">
                Finish <Send className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={() => setCurrent(current + 1)} className="btn-primary">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Jump to any question (green = answered) */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                index === current
                  ? 'bg-indigo-600 text-white'
                  : answers[index] !== undefined
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </main>

      {/* Submit confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-md p-6">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Submit quiz?</h3>
            <p className="mb-6 text-slate-600">
              You answered {answeredCount} of {total} questions.
              {answeredCount < total && ' Unanswered questions count as wrong.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">Keep going</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-success flex-1">
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentQuiz;
