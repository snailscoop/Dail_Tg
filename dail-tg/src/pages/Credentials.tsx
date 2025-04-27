import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Tabs, 
  Tab, 
  Button,
  GridLegacy
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import CredentialIssuer from '../components/credentials/CredentialIssuer';
import CredentialCard from '../components/credentials/CredentialCard';
import { Credential } from '../types';

// Sample credentials for demonstration
const sampleCredentials: Credential[] = [
  {
    id: 'cred-1',
    issuerDid: 'did:cheqd:mainnet:5678',
    subjectDid: 'did:cheqd:mainnet:8765',
    type: 'moderation',
    attributes: {
      name: 'John Smith',
      role: 'Admin',
      permissions: ['ban', 'mute', 'warn']
    },
    issuanceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    expirationDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cred-2',
    issuerDid: 'did:cheqd:mainnet:1234',
    subjectDid: 'did:cheqd:mainnet:4321',
    type: 'consent',
    attributes: {
      name: 'Jane Doe',
      role: 'Verifier',
      permissions: ['verify']
    },
    issuanceDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    expirationDate: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000).toISOString()
  }
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`credentials-tabpanel-${index}`}
      aria-labelledby={`credentials-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Credentials: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCredentialClick = (credential: Credential) => {
    setSelectedCredential(credential);
  };

  const handleIssueCredential = () => {
    setTabValue(1);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Credentials
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleIssueCredential}
          >
            Issue New Credential
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your verifiable credentials for Telegram moderation.
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="credential tabs"
          >
            <Tab label="My Credentials" id="credentials-tab-0" />
            <Tab label="Issue Credential" id="credentials-tab-1" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {selectedCredential ? (
            <Box>
              <Button 
                variant="outlined" 
                onClick={() => setSelectedCredential(null)}
                sx={{ mb: 2 }}
              >
                Back to All Credentials
              </Button>
              
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Credential Details
                </Typography>
                
                <GridLegacy container spacing={2}>
                  <GridLegacy item xs={12} sm={6}>
                    <Typography variant="subtitle2">ID:</Typography>
                    <Typography variant="body1" paragraph>{selectedCredential.id}</Typography>
                  </GridLegacy>
                  
                  <GridLegacy item xs={12} sm={6}>
                    <Typography variant="subtitle2">Type:</Typography>
                    <Typography variant="body1" paragraph>{selectedCredential.type}</Typography>
                  </GridLegacy>
                  
                  <GridLegacy item xs={12}>
                    <Typography variant="subtitle2">Issuer DID:</Typography>
                    <Typography variant="body1" paragraph>{selectedCredential.issuerDid}</Typography>
                  </GridLegacy>
                  
                  <GridLegacy item xs={12}>
                    <Typography variant="subtitle2">Subject DID:</Typography>
                    <Typography variant="body1" paragraph>{selectedCredential.subjectDid}</Typography>
                  </GridLegacy>
                  
                  <GridLegacy item xs={12} sm={6}>
                    <Typography variant="subtitle2">Issuance Date:</Typography>
                    <Typography variant="body1" paragraph>{new Date(selectedCredential.issuanceDate).toLocaleDateString()}</Typography>
                  </GridLegacy>
                  
                  <GridLegacy item xs={12} sm={6}>
                    <Typography variant="subtitle2">Expiration Date:</Typography>
                    <Typography variant="body1" paragraph>
                      {selectedCredential.expirationDate ? new Date(selectedCredential.expirationDate).toLocaleDateString() : 'No expiration'}
                    </Typography>
                  </GridLegacy>
                  
                  <GridLegacy item xs={12}>
                    <Typography variant="subtitle2">Attributes:</Typography>
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mt: 1 }}>
                      <pre>
                        {JSON.stringify(selectedCredential.attributes, null, 2)}
                      </pre>
                    </Box>
                  </GridLegacy>
                </GridLegacy>
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button variant="outlined" color="primary">
                    Verify Credential
                  </Button>
                  <Button variant="outlined" color="error">
                    Revoke Credential
                  </Button>
                </Box>
              </Paper>
            </Box>
          ) : (
            <>
              {sampleCredentials.length > 0 ? (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>Your Credentials</Typography>
                  {sampleCredentials.map((credential) => (
                    <CredentialCard 
                      key={credential.id} 
                      credential={credential}
                      onClick={handleCredentialClick}
                    />
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography variant="h6" color="text.secondary" paragraph>
                    You don't have any credentials yet
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleIssueCredential}
                  >
                    Issue Your First Credential
                  </Button>
                </Box>
              )}
            </>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <CredentialIssuer api="http://localhost:8000" />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Credentials; 