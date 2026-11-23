import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Trophy, Award, Target, BookOpen } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import QuizCard from '../../components/QuizCard';
import { Page, PageHeader, Loading, Alert, EmptyState, StatCard, greeting } from '../../components/ui';
import axios, { getErrorMessage } from '../../api/axios';

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [batches, setBatches] = useState([]); // [{ _id, name, quizzes: [...] }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // 1. Who am I and which batches did I join?
        const profile = await axios.get('/student/profile');
        setStudent(profile.data);

        // 2. Load the quizzes of every batch at the same time
        const batchesWithQuizzes = await Promise.all(
          profile.data.batches.map(async (batch) => {
            const res = await axios.get(`/student/batch/${batch._id}/quizzes`);
            return { ...batch, quizzes: res.data };
          })
        );
        setBatches(batchesWithQuizzes);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load your dashboard'));
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  // Numbers for the stat cards
  const allQuizzes = batches.flatMap((batch) => batch.quizzes);
  const completed = allQuizzes.filter((q) => q.status === 'completed');
  const activeCount = allQuizzes.filter((q) => q.status === 'available').length;
  const averageScore = completed.length
    ? `${Math.round(completed.reduce((sum, q) => sum + q.score, 0) / completed.length)}%`
    : '-';

  return (
    <StudentLayout>
      <Page>
        {loading ? (
          <Loading text="Loading your dashboard..." />
        ) : (
          <>
            <PageHeader title={`${greeting()}, ${student?.name?.split(' ')[0] || 'there'}`} subtitle="Here are your batches and quizzes." />
            <Alert message={error} />

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Users} label="Batches Joined" value={student?.batches.length ?? 0} />
              <StatCard icon={Target} label="Quizzes To Do" value={activeCount} />
              <StatCard icon={Award} label="Completed" value={completed.length} />
              <StatCard icon={Trophy} label="Average Score" value={averageScore} />
            </div>

            {student && batches.length === 0 && (
              <EmptyState icon={Users} title="You haven't joined a batch yet"
                text="Join your teacher's batch to see your quizzes here.">
                <Link to="/student/join-batch" className="btn-primary">Join a Batch</Link>
              </EmptyState>
            )}

            {batches.map((batch) => (
              <section key={batch._id} className="mb-8">
                <h2 className="mb-3 text-xl font-semibold text-stone-900">{batch.name}</h2>
                {batch.quizzes.length === 0 ? (
                  <EmptyState icon={BookOpen} title="No quizzes yet" text="Your teacher hasn't published a quiz for this batch." />
                ) : (
                  <div className="space-y-3">
                    {batch.quizzes.map((quiz) => <QuizCard key={quiz._id} quiz={quiz} />)}
                  </div>
                )}
              </section>
            ))}
          </>
        )}
      </Page>
    </StudentLayout>
  );
};

export default StudentDashboard;
