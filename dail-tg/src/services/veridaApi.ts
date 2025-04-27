import axios from 'axios';
import { Credential, ApiResponse } from '../types';

// API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Verida DataTrust Vault API
export const veridaApi = {
  // Store a credential in the Verida DataTrust Vault
  storeCredential: async (credential: Credential): Promise<ApiResponse<{ recordId: string }>> => {
    try {
      const response = await api.post('/store_credential', { credential });
      return { 
        status: 'success', 
        data: response.data.data 
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Retrieve a credential from the Verida DataTrust Vault
  getCredential: async (recordId: string): Promise<ApiResponse<{ credential: Credential }>> => {
    try {
      const response = await api.get(`/get_credential/${recordId}`);
      return { 
        status: 'success', 
        data: response.data.data 
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Request user consent for data storage in Verida
  requestDataConsent: async (userDid: string): Promise<ApiResponse<{ consentUrl: string, userDid: string, requestingDid?: string }>> => {
    try {
      const response = await api.post('/request_data_consent', { userDid });
      return { 
        status: 'success', 
        data: response.data.data 
      };
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// ConsentChain API for handling consent-related operations
export const consentChainApi = {
  // Create a consent request for moderation actions
  requestConsent: async (
    requesterId: string, 
    requestType: string, 
    metadata: Record<string, any> = {}
  ): Promise<ApiResponse<{ consentId: string }>> => {
    try {
      const response = await api.post('/request_consent', {
        requesterId,
        requestType,
        metadata
      });
      return { 
        status: 'success', 
        data: { 
          consentId: response.data.data.consentId 
        } 
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get a consent request by ID
  getConsentRequest: async (consentId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get(`/consent/${consentId}`);
      return { 
        status: 'success', 
        data: response.data.data 
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Update a consent request status
  updateConsentStatus: async (
    consentId: string, 
    status: 'approved' | 'rejected' | 'pending', 
    approverDid?: string
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/update_consent', {
        consentId,
        status,
        approverDid
      });
      return { 
        status: 'success', 
        data: response.data.data 
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Record a moderation action with consent
  recordModeration: async (
    consentId: string, 
    moderatorDid: string, 
    approved: boolean = true
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/record_moderation', {
        consentId,
        moderatorDid,
        approved
      });
      return { 
        status: 'success', 
        data: response.data.data 
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Verify a credential
  verifyCredential: async (credential: Credential): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/verify_credential', { credential });
      return { 
        status: 'success', 
        data: {
          verified: response.data.verified,
          credentialSubject: response.data.data
        }
      };
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Error handler for API calls
function handleApiError(error: any): ApiResponse<never> {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message;
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