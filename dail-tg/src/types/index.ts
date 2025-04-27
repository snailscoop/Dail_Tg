// Credential types
export interface Credential {
  id: string;
  issuerDid: string;
  subjectDid: string;
  type: 'moderation' | 'consent';
  attributes: Record<string, any>;
  issuanceDate: string;
  expirationDate?: string;
}

// Enhanced types for Verida and ConsentChain
export interface VeridaCredentialRecord {
  recordId: string;
  credential: Credential;
  timestamp: string;
  schema: string;
}

export interface ConsentCredential extends Credential {
  consentId: string;
  action: string;
  approved: boolean;
  timestamp: string;
  requesterId: string;
  target?: string;
}

// Consent types
export interface ConsentRequest {
  id: string;
  telegramId: string;
  action: string;
  status: 'pending' | 'approved' | 'denied' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  approverDid?: string;
  metadata?: string;
}

export interface ConsentRecord {
  id: string;
  telegramId: string;
  userDid: string;
  action: string;
  approved: boolean;
  timestamp: string;
  credentialId?: string;
}

// DataTrust Vault types
export interface DataStorageConsent {
  consentUrl: string;
  userDid: string;
  requestingDid: string;
}

// Moderation types
export interface ModeratorPermission {
  ban: boolean;
  mute: boolean;
  warn: boolean;
  kick: boolean;
}

export interface Moderator {
  telegramId: string;
  did: string;
  permissions: ModeratorPermission;
  issuanceDate: string;
  isActive: boolean;
}

// Linking types
export interface LinkingCode {
  code: string;
  telegramId: string;
  did: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

// Verification result types
export interface VerificationResult {
  verified: boolean;
  credentialSubject?: Record<string, any>;
  error?: string;
}

// API response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
} 