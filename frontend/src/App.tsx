import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FanChat } from './pages/FanChat';
import { OpsDashboard } from './pages/OpsDashboard';
import { Home } from './pages/Home';
import { HostVenues } from './pages/HostVenues';
import { AccessibilityCommitment } from './pages/AccessibilityCommitment';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import './App.css';

const ProtectedOpsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = sessionStorage.getItem('staff_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/fan" element={<Layout><FanChat /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/ops" element={
          <ProtectedOpsRoute>
            <Layout><OpsDashboard /></Layout>
          </ProtectedOpsRoute>
        } />
        <Route path="/venues" element={<Layout><HostVenues /></Layout>} />
        <Route path="/accessibility" element={<Layout><AccessibilityCommitment /></Layout>} />
      </Routes>
    </Router>
  );
};

export default App;
