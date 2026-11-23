/**
 * One quiz shown to a student (used on Dashboard and Active Quizzes).
 * quiz.status: 'available' | 'completed' | 'overdue'  (default: 'available')
 */
import { Link } from 'react-router-dom';
import { BookOpen, Clock, CalendarClock, Play, CheckCircle2 } from 'lucide-react';
import { formatDate } from './ui';

const statusBadge = {
  available: <span className="badge-blue">Available</span>,
  completed: <span className="badge-green"><CheckCircle2 className="h-3 w-3" /> Completed</span>,
  overdue: <span className="badge-red">Missed</span>,
};

const QuizCard = ({ quiz }) => {
  const status = quiz.status || 'available';

  return (
    <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{quiz.title}</h3>
          {statusBadge[status]}
          {quiz.batchName && <span className="badge-gray">{quiz.batchName}</span>}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {quiz.questionCount} questions</span>
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {quiz.duration} min</span>
          <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4" /> Due: {formatDate(quiz.deadline)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {status === 'completed' && (
          <div className="text-right">
            <p className="text-xs text-slate-500">Score</p>
            <p className="text-xl font-bold text-emerald-600">{quiz.score}%</p>
          </div>
        )}
        {status === 'available' && (
          <Link to={`/student/quiz/${quiz._id}`} className="btn-primary">
            <Play className="h-4 w-4" /> Start Quiz
          </Link>
        )}
        {status === 'completed' && (
          <Link to={`/student/result/${quiz._id}`} className="btn-secondary">View Result</Link>
        )}
        {status === 'overdue' && <span className="text-sm text-slate-400">Deadline passed</span>}
      </div>
    </div>
  );
};

export default QuizCard;
