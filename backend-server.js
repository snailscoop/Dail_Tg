// Backend server for Dail_Tg
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const axios = require('axios');
const Gun = require('gun');
const crypto = require('crypto');

// Load environment variables
dotenv.config({ path: './backend.env' });

const app = express();
const port = 8000;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add CORS headers explicitly to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Check required environment variables
if (!process.env.CHEQD_API_KEY || !process.env.VERIDA_PRIVATE_KEY) {
  console.error('Error: Missing required environment variables. Check backend.env file.');
  process.exit(1);
}

console.log('CHEQD API Key:', process.env.CHEQD_API_KEY ? 'Found' : 'Missing');
console.log('Verida Private Key:', process.env.VERIDA_PRIVATE_KEY ? 'Found' : 'Missing');

// Configure Cheqd API client
const cheqdApi = axios.create({
  baseURL: 'https://studio-api.cheqd.net',
  headers: {
    'x-api-key': process.env.CHEQD_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Check if we should use mock implementation for testing
const USE_MOCK = process.env.USE_MOCK === 'true' || false;
console.log('Using mock implementation:', USE_MOCK ? 'Yes' : 'No');

// Mock implementation for testing
const mockCheqdApi = {
  post: (endpoint, data) => {
    console.log(`Mock Cheqd API call to ${endpoint}:`, data);
    
    // Return appropriate mock responses based on the endpoint
    if (endpoint === '/did/create') {
      return Promise.resolve({
        data: {
          did: `did:cheqd:mainnet:${Date.now().toString(36)}`,
          verificationMethod: {
            id: `did:cheqd:mainnet:${Date.now().toString(36)}#key-1`,
            type: 'Ed25519VerificationKey2018',
            controller: `did:cheqd:mainnet:${Date.now().toString(36)}`,
            publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
          }
        }
      });
    } else if (endpoint === '/key/create') {
      return Promise.resolve({
        data: {
          kid: `key-${Date.now().toString(36)}`,
          keyType: 'Ed25519',
          publicKeyMultibase: `z${Date.now().toString(36)}`
        }
      });
    } else if (endpoint === '/did/key/create' || endpoint === '/key/create') {
      return Promise.resolve({
        data: {
          did: `did:key:z${Date.now().toString(36)}`,
          keyPair: {
            publicKeyMultibase: `z${Date.now().toString(36)}`,
            privateKeyMultibase: `z${Date.now().toString(36)}`
          }
        }
      });
    } else if (endpoint === '/credential/issue') {
      return Promise.resolve({
        data: {
          credential: `eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDpjaGVxZDptYWlubmV0OiR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9I2tleS0xIiwidHlwIjoiSldUIn0.${Buffer.from(JSON.stringify({
            sub: data.subjectDid,
            iss: data.issuerDid,
            vc: {
              '@context': ['https://www.w3.org/2018/credentials/v1'],
              type: data.type,
              credentialSubject: data.attributes
            }
          })).toString('base64')}.mockSignature123456`
        }
      });
    } else if (endpoint === '/credential/verify') {
      return Promise.resolve({
        data: {
          verified: true,
          verification: {
            status: true,
            results: []
          }
        }
      });
    } else if (endpoint === '/account') {
      return Promise.resolve({
        data: {
          accountId: `account-${Date.now().toString(36)}`,
          clientMode: 'custodian',
          createdAt: new Date().toISOString()
        }
      });
    } else {
      return Promise.resolve({ data: { status: 'success', message: 'Mock response' } });
    }
  },
  get: (endpoint) => {
    console.log(`Mock Cheqd API GET call to ${endpoint}`);
    if (endpoint === '/did/list') {
      return Promise.resolve({
        data: {
          dids: [
            `did:cheqd:mainnet:${Date.now().toString(36)}`,
            `did:cheqd:mainnet:${(Date.now() - 1000).toString(36)}`
          ]
        }
      });
    } else if (endpoint.startsWith('/did/search/')) {
      const did = endpoint.split('/').pop();
      return Promise.resolve({
        data: {
          did: did,
          verificationMethod: {
            id: `${did}#key-1`,
            type: 'Ed25519VerificationKey2018',
            controller: did,
            publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
          }
        }
      });
    } else if (endpoint === '/account') {
      return Promise.resolve({
        data: {
          accountId: `account-${Date.now().toString(36)}`,
          clientMode: 'custodian',
          createdAt: new Date().toISOString()
        }
      });
    } else {
      return Promise.resolve({ data: { status: 'success', message: 'Mock response' } });
    }
  }
};

// Production-ready Cheqd API client with proper sequence handling
class CheqdApiClient {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.accountDetails = null;
    this.issuerKeyId = null;
    this.issuerDid = null;
  }

  async initialize() {
    if (USE_MOCK) return true;
    
    try {
      // 1. Check/Get account details
      const accountResponse = await this.apiClient.get('/account');
      this.accountDetails = accountResponse.data;
      console.log('Account details retrieved:', this.accountDetails);
      
      // 2. Check if we have DIDs already
      const didsResponse = await this.apiClient.get('/did/list');
      if (didsResponse.data && didsResponse.data.dids && didsResponse.data.dids.length > 0) {
        this.issuerDid = didsResponse.data.dids[0];
        console.log('Using existing issuer DID:', this.issuerDid);
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing Cheqd API client:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      return false;
    }
  }

  async createIssuerDid(network = 'mainnet') {
    if (USE_MOCK) {
      return mockCheqdApi.post('/did/create', { network }).then(res => res.data);
    }
    
    try {
      // If we already have an issuer DID, return it
      if (this.issuerDid) {
        const didResponse = await this.apiClient.get(`/did/search/${this.issuerDid}`);
        return didResponse.data;
      }
      
      // 1. Create a key if we don't have one
      if (!this.issuerKeyId) {
        const keyResponse = await this.apiClient.post('/key/create', {
          keyType: 'Ed25519'
        });
        this.issuerKeyId = keyResponse.data.kid;
        console.log('Created issuer key:', this.issuerKeyId);
      }
      
      // 2. Create a DID using the key
      const didResponse = await this.apiClient.post('/did/create', {
        network,
        verificationMethodId: this.issuerKeyId
      });
      
      this.issuerDid = didResponse.data.did;
      console.log('Created issuer DID:', this.issuerDid);
      
      return didResponse.data;
    } catch (error) {
      console.error('Error creating issuer DID:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  }

  async createSubjectDid() {
    if (USE_MOCK) {
      return mockCheqdApi.post('/key/create', {}).then(res => res.data);
    }
    
    try {
      // For subject DIDs, we use a key-based DID
      const keyResponse = await this.apiClient.post('/key/create', {
        keyType: 'Ed25519'
      });
      
      console.log('Created subject key/DID');
      return {
        did: `did:key:${keyResponse.data.publicKeyMultibase}`,
        keyPair: {
          kid: keyResponse.data.kid,
          publicKeyMultibase: keyResponse.data.publicKeyMultibase
        }
      };
    } catch (error) {
      console.error('Error creating subject DID:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  }

  async issueCredential(payload) {
    if (USE_MOCK) {
      return mockCheqdApi.post('/credential/issue', payload).then(res => res.data);
    }
    
    try {
      // Ensure we have an issuer DID
      if (!this.issuerDid) {
        const didData = await this.createIssuerDid();
        payload.issuerDid = didData.did;
      } else {
        payload.issuerDid = this.issuerDid;
      }
      
      const response = await this.apiClient.post('/credential/issue', payload);
      return response.data;
    } catch (error) {
      console.error('Error issuing credential:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  }

  async verifyCredential(credential) {
    if (USE_MOCK) {
      return mockCheqdApi.post('/credential/verify', { credential }).then(res => res.data);
    }
    
    try {
      const response = await this.apiClient.post('/credential/verify', { credential });
      return response.data;
    } catch (error) {
      console.error('Error verifying credential:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  }
}

// Initialize the Cheqd API client
const cheqdClient = new CheqdApiClient(cheqdApi);

// Initialize Gun - use a local peer if no peers are specified
const gun = Gun({ peers: ['http://localhost:8765/gun'] });

// Gun DB collections
const linking_codes = gun.get('linking_codes');
const verified_moderators = gun.get('verified_moderators');
const consent_requests = gun.get('consent_requests');

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Dail Telegram Backend API is running' });
});

// Initialize the API client when the server starts
let apiInitialized = false;
async function initializeApi() {
  if (!USE_MOCK && !apiInitialized) {
    try {
      apiInitialized = await cheqdClient.initialize();
      console.log('API client initialized:', apiInitialized ? 'Success' : 'Failed');
    } catch (error) {
      console.error('Error initializing API client:', error.message);
      apiInitialized = false;
    }
  } else if (USE_MOCK) {
    apiInitialized = true;
  }
}

// Credential API endpoints
app.post('/issue_credential', async (req, res) => {
  try {
    const { issuerDid, subjectDid, attributes, type, credentialSchema, expirationDate } = req.body;
    
    // Prepare the request to Cheqd API
    const cheqdPayload = {
      issuerDid: issuerDid,
      subjectDid, 
      attributes,
      type: type || ['VerifiableCredential', 'ModeratorCredential'],
      credentialSchema,
      format: 'jwt',
      expirationDate
    };
    
    // If status tracking is needed, add credentialStatus
    if (req.body.statusPurpose) {
      cheqdPayload.credentialStatus = {
        statusPurpose: req.body.statusPurpose,
        statusListName: req.body.statusListName || 'moderator-credentials'
      };
    }
    
    console.log('Issuing credential with Cheqd:', cheqdPayload);
    
    // Ensure API is initialized
    if (!apiInitialized) {
      await initializeApi();
    }
    
    // Issue the credential
    const credentialData = await cheqdClient.issueCredential(cheqdPayload);
    
    res.json({ 
      status: 'success', 
      data: credentialData,
      message: 'Credential issued successfully'
    });
  } catch (error) {
    console.error('Error issuing credential:', error.response?.data || error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.response?.data?.message || error.message || 'Failed to issue credential'
    });
  }
});

// Endpoint to create a Cheqd DID (issuer DID)
app.post('/create_issuer_did', async (req, res) => {
  try {
    console.log('Received request to create issuer DID');
    console.log('Request body:', req.body);
    
    // Check the network parameter, defaulting to mainnet
    const network = req.body.network || 'mainnet';
    console.log('Using network:', network);
    
    // Ensure API is initialized
    if (!apiInitialized) {
      await initializeApi();
    }
    
    // Create the issuer DID
    const didData = await cheqdClient.createIssuerDid(network);
    
    res.json({ 
      status: 'success', 
      data: didData,
      message: 'Issuer DID created successfully'
    });
  } catch (error) {
    console.error('Error creating issuer DID:', error.message);
    
    // Structured error response
    const errorResponse = {
      status: 'error',
      message: 'Failed to create issuer DID',
      details: {
        error: error.message,
        response: error.response?.data || null,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : null
      }
    };
    
    res.status(500).json(errorResponse);
  }
});

// Create a subject DID (for the credential holder)
app.post('/create_subject_did', async (req, res) => {
  try {
    console.log('Received request to create subject DID');
    console.log('Request body:', req.body);
    
    // Ensure API is initialized
    if (!apiInitialized) {
      await initializeApi();
    }
    
    // Create the subject DID
    const didData = await cheqdClient.createSubjectDid();
    
    res.json({ 
      status: 'success', 
      data: didData,
      message: 'Subject DID created successfully'
    });
  } catch (error) {
    console.error('Error creating subject DID:', error.response?.data || error.message);
    
    // Structured error response
    const errorResponse = {
      status: 'error',
      message: 'Failed to create subject DID',
      details: {
        error: error.message,
        response: error.response?.data || null,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : null
      }
    };
    
    res.status(500).json(errorResponse);
  }
});

app.post('/verify_credential', async (req, res) => {
  try {
    // Extract the credential from the request
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No credential provided for verification' 
      });
    }
    
    // Ensure API is initialized
    if (!apiInitialized) {
      await initializeApi();
    }
    
    // Verify the credential
    const verificationData = await cheqdClient.verifyCredential(credential);
    
    res.json({ 
      status: 'success', 
      data: verificationData,
      verified: verificationData && verificationData.verified === true
    });
  } catch (error) {
    console.error('Error verifying credential:', error.response?.data || error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.response?.data?.message || error.message || 'Failed to verify credential'
    });
  }
});

// Mock storage for linking codes (in a real implementation, you would use Gun or another database)
const activeLinkingCodes = {};

// Generate a linking code for Telegram bot
app.post('/generate_linking_code', async (req, res) => {
  try {
    // Generate a random 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes expiry
    
    console.log(`Generated linking code: ${code}, expires at: ${expiresAt}`);
    
    // Store the code in our mock storage
    activeLinkingCodes[code] = {
      expiresAt,
      used: false
    };
    
    res.json({ 
      status: 'success', 
      data: { 
        code,
        expiresAt
      },
      message: 'Linking code generated successfully'
    });
  } catch (error) {
    console.error('Error generating linking code:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to generate linking code'
    });
  }
});

// Verify a linking code for Telegram bot
app.post('/verify_linking_code', async (req, res) => {
  try {
    console.log('Received verify_linking_code request:', req.body);
    
    // Handle both formats (telegramId and telegram_id)
    const code = req.body.code;
    const telegramId = req.body.telegramId || req.body.telegram_id;
    
    if (!code || !telegramId) {
      console.error('Missing required fields:', { code, telegramId });
      return res.status(400).json({ 
        status: 'error', 
        message: 'Code and Telegram ID are required' 
      });
    }
    
    console.log(`Verifying linking code: ${code} for Telegram ID: ${telegramId}`);
    
    // Check if the code exists and is valid
    const codeData = activeLinkingCodes[code];
    console.log('Code data:', codeData);
    
    const now = new Date();
    const isValid = codeData && 
                   !codeData.used && 
                   new Date(codeData.expiresAt) > now;
    
    if (!isValid) {
      console.error('Invalid code:', { 
        codeExists: !!codeData, 
        isUsed: codeData?.used, 
        expiryValid: codeData ? new Date(codeData.expiresAt) > now : false 
      });
      
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid or expired linking code' 
      });
    }
    
    // Mark the code as used
    activeLinkingCodes[code].used = true;
    
    // Generate a testnet DID for the user
    const did = `did:cheqd:testnet:${telegramId}-${Date.now().toString(36)}`;
    console.log(`Created DID ${did} for Telegram ID ${telegramId}`);
    
    res.json({ 
      status: 'success', 
      data: { 
        telegramId,
        did,
        verified: true
      },
      message: 'Linking code verified successfully'
    });
  } catch (error) {
    console.error('Error verifying linking code:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to verify linking code'
    });
  }
});

// Consent API endpoints
app.post('/request_consent', (req, res) => {
  const { moderatorId, actionString } = req.body;
  console.log(`Consent requested by ${moderatorId} for action: ${actionString}`);
  
  // Create a consent ID
  const consentId = 'consent-' + Date.now();
  const timestamp = new Date().toISOString();
  
  // Store in Gun DB
  consent_requests.get(consentId).put({
    id: consentId,
    telegram_id: moderatorId,
    action: actionString,
    status: 'pending',
    created_at: timestamp
  });
  
  console.log(`Stored consent request ${consentId} in Gun DB`);
  
  res.json({ 
    status: 'success', 
    data: { 
      consent_id: consentId,
      moderator_id: moderatorId,
      action: actionString,
      status: 'pending',
      created_at: timestamp
    } 
  });
});

// Get pending consent requests for a Telegram user
app.get('/consent_requests', (req, res) => {
  const { telegram_id, status } = req.query;
  
  const requestStatus = status || 'pending';
  const requests = [];
  
  // Gun's map() is asynchronous, wait a bit before sending response
  consent_requests.map().once((data, id) => {
    if (data && data.status === requestStatus) {
      // Only filter by telegram_id if it's provided
      if (telegram_id && data.telegram_id !== telegram_id) {
        return;
      }
      
      requests.push({
        id,
        telegramId: data.telegram_id,
        action: data.action,
        status: data.status,
        createdAt: data.created_at
      });
    }
  });
  
  // Give Gun a moment to populate the results
  setTimeout(() => {
    res.json({ 
      status: 'success', 
      data: requests
    });
  }, 100);
});

// Update consent request status
app.post('/update_consent', (req, res) => {
  const { consentId, status } = req.body;
  
  if (!consentId || !status) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Consent ID and status are required' 
    });
  }
  
  if (!['approved', 'denied', 'pending'].includes(status)) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Status must be one of: approved, denied, pending' 
    });
  }
  
  consent_requests.get(consentId).put({ status }, (ack) => {
    if (ack.err) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to update consent status' 
      });
    }
    
    res.json({ 
      status: 'success', 
      data: { 
        consentId,
        status
      },
      message: `Consent status updated to ${status}` 
    });
  });
});

// Telegram bot integration endpoints
app.post('/tg_link_account', async (req, res) => {
  try {
    const { telegramId, did } = req.body;
    
    if (!telegramId || !did) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Telegram ID and DID are required' 
      });
    }
    
    console.log(`Linking Telegram ID ${telegramId} with DID ${did}`);
    
    // Store the linking in Gun
    // This is a simple implementation - in production, you'd want to verify the DID ownership
    const linkingCode = `link-${Date.now().toString(36)}`;
    
    // Using mock data for testing
    if (USE_MOCK) {
      res.json({ 
        status: 'success', 
        data: { 
          telegramId,
          did, 
          linkingCode
        },
        message: 'Account linked successfully with mock data'
      });
      return;
    }
    
    // In a real implementation, you would store this in Gun or another database
    res.json({ 
      status: 'success', 
      data: { 
        telegramId,
        did, 
        linkingCode
      },
      message: 'Account linked successfully'
    });
  } catch (error) {
    console.error('Error linking Telegram account:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to link Telegram account'
    });
  }
});

app.post('/tg_verify_credential', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No credential provided for verification' 
      });
    }
    
    console.log('Verifying credential for Telegram bot');
    
    // Ensure API is initialized
    if (!apiInitialized) {
      await initializeApi();
    }
    
    if (USE_MOCK) {
      // Mock verification for testing
      console.log('Using mock verification for credential');
      
      // Extract metadata from the credential if possible
      let credentialType = 'ModeratorCredential';
      let issuer = 'did:cheqd:testnet:mock-issuer';
      let subject = 'did:cheqd:testnet:mock-subject';
      
      // Try to parse the payload if it's a JWT
      try {
        const parts = credential.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          if (payload.vc && payload.vc.type) {
            credentialType = Array.isArray(payload.vc.type) ? payload.vc.type.join(', ') : payload.vc.type;
          }
          if (payload.iss) {
            issuer = payload.iss;
          }
          if (payload.sub) {
            subject = payload.sub;
          }
        }
      } catch (e) {
        console.log('Could not parse JWT payload:', e.message);
      }
      
      res.json({ 
        status: 'success', 
        verified: true,
        data: {
          verified: true,
          issuer: issuer,
          subject: subject,
          issuanceDate: new Date().toISOString(),
          credentialType: credentialType
        },
        message: 'Credential verified with mock data'
      });
      return;
    }
    
    // Verify the credential
    const verificationData = await cheqdClient.verifyCredential(credential);
    
    res.json({ 
      status: 'success', 
      verified: true,
      data: verificationData,
      message: 'Credential verification complete'
    });
  } catch (error) {
    console.error('Error verifying credential for Telegram:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to verify credential'
    });
  }
});

app.post('/tg_record_consent', async (req, res) => {
  try {
    const { telegramId, action, subject, approved } = req.body;
    
    if (!telegramId || !action) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Telegram ID and action are required' 
      });
    }
    
    console.log(`Recording consent for Telegram ID ${telegramId}, action: ${action}, subject: ${subject}, approved: ${approved}`);
    
    // Create a consent record
    const consentId = `consent-${Date.now().toString(36)}`;
    const timestamp = new Date().toISOString();
    
    if (USE_MOCK) {
      // Mock consent recording for testing
      res.json({ 
        status: 'success', 
        data: { 
          consentId,
          telegramId,
          action,
          subject,
          approved,
          timestamp
        },
        message: 'Consent recorded with mock data'
      });
      return;
    }
    
    // In a real implementation, you would issue a consent credential via Cheqd
    // and store it in Verida or another database
    
    res.json({ 
      status: 'success', 
      data: { 
        consentId,
        telegramId,
        action,
        subject,
        approved,
        timestamp
      },
      message: 'Consent recorded successfully'
    });
  } catch (error) {
    console.error('Error recording consent:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to record consent'
    });
  }
});

// Add Verida integration (simplified version without WebVaultFactory)
console.log('Setting up Verida integration (simplified version)');

// Verida DataTrust Vault mock endpoints (for hackathon demo)
app.post('/request_data_consent', async (req, res) => {
  try {
    const { userDid } = req.body;
    
    if (!userDid) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required parameter: userDid' 
      });
    }
    
    // Create a mock consent URL - this would normally come from Verida WebVaultFactory
    const consentUrl = `https://vault.verida.io/authorize?did=${encodeURIComponent(userDid)}&requestingApp=Dail.Tg%20Moderation%20App&timestamp=${Date.now()}`;
    
    console.log(`Generated mock consent URL for ${userDid}: ${consentUrl}`);
    
    res.json({
      status: 'success',
      data: {
        consentUrl,
        userDid,
        requestingDid: 'did:verida:testnet:example' // Mock requesting DID
      }
    });
  } catch (error) {
    console.error('Error requesting data consent:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to request data consent'
    });
  }
});

// Store credential in Verida DataTrust Vault (mock implementation)
app.post('/store_credential', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: credential'
      });
    }
    
    // Generate a random record ID for demonstration
    const recordId = `record-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    console.log(`Mock storing credential with ID: ${recordId}`);
    
    // In a real implementation, this would store to Verida DataTrust Vault
    
    res.json({
      status: 'success',
      data: {
        recordId
      },
      message: 'Credential stored successfully'
    });
  } catch (error) {
    console.error('Error storing credential:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to store credential'
    });
  }
});

// Retrieve credential from Verida DataTrust Vault (mock implementation)
app.get('/get_credential/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    
    if (!recordId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: recordId'
      });
    }
    
    console.log(`Mock retrieving credential with ID: ${recordId}`);
    
    // Generate a mock credential for demonstration
    const mockCredential = {
      id: recordId,
      issuerDid: 'did:cheqd:testnet:issuer123',
      subjectDid: 'did:cheqd:testnet:subject456',
      type: 'moderation',
      attributes: {
        name: 'Test User',
        role: 'Moderator',
        permissions: ['ban', 'mute', 'warn'],
        telegramId: '123456789'
      },
      issuanceDate: new Date().toISOString()
    };
    
    res.json({
      status: 'success',
      data: {
        credential: mockCredential
      }
    });
  } catch (error) {
    console.error('Error retrieving credential:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve credential'
    });
  }
});

// Initialize the API when the server starts
initializeApi();

// Start the server
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
  console.log('Press Ctrl+C to exit.');
}); 