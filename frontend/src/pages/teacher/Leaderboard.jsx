import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trophy, Download, BarChart3 } from 'lucide-react';
import TeacherLayout from '../../components/TeacherLayout';
import { Page, PageHeader, Loading, Alert, EmptyState, formatDate } from '../../components/ui';
import axios, { getErrorMessage } from '../../api/axios';

const medalColors = ['text-yellow-500', 'text-slate-400', 'text-amber-700'];

const TeacherLeaderboard = () => {
  // "?quizId=..." in the URL pre-selects a quiz (used by "View results" links)
  const [searchParams] = useSearchParams();
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(searchParams.get('quizId') || '');
  const [data, setData] = useState(null); // { leaderboard, batchOptions, quizOptions }
  const [error, setError] = useState('');

  useEffect(() => {
    const params = {};
    if (selectedBatch) params.batchId = selectedBatch;
    if (selectedQuiz) params.quizId = selectedQuiz;

    axios
      .get('/teacher/leaderboard', { params })
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not load leaderboard')));
  }, [selectedBatch, selectedQuiz]);

  const changeBatch = (batchId) => {
    setSelectedBatch(batchId);
    setSelectedQuiz(''); // the old quiz may not belong to the new batch
  };

  const exportToExcel = async () => {
    // The Excel library is big, so we only load it when the button is clicked
    const XLSX = await import('xlsx');
    const rows = data.leaderboard.map((row) => ({
      Rank: row.rank,
      'Student Name': row.name,
      Email: row.email,
      Quiz: row.quizTitle,
      'Score (%)': row.score,
      'Submitted At': formatDate(row.submittedAt, ''),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leaderboard');
    XLSX.writeFile(workbook, 'leaderboard.xlsx');
  };

  const rows = data?.leaderboard || [];

  return (
    <TeacherLayout>
      <Page>
        <PageHeader title="Leaderboard" subtitle="Student scores, best first.">
          <button onClick={exportToExcel} disabled={rows.length === 0} className="btn-success">
            <Download className="h-4 w-4" /> Export to Excel
          </button>
        </PageHeader>
        <Alert message={error} />

        {/* Filters */}
        <div className="card mb-6 grid gap-4 p-5 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="batch">Batch</label>
            <select id="batch" className="input" value={selectedBatch} onChange={(e) => changeBatch(e.target.value)}>
              <option value="">All batches</option>
              {data?.batchOptions.map((batch) => (
                <option key={batch._id} value={batch._id}>{batch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="quiz">Quiz</label>
            <select id="quiz" className="input" value={selectedQuiz} onChange={(e) => setSelectedQuiz(e.target.value)}>
              <option value="">All quizzes</option>
              {data?.quizOptions.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {!data && !error ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState icon={BarChart3} title="No submissions yet" text="Results appear here as soon as students submit quizzes." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.rank}-${row.email}`} className={row.rank <= 3 ? 'bg-amber-50/40' : ''}>
                    <td>
                      <div className="flex items-center gap-2 font-semibold">
                        {row.rank <= 3 && <Trophy className={`h-4 w-4 ${medalColors[row.rank - 1]}`} />}
                        {row.rank}
                      </div>
                    </td>
                    <td>
                      <p className="font-medium text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td>{row.quizTitle}</td>
                    <td>
                      <span className={row.score >= 80 ? 'badge-green' : row.score >= 50 ? 'badge-blue' : 'badge-red'}>
                        {row.score}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap">{formatDate(row.submittedAt, '')}</td>
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

export default TeacherLeaderboard;
