import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import LanguageSelect from './pages/LanguageSelect';
import PlacementQuiz from './pages/PlacementQuiz';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ModulePage from './pages/ModulePage';
import QuizPage from './pages/QuizPage';
import CodingPage from './pages/CodingPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageCourses from './pages/admin/ManageCourses';
import ManageAssessments from './pages/admin/ManageAssessments';
import ManageCoding from './pages/admin/ManageCoding';
import Reports from './pages/admin/Reports';

function StudentRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container" style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="courses" element={<ManageCourses />} />
        <Route path="assessments" element={<ManageAssessments />} />
        <Route path="coding" element={<ManageCoding />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route
        path="/"
        element={
          <StudentRoute>
            <Layout />
          </StudentRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="select-language" element={<LanguageSelect />} />
        <Route path="placement" element={<PlacementQuiz />} />
        <Route path="profile" element={<Profile />} />
        <Route path="module/:moduleId" element={<ModulePage />} />
        <Route path="quiz/:quizId" element={<QuizPage />} />
        <Route path="problem/:problemId" element={<CodingPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
