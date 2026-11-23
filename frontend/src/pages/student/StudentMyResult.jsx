import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import { Page, PageHeader, Loading, Alert, EmptyState, formatDate } from '../../components/ui';
import axios, { getErrorMessage } from '../../api/axios';

const scoreBadge = (score) => (score >= 80 ? 'badge-green' : score >= 50 ? 'badge-blue' : 'badge-red');

const StudentMyResults = () => {
  const [results, setResults] = useState(null); // null = still loading
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get('/student/my-results')
      .then((res) => setResults(res.data))
      .catch((err) => {
        setResults([]);
        setError(getErrorMessage(err, 'Could not load results'));
      });
  }, []);

  return (
    <StudentLayout>
      <Page>
        <PageHeader title="My Results" subtitle="Every quiz you have submitted." />
        <Alert message={error} />

        {results === null ? (
          <Loading />
        ) : results.length === 0 ? (
          <EmptyState icon={Trophy} title="No results yet" text="Take a quiz and your score will show up here.">
            <Link to="/student/active-quizzes" className="btn-primary">See Active Quizzes</Link>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.quizId} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-stone-900">{result.quizTitle}</h2>
                  <p className="text-sm text-stone-500">
                    {result.correctAnswers} / {result.totalQuestions} correct - {formatDate(result.completedAt, '')} - {result.timeSpent}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`${scoreBadge(result.score)} px-3 py-1 text-sm`}>{result.score}%</span>
                  <Link to={`/student/result/${result.quizId}`} className="btn-secondary">View Details</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Page>
    </StudentLayout>
  );
};

export default StudentMyResults;
