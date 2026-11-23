import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, FileText, TrendingUp, Upload, BarChart3, PlusCircle } from 'lucide-react';
import TeacherLayout from '../../components/TeacherLayout';
import { Page, PageHeader, Loading, Alert, StatCard } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import axios, { getErrorMessage } from '../../api/axios';

const quickActions = [
  { to: '/teacher/upload', icon: Upload, title: 'AI Quiz from PDF', text: 'Upload material and let AI write the questions' },
  { to: '/teacher/manual-create', icon: PlusCircle, title: 'Create Quiz', text: 'Write your own questions and answers' },
  { to: '/teacher/leaderboard', icon: BarChart3, title: 'Leaderboard', text: 'See how your students are doing' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get('/teacher/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not load dashboard')));
  }, []);

  return (
    <TeacherLayout>
      <Page>
        <PageHeader title={`Welcome back, ${user?.name || 'Teacher'}!`} subtitle="Here's what's happening with your classes." />
        <Alert message={error} />

        {!data && !error && <Loading />}

        {data && (
          <>
            {/* Numbers */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={BookOpen} label="Total Quizzes" value={data.metrics.totalQuizzes} />
              <StatCard icon={Users} label="Students" value={data.metrics.activeStudents} color="emerald" />
              <StatCard icon={TrendingUp} label="Average Score" value={`${data.metrics.avgScore}%`} color="amber" />
              <StatCard icon={FileText} label="Batches" value={data.metrics.totalBatches} color="rose" />
            </div>

            {/* Quick actions */}
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              {quickActions.map((action) => (
                <Link key={action.to} to={action.to}
                  className="card group p-5 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
                  <action.icon className="mb-3 h-7 w-7 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">{action.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{action.text}</p>
                </Link>
              ))}
            </div>

            {/* Recent quizzes */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between p-5">
                <h2 className="text-lg font-semibold text-slate-900">Recent Quizzes</h2>
                <Link to="/teacher/quizzes" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View all</Link>
              </div>
              {data.quizzes.length === 0 ? (
                <p className="border-t border-slate-100 p-8 text-center text-slate-500">
                  No quizzes yet. Start by <Link to="/teacher/batches/create" className="font-semibold text-indigo-600">creating a batch</Link>.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Quiz</th>
                        <th>Batch</th>
                        <th>Attempts</th>
                        <th>Avg. Score</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.quizzes.map((quiz) => (
                        <tr key={quiz._id} className="hover:bg-slate-50">
                          <td className="font-medium text-slate-900">{quiz.title}</td>
                          <td>{quiz.batch}</td>
                          <td>{quiz.attempts} / {quiz.students}</td>
                          <td>
                            <span className={quiz.avgScore >= 70 ? 'badge-green' : quiz.attempts ? 'badge-red' : 'badge-gray'}>
                              {quiz.attempts ? `${quiz.avgScore}%` : '-'}
                            </span>
                          </td>
                          <td className="text-right">
                            <Link to={`/teacher/leaderboard?quizId=${quiz._id}`}
                              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                              View results
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </Page>
    </TeacherLayout>
  );
};

export default Dashboard;
