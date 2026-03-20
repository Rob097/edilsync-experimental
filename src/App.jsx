import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AuthScreen from '@/components/auth/AuthScreen';
import OperativeAppRouter from '@/operativa/OperativeAppRouter.jsx';
import PublicSiteRouter from '@/public/PublicSiteRouter';
import WebAdminRouter from '@/web-admin/WebAdminRouter';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AppShell = ({ children, withNavigationTracker = false }) => (
  <AuthProvider>
    {withNavigationTracker ? <NavigationTracker /> : null}
    {children}
  </AuthProvider>
);

const AuthenticatedAppRoutes = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <AuthScreen />;
    }
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <Routes>
      <Route path="operativa/*" element={<OperativeAppRouter />} />
      <Route index element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={path}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/operativa/*" element={<Navigate to="/app/operativa" replace />} />
          <Route
            path="/app/*"
            element={
              <AppShell withNavigationTracker={true}>
                <AuthenticatedAppRoutes />
              </AppShell>
            }
          />
          <Route
            path="/web-admin/*"
            element={
              <AppShell>
                <WebAdminRouter />
              </AppShell>
            }
          />
          <Route path="*" element={<PublicSiteRouter />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
