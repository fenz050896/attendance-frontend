import React, { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import Webcam from 'react-webcam';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import CenterFocusStrongOutlinedIcon from '@mui/icons-material/CenterFocusStrongOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';

import useSnackbar from '../../hooks/Snackbar';
import FaceVerificationService from '../../services/FaceVerificationService';

import Gambar1 from '../../assets/gambar_1.jpg';
import Gambar2 from '../../assets/gambar_2.jpg';
import Gambar3 from '../../assets/gambar_3.jpeg';

const hasRegisteredFace = false;
const images = [Gambar1, Gambar2, Gambar3];
const maxImages = 3;

function FaceRegistrationPage() {
  const { showSnackbar } = useSnackbar();

  const cameraRef = useRef(null);
  const fileInputRef = useRef(null);
  const runningRequest = useRef(null);

  const [openCamera, setOpenCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageSrcs, setImageSrcs] = useState([]);

  const capture = useCallback(() => {
    if (cameraRef.current) {
      if (imageSrcs.length >= maxImages) {
        showSnackbar({
          message: `Maksimal ${maxImages} gambar`,
          severity: 'error',
        });
        return;
      }
      const imageSrc = cameraRef.current?.getScreenshot();
      setImageSrcs((prev) => [...prev, imageSrc]);
    }
    return;
  }, [cameraRef]);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > maxImages) {
      showSnackbar({
        message: `Maksimal ${maxImages} gambar`,
        severity: 'error',
      });
      return;
    }
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file && file.type === 'image/jpeg') {
          const reader = new FileReader();
          reader.onload = (e) => {
            setImageSrcs((prev) => [...prev, e.target?.result]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };
  const handleRemoveImage = (idx) => {
    setImageSrcs((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleRegisterImages = async () => {
    if (imageSrcs.length === 0) {
      return;
    }

    try {
      setLoading(true);
      const files = imageSrcs.map((imageSrc) =>
        fetch(imageSrc).then((res) => res.blob())
      );
      const promiseFiles = await Promise.all(files);
      const formData = new FormData();
      const filename = dayjs().format('Y-m-d_HH-mm-ss');
      promiseFiles.forEach((blobFile, idx) =>
        formData.append('images', blobFile, `${filename}_${idx}.jpg`)
      );

      const abortController = new AbortController();
      runningRequest.current = abortController;

      const res = await FaceVerificationService.registerFaces(formData, abortController.signal)

      const { message, success } = res.data;
      showSnackbar({
        message,
        severity: success ? 'success' : 'error',
      });
    } catch (err) {
      showSnackbar({
        message: err,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (runningRequest.current) {
        runningRequest.current.cancel();
      }
    };
  }, []);

  return (
    <Grid container>
      {hasRegisteredFace ? (
        <>
          <Grid size={12} sx={{ marginBlockEnd: 5 }}>
            <Alert variant="outlined" severity="success">
              Anda sudah mendaftarkan wajah Anda
            </Alert>
          </Grid>
          <Grid container size={12} columnSpacing={2}>
            {images.map((image, idx) => (
              <Grid key={`image-${idx}`} size={4}>
                <Card>
                  <CardContent
                    sx={{
                      height: 400,
                      backgroundImage: `url(${image})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }}
                  />
                  <CardActions
                    sx={{ justifyContent: 'center', paddingBlock: 2 }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<EditOutlinedIcon />}
                      color="primary"
                    >
                      Ganti
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DeleteOutlineOutlinedIcon />}
                      color="error"
                    >
                      Hapus
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <>
          <Grid size={12} sx={{ marginBlockEnd: 2 }}>
            <Alert variant="outlined" severity="error">
              Anda belum mendaftarkan wajah Anda, silakan daftarkan wajah
            </Alert>
          </Grid>
          <Grid size={12} sx={{ marginBlockEnd: 2 }}>
            <Alert variant="outlined" severity="info">
              <Typography>Untuk hasil yang baik:</Typography>
              <ul>
                <li>Ambil gambar dengan wajah Anda yang terlihat jelas</li>
                <li>Silakan lepas aksesoris yang ada di wajah Anda</li>
                <li>Gunakan pencahayaan yang baik</li>
              </ul>
            </Alert>
          </Grid>
          <Grid size={12} sx={{ marginBlockEnd: 2 }}>
            <Card>
              <CardContent sx={{ justifyContent: 'center' }}>
                <Grid size={12} sx={{ marginBlockEnd: 2 }}>
                  <Button
                    onClick={() => setOpenCamera((prev) => !prev)}
                    startIcon={<CameraAltOutlinedIcon />}
                    variant="contained"
                    color="primary"
                    sx={{ marginInlineEnd: 2 }}
                  >
                    {openCamera ? 'Tutup Kamera' : 'Buka Kamera'}
                  </Button>
                  <Button
                    startIcon={<FolderOpenOutlinedIcon />}
                    variant="contained"
                    color="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Ambil dari berkas
                  </Button>
                </Grid>
                <Box
                  sx={{
                    display: openCamera ? 'flex' : 'none',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Webcam
                    audio={false}
                    screenshotFormat="image/jpeg"
                    ref={cameraRef}
                  />
                </Box>
              </CardContent>
              <CardActions
                sx={{
                  display: openCamera ? 'flex' : 'none',
                  justifyContent: 'center',
                  paddingBlock: 2,
                }}
              >
                <Button
                  onClick={capture}
                  startIcon={<CenterFocusStrongOutlinedIcon />}
                  variant="contained"
                  color="primary"
                >
                  Ambil
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg"
                  style={{ display: 'none' }}
                  multiple
                />
              </CardActions>
            </Card>
          </Grid>
          <Grid
            container
            columnSpacing={2}
            rowSpacing={2}
            size={12}
            sx={{ marginBlockEnd: 2 }}
          >
            {imageSrcs.map((imageSrc, idx) => (
              <Grid key={`image-${idx}`} size={4}>
                <Card>
                  <CardContent
                    sx={{
                      height: 400,
                      backgroundImage: `url(${imageSrc})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }}
                  />
                  <CardActions
                    sx={{ justifyContent: 'center', paddingBlock: 2 }}
                  >
                    <Button
                      startIcon={<DeleteOutlineOutlinedIcon />}
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveImage(idx)}
                    >
                      Hapus
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Grid size={12} container justifyContent="flex-end">
            <Button
              disabled={imageSrcs.length === 0}
              loading={loading}
              endIcon={<SendOutlinedIcon />}
              variant="contained"
              color="primary"
              onClick={handleRegisterImages}
            >
              Daftarkan Gambar Terpilih
            </Button>
          </Grid>
        </>
      )}
    </Grid>
  );
}

export default FaceRegistrationPage;
