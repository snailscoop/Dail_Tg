import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  IconButton, 
  Divider,
  useMediaQuery,
  useTheme,
  ListItemButton
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Home as HomeIcon, 
  VerifiedUser as CredentialIcon,
  SecurityUpdateGood as ModerationIcon,
  Gavel as ConsentIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

interface NavigationProps {
  isAuthenticated?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ isAuthenticated = false }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const navigationItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Link Credential', icon: <LinkIcon />, path: '/link' },
    { text: 'Credentials', icon: <CredentialIcon />, path: '/credentials' },
    { text: 'Moderation', icon: <ModerationIcon />, path: '/moderation' },
    { text: 'Consent Requests', icon: <ConsentIcon />, path: '/consent' },
    { text: 'DataTrust & Consent', icon: <ConsentIcon />, path: '/verida-consent' },
    { text: 'Hackathon Demo', icon: <CodeIcon />, path: '/demo' },
  ];

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          Dail TG Moderator
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Secure Moderation with DataTrust
        </Typography>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink} 
              to={item.path}
              selected={isActive(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/settings">
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dail TG Moderator
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              {navigationItems.map((item) => (
                <Button 
                  key={item.text} 
                  color="inherit" 
                  component={RouterLink} 
                  to={item.path}
                  sx={{ 
                    mx: 1,
                    fontWeight: isActive(item.path) ? 'bold' : 'normal',
                    borderBottom: isActive(item.path) ? '2px solid white' : 'none',
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navigation; 