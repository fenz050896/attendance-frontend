import React from 'react';
import * as yup from 'yup';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Link from '../../components/Link';
import useYupValidationResolver from '../../hooks/YupValidationResolver';

const validationSchema = yup.object({
  email: yup.string().email().required(),
});

function ForgotPasswordPage() {
  const resolver = useYupValidationResolver(validationSchema);
  const { handleSubmit, control } = useForm({
    resolver,
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <Grid container>
      <Grid size={12}>
        <Stack sx={{ marginBlockEnd: 2 }}>
          <Typography variant="h6">Lupa Kata Sandi</Typography>
        </Stack>
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          sx={{ '& > :not(:last-child)': { marginBlockEnd: 2 }, marginBlockEnd: 2 }}
        >
          <Controller
            name="email"
            control={control}
            render={({ field, formState: { errors } }) => (
              <TextField
                {...field}
                color="primary"
                variant="outlined"
                label="Email"
                size="small"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
          <Button fullWidth variant="contained" type="submit" color="primary">
            Atur Ulang Kata Sandi
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

export default ForgotPasswordPage;
