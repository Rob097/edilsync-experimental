import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function WebAdminGuard({ children }) {
  const { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  const isLoading = isLoadingAuth || isLoadingPublicSettings;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return children;
}
