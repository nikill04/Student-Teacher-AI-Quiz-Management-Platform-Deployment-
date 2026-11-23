import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import QuizCard from '../../components/QuizCard';
import { Page, PageHeader, Loading, Alert, EmptyState } from '../../components/ui';
import axios, { getErrorMessage } from '../../api/axios';

// Quizzes the student can still take (not submitted and before the deadline)
const ActiveQuizzes = () => {
  const [quizzes, setQuizzes] = useState(null); // null = still loading
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get('/student/active-quizzes')
      .then((res) => setQuizzes(res.data))
      .catch((err) => {
        setQuizzes([]);
        setError(getErrorMessage(err, 'Could not load active quizzes'));
      });
  }, []);

  return (
    <StudentLayout>
      <Page>
        <PageHeader title="Active Quizzes" subtitle="Quizzes you can take right now, nearest deadline first." />
        <Alert message={error} />

        {quizzes === null ? (
          <Loading />
        ) : quizzes.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="You're all caught up!" text="Nothing is due right now. New quizzes from your teachers will show up here." />
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => <QuizCard key={quiz._id} quiz={quiz} />)}
          </div>
        )}
      </Page>
    </StudentLayout>
  );
};

export default ActiveQuizzes;
