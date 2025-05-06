import React, { useEffect, useState, useRef } from 'react';
import * as yup from 'yup';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import Link from '../../components/Link';
import useYupValidationResolver from '../../hooks/YupValidationResolver';
import AuthService from '../../services/AuthService';
import useSnackbar from '../../hooks/Snackbar';

const validationSchema = yup.object({
  email: yup.string().email().required(),
  full_name: yup.string().required(),
  password: yup.string().required(),
  confirmPassword: yup
    .string()
    .required()
    .oneOf([yup.ref('password'), null], 'Kata sandi harus sama'),
});

function RegisterPage() {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const resolver = useYupValidationResolver(validationSchema);
  const { handleSubmit, control } = useForm({
    resolver,
    defaultValues: {
      email: '',
      full_name: '',
      password: '',
      confirmPassword: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const runningProcess = useRef(null);


  const handleClickShowPassword = (e) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };
  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const { confirmPassword: _, ...payload } = data;
      if (runningProcess.current) {
        showSnackbar({
          message: 'Proses sedang berjalan, silakan tunggu',
          severity: 'info',
        });
        return;
      }
      const abortController = new AbortController();
      runningProcess.current = abortController;
      const res = await AuthService.register(payload, abortController.signal);
      if (res.status === 200) {
        showSnackbar({
          message: 'Pendaftaran berhasil, silakan masuk',
          severity: 'success',
        });

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
          message: 'Pendaftaran gagal, silakan coba lagi',
          severity: 'error',
        });
      }
    } finally {
      if (runningProcess.current) {
        runningProcess.current = null;
      }
      setLoading(false)
    }
  };

  useEffect(() => {
    return () => {
      if (runningProcess.current) {
        runningProcess.current.abort();
        runningProcess.current = null;
      }
    };
  }, []);

  return (
    <Grid container>
      <Grid size={12}>
        <Stack sx={{ marginBlockEnd: 2 }}>
          <Typography variant="h6">Halo,</Typography>
          <Typography variant="h6">Silakan daftar terlebih dahulu</Typography>
        </Stack>
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            '& > :not(:last-child)': { marginBlockEnd: 2 },
            marginBlockEnd: 2,
          }}
        >
          <Controller
            name="email"
            control={control}
            render={({ field, formState: { errors } }) => (
              <TextField
                {...field}
                fullWidth
                color="primary"
                variant="outlined"
                label="Email"
                size="small"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
          <Controller
            name="full_name"
            control={control}
            render={({ field, formState: { errors } }) => (
              <TextField
                {...field}
                fullWidth
                color="primary"
                variant="outlined"
                label="Nama Lengkap"
                size="small"
                error={!!errors.full_name}
                helperText={errors.full_name?.message}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field, formState: { errors } }) => (
              <TextField
                {...field}
                fullWidth
                type={showPassword ? 'text' : 'password'}
                color="primary"
                variant="outlined"
                label="Kata Sandi"
                size="small"
                error={!!errors.password}
                helperText={errors.password?.message}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showPassword
                              ? 'hide the password'
                              : 'display the password'
                          }
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field, formState: { errors } }) => (
              <TextField
                {...field}
                fullWidth
                type={showPassword ? 'text' : 'password'}
                color="primary"
                variant="outlined"
                label="Konfirmasi Kata Sandi"
                size="small"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showPassword
                              ? 'hide the password'
                              : 'display the password'
                          }
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />
          <Button loading={loading} fullWidth variant="contained" type="submit" color="primary">
            Daftar
          </Button>
        </Box>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
            Sudah punya akun?&nbsp;
          </Typography>
          <Link to="/auth/login">Masuk</Link>
        </Box>
      </Grid>
    </Grid>
  );
}

export default RegisterPage;
