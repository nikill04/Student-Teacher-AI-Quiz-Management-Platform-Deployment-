import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, PlusCircle } from 'lucide-react';
import TeacherLayout from '../../components/TeacherLayout';
import { Page, PageHeader, Loading, Alert, EmptyState, formatDate } from '../../components/ui';
import axios, { getErrorMessage } from '../../api/axios';

const TeacherQuizzes = () => {
  const location = useLocation(); // may contain a "Quiz published!" message
  const [quizzes, setQuizzes] = useState(null); // null = still loading
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get('/teacher/quizzes')
      .then((res) => setQuizzes(res.data.quizzes))
      .catch((err) => {
        setQuizzes([]);
        setError(getErrorMessage(err, 'Failed to load quizzes'));
      });
  }, []);

  const isOverdue = (deadline) => deadline && new Date(deadline) < new Date();

  return (
    <TeacherLayout>
      <Page>
        <PageHeader title="My Quizzes" subtitle="All quizzes you have published.">
          <Link to="/teacher/manual-create" className="btn-primary">
            <PlusCircle className="h-4 w-4" /> New Quiz
          </Link>
        </PageHeader>
        <Alert type="success" message={location.state?.message} />
        <Alert message={error} />

        {quizzes === null ? (
          <Loading />
        ) : quizzes.length === 0 ? (
          <EmptyState icon={FileText} title="No quizzes yet" text="Create a quiz manually or generate one from a PDF." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Batch</th>
                  <th>Questions</th>
                  <th>Deadline</th>
                  <th>Source</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz._id} className="hover:bg-slate-50">
                    <td className="font-medium text-slate-900">{quiz.title}</td>
                    <td>{quiz.batch?.name || 'N/A'}</td>
                    <td>{quiz.questions.length}</td>
                    <td>
                      <span className={isOverdue(quiz.deadline) ? 'text-red-600' : ''}>{formatDate(quiz.deadline)}</span>
                    </td>
                    <td><span className={quiz.source === 'ai' ? 'badge-blue' : 'badge-gray'}>{quiz.source === 'ai' ? 'AI' : 'Manual'}</span></td>
                    <td className="text-right">
                      <Link to={`/teacher/leaderboard?quizId=${quiz._id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                        Results
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Page>
    </TeacherLayout>
  );
};

export default TeacherQuizzes;
