import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/theme.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import GrievancePortal from "./components/GrievancePortal";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PetitionerRegistration from "./pages/PetitionerRegistration";
import OfficialRegistration from "./pages/OfficialRegistration";
import AdminRegistration from "./pages/AdminRegistration";
import AdminLogin from "./pages/AdminLogin";
import OfficialLogin from "./pages/OfficialLogin";
import PetitionerLogin from "./pages/PetitionerLogin";
import PetitionerDashboard from "./pages/PetitionerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import OfficialDashboard from "./pages/OfficialDashboard";
import WaterDashboard from "./official_dept/Water";
import RTODashboard from "./official_dept/Rto";
import ElectricityDashboard from "./official_dept/Electricity";
import SubmitGrievance from './pages/SubmitGrievance';
import Settings from './pages/Settings';
import UpdateProfile from './pages/UpdateProfile';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './i18n/LanguageContext';
import MotionLayer from './motion/MotionLayer';

// Re-key the page wrapper per section of the app so each section replays its
// entrance, while tabs inside one dashboard (e.g. /admin/*) keep their state.
function PageFrame({ children }) {
  const { pathname } = useLocation();
  return (
    <div className="tk-page" key={pathname.split('/')[1] || 'home'}>
      {children}
    </div>
  );
}

function App() {
  useEffect(() => {
    // Any initialization code if needed
  }, []);

  return (
    <Router>
      <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#141416',
                color: '#e8e6e1',
                borderRadius: '2px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
              },
              success: {
                duration: 3000,
                iconTheme: { primary: '#5fb08a', secondary: '#141416' },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#d2402a',
                  color: '#fff',
                },
              },
            }}
          />
          <MotionLayer />
          <PageFrame>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<GrievancePortal />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            <Route path="/login/official" element={<OfficialLogin />} />
            <Route path="/login/petitioner" element={<PetitionerLogin />} />
            <Route path="/register/petitioner" element={<PetitionerRegistration />} />
            <Route path="/register/official" element={<OfficialRegistration />} />
            <Route path="/register/admin" element={<AdminRegistration />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* Protected Petitioner Routes */}
            <Route element={<ProtectedRoute allowedRoles={['petitioner']} />}>
              <Route path="/petitioner/dashboard" element={<PetitionerDashboard />} />
              <Route path="/submit-grievance" element={<SubmitGrievance />} />
              <Route path="/petitioner/settings" element={<Settings />} />
              <Route path="/update-profile" element={<UpdateProfile />} />
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/escalated" element={<AdminDashboard />} />
              <Route path="/admin/resource-management" element={<AdminDashboard />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/update-profile" element={<UpdateProfile />} />
              <Route path="/admin/smart-query" element={<AdminDashboard />} />
            </Route>

            {/* Protected Official Routes */}
            <Route element={<ProtectedRoute allowedRoles={['official']} />}>
              <Route path="/official-dashboard" element={<OfficialDashboard />} />
              <Route path="/official-dashboard/water" element={<WaterDashboard />} />
              <Route path="/official-dashboard/rto" element={<RTODashboard />} />
              <Route path="/official-dashboard/electricity" element={<ElectricityDashboard />} />
              <Route path="/official-dashboard/water/settings" element={<Settings />} />
              <Route path="/official-dashboard/rto/settings" element={<Settings />} />
              <Route path="/official-dashboard/electricity/settings" element={<Settings />} />
              <Route path="/official/settings" element={<Settings />} />
              <Route path="/official-dashboard/water/update-profile" element={<UpdateProfile />} />
              <Route path="/official-dashboard/rto/update-profile" element={<UpdateProfile />} />
              <Route path="/official-dashboard/electricity/update-profile" element={<UpdateProfile />} />
              <Route path="/official/update-profile" element={<UpdateProfile />} />
            </Route>
          </Routes>
          </PageFrame>
        </ThemeProvider>
      </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
