import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import ConsentRequests from '../components/consentChain/ConsentRequests';
import { useAuth } from '../contexts/AuthContext';

const Consent: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Just a short delay to prevent showing loading indicator for quick loads
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '50vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Consent Requests
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }} align="center">
          Review and manage consent requests for moderation actions
        </Typography>
        
        {/* Use empty string for telegramId to get all requests */}
        <ConsentRequests 
          telegramId={user?.telegramId || ''} 
          userDid={user?.did || ''}
        />
      </Box>
    </Container>
  );
};

export default Consent; 