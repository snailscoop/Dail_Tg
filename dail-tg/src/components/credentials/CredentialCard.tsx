import React from 'react';
import { Card, CardContent, CardHeader, Typography, Chip, Box, Divider } from '@mui/material';
import { Credential } from '../../types';
import { formatDate, truncateText, isCredentialExpired } from '../../utils';

interface CredentialCardProps {
  credential: Credential;
  onClick?: (credential: Credential) => void;
}

const CredentialCard: React.FC<CredentialCardProps> = ({ credential, onClick }) => {
  const { id, issuerDid, subjectDid, type, attributes, issuanceDate, expirationDate } = credential;
  const isExpired = isCredentialExpired(expirationDate);

  const handleClick = () => {
    if (onClick) {
      onClick(credential);
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'scale(1.02)' } : {}
      }}
      onClick={handleClick}
    >
      <CardHeader
        title={`${type.charAt(0).toUpperCase() + type.slice(1)} Credential`}
        subheader={`ID: ${truncateText(id, 10)}`}
        action={
          <Chip 
            label={isExpired ? 'Expired' : 'Valid'} 
            color={isExpired ? 'error' : 'success'} 
            size="small" 
          />
        }
      />
      <Divider />
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Issuer:</strong> {truncateText(issuerDid, 25)}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Subject:</strong> {truncateText(subjectDid, 25)}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Issued:</strong> {formatDate(issuanceDate)}
        </Typography>
        {expirationDate && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Expires:</strong> {formatDate(expirationDate)}
          </Typography>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Attributes:</Typography>
          <Box sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, mt: 1 }}>
            {Object.entries(attributes).map(([key, value]) => (
              <Typography key={key} variant="body2" sx={{ mb: 0.5 }}>
                <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </Typography>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CredentialCard; 