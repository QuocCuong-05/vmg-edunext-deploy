import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/AuthContext';
import ProtectedRoute from './features/auth/ProtectedRoute';
import Layout from './features/layout/Layout';
import Landing from './features/landing/Landing';
import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import Courses from './features/courses/Courses';
import CourseDetail from './features/courses/CourseDetail';
import LessonView from './features/courses/LessonView';
import Vocabulary from './features/vocabulary/Vocabulary';
import Classroom from './features/classroom/Classroom';
import Quiz from './features/quiz/Quiz';
import VimiPage from './features/vimi/VimiPage';
import WordbookPage from './features/wordbook/WordbookPage';
import LibraryPage from './features/library/LibraryPage';
import PlannerPage from './features/planner/PlannerPage';
import LevelPage from './features/level/LevelPage';
import AboutPage from './features/about/AboutPage';
import CertificatePage from './features/certificate/CertificatePage';
import RankingPage from './features/ranking/RankingPage';
import CommunityPage from './features/community/CommunityPage';
import BlogPage from './features/blog/BlogPage';
import BookingPage from './features/booking/BookingPage';
import RewardsPage from './features/rewards/RewardsPage';

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
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/courses/:slug/lessons/:lessonId" element={<LessonView />} />
        <Route path="/vocabulary" element={<Vocabulary />} />
        <Route path="/classroom" element={<Classroom />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/:slug" element={<Quiz />} />
        <Route path="/vimi" element={<VimiPage />} />
        <Route path="/wordbook" element={<WordbookPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/level" element={<LevelPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/certificate" element={<CertificatePage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
