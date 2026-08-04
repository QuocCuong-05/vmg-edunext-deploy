import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/AuthContext';
import ProtectedRoute from './features/auth/ProtectedRoute';
import Layout from './features/layout/Layout';
import Landing from './features/landing/Landing';
import Login from './features/auth/Login';
import ResetPassword from './features/auth/ResetPassword';
import Dashboard from './features/dashboard/Dashboard';
import Courses from './features/courses/Courses';
import CourseDetail from './features/courses/CourseDetail';
import RegisterCoursePage from './features/courses/RegisterCoursePage';
import OrderApprovePage from './features/courses/OrderApprovePage';
import LessonView from './features/courses/LessonView';
import Vocabulary from './features/vocabulary/Vocabulary';
import Classroom from './features/classroom/Classroom';
import Quiz from './features/quiz/Quiz';
import VimiPage from './features/vimi/VimiPage';
import WordbookPage from './features/wordbook/WordbookPage';
import PlannerPage from './features/planner/PlannerPage';
import LevelPage from './features/level/LevelPage';
import AboutPage from './features/about/AboutPage';
import CertificatePage from './features/certificate/CertificatePage';
import RankingPage from './features/ranking/RankingPage';
import CommunityPage from './features/community/CommunityPage';
import UserProfilePage from './features/community/UserProfilePage';
import BlogPage from './features/blog/BlogPage';
import BookingPage from './features/booking/BookingPage';
import RewardsPage from './features/rewards/RewardsPage';
import AdminData from './features/admin/AdminData';
import AdminRoute from './features/auth/AdminRoute';
import AccountPage from './features/profile/AccountPage';
import ChangePasswordPage from './features/profile/ChangePasswordPage';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/order-approve/:orderId" element={<OrderApprovePage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/courses/:slug/register" element={<RegisterCoursePage />} />
        <Route path="/courses/:slug/lessons/:lessonId" element={<LessonView />} />
        <Route path="/vocabulary" element={<Vocabulary />} />
        <Route path="/classroom" element={<Classroom />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/:slug" element={<Quiz />} />
        <Route path="/level/quiz/:slug" element={<Quiz />} />
        <Route path="/vimi" element={<VimiPage />} />
        <Route path="/wordbook" element={<WordbookPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/level" element={<LevelPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/certificate" element={<CertificatePage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/profile/:userId" element={<UserProfilePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/password" element={<ChangePasswordPage />} />
      </Route>
      <Route element={<AdminRoute><Layout /></AdminRoute>}>
        <Route path="/admin/data" element={<AdminData />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
