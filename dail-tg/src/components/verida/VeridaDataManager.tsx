import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link
} from '@mui/material';
import { veridaApi } from '../../services/veridaApi';
import { DataStorageConsent, Credential } from '../../types';

interface VeridaDataManagerProps {
  userDid?: string;
  credential?: Credential;
  onStorageSuccess?: (recordId: string) => void;
}

const VeridaDataManager: React.FC<VeridaDataManagerProps> = ({ 
  userDid, 
  credential, 
  onStorageSuccess 
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string>('');
  const [fetchedCredential, setFetchedCredential] = useState<Credential | null>(null);
  const [requestingConsent, setRequestingConsent] = useState<boolean>(false);
  const [consentData, setConsentData] = useState<DataStorageConsent | null>(null);
  const [consentDialogOpen, setConsentDialogOpen] = useState<boolean>(false);

  // Handle storing a credential in Verida
  const handleStoreCredential = async () => {
    if (!credential) {
      setError('No credential provided to store');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await veridaApi.storeCredential(credential);
      
      if (response.status === 'success' && response.data) {
        setSuccess(`Credential successfully stored in Verida DataTrust Vault with ID: ${response.data.recordId}`);
        setRecordId(response.data.recordId);
        if (onStorageSuccess) {
          onStorageSuccess(response.data.recordId);
        }
      } else {
        setError(response.message || 'Failed to store credential');
      }
    } catch (err) {
      setError('Error storing credential: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Handle retrieving a credential from Verida
  const handleGetCredential = async () => {
    if (!recordId) {
      setError('Please enter a record ID to retrieve');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setFetchedCredential(null);

    try {
      const response = await veridaApi.getCredential(recordId);
      
      if (response.status === 'success' && response.data) {
        setSuccess('Credential successfully retrieved from Verida DataTrust Vault');
        setFetchedCredential(response.data.credential);
      } else {
        setError(response.message || 'Failed to retrieve credential');
      }
    } catch (err) {
      setError('Error retrieving credential: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Handle requesting data storage consent
  const handleRequestConsent = async () => {
    if (!userDid) {
      setError('User DID is required to request consent');
      return;
    }

    setLoading(true);
    setRequestingConsent(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await veridaApi.requestDataConsent(userDid);
      
      if (response.status === 'success' && response.data) {
        // Make sure we have all required fields
        if (response.data.consentUrl && response.data.userDid) {
          // Create a complete DataStorageConsent object with a default requestingDid if needed
          const consentDataComplete: DataStorageConsent = {
            consentUrl: response.data.consentUrl,
            userDid: response.data.userDid,
            requestingDid: response.data.requestingDid || 'did:verida:defaultRequestingDid'
          };
          
          setConsentData(consentDataComplete);
          setConsentDialogOpen(true);
          setSuccess('Consent request generated successfully');
        } else {
          throw new Error('Invalid consent data returned from API');
        }
      } else {
        setError(response.message || 'Failed to generate consent request');
      }
    } catch (err) {
      setError('Error requesting consent: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
      setRequestingConsent(false);
    }
  };

  const handleCloseConsentDialog = () => {
    setConsentDialogOpen(false);
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          DataTrust Vault
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Securely store and manage your credentials in the Verida DataTrust Vault
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Store Credential
          </Typography>
          
          {credential ? (
            <Box sx={{ mb: 2 }}>
              <Alert severity="info" sx={{ mb: 1 }}>
                Credential ready to store: {credential.id || 'New credential'}
              </Alert>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleStoreCredential}
                disabled={loading || requestingConsent}
                sx={{ mr: 1 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Store in Verida'}
              </Button>
              
              {userDid && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleRequestConsent}
                  disabled={loading || requestingConsent}
                >
                  {requestingConsent ? <CircularProgress size={24} /> : 'Request Storage Consent'}
                </Button>
              )}
            </Box>
          ) : (
            <Alert severity="warning">
              No credential available to store. Please create or select a credential first.
            </Alert>
          )}
        </Box>

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Retrieve Credential
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <TextField
              label="Record ID"
              variant="outlined"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              size="small"
              sx={{ mr: 2, flexGrow: 1 }}
            />
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleGetCredential}
              disabled={loading || !recordId}
            >
              {loading ? <CircularProgress size={24} /> : 'Retrieve'}
            </Button>
          </Box>

          {fetchedCredential && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Retrieved Credential:
              </Typography>
              <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(fetchedCredential, null, 2)}
              </pre>
            </Box>
          )}
        </Box>

        {/* Consent Dialog */}
        <Dialog
          open={consentDialogOpen}
          onClose={handleCloseConsentDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Data Storage Consent Request</DialogTitle>
          <DialogContent>
            {consentData ? (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Please visit the following URL to provide consent for storing your data in Verida DataTrust Vault:
                </Alert>
                
                <TextField
                  fullWidth
                  value={consentData.consentUrl}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  margin="normal"
                />
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Open the link in your browser and follow the instructions to grant consent.
                  </Typography>
                  <Link 
                    href={consentData.consentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Open Consent Form
                  </Link>
                </Box>
              </>
            ) : (
              <Typography color="error">Error retrieving consent data</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConsentDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default VeridaDataManager; 