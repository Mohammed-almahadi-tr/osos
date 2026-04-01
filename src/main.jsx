import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';

// Import test utilities for development
if (import.meta.env.DEV) {
  import('./utils/supabaseTest.js').then(module => {
    window.testSupabase = module.testSupabaseConnection;
    window.createTestAdmin = module.createTestAdmin;
    window.fixUserRole = module.fixUserRole;
    console.log('🔧 Supabase test utilities loaded. Available commands:');
    console.log('  - testSupabase() - Test connection and configuration');
    console.log('  - createTestAdmin(email, password) - Create admin user');
    console.log('  - fixUserRole(userId, role) - Fix user role');
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CompanyProvider>
        <App />
      </CompanyProvider>
    </AuthProvider>
  </React.StrictMode>,
);
