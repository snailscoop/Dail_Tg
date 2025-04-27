import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  CardMedia,
  Button
} from '@mui/material';
import { 
  Link as LinkIcon,
  VerifiedUser as CredentialIcon,
  Gavel as ConsentIcon 
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, md: 4 }, 
          borderRadius: 2,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white',
          mb: 4
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              DataTrust Vault Telegram Moderation
            </Typography>
            <Typography variant="h6" paragraph>
              Secure, decentralized, and transparent moderation for Telegram groups with verifiable credentials and consent management.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                color="secondary" 
                size="large" 
                component={RouterLink}
                to="/link"
                startIcon={<LinkIcon />}
                sx={{ mr: 2, mb: { xs: 2, md: 0 } }}
              >
                Link Your Credential
              </Button>
              <Button 
                variant="outlined" 
                color="inherit" 
                size="large"
                component={RouterLink}
                to="/moderation"
                sx={{ borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                Start Moderating
              </Button>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box 
              component="img"
              src="https://cdn-icons-png.flaticon.com/512/2111/2111644.png"
              alt="Telegram Logo"
              sx={{ 
                width: '100%', 
                maxWidth: 200,
                display: 'block',
                mx: 'auto',
                filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))'
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 6, mb: 3 }}>
        How It Works
      </Typography>
      
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardMedia
              component="div"
              sx={{ 
                height: 140, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: '#e3f2fd' 
              }}
            >
              <CredentialIcon sx={{ fontSize: 60, color: '#1976d2' }} />
            </CardMedia>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography gutterBottom variant="h5" component="h3">
                Secure Credentials
              </Typography>
              <Typography>
                Moderators receive verifiable credentials through Cheqd, which they can link to their Telegram account using the /link command.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={RouterLink} to="/credentials">Learn More</Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardMedia
              component="div"
              sx={{ 
                height: 140, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: '#e8f5e9' 
              }}
            >
              <LinkIcon sx={{ fontSize: 60, color: '#388e3c' }} />
            </CardMedia>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography gutterBottom variant="h5" component="h3">
                Link Telegram
              </Typography>
              <Typography>
                Connect your credentials with your Telegram account using a secure linking code to enable moderation capabilities.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={RouterLink} to="/link">Link Now</Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardMedia
              component="div"
              sx={{ 
                height: 140, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: '#fff8e1' 
              }}
            >
              <ConsentIcon sx={{ fontSize: 60, color: '#f57c00' }} />
            </CardMedia>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography gutterBottom variant="h5" component="h3">
                ConsentChain
              </Typography>
              <Typography>
                All moderation actions require explicit consent, which is recorded on the ConsentChain for transparency and accountability.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={RouterLink} to="/consent">View Requests</Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 6, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Built with DataTrust Vault (Verida) and ConsentChain (Cheqd). Powered by decentralized Gun server.
        </Typography>
      </Box>
    </Container>
  );
};

export default Home; 