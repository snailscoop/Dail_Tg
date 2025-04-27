import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel,
  FormHelperText,
  Divider,
} from '@mui/material';
import { Formik, Form, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';
import { consentApi } from '../../services/api';
import { extractTelegramUsername } from '../../utils';

interface ModerationActionFormValues {
  telegramId: string;
  action: 'ban' | 'mute' | 'warn' | 'kick';
  reason: string;
  duration?: string;
}

interface ModerationActionsProps {
  moderatorTelegramId: string;
}

const ModerationActions: React.FC<ModerationActionsProps> = ({ moderatorTelegramId }) => {
  const [alert, setAlert] = useState<{ open: boolean, message: string, type: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    type: 'success'
  });

  const [consentId, setConsentId] = useState<string | null>(null);

  const initialValues: ModerationActionFormValues = {
    telegramId: '',
    action: 'warn',
    reason: '',
    duration: '',
  };

  const validationSchema = Yup.object({
    telegramId: Yup.string()
      .required('Target user is required'),
    action: Yup.string()
      .oneOf(['ban', 'mute', 'warn', 'kick'], 'Invalid action')
      .required('Action is required'),
    reason: Yup.string()
      .required('Reason is required')
      .min(5, 'Reason should be at least 5 characters'),
    duration: Yup.string()
      .when('action', {
        is: (action: string) => action === 'ban' || action === 'mute',
        then: (schema) => schema.required('Duration is required for ban/mute actions'),
        otherwise: (schema) => schema.optional(),
      }),
  });

  const handleSubmit = async (
    values: ModerationActionFormValues,
    { setSubmitting }: FormikHelpers<ModerationActionFormValues>
  ) => {
    try {
      // Format action string with details
      const actionString = `${values.action} ${values.telegramId} ${values.reason} ${values.duration || ''}`.trim();
      
      // Request consent for this action
      const response = await consentApi.requestConsent(
        moderatorTelegramId,
        actionString
      );
      
      if (response.status === 'success' && response.data) {
        setConsentId(response.data.consent_id);
        setAlert({
          open: true,
          message: 'Consent request sent. Please wait for approval or check Telegram for confirmation.',
          type: 'info'
        });
      } else {
        throw new Error(response.message || 'Failed to request consent');
      }
    } catch (error) {
      setAlert({
        open: true,
        message: error instanceof Error ? error.message : 'An error occurred while requesting consent',
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
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        Moderation Actions
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }} align="center">
        Request consent to perform moderation actions in your Telegram group
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
                id="telegramId"
                name="telegramId"
                label="Target User"
                value={values.telegramId}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.telegramId && Boolean(errors.telegramId)}
                helperText={touched.telegramId && errors.telegramId}
                placeholder="@username or user ID"
                variant="outlined"
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth error={touched.action && Boolean(errors.action)}>
                <InputLabel id="action-label">Action</InputLabel>
                <Select
                  labelId="action-label"
                  id="action"
                  name="action"
                  value={values.action}
                  label="Action"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <MenuItem value="warn">Warn</MenuItem>
                  <MenuItem value="mute">Mute</MenuItem>
                  <MenuItem value="kick">Kick</MenuItem>
                  <MenuItem value="ban">Ban</MenuItem>
                </Select>
                {touched.action && errors.action && (
                  <FormHelperText>{errors.action}</FormHelperText>
                )}
              </FormControl>
            </Box>
            
            {(values.action === 'ban' || values.action === 'mute') && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  id="duration"
                  name="duration"
                  label="Duration"
                  value={values.duration}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.duration && Boolean(errors.duration)}
                  helperText={
                    (touched.duration && errors.duration) ||
                    "Specify duration (e.g., '1h', '2d', '1w')"
                  }
                  placeholder="1h, 2d, 1w"
                  variant="outlined"
                />
              </Box>
            )}
            
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                id="reason"
                name="reason"
                label="Reason"
                value={values.reason}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.reason && Boolean(errors.reason)}
                helperText={touched.reason && errors.reason}
                placeholder="Explain the reason for this action"
                variant="outlined"
                multiline
                rows={3}
              />
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box>
              <AppButton
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                loading={isSubmitting}
              >
                Request Consent for Action
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

export default ModerationActions; 