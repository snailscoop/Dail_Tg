import React from 'react';
import { CssBaseline, Box, Container, ThemeProvider, createTheme, Typography } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import Credentials from './pages/Credentials';
import Consent from './pages/Consent';
import VeridaConsent from './pages/VeridaConsent';
import HackathonDemo from './pages/HackathonDemo';

// Components
import Navigation from './components/common/Navigation';
import LinkingCodeForm from './components/auth/LinkingCodeForm';
import ModerationActions from './components/moderation/ModerationActions';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Placeholder components (to be implemented)
const Settings = () => (
  <Container sx={{ mt: 4 }}>
    <h1>Settings Page</h1>
    <p>Configure your application settings here.</p>
  </Container>
);

const NotFound = () => (
  <Container sx={{ mt: 4, textAlign: 'center' }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
  </Container>
);

// Redirect component for ConsentRequests
const ConsentRequestsRedirect = () => {
  // Redirect to verida-consent with state to indicate ConsentChain tab should be selected
  return <Navigate to="/verida-consent?tab=1" replace />;
};

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Main app component that uses the auth context
const AppContent: React.FC = () => {
  const { user, login } = useAuth();

  // Handler for successful linking
  const handleLinkSuccess = (telegramId: string, did: string) => {
    login(telegramId, did);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation isAuthenticated={!!user?.isAuthenticated} />
          
          <Box component="main" sx={{ flexGrow: 1, pb: 4 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              
              <Route path="/link" element={
                <Container sx={{ mt: 4 }}>
                  <LinkingCodeForm onSuccess={handleLinkSuccess} />
                </Container>
              } />
              
              <Route path="/credentials" element={<Credentials />} />
              
              <Route path="/moderation" element={
                <Container sx={{ mt: 4 }}>
                  <ModerationActions moderatorTelegramId={user?.telegramId || ''} />
                </Container>
              } />
              
              <Route path="/consent" element={<Consent />} />
              
              <Route path="/verida-consent" element={<VeridaConsent />} />
              
              <Route path="/consent-requests" element={<ConsentRequestsRedirect />} />
              
              <Route path="/settings" element={<Settings />} />
              
              <Route path="/demo" element={<HackathonDemo />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
          
          <Box component="footer" sx={{ p: 2, mt: 'auto', backgroundColor: '#f5f5f5' }}>
            <Container maxWidth="lg">
              <Typography variant="body2" color="text.secondary" align="center">
                © {new Date().getFullYear()} Dail TG Moderator — Powered by DataTrust Vault & ConsentChain
              </Typography>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

// Wrapper component with provider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
