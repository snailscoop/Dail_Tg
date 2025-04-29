import { createAgent, IDIDManager, IResolver, IKeyManager, IDataStore, ICredentialPlugin } from '@veramo/core';
import { DIDManager } from '@veramo/did-manager';
import { KeyManager } from '@veramo/key-manager';
import { KeyManagementSystem } from '@veramo/kms-local';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { Resolver } from 'did-resolver';
import { CheqdDIDProvider } from '@cheqd/did-provider-cheqd';
import { DataStore, DataStoreORM } from '@veramo/data-store';

// Config
import { ENV } from '../config/env.example';

// Customize this for your storage needs
const DATABASE_FILE = 'database.sqlite';

export const createVeramoAgent = async () => {
  // Configure cheqd network options
  const cheqdNetworkOptions = {
    network: ENV.CHEQD_NETWORK,
    rpcUrl: ENV.CHEQD_RPC_URL,
    cosmosPayerMnemonic: ENV.CHEQD_MNEMONIC,
  };

  // Create agent
  const agent = createAgent<IDIDManager & IKeyManager & IDataStore & ICredentialPlugin & IResolver>({
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
      new DataStore(),
      new DataStoreORM(),
      new DIDResolverPlugin({
        resolver: new Resolver({
          // Add resolvers as needed
        }),
      }),
    ],
  });

  return agent;
};

// Helper function to create a DID on cheqd
export const createCheqdDID = async (agent: IDIDManager, alias: string) => {
  try {
    const did = await agent.didManagerCreate({
      alias,
      provider: 'did:cheqd',
      options: {
        network: ENV.CHEQD_NETWORK,
      },
    });
    
    console.log(`Created DID: ${did.did}`);
    return did;
  } catch (error) {
    console.error('Error creating cheqd DID:', error);
    throw error;
  }
};

// Helper function to issue a credential
export const issueCredential = async (
  agent: ICredentialPlugin,
  issuerDid: string,
  subjectDid: string,
  credentialData: any
) => {
  try {
    const credential = await agent.createVerifiableCredential({
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
    
    return credential;
  } catch (error) {
    console.error('Error issuing credential:', error);
    throw error;
  }
}; 