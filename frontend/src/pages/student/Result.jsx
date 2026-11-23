import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft, Share2, MessageCircle, MinusCircle } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import { Page, Loading, Alert, formatDate } from '../../components/ui';
import axios, { getErrorMessage } from '../../api/axios';

// Colour and short comment for the score
const scoreStyle = (score) => {
  if (score >= 80) return { text: 'text-brand-700', label: 'Well done.' };
  if (score >= 50) return { text: 'text-amber-700', label: 'Not bad.' };
  return { text: 'text-red-700', label: 'Worth another look.' };
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
        <Link to="/student/my-results" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-stone-800">
          <ArrowLeft className="h-4 w-4" /> My Results
        </Link>
        <Alert message={error} />

        {!result && !error && <Loading text="Loading result..." />}

        {result && (
          <>
            {/* Score card */}
            <div className="card mb-10 flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
              <div>
                <h1 className="text-2xl font-semibold text-stone-900">{result.quizTitle}</h1>
                <p className={`mt-4 font-mono text-6xl font-semibold ${scoreStyle(result.score).text}`}>{result.score}%</p>
                <p className="mt-2 text-stone-700">
                  {scoreStyle(result.score).label} {result.correctAnswers} of {result.totalQuestions} correct
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Time spent {result.timeSpent} · {formatDate(result.completedAt, '')}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <button onClick={shareResult} className="btn-secondary">
                  <Share2 className="h-4 w-4" /> {copied ? 'Copied!' : 'Share Result'}
                </button>
                <Link to="/student/ask-ai" className="btn-primary">
                  <MessageCircle className="h-4 w-4" /> Ask AI for Help
                </Link>
              </div>
            </div>

            {/* Answers */}
            <h2 className="mb-4 text-xl font-semibold text-stone-900">Question breakdown</h2>
            <div className="space-y-4">
              {result.questions.map((q, index) => {
                const notAnswered = q.userAnswer === -1;
                return (
                  <div key={index} className="card p-5">
                    <div className="mb-3 flex items-start gap-3">
                      {q.isCorrect ? (
                        <CheckCircle2 className="h-6 w-6 shrink-0 text-brand-600" />
                      ) : notAnswered ? (
                        <MinusCircle className="h-6 w-6 shrink-0 text-stone-400" />
                      ) : (
                        <XCircle className="h-6 w-6 shrink-0 text-red-600" />
                      )}
                      <h3 className="font-medium text-stone-900">
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
                            className={`rounded-md border p-2.5 text-sm ${
                              isCorrect ? 'border-brand-300 bg-brand-50 text-brand-800'
                                : isWrongPick ? 'border-red-300 bg-red-50 text-red-800'
                                : 'border-stone-200 text-stone-600'
                            }`}>
                            <span className="font-semibold">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                            {isCorrect && <span className="float-right text-xs font-medium">Correct</span>}
                            {isWrongPick && <span className="float-right text-xs font-medium">Your answer</span>}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="mt-4 border-l-2 border-amber-300 pl-3 text-sm text-stone-700">
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
