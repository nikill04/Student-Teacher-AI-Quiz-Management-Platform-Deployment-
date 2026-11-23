import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Wand2, Loader2, Trash2, RotateCcw, Send } from 'lucide-react';
import TeacherLayout from '../../components/TeacherLayout';
import QuizDetailsFields from '../../components/QuizDetailsFields';
import { Page, PageHeader, Alert } from '../../components/ui';
import axios, { getErrorMessage } from '../../api/axios';

const TeacherUpload = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [details, setDetails] = useState({ title: '', batchId: '', deadline: '', duration: 30 });
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [questions, setQuestions] = useState(null); // null = not generated yet
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get('/teacher/batches')
      .then((res) => setBatches(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not load batches')));
  }, []);

  // ---------- Choosing a file ----------
  const pickFile = (selected) => {
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      setError('Please choose a PDF file.');
      return;
    }
    setError('');
    setFile(selected);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  // ---------- Step 1: generate questions with AI ----------
  const generateQuiz = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please choose a PDF file first.');

    setError('');
    setGenerating(true);
    const form = new FormData();
    form.append('file', file);
    form.append('batchId', details.batchId);

    try {
      const res = await axios.post('/teacher/upload-and-generate', form);
      setQuestions(res.data.quiz.questions);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to generate quiz.'));
    } finally {
      setGenerating(false);
    }
  };

  // ---------- Step 2: review and publish ----------
  const setCorrect = (qIndex, optionIndex) =>
    setQuestions(questions.map((q, i) => (i === qIndex ? { ...q, correct: optionIndex } : q)));

  const removeQuestion = (qIndex) => setQuestions(questions.filter((_, i) => i !== qIndex));

  const publishQuiz = async () => {
    setError('');
    setPublishing(true);
    try {
      await axios.post('/teacher/publish-quiz', {
        batchId: details.batchId,
        quiz: { ...details, source: 'ai', questions },
      });
      navigate('/teacher/quizzes', { state: { message: `Quiz "${details.title}" published!` } });
    } catch (err) {
      setError(getErrorMessage(err, 'Publishing failed.'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <TeacherLayout>
      <Page className="max-w-4xl">
        <PageHeader title="AI Quiz from PDF" subtitle="Upload study material and let AI write the questions. You can review them before publishing." />
        <Alert message={error} />

        {!questions ? (
          /* ---------- STEP 1: upload form ---------- */
          <form onSubmit={generateQuiz} className="space-y-6">
            <div className="card p-6">
              <h2 className="mb-4 font-semibold text-stone-900">1. Quiz details</h2>
              <QuizDetailsFields details={details} onChange={setDetails} batches={batches} />
            </div>

            <div className="card p-6">
              <h2 className="mb-4 font-semibold text-stone-900">2. Study material (PDF)</h2>
              <label
                htmlFor="file-upload"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  dragActive ? 'border-brand-500 bg-brand-50' : 'border-stone-300 hover:border-brand-400 hover:bg-stone-50'
                }`}
              >
                {file ? (
                  <>
                    <FileText className="mb-2 h-10 w-10 text-brand-600" />
                    <p className="font-semibold text-stone-900">{file.name}</p>
                    <p className="text-sm text-stone-500">{(file.size / 1024 / 1024).toFixed(2)} MB - click to change</p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-10 w-10 text-stone-400" />
                    <p className="font-semibold text-stone-900">Drag a PDF here or click to choose</p>
                    <p className="text-sm text-stone-500">Text PDFs only, max 10 MB</p>
                  </>
                )}
              </label>
              <input id="file-upload" type="file" accept="application/pdf" hidden
                onChange={(e) => pickFile(e.target.files?.[0])} />
            </div>

            <button type="submit" disabled={generating || !file} className="btn-primary w-full py-3">
              {generating ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Generating questions... (this can take ~10 seconds)</>
              ) : (
                <><Wand2 className="h-4 w-4" /> Generate Quiz with AI</>
              )}
            </button>
          </form>
        ) : (
          /* ---------- STEP 2: review generated questions ---------- */
          <div className="space-y-4">
            <div className="card flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-stone-900">{details.title}</h2>
                <p className="text-sm text-stone-500">
                  {questions.length} questions - {details.duration} min. Click an option to change the correct answer.
                </p>
              </div>
              <button onClick={() => setQuestions(null)} className="btn-secondary">
                <RotateCcw className="h-4 w-4" /> Start over
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="card p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="font-medium text-stone-900">{qIndex + 1}. {q.question}</h3>
                  <button onClick={() => removeQuestion(qIndex)} className="text-stone-400 hover:text-red-600" aria-label="Remove question">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((option, optionIndex) => (
                    <button key={optionIndex} type="button" onClick={() => setCorrect(qIndex, optionIndex)}
                      className={`rounded-lg border p-2.5 text-left text-sm transition-colors ${
                        q.correct === optionIndex
                          ? 'border-brand-400 bg-brand-50 font-medium text-brand-800'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}>
                      {String.fromCharCode(65 + optionIndex)}. {option} {q.correct === optionIndex && '✓'}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={publishQuiz} disabled={publishing || questions.length === 0} className="btn-success w-full py-3">
              <Send className="h-4 w-4" />
              {publishing ? 'Publishing...' : `Publish Quiz (${questions.length} questions)`}
            </button>
          </div>
        )}
      </Page>
    </TeacherLayout>
  );
};

export default TeacherUpload;
