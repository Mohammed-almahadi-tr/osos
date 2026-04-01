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
import EmployeeDashboard from './pages/employee/EmployeeDashboard';

const ProtectedRoute = ({ children, requireAdmin, requireEmployee }) => {
  const { user, isAdmin, isEmployee, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface text-primary">جاري التحميل...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    if (isEmployee) return <Navigate to="/employee/dashboard" replace />;
    return <div className="min-h-screen flex flex-col justify-center items-center text-center p-6"><h2 className="text-2xl font-bold text-error mb-2">حساب غير مفعل</h2><p className="text-zinc-600 mb-6">هذا الحساب لا يمتلك صلاحيات حالياً. يرجى مراجعة مدير النظام.</p><button onClick={() => window.location.href='/login'} className="px-6 py-2 bg-primary text-white rounded-lg font-bold">العودة للاسترجاع</button></div>;
  }

  if (requireEmployee && !isEmployee) {
    if (isAdmin) return <Navigate to="/admin/company-selection" replace />;
    return <div className="min-h-screen flex flex-col justify-center items-center text-center p-6"><h2 className="text-2xl font-bold text-error mb-2">حساب غير مفعل</h2><p className="text-zinc-600 mb-6">هذا الحساب لا يمتلك صلاحيات حالياً. يرجى مراجعة مدير النظام.</p><button onClick={() => window.location.href='/login'} className="px-6 py-2 bg-primary text-white rounded-lg font-bold">العودة للاسترجاع</button></div>;
  }

  return children;
};

function App() {
  const { user, isAdmin, isEmployee, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface text-primary">جاري التحميل...</div>;
  }

  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        
        <Route path="/" element={
          !user ? <Navigate to="/login" replace /> :
          isAdmin ? <Navigate to="/admin/company-selection" replace /> :
          isEmployee ? <Navigate to="/employee/dashboard" replace /> :
          <div className="min-h-screen flex flex-col justify-center items-center text-center p-6"><h2 className="text-2xl font-bold text-error mb-2">حساب غير مفعل</h2><p className="text-zinc-600 mb-6">يرجى التأكد من تعيين دور (admin / employee) في جدول profiles الخاص بك في Supabase.</p><button onClick={() => window.location.href='/login'} className="px-6 py-2 bg-primary text-white rounded-lg font-bold">العودة للاسترجاع</button></div>
        } />

        {/* Admin Routes */}
        <Route path="/admin/company-selection" element={
          <ProtectedRoute requireAdmin>
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
