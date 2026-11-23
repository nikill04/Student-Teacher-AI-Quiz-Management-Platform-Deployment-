import { useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';
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
          <EmptyState icon={Rocket} title="You're all caught up!" text="There are no quizzes waiting for you right now." />
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
