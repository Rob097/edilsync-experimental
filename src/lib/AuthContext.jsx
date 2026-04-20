import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { appClient } from '@/api/appClient';

const AuthContext = createContext();
const createAuthRequiredError = (message = 'Authentication required') => ({
  type: 'auth_required',
  message,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }
  const [hasCompletedInitialAuthCheck, setHasCompletedInitialAuthCheck] = useState(false);
  const isAuthenticatedRef = useRef(false);
  const hasCompletedInitialAuthCheckRef = useRef(false);
  const authEpochRef = useRef(0);
  const authCheckSequenceRef = useRef(0);

  const markInitialAuthCheckCompleted = () => {
    if (!hasCompletedInitialAuthCheckRef.current) {
      setHasCompletedInitialAuthCheck(true);
      hasCompletedInitialAuthCheckRef.current = true;
    }
  };

  const applyAuthenticatedState = (currentUser) => {
    setUser(currentUser);
    setIsAuthenticated(true);
    isAuthenticatedRef.current = true;
    setAuthError(null);
    markInitialAuthCheckCompleted();
  };

  const applyUnauthenticatedState = (message = 'Authentication required') => {
    setUser(null);
    setIsAuthenticated(false);
    isAuthenticatedRef.current = false;
    setAuthError(createAuthRequiredError(message));
    markInitialAuthCheckCompleted();
  };

  const invalidateAuthEpoch = () => {
    authEpochRef.current += 1;
    return authEpochRef.current;
  };

  const beginTrackedAuthCheck = () => ({
    epoch: authEpochRef.current,
    checkId: ++authCheckSequenceRef.current,
  });

  const isTrackedAuthCheckCurrent = (trackedCheck) =>
    trackedCheck.epoch === authEpochRef.current && trackedCheck.checkId === authCheckSequenceRef.current;

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    hasCompletedInitialAuthCheckRef.current = hasCompletedInitialAuthCheck;
  }, [hasCompletedInitialAuthCheck]);

  useEffect(() => {
    checkAppState();
  }, []);

  useEffect(() => {
    const unsubscribe = appClient.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        return;
      }

      if (event === 'SIGNED_OUT' || !session?.user) {
        invalidateAuthEpoch();
        setIsLoadingAuth(false);
        applyUnauthenticatedState();
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        const shouldRunSilent = hasCompletedInitialAuthCheckRef.current || isAuthenticatedRef.current;
        checkUserAuth({
          silent: shouldRunSilent,
          preserveSessionOnFailure: shouldRunSilent || isAuthenticatedRef.current,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
    try {
      setAuthError(null);
      setIsLoadingPublicSettings(true);
      setAppPublicSettings({ provider: 'supabase' });
      await checkUserAuth();
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingAuth(false);
    } finally {
      setIsLoadingPublicSettings(false);
    }
  };

  const checkUserAuth = async ({
    silent = false,
    preserveSessionOnFailure = silent || isAuthenticatedRef.current,
  } = {}) => {
    const trackedCheck = beginTrackedAuthCheck();

    try {
      if (!silent) {
        setIsLoadingAuth(true);
      }

      const currentUser = await appClient.auth.me();

      if (!isTrackedAuthCheckCurrent(trackedCheck)) {
        return currentUser;
      }

      applyAuthenticatedState(currentUser);
      return currentUser;
    } catch (error) {
      if (!isTrackedAuthCheckCurrent(trackedCheck)) {
        return null;
      }

      console.error('User auth check failed:', error);

      if (preserveSessionOnFailure && isAuthenticatedRef.current) {
        setAuthError(null);
        return null;
      }

      applyUnauthenticatedState();
      return null;
    } finally {
      if (!silent && isTrackedAuthCheckCurrent(trackedCheck)) {
        setIsLoadingAuth(false);
      }
    }
  };

  const signInWithPassword = async ({ email, password }) => {
    const authEpoch = invalidateAuthEpoch();
    setIsLoadingAuth(true);

    try {
      const currentUser = await appClient.auth.signInWithPassword({ email, password });

      if (authEpoch === authEpochRef.current) {
        applyAuthenticatedState(currentUser);
      }

      return currentUser;
    } catch (error) {
      if (authEpoch === authEpochRef.current) {
        applyUnauthenticatedState(error?.message || 'Authentication required');
      }

      throw error;
    } finally {
      if (authEpoch === authEpochRef.current) {
        setIsLoadingAuth(false);
      }
    }
  };

  const signUpWithPassword = async ({ email, password }) => {
    const authEpoch = invalidateAuthEpoch();
    setIsLoadingAuth(true);

    try {
      const response = await appClient.auth.signUpWithPassword({ email, password });

      if (authEpoch !== authEpochRef.current) {
        return response;
      }

      if (!response?.requiresEmailConfirmation) {
        const currentUser = response.user || await appClient.auth.me();
        applyAuthenticatedState(currentUser);
      } else {
        setAuthError(null);
        markInitialAuthCheckCompleted();
      }

      return response;
    } catch (error) {
      if (authEpoch === authEpochRef.current) {
        setAuthError(createAuthRequiredError(error?.message || 'Authentication required'));
        markInitialAuthCheckCompleted();
      }

      throw error;
    } finally {
      if (authEpoch === authEpochRef.current) {
        setIsLoadingAuth(false);
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    invalidateAuthEpoch();
    setIsLoadingAuth(false);
    applyUnauthenticatedState();

    if (shouldRedirect) {
      appClient.auth.logout(window.location.href);
    } else {
      appClient.auth.logout();
    }
  };

  const navigateToLogin = () => {
    appClient.auth.redirectToLogin(window.location.href).catch((error) => {
      console.error('Login redirect failed:', error);
      setAuthError(createAuthRequiredError());
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
