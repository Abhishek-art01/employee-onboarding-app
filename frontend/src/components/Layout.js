/**
 * components/Layout.js — Shared top navbar + sidebar shell.
 */
import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
         Drawer, List, ListItem, ListItemIcon, ListItemText, Divider,
         useMediaQuery, useTheme, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuIcon             from '@mui/icons-material/Menu';
import DashboardIcon        from '@mui/icons-material/Dashboard';
import AssignmentIcon       from '@mui/icons-material/Assignment';
import FolderIcon           from '@mui/icons-material/Folder';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon           from '@mui/icons-material/Logout';
import { useAuth }          from '../App';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard',   path: '/dashboard',     icon: <DashboardIcon />,          roles: ['all'] },
  { label: 'Onboarding',  path: '/onboarding',    icon: <AssignmentIcon />,         roles: ['employee','manager'] },
  { label: 'Documents',   path: '/documents',     icon: <FolderIcon />,             roles: ['all'] },
  { label: 'HR Review',   path: '/admin/review',  icon: <AdminPanelSettingsIcon />, roles: ['hr_admin','hr_executive','super_admin'] },
];

export default function Layout({ children }) {
  const { user, logout }   = useAuth();
  const navigate           = useNavigate();
  const location           = useLocation();
  const theme              = useTheme();
  const isMobile           = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl,   setAnchorEl]   = useState(null);

  const visibleItems = navItems.filter(item =>
    item.roles.includes('all') || item.roles.includes(user?.role)
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ width: DRAWER_WIDTH, pt: 8 }}>
      <List>
        {visibleItems.map(item => (
          <ListItem key={item.path} button onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 2, mx: 1, mb: 0.5,
              bgcolor: location.pathname === item.path ? 'primary.main' : 'transparent',
              color  : location.pathname === item.path ? 'white' : 'inherit',
              '&:hover': { bgcolor: location.pathname === item.path ? 'primary.dark' : 'action.hover' },
            }}>
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 1 }} />
      <List>
        <ListItem button onClick={handleLogout} sx={{ borderRadius: 2, mx: 1, color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: theme.zIndex.drawer + 1, borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => setDrawerOpen(o => !o)} edge="start" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Employee Onboarding
          </Typography>
          <Tooltip title={`${user?.full_name} (${user?.role})`}>
            <IconButton onClick={e => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 34, height: 34, fontSize: 14 }}>
                {user?.full_name?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Box><Typography variant="body2" fontWeight={600}>{user?.full_name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography></Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <LogoutIcon sx={{ mr: 1, fontSize: 18 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer variant={isMobile ? 'temporary' : 'persistent'} open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ width: DRAWER_WIDTH, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, ml: drawerOpen && !isMobile ? `${DRAWER_WIDTH}px` : 0,
        transition: theme.transitions.create('margin', { easing: theme.transitions.easing.sharp, duration: 200 }) }}>
        {children}
      </Box>
    </Box>
  );
}
