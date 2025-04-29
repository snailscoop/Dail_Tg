/**
 * CHEQD Studio API Endpoint Discovery Tool
 * 
 * This script attempts to discover working endpoints by trying different path combinations
 */

// Load environment variables
require('./local-env');

const studioApi = require('./cheqd/api/studio');
const axios = studioApi.apiClient;

// List of potential endpoint patterns to try
const endpointPatterns = [
  // DID-related endpoints
  '/dids',
  '/dids/list',
  '/dids/create',
  '/dids/resolve',
  '/v1/dids',
  '/v1/dids/list',
  '/v1/dids/create',
  '/v1/dids/resolve',
  
  // Credential-related endpoints
  '/credentials',
  '/credentials/list',
  '/credentials/create',
  '/credentials/verify',
  '/v1/credentials',
  '/v1/credentials/list',
  '/v1/credentials/create',
  '/v1/credentials/verify',
  
  // Presentation-related endpoints
  '/presentations',
  '/presentations/create',
  '/presentations/verify',
  '/v1/presentations',
  '/v1/presentations/create',
  '/v1/presentations/verify',
  
  // Misc endpoints to try
  '/schema',
  '/schema/list',
  '/v1/schema',
  '/v1/schema/list',
];

async function testEndpoint(method, path) {
  try {
    console.log(`\nTesting ${method.toUpperCase()} ${path}`);
    
    let response;
    if (method === 'get') {
      response = await axios.get(path);
    } else if (method === 'post') {
      // For POST requests, we'll just send an empty object
      response = await axios.post(path, {});
    }
    
    console.log('  Status:', response.status, response.statusText);
    
    if (response.data) {
      // Format the response data
      const dataString = typeof response.data === 'object' 
        ? JSON.stringify(response.data, null, 2).substring(0, 500) 
        : response.data.toString().substring(0, 500);
        
      console.log('  Data:', dataString);
      
      // Highlight if we found a working endpoint
      if (typeof response.data === 'object' && Object.keys(response.data).length > 0) {
        console.log('  ✅ Found working endpoint!');
      }
    }
    
    return true;
  } catch (error) {
    // We only want to show details for "interesting" errors
    if (error.response && error.response.status !== 400) {
      console.log(`  Status: ${error.response?.status || 'Unknown'}`);
      console.log(`  Error: ${error.message}`);
      
      if (error.response?.data) {
        const dataString = typeof error.response.data === 'object' 
          ? JSON.stringify(error.response.data, null, 2).substring(0, 200) 
          : error.response.data.toString().substring(0, 200);
          
        console.log(`  Data: ${dataString}`);
      }
    } else {
      // Just a simple dot for 400 errors to reduce output noise
      process.stdout.write('.');
    }
    
    return false;
  }
}

async function discoverEndpoints() {
  console.log('CHEQD Studio API Endpoint Discovery');
  console.log('----------------------------------');
  
  // First, verify we can still access the known working endpoint
  console.log('\nVerifying access to known working endpoint:');
  await testEndpoint('get', '/account');
  
  // Try GET requests on all potential endpoints
  console.log('\nTesting GET requests on potential endpoints:');
  for (const path of endpointPatterns) {
    await testEndpoint('get', path);
  }
  
  // Try POST requests on all potential endpoints
  console.log('\n\nTesting POST requests on potential endpoints:');
  for (const path of endpointPatterns) {
    await testEndpoint('post', path);
  }
  
  console.log('\n\nEndpoint discovery completed.');
}

// Run the discovery process
discoverEndpoints(); 