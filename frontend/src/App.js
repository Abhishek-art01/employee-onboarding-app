/**
 * App.js — Root component with routing and auth context.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { authService } from './services/authService';

// ─── Pages ────────────────────────────────────────────────────────
import LoginPage          from './pages/Login';
import RegisterPage       from './pages/Register';
import OnboardingFormPage from './pages/OnboardingForm';
import DocumentUploadPage from './pages/DocumentUpload';
import DashboardPage      from './pages/Dashboard';
import AdminReviewPage    from './pages/AdminReview';
import NotFoundPage       from './pages/NotFound';

// ─── MUI Theme ────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    primary  : { main: '#1a3660', light: '#2e6da4', dark: '#0d1e36' },
    secondary: { main: '#e8a020', light: '#f4c56a', dark: '#c47a10' },
    background: { default: '#f4f6f9', paper: '#ffffff' },
    success  : { main: '#2a7a47' },
    error    : { main: '#c0392b' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape    : { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 } },
    },
    MuiTextField: {
      defaultProps: { size: 'medium', variant: 'outlined' },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
      },
    },
  },
});

// ─── Auth Context ─────────────────────────────────────────────────
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.me()
        .then(res  => setUser(res.user))
        .catch(()  => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, refreshToken, userData) => {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  const logout = async () => {
    try { await authService.logout(); } catch {}
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {loading
        ? <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
            <CircularProgress size={48} />
          </Box>
        : children
      }
    </AuthContext.Provider>
  );
};

// ─── Route Guards ─────────────────────────────────────────────────
const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const HRRoute = () => {
  const { user } = useAuth();
  const allowed  = ['hr_admin', 'hr_executive', 'super_admin'];
  return user && allowed.includes(user.role) ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

const GuestRoute = () => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        toastOptions={{ duration: 4000, style: { fontFamily: '"Inter", sans-serif', fontSize: 14 } }}
      />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Guest only */}
            <Route element={<GuestRoute />}>
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard"  element={<DashboardPage />} />
              <Route path="/onboarding" element={<OnboardingFormPage />} />
              <Route path="/documents"  element={<DocumentUploadPage />} />

              {/* HR only */}
              <Route element={<HRRoute />}>
                <Route path="/admin/review"  element={<AdminReviewPage />} />
              </Route>
            </Route>

            <Route path="/"   element={<Navigate to="/dashboard" replace />} />
            <Route path="*"   element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
