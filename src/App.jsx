import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';

// Pages
import Login from './pages/Login';
import CompanySelection from './pages/admin/CompanySelection';
import AdminDashboard from './pages/admin/AdminDashboard';
import DailyAttendance from './pages/admin/DailyAttendance';
import MonthlyReports from './pages/admin/MonthlyReports';
import EmployeesList from './pages/admin/EmployeesList';
import AddEmployee from './pages/admin/AddEmployee';
import EditEmployee from './pages/admin/EditEmployee';
import AddCompany from './pages/admin/AddCompany';
import CompaniesList from './pages/admin/CompaniesList';
import CompanyCourses from './pages/admin/CompanyCourses';
import EmployeeDetail from './pages/admin/EmployeeDetail';
import ProjectsPage from './pages/admin/ProjectsPage';
import TasksPage from './pages/admin/TasksPage';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';

const ProtectedRoute = ({ children, requireAdmin, requireEmployee, requireSuperAdmin }) => {
  const { user, isAdmin, isEmployee, isCompanyManager, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface text-primary">جاري التحميل...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireSuperAdmin && !isAdmin) {
    if (isCompanyManager) return <Navigate to="/admin/dashboard" replace />;
    if (isEmployee) return <Navigate to="/employee/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin && !isCompanyManager) {
    if (isEmployee) return <Navigate to="/employee/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  if (requireEmployee && !isEmployee) {
    if (isAdmin) return <Navigate to="/admin/company-selection" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const { user, isAdmin, isEmployee, isCompanyManager, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface text-primary">جاري التحميل...</div>;
  }

  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={(user && (isAdmin || isEmployee || isCompanyManager)) ? <Navigate to="/" replace /> : <Login />} />
        
        <Route path="/" element={
          !user ? <Navigate to="/login" replace /> :
          isAdmin ? <Navigate to="/admin/company-selection" replace /> :
          isCompanyManager ? <Navigate to="/admin/dashboard" replace /> :
          isEmployee ? <Navigate to="/employee/dashboard" replace /> :
          <Navigate to="/login" replace />
        } />

        {/* Admin Routes */}
        <Route path="/admin/company-selection" element={
          <ProtectedRoute requireSuperAdmin>
            <CompanySelection />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="attendance" element={<DailyAttendance />} />
          <Route path="reports" element={<MonthlyReports />} />
          <Route path="employees" element={<EmployeesList />} />
          <Route path="add-employee" element={<AddEmployee />} />
          <Route path="edit-employee/:id" element={<EditEmployee />} />
          <Route path="companies" element={
            <ProtectedRoute requireSuperAdmin>
              <CompaniesList />
            </ProtectedRoute>
          } />
          <Route path="add-company" element={
            <ProtectedRoute requireSuperAdmin>
              <AddCompany />
            </ProtectedRoute>
          } />
          <Route path="company-courses" element={<CompanyCourses />} />
          <Route path="employee/:id" element={<EmployeeDetail />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="tasks" element={<TasksPage />} />
        </Route>

        {/* Employee Routes */}
        <Route path="/employee" element={
          <ProtectedRoute requireEmployee>
            <EmployeeLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<EmployeeDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
