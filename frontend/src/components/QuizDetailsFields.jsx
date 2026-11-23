/**
 * The "quiz details" inputs (title, batch, deadline, duration).
 * Shared by "Create Quiz" and "AI Quiz from PDF".
 *
 * details  = { title, batchId, deadline, duration }
 * onChange = function that receives the updated details object
 */
import { Link } from 'react-router-dom';

// Current local time in the format a datetime-local input expects ("2025-01-31T14:30")
const nowForInput = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const QuizDetailsFields = ({ details, onChange, batches }) => {
  const update = (field, value) => onChange({ ...details, [field]: value });

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <label className="label" htmlFor="title">Quiz title</label>
        <input id="title" className="input" placeholder="e.g. Chapter 3 - Photosynthesis"
          value={details.title} onChange={(e) => update('title', e.target.value)} required />
      </div>

      <div>
        <label className="label" htmlFor="batch">Batch</label>
        <select id="batch" className="input" value={details.batchId}
          onChange={(e) => update('batchId', e.target.value)} required>
          <option value="">Choose a batch...</option>
          {batches.map((batch) => (
            <option key={batch._id} value={batch._id}>{batch.name}</option>
          ))}
        </select>
        {batches.length === 0 && (
          <p className="mt-1 text-xs text-amber-600">
            You have no batches yet. <Link to="/teacher/batches/create" className="font-semibold underline">Create one first</Link>.
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="deadline">Deadline <span className="font-normal text-stone-400">(optional)</span></label>
        <input id="deadline" type="datetime-local" className="input" min={nowForInput()}
          value={details.deadline} onChange={(e) => update('deadline', e.target.value)} />
      </div>

      <div>
        <label className="label" htmlFor="duration">Duration (minutes)</label>
        <input id="duration" type="number" min="1" max="300" className="input"
          value={details.duration} onChange={(e) => update('duration', e.target.value)} required />
      </div>
    </div>
  );
};

export default QuizDetailsFields;
