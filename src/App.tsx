import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AdminButton from './components/AdminButton';
import AdminLogin from './components/AdminLogin';
import { TimelineProvider } from './context/TimelineContext';

export default function App() {
  const [showAdminLogin, setShowAdminLogin] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'SELECT 1' })
        });
        
        if (!response.ok) {
          throw new Error('Database connection failed');
        }
        
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to database');
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-red-600 text-xl font-semibold mb-4">Application Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <TimelineProvider>
      <Dashboard isAdmin={isAdmin} />
      <AdminButton 
        onClick={() => setShowAdminLogin(true)} 
        className={isAdmin ? 'hidden' : ''} 
      />
      {showAdminLogin && (
        <AdminLogin 
          onLogin={() => {
            setIsAdmin(true);
            setShowAdminLogin(false);
          }} 
          onClose={() => setShowAdminLogin(false)} 
        />
      )}
    </TimelineProvider>
  );
}