import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Link
} from '@mui/material';
import {
  VerifiedUser as CredentialIcon,
  Security as SecurityIcon,
  Check as ApproveIcon,
  Cancel as DenyIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import axios from 'axios';

// API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Demo steps
const steps = [
  'User Identity',
  'Credential Storage',
  'Consent Management',
  'Verification'
];

const HackathonDemo: React.FC = () => {
  // State for demo steps
  const [activeStep, setActiveStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // User identity state
  const [userDid, setUserDid] = useState<string>('');
  const [telegramId, setTelegramId] = useState<string>('');
  
  // Credential state
  const [credential, setCredential] = useState<any>(null);
  const [recordId, setRecordId] = useState<string>('');
  
  // Consent state
  const [consentData, setConsentData] = useState<any>(null);
  const [consentRequests, setConsentRequests] = useState<any[]>([]);
  const [actionType, setActionType] = useState<string>('ban');
  const [targetUser, setTargetUser] = useState<string>('@testuser');
  
  // Generate a sample DID for ease of use
  useEffect(() => {
    if (!userDid) {
      setUserDid(`did:cheqd:testnet:demo-${Date.now().toString(36)}`);
    }
    if (!telegramId) {
      setTelegramId(Math.floor(Math.random() * 1000000000).toString());
    }
  }, [userDid, telegramId]);

  // Fetch consent requests
  const fetchConsentRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/consent_requests?status=pending');
      
      if (response.data.status === 'success') {
        setConsentRequests(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch consent requests');
      }
    } catch (error) {
      console.error('Error fetching consent requests:', error);
      setError('Failed to load consent requests');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch requests on mount
  useEffect(() => {
    fetchConsentRequests();
  }, []);

  // Generate sample credential
  const generateSampleCredential = () => {
    const sampleCredential = {
      id: 'cred-' + Date.now(),
      issuerDid: 'did:cheqd:testnet:' + Date.now().toString(36),
      subjectDid: userDid,
      type: 'moderation',
      attributes: {
        name: 'Demo User',
        role: 'Moderator',
        permissions: ['ban', 'mute', 'warn'],
        telegramId: telegramId
      },
      issuanceDate: new Date().toISOString()
    };
    
    setCredential(sampleCredential);
    setSuccess('Sample credential generated successfully');
  };

  // Request Verida data consent
  const requestDataConsent = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.post('/request_data_consent', { userDid });
      
      if (response.data.status === 'success') {
        setConsentData(response.data.data);
        setSuccess('Data consent request generated successfully');
      } else {
        throw new Error(response.data.message || 'Failed to request data consent');
      }
    } catch (error) {
      console.error('Error requesting data consent:', error);
      setError('Failed to request data consent');
    } finally {
      setLoading(false);
    }
  };

  // Store credential in Verida
  const storeCredential = async () => {
    if (!credential) {
      setError('No credential to store');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.post('/store_credential', { credential });
      
      if (response.data.status === 'success') {
        setRecordId(response.data.data.recordId);
        setSuccess(`Credential stored with ID: ${response.data.data.recordId}`);
      } else {
        throw new Error(response.data.message || 'Failed to store credential');
      }
    } catch (error) {
      console.error('Error storing credential:', error);
      setError('Failed to store credential');
    } finally {
      setLoading(false);
    }
  };

  // Retrieve credential from Verida
  const retrieveCredential = async () => {
    if (!recordId) {
      setError('Record ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.get(`/get_credential/${recordId}`);
      
      if (response.data.status === 'success') {
        setCredential(response.data.data.credential);
        setSuccess('Credential retrieved successfully');
      } else {
        throw new Error(response.data.message || 'Failed to retrieve credential');
      }
    } catch (error) {
      console.error('Error retrieving credential:', error);
      setError('Failed to retrieve credential');
    } finally {
      setLoading(false);
    }
  };

  // Create consent request
  const createConsentRequest = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.post('/request_consent', {
        moderatorId: telegramId,
        actionString: `${actionType} ${targetUser}`
      });
      
      if (response.data.status === 'success') {
        setSuccess(`Consent request created with ID: ${response.data.data.consent_id}`);
        fetchConsentRequests();
      } else {
        throw new Error(response.data.message || 'Failed to create consent request');
      }
    } catch (error) {
      console.error('Error creating consent request:', error);
      setError('Failed to create consent request');
    } finally {
      setLoading(false);
    }
  };

  // Handle consent request action (approve/deny)
  const handleConsentAction = async (consentId: string, approve: boolean) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.post('/update_consent', {
        consentId,
        status: approve ? 'approved' : 'denied'
      });
      
      if (response.data.status === 'success') {
        setSuccess(`Consent request ${approve ? 'approved' : 'denied'} successfully`);
        fetchConsentRequests();
      } else {
        throw new Error(response.data.message || 'Failed to update consent status');
      }
    } catch (error) {
      console.error('Error updating consent:', error);
      setError('Failed to update consent status');
    } finally {
      setLoading(false);
    }
  };

  // Handle step navigation
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Hackathon Demo: DataTrust & ConsentChain
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Secure credential storage and consent management for Telegram moderation
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4 }}>
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                <CredentialIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                User Identity
              </Typography>
              
              <Typography variant="body2" paragraph>
                This step simulates a Telegram user with a decentralized identifier (DID) that will be used for secure credential storage and consent management.
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="User DID"
                    fullWidth
                    value={userDid}
                    onChange={(e) => setUserDid(e.target.value)}
                    margin="normal"
                    helperText="Decentralized Identifier for this user"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="Telegram ID"
                    fullWidth
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    margin="normal"
                    helperText="Telegram user identifier"
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                  disabled={!userDid || !telegramId}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                DataTrust Vault Integration
              </Typography>
              
              <Typography variant="body2" paragraph>
                Store your credentials securely in the Verida DataTrust Vault with privacy-preserving consent.
              </Typography>
              
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Step 1: Generate a Sample Credential
                  </Typography>
                  
                  <Button 
                    variant="outlined" 
                    onClick={generateSampleCredential}
                    disabled={loading}
                    sx={{ mb: 2 }}
                  >
                    Generate Credential
                  </Button>

                  {credential && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                      <Alert severity="info" sx={{ mb: 1 }}>
                        Sample credential ready for storage
                      </Alert>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                        <pre style={{ margin: 0, overflow: 'auto' }}>
                          {JSON.stringify(credential, null, 2)}
                        </pre>
                      </Paper>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Step 2: Request Data Storage Consent
                  </Typography>
                  
                  <Button 
                    variant="outlined" 
                    onClick={requestDataConsent}
                    disabled={loading || !userDid}
                    sx={{ mb: 2 }}
                  >
                    Request User Consent
                  </Button>

                  {consentData && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                      <Alert severity="info" sx={{ mb: 1 }}>
                        Consent URL generated for the user to approve data storage
                      </Alert>
                      <TextField
                        fullWidth
                        value={consentData.consentUrl}
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                        margin="normal"
                        size="small"
                      />
                      <Box sx={{ mt: 1 }}>
                        <Link 
                          href={consentData.consentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Open Consent Form
                        </Link>
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Step 3: Store Credential in DataTrust Vault
                  </Typography>
                  
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={storeCredential}
                    disabled={loading || !credential}
                    sx={{ mb: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Store Credential'}
                  </Button>

                  {recordId && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Credential stored with ID: {recordId}
                    </Alert>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Step 4: Retrieve Credential
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                    <TextField
                      label="Record ID"
                      value={recordId}
                      onChange={(e) => setRecordId(e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{ flexGrow: 1 }}
                    />
                    <Button 
                      variant="outlined"
                      onClick={retrieveCredential}
                      disabled={loading || !recordId}
                    >
                      Retrieve
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ConsentChain Management
              </Typography>
              
              <Typography variant="body2" paragraph>
                Create and manage consent requests for moderation actions on Telegram.
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Create Consent Request
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          select
                          label="Action Type"
                          value={actionType}
                          onChange={(e) => setActionType(e.target.value)}
                          fullWidth
                          margin="normal"
                          SelectProps={{
                            native: true,
                          }}
                        >
                          <option value="ban">Ban</option>
                          <option value="mute">Mute</option>
                          <option value="warn">Warn</option>
                          <option value="kick">Kick</option>
                        </TextField>
                        
                        <TextField
                          label="Target Username"
                          value={targetUser}
                          onChange={(e) => setTargetUser(e.target.value)}
                          fullWidth
                          margin="normal"
                        />
                      </Box>
                      
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={createConsentRequest}
                        disabled={loading || !targetUser}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Create Request'}
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1">
                          Pending Consent Requests
                        </Typography>
                        
                        <Button
                          size="small"
                          onClick={fetchConsentRequests}
                          disabled={loading}
                        >
                          Refresh
                        </Button>
                      </Box>
                      
                      {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                          <CircularProgress />
                        </Box>
                      ) : consentRequests.length > 0 ? (
                        <Box>
                          {consentRequests.map((request) => (
                            <Card 
                              key={request.id} 
                              variant="outlined" 
                              sx={{ mb: 2, bgcolor: '#f9f9f9' }}
                            >
                              <CardContent sx={{ pb: 1 }}>
                                <Typography variant="subtitle2">
                                  {request.action.toUpperCase()}
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary">
                                  Created: {new Date(request.createdAt).toLocaleString()}
                                </Typography>
                                
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleConsentAction(request.id, false)}
                                    disabled={loading}
                                    startIcon={<DenyIcon />}
                                  >
                                    Deny
                                  </Button>
                                  
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleConsentAction(request.id, true)}
                                    disabled={loading}
                                    startIcon={<ApproveIcon />}
                                  >
                                    Approve
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      ) : (
                        <Alert severity="info">
                          No pending consent requests found
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                <ApproveIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Verification & Summary
              </Typography>
              
              <Alert severity="success" sx={{ mb: 3 }}>
                You have successfully demonstrated the integration of DataTrust Vault and ConsentChain!
              </Alert>
              
              <Paper sx={{ p: 3, bgcolor: '#f9f9f9', mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Key Features Demonstrated:
                </Typography>
                
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body1" paragraph>
                    <strong>1. Secure Identity:</strong> Used decentralized identifiers (DIDs) for user identity
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    <strong>2. DataTrust Vault Integration:</strong> Stored credentials with explicit user consent
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    <strong>3. ConsentChain:</strong> Created, approved, and tracked consent for moderation actions
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    <strong>4. Privacy-Preserving:</strong> All operations require explicit user consent
                  </Typography>
                </Box>
              </Paper>
              
              <Typography variant="subtitle1" gutterBottom>
                Next Steps:
              </Typography>
              
              <Box sx={{ ml: 2, mb: 3 }}>
                <Typography variant="body1" paragraph>
                  - Integrate with Telegram Bot for real-world moderation
                </Typography>
                
                <Typography variant="body1" paragraph>
                  - Implement stronger credential verification
                </Typography>
                
                <Typography variant="body1" paragraph>
                  - Add advanced consent workflows and auditing
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => setActiveStep(0)}
                >
                  Restart Demo
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Built for the Cheqd AI TruthRise Hackathon • Integrating Verida DataTrust Vault & ConsentChain
        </Typography>
      </Box>
    </Container>
  );
};

export default HackathonDemo; 