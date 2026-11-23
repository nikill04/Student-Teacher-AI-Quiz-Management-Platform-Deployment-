import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import TeacherLayout from '../../components/TeacherLayout';
import QuizDetailsFields from '../../components/QuizDetailsFields';
import { Page, PageHeader, Alert } from '../../components/ui';
import axios, { getErrorMessage } from '../../api/axios';

// A new empty question. "correct" = index of the right option (0 = A)
const emptyQuestion = () => ({ id: Date.now(), question: '', options: ['', '', '', ''], correct: 0 });

const ManualCreate = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [details, setDetails] = useState({ title: '', batchId: '', deadline: '', duration: 30 });
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .get('/teacher/batches')
      .then((res) => setBatches(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not load batches')));
  }, []);

  // Change one field of one question
  const updateQuestion = (id, field, value) =>
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)));

  // Change one option of one question
  const updateOption = (id, optionIndex, value) =>
    setQuestions(questions.map((q) =>
      q.id === id ? { ...q, options: q.options.map((opt, i) => (i === optionIndex ? value : opt)) } : q
    ));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await axios.post('/teacher/publish-quiz', {
        batchId: details.batchId,
        quiz: {
          title: details.title,
          deadline: details.deadline,
          duration: details.duration,
          source: 'manual',
          questions: questions.map(({ question, options, correct }) => ({ question, options, correct })),
        },
      });
      navigate('/teacher/quizzes', { state: { message: `Quiz "${details.title}" published!` } });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create quiz'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <TeacherLayout>
      <Page className="max-w-4xl">
        <PageHeader title="Create Quiz" subtitle="Write your own questions. Select the circle next to the correct answer." />
        <Alert message={error} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-stone-900">Quiz details</h2>
            <QuizDetailsFields details={details} onChange={setDetails} batches={batches} />
          </div>

          {questions.map((q, index) => (
            <div key={q.id} className="card p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-stone-900">Question {index + 1}</h3>
                {questions.length > 1 && (
                  <button type="button" onClick={() => setQuestions(questions.filter((x) => x.id !== q.id))}
                    className="btn-danger px-3 py-1.5" aria-label="Delete question">
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                )}
              </div>

              <textarea className="input mb-4" rows={2} placeholder="Type the question"
                value={q.question} onChange={(e) => updateQuestion(q.id, 'question', e.target.value)} required />

              <div className="grid gap-3 sm:grid-cols-2">
                {q.options.map((option, optionIndex) => (
                  <label key={optionIndex}
                    className={`flex items-center gap-3 rounded-lg border p-2 ${
                      q.correct === optionIndex ? 'border-brand-400 bg-brand-50' : 'border-stone-200'
                    }`}>
                    <input type="radio" name={`correct-${q.id}`} className="h-4 w-4 accent-brand-600"
                      checked={q.correct === optionIndex} onChange={() => updateQuestion(q.id, 'correct', optionIndex)} />
                    <input className="input border-0 bg-transparent px-1 py-1 focus:ring-0"
                      placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      value={option} onChange={(e) => updateOption(q.id, optionIndex, e.target.value)} required />
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button type="button" onClick={() => setQuestions([...questions, emptyQuestion()])} className="btn-secondary">
              <Plus className="h-4 w-4" /> Add Question
            </button>
            <button type="submit" disabled={saving} className="btn-success px-6">
              <Save className="h-4 w-4" />
              {saving ? 'Publishing...' : `Publish Quiz (${questions.length} questions)`}
            </button>
          </div>
        </form>
      </Page>
    </TeacherLayout>
  );
};

export default ManualCreate;
