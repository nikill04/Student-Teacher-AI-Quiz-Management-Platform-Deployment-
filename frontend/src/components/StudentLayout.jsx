import { LayoutDashboard, MessageCircle, ClipboardList, ListChecks, Users } from 'lucide-react';
import AppLayout from './AppLayout';

// Sidebar links for students
const navigation = [
  { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Active Quizzes', href: '/student/active-quizzes', icon: ClipboardList },
  { name: 'My Results', href: '/student/my-results', icon: ListChecks },
  { name: 'Batches', href: '/student/join-batch', icon: Users },
  { name: 'Ask AI', href: '/student/ask-ai', icon: MessageCircle },
];

const StudentLayout = ({ children }) => (
  <AppLayout role="student" navigation={navigation}>
    {children}
  </AppLayout>
);

export default StudentLayout;
