import React from 'react';
import { Button, CircularProgress, ButtonProps } from '@mui/material';

interface AppButtonProps extends ButtonProps {
  loading?: boolean;
  icon?: React.ReactNode;
}

const AppButton: React.FC<AppButtonProps> = ({
  children,
  loading = false,
  disabled,
  icon,
  startIcon,
  endIcon,
  ...props
}) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      startIcon={loading ? undefined : startIcon || icon}
      endIcon={loading ? undefined : endIcon}
    >
      {loading ? (
        <>
          <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default AppButton; 