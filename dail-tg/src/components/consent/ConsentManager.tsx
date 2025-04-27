import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ListItemButton
} from '@mui/material';
import { consentChainApi } from '../../services/veridaApi';
import { ConsentRequest } from '../../types';

interface ConsentManagerProps {
  userDid?: string;
  telegramId?: string;
}

const ConsentManager: React.FC<ConsentManagerProps> = ({ userDid, telegramId }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ConsentRequest | null>(null);
  const [actionType, setActionType] = useState<string>('ban');
  const [target, setTarget] = useState<string>('');
  const [consentDialogOpen, setConsentDialogOpen] = useState<boolean>(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState<boolean>(false);

  // Fetch pending consent requests
  const fetchPendingRequests = useCallback(async () => {
    if (!telegramId) {
      setError('Telegram ID is required to fetch pending requests');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // This would need to call the actual API endpoint
      // For now, we'll simulate with some mock data
      const mockRequests: ConsentRequest[] = [
        {
          id: `consent-${Date.now()}-1`,
          telegramId,
          action: 'ban',
          status: 'pending',
          createdAt: new Date().toISOString(),
          metadata: JSON.stringify({ target: '@user123' }),
        },
        {
          id: `consent-${Date.now()}-2`,
          telegramId,
          action: 'mute',
          status: 'pending',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          metadata: JSON.stringify({ target: '@user456', duration: '1h' }),
        }
      ];
      
      setConsentRequests(mockRequests);
    } catch (err) {
      setError('Error fetching consent requests: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [telegramId, setError, setLoading, setConsentRequests]);

  // Create a new consent request
  const handleCreateRequest = async () => {
    if (!telegramId) {
      setError('Telegram ID is required to create a consent request');
      return;
    }

    if (!target) {
      setError('Target user is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call the ConsentChain API
      const response = await consentChainApi.requestConsent(
        telegramId, 
        actionType, 
        { target }
      );
      
      if (response.status === 'success' && response.data) {
        setSuccess(`Consent request created with ID: ${response.data.consentId}`);
        
        // Add the new request to the list
        const newRequest: ConsentRequest = {
          id: response.data.consentId,
          telegramId,
          action: actionType,
          status: 'pending',
          createdAt: new Date().toISOString(),
          metadata: JSON.stringify({ target }),
        };
        
        setConsentRequests(prev => [newRequest, ...prev]);
        setTarget('');
      } else {
        setError(response.message || 'Failed to create consent request');
      }
    } catch (err) {
      setError('Error creating consent request: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Handle consent request selection
  const handleSelectRequest = (request: ConsentRequest) => {
    setSelectedRequest(request);
    setConsentDialogOpen(true);
  };

  // Handle request approval or rejection
  const handleRequestAction = async (approve: boolean) => {
    if (!selectedRequest || !userDid) {
      setError('Selected request and user DID are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First update the consent status
      const statusResponse = await consentChainApi.updateConsentStatus(
        selectedRequest.id,
        approve ? 'approved' : 'rejected',
        userDid
      );
      
      if (statusResponse.status !== 'success') {
        throw new Error(statusResponse.message || 'Failed to update consent status');
      }
      
      // If approved, record the moderation action
      if (approve) {
        const moderationResponse = await consentChainApi.recordModeration(
          selectedRequest.id,
          userDid,
          true
        );
        
        if (moderationResponse.status !== 'success') {
          throw new Error(moderationResponse.message || 'Failed to record moderation action');
        }
      }
      
      setSuccess(`Consent request ${approve ? 'approved' : 'rejected'} successfully`);
      setConsentDialogOpen(false);
      
      // Update the request in the list
      setConsentRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: approve ? 'approved' : 'rejected', approverDid: userDid }
            : req
        )
      );
    } catch (err) {
      setError('Error processing consent request: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
      setApprovalDialogOpen(false);
    }
  };

  // Close consent dialog
  const handleCloseConsentDialog = () => {
    setConsentDialogOpen(false);
    setSelectedRequest(null);
  };

  // Open approval confirmation dialog
  const handleOpenApprovalDialog = (approve: boolean) => {
    setApprovalDialogOpen(true);
  };

  // Close approval confirmation dialog
  const handleCloseApprovalDialog = () => {
    setApprovalDialogOpen(false);
  };

  // Handle action type selection
  const handleActionTypeChange = (event: SelectChangeEvent) => {
    setActionType(event.target.value as string);
  };

  // Effect to fetch requests on mount or when telegramId changes
  useEffect(() => {
    if (telegramId) {
      fetchPendingRequests();
    }
  }, [telegramId, fetchPendingRequests]);

  // Helper to render status chip
  const renderStatusChip = (status: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    
    switch (status) {
      case 'pending':
        color = 'warning';
        break;
      case 'approved':
        color = 'success';
        break;
      case 'rejected':
      case 'denied':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          ConsentChain Manager
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Manage consent requests for moderation actions
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

        {/* Create new consent request */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Create Consent Request
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel id="action-type-label">Action Type</InputLabel>
              <Select
                labelId="action-type-label"
                value={actionType}
                label="Action Type"
                onChange={handleActionTypeChange}
              >
                <MenuItem value="ban">Ban</MenuItem>
                <MenuItem value="mute">Mute</MenuItem>
                <MenuItem value="warn">Warn</MenuItem>
                <MenuItem value="kick">Kick</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Target User"
              placeholder="@username"
              variant="outlined"
              size="small"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              sx={{ flex: 2 }}
            />
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateRequest}
              disabled={loading || !target}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Request'}
            </Button>
          </Box>
        </Box>

        {/* List of consent requests */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1">
              Pending Consent Requests
            </Typography>
            
            <Button
              size="small"
              onClick={fetchPendingRequests}
              disabled={loading || !telegramId}
            >
              Refresh
            </Button>
          </Box>
          
          {consentRequests.length > 0 ? (
            <List>
              {consentRequests.map((request, index) => {
                let metadata: any = {};
                try {
                  metadata = JSON.parse(request.metadata || '{}');
                } catch (e) {
                  // Ignore parsing errors
                }
                
                return (
                  <React.Fragment key={request.id}>
                    {index > 0 && <Divider />}
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => handleSelectRequest(request)}
                        disabled={loading || request.status !== 'pending'}
                      >
                        <ListItemText
                          primary={`${request.action.toUpperCase()} - ${metadata.target || 'Unknown target'}`}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                Created: {new Date(request.createdAt).toLocaleString()}
                              </Typography>
                              {' — '}
                              Status: {renderStatusChip(request.status)}
                            </>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          ) : (
            <Alert severity="info">
              No pending consent requests found
            </Alert>
          )}
        </Box>

        {/* Consent request dialog */}
        <Dialog
          open={consentDialogOpen}
          onClose={handleCloseConsentDialog}
          maxWidth="sm"
          fullWidth
        >
          {selectedRequest && (
            <>
              <DialogTitle>
                Consent Request Details
              </DialogTitle>
              
              <DialogContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">ID:</Typography>
                  <Typography variant="body1" paragraph>{selectedRequest.id}</Typography>
                  
                  <Typography variant="subtitle2">Action:</Typography>
                  <Typography variant="body1" paragraph>{selectedRequest.action.toUpperCase()}</Typography>
                  
                  <Typography variant="subtitle2">Telegram ID:</Typography>
                  <Typography variant="body1" paragraph>{selectedRequest.telegramId}</Typography>
                  
                  <Typography variant="subtitle2">Created:</Typography>
                  <Typography variant="body1" paragraph>
                    {new Date(selectedRequest.createdAt).toLocaleString()}
                  </Typography>
                  
                  <Typography variant="subtitle2">Status:</Typography>
                  <Box sx={{ mt: 0.5, mb: 1 }}>
                    {renderStatusChip(selectedRequest.status)}
                  </Box>
                  
                  <Typography variant="subtitle2">Metadata:</Typography>
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mt: 1 }}>
                    <pre>
                      {selectedRequest.metadata ? 
                        JSON.stringify(JSON.parse(selectedRequest.metadata), null, 2) : 
                        'No metadata'}
                    </pre>
                  </Box>
                </Box>
                
                {selectedRequest.status === 'pending' && (
                  <Alert severity="warning">
                    This action requires your consent. Do you approve this moderation action?
                  </Alert>
                )}
              </DialogContent>
              
              <DialogActions>
                <Button onClick={handleCloseConsentDialog}>
                  Close
                </Button>
                
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button 
                      onClick={() => handleOpenApprovalDialog(false)}
                      color="error"
                      variant="outlined"
                      disabled={loading}
                    >
                      Reject
                    </Button>
                    
                    <Button 
                      onClick={() => handleOpenApprovalDialog(true)}
                      color="success"
                      variant="contained"
                      disabled={loading}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog
          open={approvalDialogOpen}
          onClose={handleCloseApprovalDialog}
        >
          <DialogTitle>
            Confirm Action
          </DialogTitle>
          
          <DialogContent>
            <DialogContentText>
              Are you sure you want to approve this moderation action? 
              This will create a verifiable credential recording your consent.
            </DialogContentText>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCloseApprovalDialog} disabled={loading}>
              Cancel
            </Button>
            
            <Button 
              onClick={() => handleRequestAction(false)} 
              color="error" 
              disabled={loading}
            >
              Reject
            </Button>
            
            <Button 
              onClick={() => handleRequestAction(true)} 
              color="success" 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Approve'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ConsentManager; 