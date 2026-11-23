import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, CheckCircle2, XCircle, ArrowLeft, Share2, MessageCircle, MinusCircle } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import { Page, Loading, Alert, formatDate } from '../../components/ui';
import axios, { getErrorMessage } from '../../api/axios';

// Colour of the score card depending on the score
const scoreStyle = (score) => {
  if (score >= 80) return { box: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-600', label: 'Excellent work!' };
  if (score >= 50) return { box: 'border-brand-200 bg-brand-50', text: 'text-brand-600', label: 'Good job!' };
  return { box: 'border-red-200 bg-red-50', text: 'text-red-600', label: 'Keep practicing!' };
};

const StudentResult = () => {
  const { quizId } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios
      .get(`/student/result/${quizId}`)
      .then((res) => setResult(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not load the result')));
  }, [quizId]);

  // Copies a short summary of the result so the student can paste it anywhere
  const shareResult = async () => {
    const text = `I scored ${result.score}% (${result.correctAnswers}/${result.totalQuestions}) on "${result.quizTitle}" in QuizAI!`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy your result:', text);
    }
  };

  return (
    <StudentLayout>
      <Page className="max-w-4xl">
        <Link to="/student/my-results" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> My Results
        </Link>
        <Alert message={error} />

        {!result && !error && <Loading text="Loading result..." />}

        {result && (
          <>
            {/* Score card */}
            <div className={`mb-6 rounded-2xl border-2 p-8 text-center ${scoreStyle(result.score).box}`}>
              <Trophy className={`mx-auto mb-3 h-12 w-12 ${scoreStyle(result.score).text}`} />
              <p className="text-sm font-medium text-slate-600">{result.quizTitle}</p>
              <p className={`text-5xl font-extrabold ${scoreStyle(result.score).text}`}>{result.score}%</p>
              <p className="mt-1 font-semibold text-slate-800">{scoreStyle(result.score).label}</p>
              <p className="mt-2 text-slate-600">
                {result.correctAnswers} of {result.totalQuestions} correct - time spent {result.timeSpent} - {formatDate(result.completedAt, '')}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button onClick={shareResult} className="btn-secondary">
                  <Share2 className="h-4 w-4" /> {copied ? 'Copied!' : 'Share Result'}
                </button>
                <Link to="/student/ask-ai" className="btn-primary">
                  <MessageCircle className="h-4 w-4" /> Ask AI for Help
                </Link>
              </div>
            </div>

            {/* Answers */}
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Question breakdown</h2>
            <div className="space-y-4">
              {result.questions.map((q, index) => {
                const notAnswered = q.userAnswer === -1;
                return (
                  <div key={index} className="card p-5">
                    <div className="mb-3 flex items-start gap-3">
                      {q.isCorrect ? (
                        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                      ) : notAnswered ? (
                        <MinusCircle className="h-6 w-6 shrink-0 text-slate-400" />
                      ) : (
                        <XCircle className="h-6 w-6 shrink-0 text-red-600" />
                      )}
                      <h3 className="font-medium text-slate-900">
                        {index + 1}. {q.question}
                        {notAnswered && <span className="badge-gray ml-2">Not answered</span>}
                      </h3>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options.map((option, optionIndex) => {
                        const isCorrect = optionIndex === q.correctAnswer;
                        const isWrongPick = optionIndex === q.userAnswer && !isCorrect;
                        return (
                          <div key={optionIndex}
                            className={`rounded-lg border p-2.5 text-sm ${
                              isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : isWrongPick ? 'border-red-300 bg-red-50 text-red-800'
                                : 'border-slate-200 text-slate-600'
                            }`}>
                            <span className="font-semibold">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                            {isCorrect && <span className="ml-1 font-semibold"> - Correct</span>}
                            {isWrongPick && <span className="ml-1 font-semibold"> - Your answer</span>}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-900">
                        <span className="font-semibold">Explanation: </span>{q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Page>
    </StudentLayout>
  );
};

export default StudentResult;
