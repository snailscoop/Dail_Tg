import Gun from 'gun';
import 'gun/sea';
import { ENV } from '../config/env.example';

// Initialize GunDB with peers
export const initGunDB = (isMasterNode = false) => {
  // Configuration for GunDB
  const gunConfig: any = {
    peers: ENV.GUNDB_PEERS,
    radisk: true,  // Persist data to disk
    file: 'gundb',  // Storage location
  };
  
  // Add web server for master node
  if (isMasterNode) {
    const server = require('http').createServer().listen(ENV.PORT);
    gunConfig.web = server;
    console.log(`GunDB master node running on port ${ENV.PORT}`);
  } else {
    // For bot peers, we want to optimize for local-first operations
    gunConfig.localStorage = false;  // Don't use browser localStorage
  }
  
  const gun = Gun(gunConfig);
  
  // Add some basic error handlers
  gun.on('error', (err: any) => {
    console.error('GunDB error:', err);
  });
  
  // Log connection status
  if (!isMasterNode) {
    ENV.GUNDB_PEERS.forEach(peer => {
      console.log(`GunDB attempting to connect to peer: ${peer}`);
    });
  }
  
  return gun;
};

// Initialize master node
export const initMasterNode = () => {
  return initGunDB(true);
};

// Initialize bot peer node
export const initBotNode = () => {
  return initGunDB(false);
};

// Store credential reference in GunDB
export const storeCredential = (
  gun: any,
  credentialId: string,
  issuerDid: string,
  subjectDid: string,
  metadata: any
) => {
  return new Promise((resolve, reject) => {
    const credentialRef = {
      id: credentialId,
      issuer: issuerDid,
      subject: subjectDid,
      type: metadata.type || [],
      timestamp: Date.now(),
      metadata,
    };
    
    // Store in local cache first for immediate access
    gun.get('credentials')
      .get(credentialId)
      .put(credentialRef, (ack: any) => {
        if (ack.err) {
          reject(ack.err);
        } else {
          // Also index by subject for faster lookup
          gun.get('credentials_by_subject')
            .get(subjectDid)
            .set(gun.get('credentials').get(credentialId));
            
          resolve(credentialRef);
        }
      });
  });
};

// Store consent record in GunDB
export const storeConsentRecord = (
  gun: any,
  consentId: string,
  issuerDid: string,
  subjectDid: string,
  purpose: string,
  expiryDate?: string
) => {
  return new Promise((resolve, reject) => {
    const consentRecord = {
      id: consentId,
      issuer: issuerDid,
      subject: subjectDid,
      purpose,
      granted: true,
      timestamp: Date.now(),
      expiry: expiryDate || null,
    };
    
    gun.get('consent')
      .get(consentId)
      .put(consentRecord, (ack: any) => {
        if (ack.err) {
          reject(ack.err);
        } else {
          // Also index by subject
          gun.get('consent_by_subject')
            .get(subjectDid)
            .set(gun.get('consent').get(consentId));
            
          resolve(consentRecord);
        }
      });
  });
};

// Get credential from GunDB
export const getCredential = (gun: any, credentialId: string) => {
  return new Promise((resolve, reject) => {
    gun.get('credentials')
      .get(credentialId)
      .once((data: any) => {
        if (data) {
          resolve(data);
        } else {
          reject(new Error('Credential not found'));
        }
      });
  });
};

// Check if user has valid moderator credential
export const hasModeratorCredential = (gun: any, userDid: string) => {
  return new Promise((resolve) => {
    const credentials: any[] = [];
    
    // Use the index for faster lookup
    gun.get('credentials_by_subject')
      .get(userDid)
      .map()
      .once((data: any, key: string) => {
        // Load the full credential data
        gun.get('credentials').get(key).once((credData: any) => {
          if (credData && 
              credData.metadata && 
              credData.metadata.type && 
              credData.metadata.type.includes('ModeratorCredential')) {
            credentials.push(credData);
          }
        });
      });
      
    // Wait a bit for Gun to process the query
    setTimeout(() => {
      resolve(credentials.length > 0);
    }, 1000);
  });
}; 