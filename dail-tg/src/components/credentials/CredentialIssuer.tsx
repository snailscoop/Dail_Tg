import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel,
  CircularProgress,
  GridLegacy,
  Alert,
  Divider
} from '@mui/material';
import { Formik, Form, FormikHelpers, FormikProps } from 'formik';
import * as Yup from 'yup';

interface CredentialIssuerProps {
  api: string;
}

interface CredentialFormValues {
  issuerDid: string;
  subjectDid: string;
  attributes: string;
  credentialType: string;
  credentialSchema?: string;
  expirationDate?: string;
  includeBitstringStatus: boolean;
  statusPurpose?: 'revocation' | 'suspension';
  statusListName?: string;
}

const CredentialIssuer: React.FC<CredentialIssuerProps> = ({ api }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'create-issuer' | 'create-subject' | 'issue'>('create-issuer');
  const [issuerDid, setIssuerDid] = useState('');
  const [subjectDid, setSubjectDid] = useState('');
  // Create a ref to store the Formik instance
  const formikRef = React.useRef<any>(null);

  const initialValues: CredentialFormValues = {
    issuerDid,
    subjectDid,
    attributes: JSON.stringify({
      name: 'John Doe',
      role: 'Moderator',
      permissions: ['ban', 'mute', 'warn']
    }, null, 2),
    credentialType: 'ModeratorCredential',
    credentialSchema: 'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld',
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    includeBitstringStatus: false,
    statusPurpose: 'revocation',
    statusListName: 'moderator-credentials'
  };

  const validationSchema = Yup.object({
    issuerDid: Yup.string().required('Issuer DID is required'),
    subjectDid: Yup.string().required('Subject DID is required'),
    attributes: Yup.string().required('Attributes are required')
      .test('is-valid-json', 'Must be valid JSON', (value) => {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          return false;
        }
      }),
    credentialType: Yup.string().required('Credential type is required'),
    credentialSchema: Yup.string().url('Must be a valid URL'),
    expirationDate: Yup.string().optional(),
    includeBitstringStatus: Yup.boolean(),
    statusPurpose: Yup.string().when('includeBitstringStatus', (includeBitstringStatus, schema) => {
      return includeBitstringStatus 
        ? schema.required('Status purpose is required when using status list')
        : schema;
    }),
    statusListName: Yup.string().when('includeBitstringStatus', (includeBitstringStatus, schema) => {
      return includeBitstringStatus 
        ? schema.required('Status list name is required when using status list')
        : schema;
    })
  });

  const createIssuerDid = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the API to create an issuer DID
      const response = await fetch(`${api}/create_issuer_did`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ network: 'testnet' })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        const didValue = data.data.id || data.data.did;
        console.log('Issuer DID created:', didValue);
        setIssuerDid(didValue);
        
        // Store in localStorage as a backup
        try {
          localStorage.setItem('issuerDid', didValue);
          console.log('Saved issuer DID to localStorage:', didValue);
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
        
        setStep('create-subject');
        setResult(data.data);
      } else {
        setError(data.message || 'Failed to create issuer DID');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Add debug useEffect to log the DIDs whenever they change
  useEffect(() => {
    console.log('DIDs updated:', { issuerDid, subjectDid });
    
    // If we're on the issue step, try to update the form values
    if (step === 'issue' && formikRef.current) {
      console.log('Updating form values with DIDs');
      if (issuerDid) {
        formikRef.current.setFieldValue('issuerDid', issuerDid);
      }
      if (subjectDid) {
        formikRef.current.setFieldValue('subjectDid', subjectDid);
      }
    }
  }, [issuerDid, subjectDid, step]);

  // Add a direct DOM manipulation effect for emergency backup
  useEffect(() => {
    if (step === 'issue' && (issuerDid || subjectDid)) {
      // Set a timeout to give React time to render the form fields
      const timeoutId = setTimeout(() => {
        // Directly manipulate DOM as a last-resort backup
        if (issuerDid) {
          const issuerField = document.getElementById('issuerDid') as HTMLInputElement;
          if (issuerField && (!issuerField.value || issuerField.value.trim() === '')) {
            console.log('Direct DOM update for issuerDid');
            issuerField.value = issuerDid;
          }
        }
        
        if (subjectDid) {
          const subjectField = document.getElementById('subjectDid') as HTMLInputElement;
          if (subjectField && (!subjectField.value || subjectField.value.trim() === '')) {
            console.log('Direct DOM update for subjectDid');
            subjectField.value = subjectDid;
          }
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [step, issuerDid, subjectDid]);

  // Log when in the issue step
  useEffect(() => {
    if (step === 'issue') {
      console.log('In issue step with DIDs:', { issuerDid, subjectDid });
    }
  }, [step, issuerDid, subjectDid]);

  const createSubjectDid = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the API to create a subject DID
      const response = await fetch(`${api}/create_subject_did`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        const didValue = data.data.id || data.data.did;
        console.log('Subject DID created:', didValue);
        setSubjectDid(didValue);
        
        // Store in localStorage as a backup
        try {
          localStorage.setItem('subjectDid', didValue);
          console.log('Saved subject DID to localStorage:', didValue);
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
        
        setStep('issue');
        setResult(data.data);
      } else {
        setError(data.message || 'Failed to create subject DID');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Add a check on component mount to try to recover DIDs from localStorage
  useEffect(() => {
    // Try to restore from localStorage if we don't have DIDs yet
    if (!issuerDid) {
      const savedIssuerDid = localStorage.getItem('issuerDid');
      if (savedIssuerDid) {
        console.log('Restored issuer DID from localStorage:', savedIssuerDid);
        setIssuerDid(savedIssuerDid);
      }
    }
    
    if (!subjectDid) {
      const savedSubjectDid = localStorage.getItem('subjectDid');
      if (savedSubjectDid) {
        console.log('Restored subject DID from localStorage:', savedSubjectDid);
        setSubjectDid(savedSubjectDid);
      }
    }
  }, [issuerDid, subjectDid]);

  // When step changes to 'issue', inject the DIDs if needed
  useEffect(() => {
    if (step === 'issue') {
      // Direct DOM manipulation to ensure the subject DID field is populated
      setTimeout(() => {
        const subjectDidField = document.getElementById('subjectDid') as HTMLInputElement;
        if (subjectDidField && (!subjectDidField.value || subjectDidField.value === '')) {
          console.log('Directly injecting subject DID into field:', subjectDid);
          subjectDidField.value = subjectDid;
          
          // Create and dispatch an input event to notify React
          const event = new Event('input', { bubbles: true });
          subjectDidField.dispatchEvent(event);
          
          // Also try using the Formik ref
          if (formikRef.current) {
            formikRef.current.setFieldValue('subjectDid', subjectDid);
          }
        }
      }, 500);
    }
  }, [step, subjectDid]);

  const handleSubmit = async (
    values: CredentialFormValues,
    { setSubmitting }: FormikHelpers<CredentialFormValues>
  ) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      // Parse attributes from JSON string to object
      let parsedAttributes;
      try {
        parsedAttributes = JSON.parse(values.attributes);
      } catch (e) {
        throw new Error('Invalid JSON format for attributes');
      }
      
      // Prepare request payload
      const payload: any = {
        issuerDid: values.issuerDid,
        subjectDid: values.subjectDid,
        attributes: parsedAttributes,
        type: ['VerifiableCredential', values.credentialType],
        expirationDate: values.expirationDate
      };
      
      // Add schema if provided
      if (values.credentialSchema) {
        payload.credentialSchema = values.credentialSchema;
      }
      
      // Add status information if requested
      if (values.includeBitstringStatus) {
        payload.statusPurpose = values.statusPurpose;
        payload.statusListName = values.statusListName;
      }
      
      // Call the API to issue a credential
      const response = await fetch(`${api}/issue_credential`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setResult(data.data);
      } else {
        setError(data.message || 'Failed to issue credential');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'create-issuer':
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Step 1: Create an Issuer DID
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              First, we need to create a DID for the credential issuer on the Cheqd network.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={createIssuerDid}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Issuer DID'}
            </Button>
          </Box>
        );

      case 'create-subject':
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Step 2: Create a Subject DID
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Now, we need to create a DID for the credential subject (holder).
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Issuer DID:</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {issuerDid}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={createSubjectDid}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Subject DID'}
            </Button>
          </Box>
        );

      case 'issue':
        return (
          <Formik
            initialValues={{
              ...initialValues,
              issuerDid,
              subjectDid
            }}
            enableReinitialize={true}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            innerRef={formikRef}
          >
            {({ values, errors, touched, handleChange, handleBlur, isSubmitting, setFieldValue }: FormikProps<CredentialFormValues>) => {
              return (
                <Form>
                  <Typography variant="h6" gutterBottom>
                    Step 3: Issue a Credential
                  </Typography>
                  
                  <GridLegacy container spacing={2}>
                    <GridLegacy item xs={12}>
                      <TextField
                        fullWidth
                        id="issuerDid"
                        name="issuerDid"
                        label="Issuer DID"
                        value={values.issuerDid || issuerDid}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.issuerDid && Boolean(errors.issuerDid)}
                        helperText={touched.issuerDid && errors.issuerDid}
                        margin="normal"
                        InputProps={{ readOnly: true }}
                        sx={{ bgcolor: '#f5f5f5' }}
                      />
                    </GridLegacy>
                    
                    <GridLegacy item xs={12}>
                      <TextField
                        fullWidth
                        id="subjectDid"
                        name="subjectDid"
                        label="Subject DID"
                        value={values.subjectDid || subjectDid}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.subjectDid && Boolean(errors.subjectDid)}
                        helperText={touched.subjectDid && errors.subjectDid}
                        margin="normal"
                        InputProps={{ readOnly: true }}
                        sx={{ bgcolor: '#f5f5f5' }}
                      />
                    </GridLegacy>
                    
                    <GridLegacy item xs={12}>
                      <TextField
                        fullWidth
                        id="credentialType"
                        name="credentialType"
                        label="Credential Type"
                        value={values.credentialType}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.credentialType && Boolean(errors.credentialType)}
                        helperText={touched.credentialType && errors.credentialType}
                        margin="normal"
                        inputProps={{
                          style: { pointerEvents: 'auto' }
                        }}
                      />
                    </GridLegacy>
                    
                    <GridLegacy item xs={12}>
                      <TextField
                        fullWidth
                        id="credentialSchema"
                        name="credentialSchema"
                        label="Credential Schema URL (optional)"
                        value={values.credentialSchema}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.credentialSchema && Boolean(errors.credentialSchema)}
                        helperText={touched.credentialSchema && errors.credentialSchema}
                        margin="normal"
                        inputProps={{
                          style: { pointerEvents: 'auto' }
                        }}
                      />
                    </GridLegacy>
                    
                    <GridLegacy item xs={12}>
                      <TextField
                        fullWidth
                        id="expirationDate"
                        name="expirationDate"
                        label="Expiration Date (optional)"
                        value={values.expirationDate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.expirationDate && Boolean(errors.expirationDate)}
                        helperText={touched.expirationDate && errors.expirationDate}
                        margin="normal"
                        inputProps={{
                          style: { pointerEvents: 'auto' }
                        }}
                      />
                    </GridLegacy>
                    
                    <GridLegacy item xs={12}>
                      <TextField
                        fullWidth
                        id="attributes"
                        name="attributes"
                        label="Attributes (JSON)"
                        value={values.attributes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.attributes && Boolean(errors.attributes)}
                        helperText={touched.attributes && errors.attributes}
                        margin="normal"
                        multiline
                        minRows={5}
                        inputProps={{
                          style: { pointerEvents: 'auto' }
                        }}
                      />
                    </GridLegacy>
                    
                    <GridLegacy item xs={12}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="status-label">Include Status List</InputLabel>
                        <Select
                          labelId="status-label"
                          id="includeBitstringStatus"
                          name="includeBitstringStatus"
                          value={values.includeBitstringStatus}
                          label="Include Status List"
                          onChange={(e) => {
                            const value = e.target.value === 'true';
                            setFieldValue('includeBitstringStatus', value);
                          }}
                        >
                          <MenuItem value="false">No</MenuItem>
                          <MenuItem value="true">Yes</MenuItem>
                        </Select>
                      </FormControl>
                    </GridLegacy>
                    
                    {values.includeBitstringStatus && (
                      <>
                        <GridLegacy item xs={12} sm={6}>
                          <FormControl fullWidth margin="normal">
                            <InputLabel id="status-purpose-label">Status Purpose</InputLabel>
                            <Select
                              labelId="status-purpose-label"
                              id="statusPurpose"
                              name="statusPurpose"
                              value={values.statusPurpose}
                              label="Status Purpose"
                              onChange={handleChange}
                              error={touched.statusPurpose && Boolean(errors.statusPurpose)}
                            >
                              <MenuItem value="revocation">Revocation</MenuItem>
                              <MenuItem value="suspension">Suspension</MenuItem>
                            </Select>
                          </FormControl>
                        </GridLegacy>
                        
                        <GridLegacy item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            id="statusListName"
                            name="statusListName"
                            label="Status List Name"
                            value={values.statusListName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.statusListName && Boolean(errors.statusListName)}
                            helperText={touched.statusListName && errors.statusListName}
                            margin="normal"
                          />
                        </GridLegacy>
                      </>
                    )}
                  </GridLegacy>
                  
                  <Box sx={{ mt: 3, mb: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={isSubmitting || loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Issue Credential'}
                    </Button>
                  </Box>
                </Form>
              );
            }}
          </Formik>
        );
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        Issue Credential
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }} align="center">
        Issue a W3C Verifiable Credential signed by your Cheqd DID
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {result && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            {step === 'issue' ? 'Credential issued successfully!' : `${step === 'create-issuer' ? 'Issuer' : 'Subject'} DID created successfully!`}
          </Alert>
          <Typography variant="subtitle2" gutterBottom>
            {step === 'issue' ? 'Credential Data:' : `${step === 'create-issuer' ? 'Issuer' : 'Subject'} DID:`}
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: '#f5f5f5',
              borderRadius: 1,
              overflowX: 'auto',
              fontSize: '0.875rem',
              maxHeight: 300
            }}
          >
            {JSON.stringify(result, null, 2)}
          </Box>
        </Box>
      )}
      
      <Divider sx={{ my: 3 }} />
      
      {renderStep()}
    </Paper>
  );
};

export default CredentialIssuer; 