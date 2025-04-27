import Gun from 'gun';
import { LinkingCode, Moderator, ConsentRequest } from '../types';

// Initialize Gun with peers
const gunPeers = process.env.REACT_APP_GUN_PEERS?.split(',') || ['http://localhost:8765/gun'];
const gun = Gun({ peers: gunPeers });

// Gun paths
const linking_codes = gun.get('linking_codes');
const verified_moderators = gun.get('verified_moderators');
const consent_requests = gun.get('consent_requests');

// Gun service
const gunService = {
  // Linking code methods
  getLinkingCode: (code: string): Promise<LinkingCode | null> => {
    return new Promise((resolve) => {
      linking_codes.get(code).once((data) => {
        if (data) {
          resolve({
            code,
            telegramId: data.telegram_id,
            did: data.did,
            createdAt: data.created_at,
            expiresAt: data.expires_at,
            used: data.used === 1
          });
        } else {
          resolve(null);
        }
      });
    });
  },

  // Moderator methods
  getVerifiedModerator: (telegramId: string): Promise<Moderator | null> => {
    return new Promise((resolve) => {
      verified_moderators.get(telegramId).once((data) => {
        if (data && data.is_active === 1) {
          try {
            const permissions = JSON.parse(data.permissions);
            resolve({
              telegramId,
              did: data.did,
              permissions: {
                ban: permissions.includes('ban'),
                mute: permissions.includes('mute'),
                warn: permissions.includes('warn'),
                kick: permissions.includes('kick')
              },
              issuanceDate: data.issuance_date,
              isActive: data.is_active === 1
            });
          } catch (error) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  },

  // Consent request methods
  getConsentRequests: (telegramId: string): Promise<ConsentRequest[]> => {
    return new Promise((resolve) => {
      const requests: ConsentRequest[] = [];
      consent_requests.map().once((data, id) => {
        if (data && data.telegram_id === telegramId && data.status === 'pending') {
          requests.push({
            id,
            telegramId: data.telegram_id,
            action: data.action,
            status: data.status,
            createdAt: data.created_at
          });
        }
      });
      
      // Gun's map() is asynchronous, so we need to wait a bit
      setTimeout(() => resolve(requests), 100);
    });
  },

  updateConsentStatus: (consentId: string, status: 'approved' | 'denied'): Promise<boolean> => {
    return new Promise((resolve) => {
      consent_requests.get(consentId).put({ status }, (ack: any) => {
        resolve(!ack.err);
      });
    });
  }
};

export default gunService; 