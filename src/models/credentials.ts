// Basic DID identity
export interface Identity {
  did: string;
  alias: string;
  provider: string;
  controllerKeyId: string;
}

// Moderator credential data
export interface ModeratorCredential {
  type: 'moderator';
  chatId: string;
  permissions: ModeratorPermissions;
  issuanceDate: string;
  expirationDate?: string;
}

// Consent record data
export interface ConsentRecord {
  id: string;
  issuer: string;
  subject: string;
  purpose: string;
  granted: boolean;
  timestamp: number;
  expiry: string | null;
}

// Moderator permissions
export interface ModeratorPermissions {
  canBan: boolean;
  canMute: boolean;
  canDelete: boolean;
  canDeleteMedia: boolean;
  canIssueWarnings: boolean;
  moderationScope: string[];
}

// Ban record
export interface BanRecord {
  id: string;
  targetUser: string;
  bannedBy: string;
  chatId: string;
  reason: string;
  evidence?: string[];
  timestamp: number;
  expirationDate?: string;
  consentIds: string[]; // References to consent records
}

// Credential reference stored in GunDB
export interface CredentialReference {
  id: string;
  issuer: string;
  subject: string;
  type: string[];
  timestamp: number;
  metadata: any;
} 