import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  IconButton,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { CheckCircle as ApproveIcon, Cancel as DenyIcon } from '@mui/icons-material';
import { ConsentRequest } from '../../types';
import { formatDate } from '../../utils';
import AlertMessage from '../common/AlertMessage';
import AppButton from '../common/AppButton';
import gunService from '../../services/gunService';
import { consentApi, gunApi } from '../../services/api';

interface ConsentRequestsProps {
  telegramId: string;
  userDid: string;
}

const ConsentRequests: React.FC<ConsentRequestsProps> = ({ telegramId, userDid }) => {
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ open: boolean, message: string, type: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const fetchConsentRequests = async () => {
      try {
        setLoading(true);
        // Use API endpoint instead of direct Gun access
        const response = await gunApi.fetchPendingConsents(telegramId);
        
        if (response.status === 'success' && response.data) {
          setConsentRequests(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch consent requests');
        }
      } catch (error) {
        console.error('Error fetching consent requests:', error);
        setAlert({
          open: true,
          message: 'Failed to load consent requests',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConsentRequests();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchConsentRequests, 5000);
    
    return () => clearInterval(interval);
  }, [telegramId]);

  const handleConsent = async (consentId: string, approve: boolean) => {
    setProcessing(consentId);
    try {
      // First update in Gun DB via API
      const updateResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/update_consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consentId,
          status: approve ? 'approved' : 'denied'
        }),
      });
      
      const updateResult = await updateResponse.json();
      if (updateResult.status !== 'success') {
        throw new Error('Failed to update consent status');
      }
      
      // Then store the consent record with credential
      const request = consentRequests.find(req => req.id === consentId);
      if (!request) {
        throw new Error('Consent request not found');
      }
      
      const response = await consentApi.storeConsent(
        consentId,
        userDid,
        request.action,
        approve
      );
      
      if (response.status === 'success') {
        setAlert({
          open: true,
          message: `Consent ${approve ? 'approved' : 'denied'} successfully`,
          type: 'success'
        });
        
        // Remove the processed request from the list
        setConsentRequests(consentRequests.filter(req => req.id !== consentId));
      } else {
        throw new Error(response.message || 'Failed to store consent');
      }
    } catch (error) {
      setAlert({
        open: true,
        message: error instanceof Error ? error.message : 'An error occurred while processing consent',
        type: 'error'
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        Pending Consent Requests
      </Typography>
      
      {consentRequests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No pending consent requests found
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%' }}>
          {consentRequests.map((request) => (
            <Card key={request.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Action: <Chip label={request.action.split(' ')[0]} color="primary" size="small" />
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Details:</strong> {request.action}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  <strong>Requested:</strong> {formatDate(request.createdAt)}
                </Typography>
              </CardContent>
              
              <Divider />
              
              <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Consent ID:</strong> {request.id.substring(0, 8)}...
                </Typography>
                
                <Box>
                  <AppButton
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => handleConsent(request.id, true)}
                    disabled={!!processing}
                    loading={processing === request.id}
                    startIcon={<ApproveIcon />}
                    sx={{ mr: 1 }}
                  >
                    Approve
                  </AppButton>
                  
                  <AppButton
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleConsent(request.id, false)}
                    disabled={!!processing}
                    loading={processing === request.id}
                    startIcon={<DenyIcon />}
                  >
                    Deny
                  </AppButton>
                </Box>
              </CardActions>
            </Card>
          ))}
        </List>
      )}
      
      <AlertMessage
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={handleCloseAlert}
      />
    </Paper>
  );
};

export default ConsentRequests; 