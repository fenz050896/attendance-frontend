import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from './hooks/SnackbarContext';

import AuthGuard from './components/AuthGuard';
import MainLayout from './pages/layouts/MainLayout';
import AuthLayout from './pages/layouts/AuthLayout';

import mainRoutes from './routes/main';
import authRoutes from './routes/auth';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#F3C623',
    },
    secondary: {
      main: '#132B4A',
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: mainRoutes,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: authRoutes,
  },
]);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SnackbarProvider>
          <CssBaseline />
          <RouterProvider router={router} />
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
