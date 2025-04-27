// Simple backend server for consent management
const express = require('express');
const cors = require('cors');
const Gun = require('gun');

// Initialize app and Gun
const app = express();
const port = 8000;

// Very permissive CORS for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

app.use(express.json());

// Initialize Gun with local peer
const gun = Gun({ peers: ['http://localhost:8765/gun'] });

// Gun collections
const consent_requests = gun.get('consent_requests');

// Basic hello endpoint
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Simple Consent Backend API is running' });
});

// Create a consent request
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

// Get pending consent requests
app.get('/consent_requests', (req, res) => {
  const { telegram_id, status } = req.query;
  
  const requestStatus = status || 'pending';
  const requests = [];
  
  // Process Gun data asynchronously
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

// Store a signed consent record
app.post('/store_consent', (req, res) => {
  const { consent_id, user_did, action, approved } = req.body;
  
  if (!consent_id || !action) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Consent ID and action are required' 
    });
  }
  
  console.log(`Storing consent record: ${consent_id}, action: ${action}, approved: ${approved}`);
  
  // Update the consent status in Gun
  consent_requests.get(consent_id).put({ 
    status: approved ? 'approved' : 'denied',
    updated_at: new Date().toISOString()
  });
  
  res.json({ 
    status: 'success', 
    data: { 
      id: consent_id,
      userDid: user_did || 'anonymous',
      action,
      approved,
      timestamp: new Date().toISOString()
    },
    message: 'Consent stored successfully'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Simple backend server running on http://localhost:${port}`);
  console.log('Press Ctrl+C to exit.');
}); 