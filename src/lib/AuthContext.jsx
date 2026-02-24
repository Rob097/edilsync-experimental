import React, { createContext, useState, useContext, useEffect } from 'react';
import { appClient } from '@/api/appClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }
  const [hasCompletedInitialAuthCheck, setHasCompletedInitialAuthCheck] = useState(false);

  useEffect(() => {
    checkAppState();
  }, []);

  useEffect(() => {
    const unsubscribe = appClient.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        return;
      }

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        const shouldRunSilent = hasCompletedInitialAuthCheck || isAuthenticated;
        checkUserAuth({ silent: shouldRunSilent });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [hasCompletedInitialAuthCheck, isAuthenticated]);

  const checkAppState = async () => {
    try {
      setAuthError(null);
      setIsLoadingPublicSettings(true);
      setAppPublicSettings({ provider: 'supabase' });
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setIsLoadingAuth(true);
      }
      const currentUser = await appClient.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      if (!silent) {
        setIsLoadingAuth(false);
      }
      if (!hasCompletedInitialAuthCheck) {
        setHasCompletedInitialAuthCheck(true);
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      if (!silent) {
        setIsLoadingAuth(false);
      }
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_required',
        message: 'Authentication required'
      });
      if (!hasCompletedInitialAuthCheck) {
        setHasCompletedInitialAuthCheck(true);
      }
    }
  };

  const signInWithPassword = async ({ email, password }) => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await appClient.auth.signInWithPassword({ email, password });
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      setAuthError({
        type: 'auth_required',
        message: error?.message || 'Authentication required'
      });
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const signUpWithPassword = async ({ email, password }) => {
    setIsLoadingAuth(true);
    try {
      const response = await appClient.auth.signUpWithPassword({ email, password });

      if (!response?.requiresEmailConfirmation) {
        const currentUser = await appClient.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
      }

      setAuthError(null);
      return response;
    } catch (error) {
      setAuthError({
        type: 'auth_required',
        message: error?.message || 'Authentication required'
      });
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      appClient.auth.logout(window.location.href);
    } else {
      appClient.auth.logout();
    }
  };

  const navigateToLogin = () => {
    appClient.auth.redirectToLogin(window.location.href).catch((error) => {
      console.error('Login redirect failed:', error);
      setAuthError({
        type: 'auth_required',
        message: 'Authentication required'
      });
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
      signInWithPassword,
      signUpWithPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
