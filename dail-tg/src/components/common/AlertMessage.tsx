import React from 'react';
import { Alert, AlertTitle, Snackbar } from '@mui/material';

interface AlertMessageProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  open: boolean;
  onClose: () => void;
  title?: string;
  autoHideDuration?: number;
}

const AlertMessage: React.FC<AlertMessageProps> = ({
  message,
  type,
  open,
  onClose,
  title,
  autoHideDuration = 6000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        onClose={onClose} 
        severity={type} 
        variant="filled"
        sx={{ width: '100%' }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AlertMessage; 