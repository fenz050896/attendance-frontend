import React, { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';

import useSnackbar from '../../hooks/Snackbar';
import UserProfileService from '../../services/UserProfileService';
import useBoundStore from '../../stores';

const forms = [
  {
    name: 'email',
    label: 'E-mail',
    disabled: true,
    icon: <EmailOutlinedIcon />,
  },
  { name: 'fullName', label: 'Nama Lengkap', icon: <BadgeOutlinedIcon /> },
  { name: 'address', label: 'Alamat Lengkap', icon: <HomeOutlinedIcon /> },
  {
    name: 'phoneNumber',
    label: 'Nomor Telepon',
    icon: <LocalPhoneOutlinedIcon />,
  },
];

function ProfilePage() {
  const { showSnackbar } = useSnackbar();
  const user = useBoundStore((state) => state.user);
  const setUser = useBoundStore((state) => state.setUser);
  const {
    handleSubmit,
    control,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      email: user?.email || '',
      fullName: user?.full_name || '',
      address: user?.profile?.address || '',
      phoneNumber: user?.profile?.phone_number || '',
      birthdate: user?.profile?.birthdate || '',
    },
  });

  const runningProcess = useRef(null);
  const [mnemonicPhrase, setMnemonicPhrase] = useState(null);
  const [inputMnemonicPhrase, setInputMnemonicPhrase] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [generateContextLoading, setGenerateContextLoading] = useState(false);
  const [checkContextLoading, setCheckContextLoading] = useState(false);
  const [hasEncryptionContext, setHasEncryptionContext] = useState(false);
  const [openContextLoading, setOpenContextLoading] = useState(false);
  const [contextIsOpened, setContextIsOpened] = useState(false);

  const checkSavedContextKey = async (signal) => {
    try {
      setCheckContextLoading(true);
      const res = await UserProfileService.checkSavedContextKey(signal);
      if (res.status === 200 && !res.data.error) {
        setHasEncryptionContext(res.data.data.exists);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setCheckContextLoading(false);
      if (runningProcess.current) {
        runningProcess.current = null;
      }
    }
  };

  const handleGenerateContextKey = async () => {
    try {
      if (hasEncryptionContext) {
        return;
      }
      setGenerateContextLoading(true);
      if (runningProcess.current || generateContextLoading) {
        return;
      }

      const abortController = new AbortController();
      runningProcess.current = abortController;

      const res = await UserProfileService.generateContextKey(
        abortController.signal
      );
      if (res.status === 200 && !res.data.error) {
        showSnackbar({
          message: 'Berhasil membuat kunci konteks',
          severity: 'success',
        });
        await checkSavedContextKey(abortController.signal);
        setMnemonicPhrase(res.data.data);
      } else {
        showSnackbar({
          message: 'Gagal membuat kunci konteks (1)',
          severity: 'error',
        });
      }
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') {
        showSnackbar({
          message: 'Gagal membuat kunci konteks (2)',
          severity: 'error',
        });
      }
    } finally {
      setGenerateContextLoading(false);
      if (runningProcess.current) {
        runningProcess.current = null;
      }
    }
  };

  const handleUpdateProfile = async (data) => {
    try {
      if (runningProcess.current || profileLoading) {
        return;
      }
      setProfileLoading(true);
      const abortController = new AbortController();
      runningProcess.current = abortController;
      data.user_id = user.id;
      const res = await UserProfileService.update(abortController.signal, data);
      if (res.status === 200) {
        setUser({
          ...user,
          full_name: data.fullName,
          profile: {
            ...user.profile,
            address: data.address,
            phone_number: data.phoneNumber,
            birthdate: data.birthdate,
          },
        });

        showSnackbar({
          message: 'Berhasil memperbarui profil pengguna',
          severity: 'success',
        });
      } else {
        showSnackbar({
          message: 'Gagal memperbarui profil pengguna (1)',
          severity: 'error',
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError' || err.name !== 'CanceledError') {
        showSnackbar({
          message: 'Gagal memperbarui profil pengguna (2)',
          severity: 'error',
        });
      }
    } finally {
      setProfileLoading(false);
      if (runningProcess.current) {
        runningProcess.current = null;
      }
    }
  };

  const handleOpenContext = async () => {
    try {
      if (runningProcess.current || openContextLoading) {
        return;
      }
      setOpenContextLoading(true);
      const abortController = new AbortController();
      runningProcess.current = abortController;
      const res = await UserProfileService.openSavedContextKey(
        abortController.signal,
        {
          mnemonic_phrase: inputMnemonicPhrase,
        }
      );

      if (res.status === 200 && !res.data.error) {
        showSnackbar({
          message: 'Berhasil membuka konteks',
          severity: 'success',
        });
        setContextIsOpened(true);
      } else {
        showSnackbar({
          message: 'Gagal membuka konteks, silakan coba lagi beberapa saat (1)',
          severity: 'error',
        });
      }
    } catch (err) {
      console.log(err);
      if (err.name !== 'AbortError' || err.name !== 'CanceledError') {
        showSnackbar({
          message: 'Gagal membuka konteks, silakan coba lagi beberapa saat (2)',
          severity: 'error',
        });
      }
    } finally {
      setOpenContextLoading(false);
      if (runningProcess.current) {
        runningProcess.current = null;
      }
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    checkSavedContextKey(abortController.signal);

    return () => {
      abortController.abort();
      if (runningProcess.current) {
        runningProcess.current.abort();
      }
      runningProcess.current = null;
    };
  }, []);

  return (
    <Grid container>
      <Grid size={12} sx={{ borderBlockEnd: '1px solid #ccc' }}>
        <Typography variant="h6">Profil Pengguna</Typography>
      </Grid>
      <Grid
        container
        size={12}
        component="form"
        noValidate
        onSubmit={handleSubmit(handleUpdateProfile)}
        sx={{ paddingBlock: 3 }}
        rowSpacing={3}
        columnSpacing={3}
      >
        {forms.map((form, idx) => (
          <Grid size={6} key={`${form.name}-${idx}`}>
            <Controller
              name={form.name}
              control={control}
              render={({ field, formState: { errors } }) => (
                <TextField
                  {...field}
                  disabled={Boolean(form.disabled)}
                  fullWidth
                  color="primary"
                  variant="outlined"
                  label={form.label}
                  error={!!errors[form.name]}
                  helperText={errors[form.name]?.message}
                  slotProps={{
                    input: {
                      readOnly: Boolean(form.disabled),
                      startAdornment: (
                        <InputAdornment position="start">
                          {form.icon}
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
          </Grid>
        ))}
        <Grid size={6}>
          <Controller
            name="birthdate"
            control={control}
            render={({ field, formState: { errors } }) => {
              let value = dayjs(field.value);
              value = value.isValid() ? value : null;
              return (
                <DatePicker
                  value={value}
                  onChange={(newValue) => {
                    const v = newValue.format('YYYY-MM-DD');
                    field.onChange(v);
                  }}
                  label="Tanggal Lahir"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: errors.birthdate?.message || '',
                    },
                  }}
                  sx={{ marginInlineEnd: 2 }}
                />
              );
            }}
          />
        </Grid>
        <Grid container size={12} justifyContent="flex-end">
          <Button
            loading={profileLoading}
            startIcon={<EditNoteOutlinedIcon />}
            disabled={!isDirty}
            variant="contained"
            type="submit"
            color="primary"
          >
            Edit
          </Button>
        </Grid>
      </Grid>
      <Grid size={12} sx={{ borderBlockEnd: '1px solid #ccc' }}>
        <Typography variant="h6">Buat Kunci Konteks Enkripsi</Typography>
      </Grid>
      <Grid container size={12} sx={{ paddingBlockStart: 2 }}>
        {checkContextLoading ? (
          <Skeleton
            variant="rectangular"
            width="100%"
            height={50}
            sx={{ marginBlockEnd: 2 }}
          />
        ) : hasEncryptionContext ? (
          <Grid container size={12}>
            <Grid size={12}>
              <Alert
                severity="info"
                variant="outlined"
                sx={{ width: '100%', marginBlockEnd: 2 }}
              >
                Kunci konteks enkripsi sudah dibuat.
              </Alert>
            </Grid>
            {mnemonicPhrase !== null && (
              <Grid size={12}>
                <Typography variant="subtitle1">
                  Berikut ini adalah kunci untuk membuka konteks yang telah Anda
                  buat :
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  fontStyle="italic"
                  color="error"
                >
                  Simpan kunci ini baik baik karena kunci ini tidak akan
                  dimunculkan lagi
                </Typography>
                <TextField
                  fullWidth
                  disabled
                  slotProps={{ input: { readOnly: true } }}
                  value={mnemonicPhrase}
                />
              </Grid>
            )}
            {!contextIsOpened && (
              <Grid container size={12}>
                <Grid size={12}>
                  <Typography variant="subtitle1">
                    Buka konteks dengan kunci Anda :
                  </Typography>
                </Grid>
                <Grid size={12} sx={{ marginBlockEnd: 2 }}>
                  <MyTextField
                    fullWidth
                    variant="outlined"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <KeyOutlinedIcon />
                          </InputAdornment>
                        ),
                      },
                    }}
                    onBlur={(v) => setInputMnemonicPhrase(v)}
                    value={inputMnemonicPhrase}
                  />
                </Grid>
                <Grid container justifyContent="flex-end" size={12}>
                  <Button
                    loading={openContextLoading}
                    onClick={handleOpenContext}
                    startIcon={<LockOpenOutlinedIcon />}
                    variant="contained"
                    color="primary"
                  >
                    Buka Konteks
                  </Button>
                </Grid>
              </Grid>
            )}
          </Grid>
        ) : (
          <Button
            loading={generateContextLoading}
            onClick={handleGenerateContextKey}
            startIcon={<KeyOutlinedIcon />}
            variant="contained"
            color="primary"
          >
            Buat Kunci
          </Button>
        )}
      </Grid>
    </Grid>
  );
}

function MyTextField({ value, onBlur, ...props }) {
  const [v, setV] = useState(value);

  const handleBlur = () => {
    onBlur(v);
  };

  useEffect(() => {
    setV(value);
  }, [value]);

  return (
    <TextField
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={handleBlur}
      {...props}
    />
  );
}

export default ProfilePage;
