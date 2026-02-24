import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import EssentialLayout from './EssentialLayout';
import EssentialHome from './pages/EssentialHome';
import EssentialProjects from './pages/EssentialProjects';
import EssentialProjectExplorer from './pages/EssentialProjectExplorer';
import EssentialNewProject from './pages/EssentialNewProject';
import EssentialCompanies from './pages/EssentialCompanies';
import EssentialCompanyDetail from './pages/EssentialCompanyDetail';
import EssentialNewCompany from './pages/EssentialNewCompany';
import EssentialCalendar from './pages/EssentialCalendar';
import TourProvider from '@/components/tour/TourProvider';
import TourOverlay from '@/components/tour/TourOverlay';

export default function EssentialAppRouter() {
  return (
    <TourProvider>
      <TourOverlay />
      <Routes>
        <Route element={<EssentialLayout />}>
          <Route path="/" element={<EssentialHome />} />
          <Route path="/progetti" element={<EssentialProjects />} />
          <Route path="/progetti/nuovo" element={<EssentialNewProject />} />
          <Route path="/progetti/:projectId" element={<EssentialProjectExplorer />} />
          <Route path="/progetti/:projectId/:section" element={<EssentialProjectExplorer />} />
          <Route path="/societa" element={<EssentialCompanies />} />
          <Route path="/societa/nuova" element={<EssentialNewCompany />} />
          <Route path="/societa/:companyId" element={<EssentialCompanyDetail />} />
          <Route path="/calendario" element={<EssentialCalendar />} />
        </Route>
        <Route path="*" element={<Navigate to="/essenziale" replace />} />
      </Routes>
    </TourProvider>
  );
}
