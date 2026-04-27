import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PublicSiteRouter from '@/public/PublicSiteRouter';
const ProtectedAppEntry = lazy(() => import('@/ProtectedAppEntry'));
const LegacyOperativeRedirect = lazy(() =>
  import('@/ProtectedAppEntry').then((module) => ({ default: module.LegacyOperativeRedirect })),
);
const WebAdminEntry = lazy(() =>
  import('@/ProtectedAppEntry').then((module) => ({ default: module.WebAdminEntry })),
);

const RouteFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/90">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);


function App() {

  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/operativa/*" element={<LegacyOperativeRedirect />} />
          <Route path="/app/*" element={<ProtectedAppEntry />} />
          <Route path="/web-admin/*" element={<WebAdminEntry />} />
          <Route path="*" element={<PublicSiteRouter />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
