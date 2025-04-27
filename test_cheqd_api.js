// Test script for Backend API and Cheqd API
const axios = require('axios');

// Set the Cheqd API key (use the same key for both backend and direct API tests)
const CHEQD_API_KEY = 'caas_c40dc32af89e7550fcb8357c57968bf3daaaaeb59d766d73b01e776b80405bc17a0fbd40a9d318fd9b366040ec266c4c581acf4e6695b3822ee61fdeebec9193';

// Configure the Cheqd API client (direct API calls)
const cheqdApi = axios.create({
  baseURL: 'https://studio-api.cheqd.net',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': CHEQD_API_KEY
  }
});

// Backend server URL
const backendUrl = 'http://localhost:8000';
const backendApi = axios.create({
  baseURL: backendUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Test function to check API health
async function testApiHealth() {
  try {
    // Test the backend server health
    const response = await backendApi.get('/');
    console.log('Backend Health Check:', response.status, response.data);
    return true;
  } catch (error) {
    console.error('Backend Health Check Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

// Test direct connection to Cheqd API
async function testCheqdApiHealth() {
  try {
    // Check if Cheqd API is available
    console.log('Testing direct connection to Cheqd API...');
    const response = await cheqdApi.get('/health');
    console.log('Cheqd API Health Check:', response.status, response.data);
    return true;
  } catch (error) {
    console.error('Cheqd API Health Check Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers));
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Request details:', error.request._currentUrl);
    }
    return false;
  }
}

// Test function to create an issuer DID
async function testCreateIssuerDid() {
  try {
    const payload = {
      network: 'testnet'
    };
    
    console.log('Creating Issuer DID with payload:', payload);
    
    // First try direct Cheqd API
    try {
      console.log('Attempting direct Cheqd API call...');
      const cheqdResponse = await cheqdApi.post('/did/create', payload);
      console.log('Cheqd API Create Issuer DID Response:', cheqdResponse.status, cheqdResponse.data);
      return true;
    } catch (cheqdError) {
      console.log('Direct Cheqd API failed, falling back to backend server');
      console.error('Cheqd API Error:', cheqdError.message);
      if (cheqdError.response) {
        console.error('Status:', cheqdError.response.status);
        console.error('Headers:', JSON.stringify(cheqdError.response.headers));
        console.error('Data:', cheqdError.response.data);
      } else if (cheqdError.request) {
        console.error('No response received. Request details:', cheqdError.request._currentUrl);
      }
      
      // If direct API fails, use the backend
      const response = await backendApi.post('/create_issuer_did', payload);
      console.log('Create Issuer DID Response (via Backend):', response.status, response.data);
      return true;
    }
  } catch (error) {
    console.error('Create Issuer DID Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Test function to create a subject DID
async function testCreateSubjectDid() {
  try {
    console.log('Creating Subject DID');
    
    // First try direct Cheqd API
    try {
      console.log('Attempting direct Cheqd API call...');
      const cheqdResponse = await cheqdApi.post('/did/key/create', {});
      console.log('Cheqd API Create Subject DID Response:', cheqdResponse.status, cheqdResponse.data);
      return true;
    } catch (cheqdError) {
      console.log('Direct Cheqd API failed, falling back to backend server');
      console.error('Cheqd API Error:', cheqdError.message);
      if (cheqdError.response) {
        console.error('Status:', cheqdError.response.status);
        console.error('Headers:', JSON.stringify(cheqdError.response.headers));
        console.error('Data:', cheqdError.response.data);
      } else if (cheqdError.request) {
        console.error('No response received. Request details:', cheqdError.request._currentUrl);
      }
      
      // If direct API fails, use the backend
      const response = await backendApi.post('/create_subject_did', {});
      console.log('Create Subject DID Response (via Backend):', response.status, response.data);
      return true;
    }
  } catch (error) {
    console.error('Create Subject DID Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Test function to verify a credential
async function testVerifyCredential() {
  try {
    // This is a placeholder credential - in a real test you would use an actual credential
    const payload = {
      credential: "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDpjaGVxZDpuZXQ6dGVzdG5ldDoxMjM0NTY3ODkwIiwidHlwIjoiSldUIn0..."
    };
    
    console.log('Verifying credential with payload:', payload);
    
    // First try direct Cheqd API
    try {
      console.log('Attempting direct Cheqd API call...');
      const cheqdResponse = await cheqdApi.post('/credential/verify', payload);
      console.log('Cheqd API Verify Credential Response:', cheqdResponse.status, cheqdResponse.data);
      return true;
    } catch (cheqdError) {
      console.log('Direct Cheqd API failed, falling back to backend server');
      console.error('Cheqd API Error:', cheqdError.message);
      if (cheqdError.response) {
        console.error('Status:', cheqdError.response.status);
        console.error('Headers:', JSON.stringify(cheqdError.response.headers));
        console.error('Data:', cheqdError.response.data);
      } else if (cheqdError.request) {
        console.error('No response received. Request details:', cheqdError.request._currentUrl);
      }
      
      // If direct API fails, use the backend
      const response = await backendApi.post('/verify_credential', payload);
      console.log('Verify Credential Response (via Backend):', response.status, response.data);
      return true;
    }
  } catch (error) {
    console.error('Verify Credential Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('Starting API tests...');
  
  const healthCheck = await testApiHealth();
  console.log('Backend Health Check Result:', healthCheck ? 'Success' : 'Failed');
  
  const cheqdApiCheck = await testCheqdApiHealth();
  console.log('Cheqd API Health Check Result:', cheqdApiCheck ? 'Success' : 'Failed');
  console.log('----------------------------------------------------');
  
  if (healthCheck) {
    const issuerDidResult = await testCreateIssuerDid();
    console.log('Create Issuer DID Test Result:', issuerDidResult ? 'Success' : 'Failed');
    
    const subjectDidResult = await testCreateSubjectDid();
    console.log('Create Subject DID Test Result:', subjectDidResult ? 'Success' : 'Failed');
    
    const verifyCredentialResult = await testVerifyCredential();
    console.log('Verify Credential Test Result:', verifyCredentialResult ? 'Success' : 'Failed');
    
    console.log('Test Summary:');
    console.log('- Backend Health Check:', healthCheck ? 'Success' : 'Failed');
    console.log('- Cheqd API Health Check:', cheqdApiCheck ? 'Success' : 'Failed');
    console.log('- Create Issuer DID Test:', issuerDidResult ? 'Success' : 'Failed');
    console.log('- Create Subject DID Test:', subjectDidResult ? 'Success' : 'Failed');
    console.log('- Verify Credential Test:', verifyCredentialResult ? 'Success' : 'Failed');
  } else {
    console.log('Skipping other tests because backend health check failed.');
  }
}

// Execute the tests
runTests().catch(error => {
  console.error('Unexpected error during tests:', error);
}); 