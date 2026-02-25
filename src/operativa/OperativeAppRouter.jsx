import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import OperativeLayout from './OperativeLayout';
import OperativeEntry from './pages/OperativeEntry';
import OperativeDaySummary from './pages/OperativeDaySummary';
import OperativeProjectWorkspace from './pages/OperativeProjectWorkspace';

export default function OperativeAppRouter() {
  return (
    <Routes>
      <Route element={<OperativeLayout />}>
        <Route path="/" element={<OperativeEntry />} />
        <Route path="/riepilogo" element={<OperativeDaySummary />} />
        <Route path="/progetto/:projectId" element={<OperativeProjectWorkspace />} />
      </Route>
      <Route path="*" element={<Navigate to="/operativa" replace />} />
    </Routes>
  );
}
