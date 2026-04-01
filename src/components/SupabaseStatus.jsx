import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

/**
 * Development-only component to show Supabase connection status
 * Add this to your app during development to monitor connection health
 */
const SupabaseStatus = () => {
  const [status, setStatus] = useState('checking');
  const [details, setDetails] = useState('');

  useEffect(() => {
    checkConnection();
    
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setStatus('error');
        setDetails('Missing credentials in .env');
        return;
      }

      // Quick health check
      const { error } = await supabase.from('companies').select('count').limit(1);
      
      if (error) {
        setStatus('error');
        setDetails(error.message);
      } else {
        setStatus('connected');
        setDetails('All systems operational');
      }
    } catch (err) {
      setStatus('error');
      setDetails(err.message);
    }
  };

  // Only show in development
  if (import.meta.env.PROD) return null;

  const statusColors = {
    checking: 'bg-yellow-500',
    connected: 'bg-green-500',
    error: 'bg-red-500'
  };

  const statusIcons = {
    checking: '⏳',
    connected: '✅',
    error: '❌'
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-lg p-3 max-w-xs border border-gray-200">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]} animate-pulse`}></div>
        <span className="text-sm font-semibold text-gray-700">
          {statusIcons[status]} Supabase: {status}
        </span>
      </div>
      {details && (
        <p className="text-xs text-gray-500 mt-1 truncate" title={details}>
          {details}
        </p>
      )}
    </div>
  );
};

export default SupabaseStatus;
