import { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import TeacherLayout from '../../components/TeacherLayout';
import { Page, PageHeader, Alert, Loading, EmptyState } from '../../components/ui';
import axios, { getErrorMessage } from '../../api/axios';

// Teacher "Batches" page: create a batch + see your batches and their students
const CreateBatch = () => {
  const [batchName, setBatchName] = useState('');
  const [batches, setBatches] = useState(null); // null = still loading
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBatches = () => {
    axios
      .get('/teacher/batches')
      .then((res) => setBatches(res.data))
      .catch((err) => {
        setBatches([]);
        setError(getErrorMessage(err, 'Could not load your batches'));
      });
  };

  useEffect(loadBatches, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      const res = await axios.post('/teacher/batch/create', { name: batchName });
      setMessage(`Batch "${res.data.batch.name}" created. Students can now join it from their Batches page.`);
      setBatchName('');
      loadBatches();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create batch.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <TeacherLayout>
      <Page>
        <PageHeader title="Batches" subtitle="Create a batch for each class. Students join a batch to get its quizzes." />

        {/* Create form */}
        <form onSubmit={handleSubmit} className="card mb-8 p-5">
          <Alert type="success" message={message} />
          <Alert message={error} />
          <label className="label" htmlFor="batchName">New batch name</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input id="batchName" className="input" placeholder="e.g. CS-A 2025"
              value={batchName} onChange={(e) => setBatchName(e.target.value)} required />
            <button type="submit" disabled={saving} className="btn-primary shrink-0">
              <Plus className="h-4 w-4" />
              {saving ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>

        {/* List of batches */}
        <h2 className="mb-3 text-lg font-semibold text-stone-900">Your batches</h2>
        {batches === null ? (
          <Loading />
        ) : batches.length === 0 ? (
          <EmptyState icon={Users} title="No batches yet" text="Create your first batch above." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {batches.map((batch) => (
              <div key={batch._id} className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-stone-900">{batch.name}</h3>
                  <span className="badge-blue">{batch.students.length} students</span>
                </div>
                {batch.students.length === 0 ? (
                  <p className="text-sm text-stone-500">No students have joined yet.</p>
                ) : (
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                    {batch.students.map((student) => (
                      <li key={student._id} className="flex justify-between gap-2 text-stone-600">
                        <span className="font-medium text-stone-800">{student.name}</span>
                        <span className="truncate text-stone-400">{student.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Page>
    </TeacherLayout>
  );
};

export default CreateBatch;
