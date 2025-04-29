const { createAgent } = require('@veramo/core');
const { DIDManager } = require('@veramo/did-manager');
const { KeyManager } = require('@veramo/key-manager');
const { KeyManagementSystem } = require('@veramo/kms-local');
const { CredentialPlugin } = require('@veramo/credential-w3c');
const { CheqdDIDProvider } = require('@cheqd/did-provider-cheqd');
const { DataStore } = require('@veramo/data-store');
const config = require('../config');

// Singleton agent instance
let agent = null;

/**
 * Create Veramo agent with cheqd provider
 * @returns {Promise<Object>} Veramo agent instance
 */
async function createVeramoAgent() {
  if (agent) return agent;

  try {
    // Check for required configuration
    if (!config.cheqd.mnemonic) {
      throw new Error('CHEQD_MNEMONIC is not set in environment variables. A mnemonic is required for Veramo to create DIDs.');
    }
    
    // Configure cheqd network options
    const cheqdNetworkOptions = {
      network: config.cheqd.network,
      rpcUrl: config.cheqd.rpcUrl,
      cosmosPayerMnemonic: config.cheqd.mnemonic,
    };

    console.log(`Initializing Veramo agent for ${config.cheqd.network} network`);
    console.log(`RPC URL: ${config.cheqd.rpcUrl}`);
    console.log(`Mnemonic available: ${!!config.cheqd.mnemonic}`);

    // Create agent with needed plugins
    agent = createAgent({
      plugins: [
        new KeyManager({
          store: new DataStore(),
          kms: {
            local: new KeyManagementSystem(),
          },
        }),
        new DIDManager({
          store: new DataStore(),
          defaultProvider: 'did:cheqd',
          providers: {
            'did:cheqd': new CheqdDIDProvider(cheqdNetworkOptions),
          },
        }),
        new CredentialPlugin(),
      ],
    });

    console.log('Veramo agent created successfully');
    return agent;
  } catch (error) {
    console.error('Error creating Veramo agent:', error);
    throw error;
  }
}

/**
 * Create a DID on cheqd
 * @param {string} alias - Alias for the DID
 * @returns {Promise<Object>} Created DID
 */
async function createCheqdDID(alias) {
  try {
    const veramoAgent = await createVeramoAgent();
    
    console.log(`Creating DID with alias: ${alias}`);
    const did = await veramoAgent.didManagerCreate({
      alias,
      provider: 'did:cheqd',
      options: {
        network: config.cheqd.network,
      },
    });
    
    console.log(`Created DID: ${did.did}`);
    return did;
  } catch (error) {
    console.error('Error creating cheqd DID:', error);
    throw error;
  }
}

/**
 * Issue a credential
 * @param {string} issuerDid - Issuer DID
 * @param {string} subjectDid - Subject DID
 * @param {Object} credentialData - Credential data
 * @returns {Promise<Object>} Issued credential
 */
async function issueCredential(issuerDid, subjectDid, credentialData) {
  try {
    const veramoAgent = await createVeramoAgent();
    
    console.log(`Issuing credential from ${issuerDid} to ${subjectDid}`);
    const credential = await veramoAgent.createVerifiableCredential({
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'ModeratorCredential'],
        issuer: { id: issuerDid },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: subjectDid,
          ...credentialData,
        },
      },
      proofFormat: 'jwt',
    });
    
    console.log('Credential issued successfully');
    return credential;
  } catch (error) {
    console.error('Error issuing credential:', error);
    throw error;
  }
}

/**
 * Verify a credential
 * @param {Object} credential - Credential to verify
 * @returns {Promise<Object>} Verification result
 */
async function verifyCredential(credential) {
  try {
    const veramoAgent = await createVeramoAgent();
    
    console.log('Verifying credential...');
    const result = await veramoAgent.verifyCredential({
      credential,
    });
    
    console.log(`Verification result: ${result.verified ? 'Success' : 'Failed'}`);
    return result;
  } catch (error) {
    console.error('Error verifying credential:', error);
    throw error;
  }
}

module.exports = {
  createVeramoAgent,
  createCheqdDID,
  issueCredential,
  verifyCredential,
}; 