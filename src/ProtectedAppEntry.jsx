import NavigationTracker from '@/lib/NavigationTracker';
import { pagesConfig } from './pages.config';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AuthScreen from '@/components/auth/AuthScreen';
import OperativeAppRouter from '@/operativa/OperativeAppRouter.jsx';
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

export const LegacyOperativeRedirect = () => {
  const location = useLocation();
  const nextPath = `/app${location.pathname}${location.search}${location.hash}`;
  return <Navigate to={nextPath} replace />;
};

const AuthenticatedAppRoutes = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }

    if (authError.type === 'auth_required') {
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

export const WebAdminEntry = () => (
  <AppShell>
    <WebAdminRouter />
  </AppShell>
);

export default function ProtectedAppEntry() {
  return (
    <AppShell withNavigationTracker={true}>
      <AuthenticatedAppRoutes />
    </AppShell>
  );
}