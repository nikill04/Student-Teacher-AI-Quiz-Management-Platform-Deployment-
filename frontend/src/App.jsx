import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth, dashboardPath } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import TeacherDashboard from './pages/teacher/Dashboard';
import CreateBatch from './pages/teacher/CreateBatch';
import TeacherUpload from './pages/teacher/Upload';
import TeacherManualCreate from './pages/teacher/ManualCreate';
import TeacherQuizzes from './pages/teacher/TeacherQuizzes';
import TeacherLeaderboard from './pages/teacher/Leaderboard';

import StudentDashboard from './pages/student/Dashboard';
import ActiveQuizzes from './pages/student/ActiveQuizzes';
import StudentQuiz from './pages/student/Quiz';
import StudentResult from './pages/student/Result';
import StudentMyResults from './pages/student/StudentMyResult';
import JoinBatch from './pages/student/JoinBatch';
import StudentAskAI from './pages/student/AskAI';

// Guards a group of pages:
// not logged in -> /login, wrong role (e.g. a student opening a teacher page) -> own dashboard
function RequireRole({ role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={dashboardPath(user.role)} replace />;
  return <Outlet />; // show the requested page
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Teacher pages (only for logged-in teachers) */}
        <Route element={<RequireRole role="teacher" />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/batches/create" element={<CreateBatch />} />
          <Route path="/teacher/upload" element={<TeacherUpload />} />
          <Route path="/teacher/manual-create" element={<TeacherManualCreate />} />
          <Route path="/teacher/quizzes" element={<TeacherQuizzes />} />
          <Route path="/teacher/leaderboard" element={<TeacherLeaderboard />} />
        </Route>

        {/* Student pages (only for logged-in students) */}
        <Route element={<RequireRole role="student" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/active-quizzes" element={<ActiveQuizzes />} />
          <Route path="/student/quiz/:quizId" element={<StudentQuiz />} />
          <Route path="/student/result/:quizId" element={<StudentResult />} />
          <Route path="/student/my-results" element={<StudentMyResults />} />
          <Route path="/student/join-batch" element={<JoinBatch />} />
          <Route path="/student/ask-ai" element={<StudentAskAI />} />
        </Route>

        {/* Unknown URL -> home page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
