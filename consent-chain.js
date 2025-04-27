// ConsentChain implementation using Cheqd for consent credentials
const axios = require('axios');
const dotenv = require('dotenv');
const Gun = require('gun');
const veridaClient = require('./verida-client');

dotenv.config({ path: './backend.env' });

// Constants
const USE_MOCK = process.env.USE_MOCK === 'true' || false;
const CHEQD_API_KEY = process.env.CHEQD_API_KEY;
const ISSUER_DID_KEY = 'issuerDid';
const ISSUER_KEY_ID = 'issuerKeyId';

// Initialize Gun
const gun = Gun({ peers: ['http://localhost:8765/gun'] });
const consents = gun.get('consents');
const credentials = gun.get('credentials');

// Cheqd API client
const cheqdApi = axios.create({
  baseURL: 'https://studio-api.cheqd.net',
  headers: {
    'x-api-key': CHEQD_API_KEY,
    'Content-Type': 'application/json'
  }
});

class ConsentChain {
  constructor() {
    this.issuerDid = null;
    this.issuerKeyId = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing ConsentChain...');
      
      // Check if we have an issuer DID stored
      await new Promise(resolve => {
        gun.get('credentials').get(ISSUER_DID_KEY).once(async (did) => {
          if (did) {
            this.issuerDid = did;
            console.log(`Using stored issuer DID: ${did}`);
            gun.get('credentials').get(ISSUER_KEY_ID).once((keyId) => {
              if (keyId) {
                this.issuerKeyId = keyId;
                console.log(`Using stored issuer key ID: ${keyId}`);
              }
              resolve();
            });
          } else {
            resolve();
          }
        });
      });

      // If we don't have a stored DID, create one
      if (!this.issuerDid) {
        if (USE_MOCK) {
          this.issuerDid = `did:cheqd:testnet:${Date.now().toString(36)}`;
          this.issuerKeyId = `key-${Date.now().toString(36)}`;
          
          // Store mock DID
          gun.get('credentials').get(ISSUER_DID_KEY).put(this.issuerDid);
          gun.get('credentials').get(ISSUER_KEY_ID).put(this.issuerKeyId);
          
          console.log(`Created mock issuer DID: ${this.issuerDid}`);
        } else {
          // Create a real Cheqd DID
          const response = await cheqdApi.post('/did/create', { network: 'testnet' });
          this.issuerDid = response.data.did;
          this.issuerKeyId = response.data.verificationMethod.id;
          
          // Store the new DID
          gun.get('credentials').get(ISSUER_DID_KEY).put(this.issuerDid);
          gun.get('credentials').get(ISSUER_KEY_ID).put(this.issuerKeyId);
          
          console.log(`Created new issuer DID: ${this.issuerDid}`);
        }
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing ConsentChain:', error);
      return false;
    }
  }

  // Create a consent request
  async createConsentRequest(requesterId, requestType, metadata = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Generate consent ID
      const consentId = `consent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const timestamp = new Date().toISOString();

      // Create the consent request object
      const consentRequest = {
        id: consentId,
        requesterId,
        requestType,
        metadata: JSON.stringify(metadata),
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp
      };

      // Store in Gun DB
      consents.get(consentId).put(consentRequest);
      console.log(`Stored consent request ${consentId} in Gun DB`);

      return consentId;
    } catch (error) {
      console.error('Error creating consent request:', error);
      throw new Error(`Failed to create consent request: ${error.message}`);
    }
  }

  // Get a consent request by ID
  async getConsentRequest(consentId) {
    return new Promise((resolve, reject) => {
      consents.get(consentId).once((data) => {
        if (data) {
          resolve(data);
        } else {
          reject(new Error(`Consent request ${consentId} not found`));
        }
      });
    });
  }

  // Update a consent request status
  async updateConsentStatus(consentId, status, approverDid = null) {
    try {
      // Get the current consent data
      const consentData = await this.getConsentRequest(consentId);
      
      // Update the consent status
      const updatedConsent = {
        ...consentData,
        status,
        updatedAt: new Date().toISOString()
      };
      
      if (approverDid) {
        updatedConsent.approverDid = approverDid;
      }
      
      // Store the updated consent
      consents.get(consentId).put(updatedConsent);
      console.log(`Updated consent ${consentId} status to ${status}`);
      
      return updatedConsent;
    } catch (error) {
      console.error(`Error updating consent ${consentId} status:`, error);
      throw error;
    }
  }

  // Issue a consent credential using Cheqd
  async issueConsentCredential(consentId, userDid, approved = true) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Get the consent request
      const consentData = await this.getConsentRequest(consentId);
      if (!consentData) {
        throw new Error(`Consent request ${consentId} not found`);
      }

      // Parse metadata
      let metadata = {};
      try {
        metadata = JSON.parse(consentData.metadata);
      } catch (e) {
        console.warn(`Could not parse metadata for consent ${consentId}, using empty object`);
      }

      // Prepare credential subject data
      const subjectData = {
        id: userDid,
        consentId,
        action: consentData.requestType,
        approved,
        timestamp: new Date().toISOString(),
        requesterId: consentData.requesterId,
        ...metadata
      };

      let credential;
      
      if (USE_MOCK) {
        // Create a mock credential
        credential = {
          "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://www.w3.org/2018/credentials/examples/v1"
          ],
          "id": `urn:uuid:${Date.now()}`,
          "type": ["VerifiableCredential", "ConsentCredential"],
          "issuer": this.issuerDid,
          "issuanceDate": new Date().toISOString(),
          "credentialSubject": subjectData
        };
        
        console.log('Generated mock consent credential');
      } else {
        // Issue a real credential through Cheqd
        const payload = {
          issuerDid: this.issuerDid,
          verificationMethodId: this.issuerKeyId,
          subjectDid: userDid,
          type: ["VerifiableCredential", "ConsentCredential"],
          attributes: subjectData
        };
        
        const response = await cheqdApi.post('/credential/issue', payload);
        credential = response.data.credential;
        console.log('Issued consent credential through Cheqd');
      }

      // Store the credential in Verida DataTrust Vault
      const storedCredential = await veridaClient.storeCredential(credential);
      
      if (!storedCredential.success) {
        console.warn(`Warning: Failed to store credential in Verida: ${storedCredential.error}`);
      }

      // Update the consent request
      await this.updateConsentStatus(consentId, approved ? 'approved' : 'rejected', userDid);

      return {
        consentId,
        credential,
        storedInVerida: storedCredential.success,
        recordId: storedCredential.recordId
      };
    } catch (error) {
      console.error('Error issuing consent credential:', error);
      throw new Error(`Failed to issue consent credential: ${error.message}`);
    }
  }

  // Verify a consent credential
  async verifyConsentCredential(credential) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      if (USE_MOCK) {
        // Mock verification
        console.log('Mock verifying consent credential');
        return {
          verified: true,
          credentialSubject: credential.credentialSubject || {}
        };
      } else {
        // Real verification through Cheqd
        const response = await cheqdApi.post('/credential/verify', { credential });
        console.log('Verified consent credential through Cheqd');
        
        // Parse the credential to get the subject
        let credentialData;
        if (typeof credential === 'string') {
          // JWT format
          const parts = credential.split('.');
          if (parts.length === 3) {
            try {
              credentialData = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            } catch (e) {
              console.warn('Could not parse JWT credential payload');
            }
          }
        } else {
          // JSON format
          credentialData = credential;
        }
        
        return {
          verified: response.data.verified,
          credentialSubject: credentialData?.credentialSubject || {}
        };
      }
    } catch (error) {
      console.error('Error verifying consent credential:', error);
      return {
        verified: false,
        error: error.message
      };
    }
  }

  // Request consent for a moderation action
  async requestModerationConsent(requesterId, action, target) {
    try {
      // Create consent request
      const consentId = await this.createConsentRequest(requesterId, action, { target });
      
      return {
        consentId,
        requesterId,
        action,
        target,
        status: 'pending'
      };
    } catch (error) {
      console.error('Error requesting moderation consent:', error);
      throw error;
    }
  }

  // Record a moderation action with consent
  async recordModerationAction(consentId, moderatorDid, approved = true) {
    try {
      // Issue consent credential
      const result = await this.issueConsentCredential(consentId, moderatorDid, approved);
      
      // Prepare response
      return {
        consentId,
        moderatorDid,
        approved,
        recordedAt: new Date().toISOString(),
        credential: result.credential,
        veridaRecordId: result.recordId
      };
    } catch (error) {
      console.error('Error recording moderation action:', error);
      throw error;
    }
  }
}

// Export singleton instance
const consentChain = new ConsentChain();
module.exports = consentChain; 