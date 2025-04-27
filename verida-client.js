// Verida DataTrust Vault Client
const { VeridaClient } = require('@verida/client-ts');
const { NodeAccountSignerPrivateKey } = require('@verida/account-node');
const { WebVaultFactory } = require('@verida/account-web-vault');
const { DIDClient } = require('@verida/did-client');
const dotenv = require('dotenv');

dotenv.config({ path: './backend.env' });

// Context name for the application
const CONTEXT_NAME = 'Dail.Tg Moderation App';
const DEFAULT_NETWORK = 'testnet';
const SCHEMA_ID = 'https://schemas.verida.io/credential-schema/v0.1.0/schema.json';

class VeridaVaultClient {
  constructor() {
    this.client = null;
    this.did = null;
    this.context = null;
    this.datastore = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing Verida client...');
      
      // Get private key from environment
      const privateKey = process.env.VERIDA_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('VERIDA_PRIVATE_KEY not found in environment variables');
      }

      // Create account signer using private key
      const accountSigner = new NodeAccountSignerPrivateKey({
        privateKey,
        did: DIDClient.createDIDFromPrivateKey(privateKey)
      });

      // Create account
      this.client = new VeridaClient({
        network: DEFAULT_NETWORK,
        didClientConfig: {
          network: DEFAULT_NETWORK
        }
      });

      // Connect to Verida network
      await this.client.connect(accountSigner);
      
      // Get DID
      this.did = await this.client.getDid();
      console.log(`Connected with DID: ${this.did}`);

      // Open context
      this.context = await this.client.openContext(CONTEXT_NAME);
      console.log('Context opened successfully');
      
      // Open datastore for credentials
      this.datastore = await this.context.openDatastore('credentials');
      console.log('Credentials datastore opened successfully');
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing Verida client:', error);
      return false;
    }
  }

  // Store a credential in the DataTrust Vault
  async storeCredential(credential) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Create a timestamp for the record
      const timestamp = new Date().toISOString();
      
      // Prepare the record to store
      const record = {
        timestamp,
        credential,
        schema: SCHEMA_ID
      };
      
      // Save the record to the datastore
      const savedRecord = await this.datastore.save(record);
      console.log(`Credential stored with ID: ${savedRecord.id}`);
      
      return {
        success: true,
        recordId: savedRecord.id
      };
    } catch (error) {
      console.error('Error storing credential:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Retrieve a credential from the DataTrust Vault
  async getCredential(recordId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const record = await this.datastore.get(recordId);
      
      if (!record) {
        throw new Error(`Credential with ID ${recordId} not found`);
      }
      
      return {
        success: true,
        credential: record.credential
      };
    } catch (error) {
      console.error('Error retrieving credential:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Query credentials with filters
  async queryCredentials(filter = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const records = await this.datastore.query(filter);
      
      return {
        success: true,
        credentials: records
      };
    } catch (error) {
      console.error('Error querying credentials:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Request user consent for storing their data
  async requestDataStorageConsent(userDid) {
    try {
      // Create web vault client for consent UI
      const webVaultFactory = new WebVaultFactory();
      
      // Generate consent request data
      const consentRequest = {
        userDid,
        appName: CONTEXT_NAME,
        requestingDid: this.did,
        description: 'Allow Dail.Tg Moderation Bot to store your credentials securely in the Verida DataTrust Vault',
        permissions: ['credentials:readWrite'],
        callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:8000'}/consent-callback`
      };
      
      // Generate consent request URL
      const consentUrl = webVaultFactory.generateAuthRequestUrl(consentRequest);
      
      return {
        success: true,
        consentUrl,
        userDid,
        requestingDid: this.did
      };
    } catch (error) {
      console.error('Error generating consent request:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const veridaClientInstance = new VeridaVaultClient();
module.exports = veridaClientInstance; 