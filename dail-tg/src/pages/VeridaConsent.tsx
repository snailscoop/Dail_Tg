import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Alert
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import VeridaDataManager from '../components/verida/VeridaDataManager';
import ConsentManager from '../components/consent/ConsentManager';
import { Credential } from '../types';

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
      id={`verida-consent-tabpanel-${index}`}
      aria-labelledby={`verida-consent-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const VeridaConsent: React.FC = () => {
  const location = useLocation();
  const [tabValue, setTabValue] = useState<number>(0);
  const [userDid, setUserDid] = useState<string>('');
  const [telegramId, setTelegramId] = useState<string>('');
  const [inputsValid, setInputsValid] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<Credential | undefined>(undefined);

  // Effect to set the tab based on URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 1) {
        setTabValue(tabIndex);
      }
    }
  }, [location]);

  // Sample credential for demonstration
  const sampleCredential: Credential = {
    id: 'cred-' + Date.now(),
    issuerDid: 'did:cheqd:testnet:' + Date.now().toString(36),
    subjectDid: userDid || 'did:cheqd:testnet:sample',
    type: 'moderation',
    attributes: {
      name: 'Sample User',
      role: 'Moderator',
      permissions: ['ban', 'mute', 'warn'],
      telegramId: telegramId || '1234567890'
    },
    issuanceDate: new Date().toISOString()
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = () => {
    setInputsValid(!!userDid && !!telegramId);
  };

  const handleUserDidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserDid(e.target.value);
    handleInputChange();
  };

  const handleTelegramIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelegramId(e.target.value);
    handleInputChange();
  };

  const handleGenerateSampleCredential = () => {
    setSelectedCredential({
      ...sampleCredential,
      subjectDid: userDid || sampleCredential.subjectDid,
      attributes: {
        ...sampleCredential.attributes,
        telegramId: telegramId || sampleCredential.attributes.telegramId
      }
    });
  };

  const handleStorageSuccess = (recordId: string) => {
    // You can perform additional actions when storage is successful
    console.log('Credential stored with record ID:', recordId);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            DataTrust & Consent
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Manage your secure credentials with Verida DataTrust Vault and consent with ConsentChain
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* User Identification Form */}
        <Box sx={{ mb: 4, p: 3, bgcolor: '#f8f8f8', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Identity Information
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
            <TextField
              label="User DID"
              placeholder="did:cheqd:testnet:..."
              variant="outlined"
              fullWidth
              value={userDid}
              onChange={handleUserDidChange}
            />
            
            <TextField
              label="Telegram ID"
              placeholder="Your Telegram ID"
              variant="outlined"
              fullWidth
              value={telegramId}
              onChange={handleTelegramIdChange}
            />
          </Box>
          
          <Button
            variant="contained"
            onClick={handleGenerateSampleCredential}
            disabled={!inputsValid}
          >
            Generate Sample Credential
          </Button>
          
          {selectedCredential && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Sample credential generated for {selectedCredential.subjectDid}
            </Alert>
          )}
        </Box>

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="DataTrust and Consent tabs"
          >
            <Tab label="DataTrust Vault" id="verida-consent-tab-0" />
            <Tab label="ConsentChain" id="verida-consent-tab-1" />
          </Tabs>
        </Box>
        
        {/* DataTrust Vault Panel */}
        <TabPanel value={tabValue} index={0}>
          <VeridaDataManager 
            userDid={userDid} 
            credential={selectedCredential} 
            onStorageSuccess={handleStorageSuccess} 
          />
        </TabPanel>
        
        {/* ConsentChain Panel */}
        <TabPanel value={tabValue} index={1}>
          <ConsentManager 
            userDid={userDid} 
            telegramId={telegramId} 
          />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default VeridaConsent; 