import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import LoginPageImage from '../../assets/login_page_image.webp';
import useBoundStore from '../../stores';

function AuthLayout({ children }) {
  const navigate = useNavigate();
  const token = useBoundStore((state) => state.token);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useBoundStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    if (useBoundStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => unsub();
  }, []);

  useEffect(() => {
    if (hydrated && token) {
      navigate('/', { replace: true });
    }
  }, [hydrated, token]);

  if (hydrated && !token) {
    return (
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        sx={{ height: '100vh' }}
      >
        <Grid container size={{ xs: 12, md: 8 }}>
          <Card sx={{ width: '100%' }}>
            <CardContent sx={{ padding: 0, ':last-child': { padding: 0 } }}>
              <Grid container>
                <Grid size={6} sx={{ padding: 3, paddingInlineEnd: 5 }}>
                  <Grid
                    container
                    justifyContent="center"
                    alignItems="center"
                    sx={{ height: '20%' }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 'bold',
                        textAlign: 'center',
                      }}
                    >
                      Attendance App
                    </Typography>
                  </Grid>
                  <Grid
                    container
                    justifyContent="center"
                    alignItems="center"
                    sx={{ height: '70%' }}
                  >
                    {children || <Outlet />}
                  </Grid>
                </Grid>
                <Grid
                  container
                  size={6}
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    background: 'secondary.main',
                  }}
                >
                  <Box
                    component="img"
                    src={LoginPageImage}
                    sx={{ width: '100%' }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  } else {
    return <></>;
  }
}

export default AuthLayout;
