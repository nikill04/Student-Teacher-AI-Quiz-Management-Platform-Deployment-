import { useEffect, useState } from 'react';
import { Users, LogOut, Plus } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import { Page, PageHeader, Alert, Loading, EmptyState } from '../../components/ui';
import axios, { getErrorMessage } from '../../api/axios';

const JoinBatch = () => {
  const [allBatches, setAllBatches] = useState([]);
  const [myBatches, setMyBatches] = useState(null); // null = still loading
  const [selectedBatch, setSelectedBatch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [batchesRes, profileRes] = await Promise.all([
        axios.get('/student/batches'),
        axios.get('/student/profile'),
      ]);
      setAllBatches(batchesRes.data);
      setMyBatches(profileRes.data.batches);
    } catch (err) {
      setMyBatches([]);
      setError(getErrorMessage(err, 'Could not load batches'));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Only show batches the student has NOT joined yet in the dropdown
  const joinedIds = (myBatches || []).map((b) => b._id);
  const availableBatches = allBatches.filter((b) => !joinedIds.includes(b._id));

  const handleJoin = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await axios.post('/student/join-batch', { batchId: selectedBatch });
      setMessage(res.data.message);
      setSelectedBatch('');
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to join batch'));
    }
  };

  const handleLeave = async (batch) => {
    if (!window.confirm(`Leave "${batch.name}"? You will stop seeing its quizzes.`)) return;
    setMessage('');
    setError('');
    try {
      const res = await axios.delete(`/student/leave-batch/${batch._id}`);
      setMessage(res.data.message);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to leave the batch'));
    }
  };

  return (
    <StudentLayout>
      <Page className="max-w-3xl">
        <PageHeader title="Batches" subtitle="Join your teacher's batch to receive their quizzes." />
        <Alert type="success" message={message} />
        <Alert message={error} />

        {/* Join form */}
        <form onSubmit={handleJoin} className="card mb-8 p-5">
          <label className="label" htmlFor="batch">Join a new batch</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select id="batch" className="input" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
              <option value="">
                {availableBatches.length ? 'Select a batch...' : 'No other batches available'}
              </option>
              {availableBatches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name}{batch.teacher?.name ? ` (by ${batch.teacher.name})` : ''}
                </option>
              ))}
            </select>
            <button type="submit" disabled={!selectedBatch} className="btn-primary shrink-0">
              <Plus className="h-4 w-4" /> Join
            </button>
          </div>
        </form>

        {/* Joined batches */}
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Your batches</h2>
        {myBatches === null ? (
          <Loading />
        ) : myBatches.length === 0 ? (
          <EmptyState icon={Users} title="No batches joined yet" text="Pick a batch above to get started." />
        ) : (
          <ul className="space-y-3">
            {myBatches.map((batch) => (
              <li key={batch._id} className="card flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-50 p-2"><Users className="h-5 w-5 text-brand-600" /></div>
                  <span className="font-medium text-slate-900">{batch.name}</span>
                </div>
                <button onClick={() => handleLeave(batch)} className="btn-danger px-3 py-1.5">
                  <LogOut className="h-4 w-4" /> Leave
                </button>
              </li>
            ))}
          </ul>
        )}
      </Page>
    </StudentLayout>
  );
};

export default JoinBatch;
