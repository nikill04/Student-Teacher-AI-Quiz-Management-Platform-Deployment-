import { LayoutDashboard, Upload, BookOpen, Users, BarChart3, FileText } from 'lucide-react';
import AppLayout from './AppLayout';

// Sidebar links for teachers
const navigation = [
  { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
  { name: 'Batches', href: '/teacher/batches/create', icon: Users },
  { name: 'AI Quiz from PDF', href: '/teacher/upload', icon: Upload },
  { name: 'Create Quiz', href: '/teacher/manual-create', icon: BookOpen },
  { name: 'My Quizzes', href: '/teacher/quizzes', icon: FileText },
  { name: 'Leaderboard', href: '/teacher/leaderboard', icon: BarChart3 },
];

const TeacherLayout = ({ children }) => (
  <AppLayout role="teacher" navigation={navigation}>
    {children}
  </AppLayout>
);

export default TeacherLayout;
