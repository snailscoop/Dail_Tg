import axios from 'axios';
import { 
  Credential, 
  ConsentRequest, 
  ConsentRecord, 
  Moderator, 
  LinkingCode, 
  ApiResponse 
} from '../types';

// API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Credential API
export const credentialApi = {
  issueCredential: async (
    issuerDid: string, 
    subjectDid: string, 
    attributes: Record<string, any>, 
    credentialType: string = 'moderation'
  ): Promise<ApiResponse<Credential>> => {
    try {
      const response = await api.post('/issue_credential', {
        issuerDid,
        subjectDid,
        attributes,
        type: ['VerifiableCredential', credentialType]
      });
      return { status: 'success', data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  verifyCredential: async (credential: Credential): Promise<ApiResponse<boolean>> => {
    try {
      const response = await api.post('/verify_credential', { credential });
      return { status: 'success', data: response.data.status === 'success' };
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Linking API
export const linkingApi = {
  generateLinkingCode: async (
    credential: Credential, 
    telegramId: string
  ): Promise<ApiResponse<LinkingCode>> => {
    try {
      const response = await api.post('/generate_linking_code', {
        credential,
        telegramId
      });
      return { status: 'success', data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  verifyLinkingCode: async (
    code: string, 
    telegramId: string
  ): Promise<ApiResponse<{ did: string }>> => {
    try {
      console.log(`Sending verification request with code: ${code}, telegram_id: ${telegramId}`);
      
      // Make sure the data is properly formatted
      const payload = {
        code: code.trim(),
        telegram_id: telegramId.trim()
      };
      
      console.log('Request payload:', payload);
      
      const response = await api.post('/verify_linking_code', payload);
      console.log('Verification response:', response.data);
      
      return { 
        status: 'success', 
        data: response.data.data 
      };
    } catch (error: any) {
      console.error('Verification error:', error);
      
      // More specific error handling
      let errorMessage = 'An error occurred while verifying the code';
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      return { 
        status: 'error', 
        message: errorMessage
      };
    }
  }
};

// Consent API
export const consentApi = {
  requestConsent: async (
    telegramId: string, 
    action: string
  ): Promise<ApiResponse<{ consent_id: string }>> => {
    try {
      const response = await api.post('/request_consent', {
        telegram_id: telegramId,
        action
      });
      return { status: 'success', data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  storeConsent: async (
    consentId: string, 
    userDid: string, 
    action: string, 
    approved: boolean
  ): Promise<ApiResponse<ConsentRecord>> => {
    try {
      const response = await api.post('/store_consent', {
        consent_id: consentId,
        user_did: userDid,
        action,
        approved
      });
      return { status: 'success', data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Gun utilities (for direct Gun DB access if needed)
export const gunApi = {
  fetchVerifiedModerators: async (): Promise<ApiResponse<Moderator[]>> => {
    try {
      const response = await api.get('/verified_moderators');
      return { status: 'success', data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  fetchPendingConsents: async (
    telegramId?: string
  ): Promise<ApiResponse<ConsentRequest[]>> => {
    try {
      // If telegramId is provided, filter by it, otherwise get all
      const endpoint = telegramId 
        ? `/consent_requests?telegram_id=${telegramId}&status=pending`
        : '/consent_requests?status=pending';
        
      const response = await api.get(endpoint);
      
      if (response.data && response.data.status === 'success') {
        return { 
          status: 'success', 
          data: response.data.data 
        };
      }
      
      return { 
        status: 'success', 
        data: [] 
      };
    } catch (error) {
      console.error('Error fetching pending consents:', error);
      return handleApiError(error);
    }
  }
};

// Error handler for API calls
function handleApiError(error: any): ApiResponse<never> {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.detail || error.message;
    return { 
      status: 'error', 
      message 
    };
  }
  return { 
    status: 'error', 
    message: 'An unexpected error occurred' 
  };
} 