import React, { useState } from 'react';
import { Box, TextField, Typography, Paper } from '@mui/material';
import { Formik, Form, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';
import { linkingApi } from '../../services/api';

interface LinkingCodeFormValues {
  code: string;
  telegramId: string;
}

interface LinkingCodeFormProps {
  onSuccess?: (telegramId: string, did: string) => void;
}

const LinkingCodeForm: React.FC<LinkingCodeFormProps> = ({ onSuccess }) => {
  const [alert, setAlert] = useState<{ open: boolean, message: string, type: 'success' | 'error' }>({
    open: false,
    message: '',
    type: 'success'
  });

  const initialValues: LinkingCodeFormValues = {
    code: '',
    telegramId: '',
  };

  const validationSchema = Yup.object({
    code: Yup.string()
      .required('Code is required')
      .min(6, 'Code should be at least 6 characters')
      .matches(/^[A-Z0-9]+$/, 'Code should only contain uppercase letters and numbers'),
    telegramId: Yup.string()
      .required('Telegram ID is required')
  });

  const handleSubmit = async (
    values: LinkingCodeFormValues,
    { setSubmitting }: FormikHelpers<LinkingCodeFormValues>
  ) => {
    try {
      console.log('Submitting linking code form with values:', values);
      
      // Trim inputs and normalize Telegram ID format
      const code = values.code.trim();
      // Remove @ prefix if present
      const telegramId = values.telegramId.trim().replace(/^@/, '');
      
      console.log('Processed values:', { code, telegramId });
      
      const response = await linkingApi.verifyLinkingCode(code, telegramId);
      console.log('Verification response:', response);
      
      if (response.status === 'success' && response.data) {
        setAlert({
          open: true,
          message: 'Successfully linked your Telegram ID with your credentials',
          type: 'success'
        });
        
        if (onSuccess) {
          onSuccess(telegramId, response.data.did);
        }
      } else {
        throw new Error(response.message || 'Failed to verify code');
      }
    } catch (error: any) {
      console.error('Link error:', error);
      
      // Provide a more specific error message if available
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'An error occurred while verifying the code';
      
      setAlert({
        open: true,
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        Link Telegram with Credential
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} align="center">
        Enter the linking code you received and your Telegram ID to link your account with your credential
      </Typography>
      
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
          <Form>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                id="code"
                name="code"
                label="Linking Code"
                value={values.code}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.code && Boolean(errors.code)}
                helperText={touched.code && errors.code}
                placeholder="Enter your linking code"
                variant="outlined"
                autoComplete="off"
              />
            </Box>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                id="telegramId"
                name="telegramId"
                label="Telegram ID"
                value={values.telegramId}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.telegramId && Boolean(errors.telegramId)}
                helperText={touched.telegramId && errors.telegramId}
                placeholder="Your Telegram ID or username"
                variant="outlined"
              />
            </Box>
            <Box>
              <AppButton
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                loading={isSubmitting}
              >
                Link Telegram ID
              </AppButton>
            </Box>
          </Form>
        )}
      </Formik>
      
      <AlertMessage
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={handleCloseAlert}
      />
    </Paper>
  );
};

export default LinkingCodeForm; 