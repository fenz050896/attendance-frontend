import React, { useRef, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';

import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import MuiListItemButton from '@mui/material/ListItemButton';
import MuiListItemIcon from '@mui/material/ListItemIcon';
import MuiListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MuiAppBar from '@mui/material/AppBar';
import MuiDrawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import AccountCircle from '@mui/icons-material/AccountCircle';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import FaceIcon from '@mui/icons-material/Face';
import ListIcon from '@mui/icons-material/List';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';

import useBoundStore from '../../stores';
import useSnackbar from '../../hooks/Snackbar';
import AuthService from '../../services/AuthService';

const drawerWidth = 240;
const menus = [
  {
    title: 'Daftar Absensi',
    icon: <ListIcon />,
    path: '/',
  },
  {
    title: 'Registrasi Wajah',
    icon: <FaceIcon />,
    path: '/face-registration',
  },
  {
    title: 'Absensi',
    icon: <CenterFocusWeakIcon />,
    path: '/absence',
  },
];

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      },
    },
  ],
}));

const ListItemButton = ({ children, open, ...props }) => (
  <MuiListItemButton
    {...props}
    sx={[
      { minHeight: 48, paddingInline: 2.5 },
      open ? { justifyContent: 'initial' } : { justifyContent: 'center' },
    ]}
  >
    {children}
  </MuiListItemButton>
);

const ListItemIcon = ({ children, open, ...props }) => (
  <MuiListItemIcon
    {...props}
    sx={[
      { minWidth: 0, justifyContent: 'center' },
      open ? { marginInlineEnd: 3 } : { marginInlineEnd: 'auto' },
    ]}
  >
    {children}
  </MuiListItemIcon>
);

const ListItemText = ({ children, open, ...props }) => (
  <MuiListItemText
    {...props}
    primary={children}
    sx={[open ? { opacity: 1 } : { opacity: 0 }]}
  />
);

function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useBoundStore((state) => state.user);
  const setUser = useBoundStore((state) => state.setUser);
  const setToken = useBoundStore((state) => state.setToken);
  const setContextOpened = useBoundStore((state) => state.setContextOpened);
  const setHasRegisteredFaces = useBoundStore((state) => state.setHasRegisteredFaces);
  const { showSnackbar } = useSnackbar();

  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const runningProcess = useRef(null);

  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleLogout = async () => {
    try {
      if (runningProcess.current) {
        return;
      }
      const abortController = new AbortController();
      runningProcess.current = abortController;
      const res = await AuthService.logout(abortController.signal);
      if (res.status === 200) {
        setUser(null);
        setToken(null);
        setContextOpened(false);
        setHasRegisteredFaces(false);
        useBoundStore.persist.clearStorage();
        navigate('/auth/login', { replace: true });
      } else {
        showSnackbar({
          message: res.data.message,
          severity: 'error',
        });
      }
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') {
        showSnackbar({
          message: 'Logout gagal, silakan coba lagi',
          severity: 'error',
        });
      }
    } finally {
      if (runningProcess.current) {
        runningProcess.current = null;
      }
    }
  };
  const handleProfileClick = () => {
    handleClose();
    navigate('/profile');
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[{ marginInlineEnd: 5 }, open && { display: 'none' }]}
          >
            <MenuIcon />
          </IconButton>
          {open && (
            <IconButton onClick={handleDrawerClose}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Box>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <SettingsIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              sx={{
                '& .MuiPaper-root': {
                  width: 200,
                },
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <Typography
                variant="body1"
                sx={{ textAlign: 'center', paddingBlockEnd: 1 }}
              >
                Halo {user?.full_name}!
              </Typography>
              <Divider />
              <MenuItem
                sx={{
                  background:
                    location.pathname === '/profile'
                      ? (theme) => theme.palette.secondary.main
                      : 'inherit',
                }}
                onClick={handleProfileClick}
              >
                <MuiListItemIcon>
                  <AccountCircle color="info" />
                </MuiListItemIcon>
                Profil
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <MuiListItemIcon>
                  <LogoutIcon color="error" />
                </MuiListItemIcon>
                Keluar
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <Typography variant="h6" noWrap component="div">
            Attendance App
          </Typography>
        </DrawerHeader>
        <Divider />
        <List>
          {menus.map((menu, index) => (
            <ListItem
              key={`menu-${index}`}
              component={NavLink}
              to={menu.path}
              disablePadding
              sx={{
                color: 'inherit',
                display: 'block',
                ':hover': {
                  background: (theme) => theme.palette.secondary.main,
                },
                '&.active': {
                  background: (theme) => theme.palette.secondary.main,
                },
              }}
            >
              <ListItemButton open={open}>
                <ListItemIcon open={open}>{menu.icon}</ListItemIcon>
                <ListItemText open={open}>{menu.title}</ListItemText>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        {children || <Outlet />}
      </Box>
    </Box>
  );
}

export default MainLayout;
