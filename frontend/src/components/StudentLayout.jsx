import { LayoutDashboard, MessageCircle, Trophy, Users, Rocket } from 'lucide-react';
import AppLayout from './AppLayout';

// Sidebar links for students
const navigation = [
  { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Active Quizzes', href: '/student/active-quizzes', icon: Rocket },
  { name: 'My Results', href: '/student/my-results', icon: Trophy },
  { name: 'Batches', href: '/student/join-batch', icon: Users },
  { name: 'Ask AI', href: '/student/ask-ai', icon: MessageCircle },
];

const StudentLayout = ({ children }) => (
  <AppLayout role="student" navigation={navigation}>
    {children}
  </AppLayout>
);

export default StudentLayout;
