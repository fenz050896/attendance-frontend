import React, { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import CenterFocusStrongOutlinedIcon from '@mui/icons-material/CenterFocusStrongOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';

import useSnackbar from '../../hooks/Snackbar';
import useBoundStore from '../../stores';
import FaceVerificationService from '../../services/FaceVerificationService';

import Gambar1 from '../../assets/gambar_1.jpg';
import Gambar2 from '../../assets/gambar_2.jpg';
import Gambar3 from '../../assets/gambar_3.jpeg';

const images = [Gambar1, Gambar2, Gambar3];
const maxImages = 3;

function FaceRegistrationPage() {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const contextIsOpened = useBoundStore((state) => state.contextOpened);
  const hasRegisteredFaces = useBoundStore((state) => state.hasRegisteredFaces);
  const setHasRegisteredFaces = useBoundStore(
    (state) => state.setHasRegisteredFaces
  );

  const cameraRef = useRef(null);
  const fileInputRef = useRef(null);
  const runningRequest = useRef(null);

  const [openCamera, setOpenCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [getRegisteredUserFacesLoading, setGetRegisteredUserFacesLoading] =
    useState(true);
  const [imageSrcs, setImageSrcs] = useState([]);
  const [imageIds, setImageIds] = useState([]);

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
  }, [cameraRef, imageSrcs]);

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
  const handleRegisterFaceImages = async () => {
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
      const filename = dayjs().format('YYYY-MM-DD_HH-mm-ss');
      promiseFiles.forEach((blobFile, idx) =>
        formData.append('images', blobFile, `${filename}_${idx}.jpg`)
      );

      const abortController = new AbortController();
      runningRequest.current = abortController;

      const res = await FaceVerificationService.registerFaces(
        formData,
        abortController.signal
      );

      const { message, error } = res.data;
      if (!error) {
        setHasRegisteredFaces(true);
      }

      showSnackbar({
        message,
        severity: error ? 'error' : 'success',
      });
    } catch (err) {
      showSnackbar({
        message: err,
        severity: 'error',
      });
    } finally {
      setLoading(false);
      if (runningRequest.current) {
        runningRequest.current = null;
      }
    }
  };
  const handleGoToProfilePage = () => {
    navigate('/profile');
  };

  useEffect(() => {
    const getRegisteredUserFaces = async (signal) => {
      try {
        setGetRegisteredUserFacesLoading(true);
        const res = await FaceVerificationService.getRegisteredFaces(signal);
        const imageIds = res.data.data;
        if (!res.data.error && res.data.data.length > 0) {
          setHasRegisteredFaces(true);
          setImageIds(imageIds);
        }
      } catch (err) {
        if (err.code !== 'ERR_CANCELED') {
          showSnackbar({
            message: err,
            severity: 'error',
          });
        }
      } finally {
        setGetRegisteredUserFacesLoading(false);
      }
    };

    runningRequest.current = new AbortController();
    getRegisteredUserFaces(runningRequest.current.signal);

    return () => {
      runningRequest.current?.abort();
      runningRequest.current = null;
    };
  }, []);

  return (
    <Grid container>
      {!contextIsOpened && (
        <Grid size={12} sx={{ marginBlockEnd: 2 }}>
          <Alert variant="outlined" severity="info" sx={{ alignItems: 'center' }}>
            Anda belum membuka konteks untuk keperluan enkripsi dan dekripsi,
            silakan buka pada <Button variant="text" color="info" onClick={handleGoToProfilePage}>Halaman ini</Button>
          </Alert>
        </Grid>
      )}
      {getRegisteredUserFacesLoading ? (
        <>
          <Grid size={12} sx={{ marginBlockEnd: 5 }}>
            <Skeleton variant="rectangular" width="100%" height={50} />
          </Grid>
          <Grid
            container
            size={12}
            columnSpacing={2}
            sx={{ marginBlockEnd: 2 }}
          >
            <Grid size={4}>
              <Skeleton variant="rectangular" width="100%" height={350} />
            </Grid>
            <Grid size={4}>
              <Skeleton variant="rectangular" width="100%" height={350} />
            </Grid>
            <Grid size={4}>
              <Skeleton variant="rectangular" width="100%" height={350} />
            </Grid>
          </Grid>
        </>
      ) : hasRegisteredFaces ? (
        <>
          <Grid size={12} sx={{ marginBlockEnd: 5 }}>
            <Alert variant="outlined" severity="success">
              Anda sudah mendaftarkan wajah Anda
            </Alert>
          </Grid>
          <Grid container size={12} columnSpacing={2}>
            {imageIds.map((item, idx) => (
              <ImageView key={`image-${idx}`} imageId={item.id} />
            ))}
            {/* {images.map((image, idx) => (
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
            ))} */}
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
              disabled={imageSrcs.length < maxImages}
              loading={loading}
              endIcon={<SendOutlinedIcon />}
              variant="contained"
              color="primary"
              onClick={handleRegisterFaceImages}
            >
              Daftarkan Gambar Terpilih
            </Button>
          </Grid>
        </>
      )}
    </Grid>
  );
}

function ImageView({ imageId = null }) {
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    const fetchImage = async (id, signal) => {
      try {
        const response =
          await FaceVerificationService.getRegisteredFaceContentById(
            id,
            signal
          );
        const url = URL.createObjectURL(response.data);
        setImgUrl(url);
      } catch (err) {
        console.error('Failed to fetch image:', err);
      }
    };

    const abortController = new AbortController();
    fetchImage(imageId, abortController.signal);

    return () => {
      if (imgUrl) {
        URL.revokeObjectURL(imgUrl);
      }
      abortController.abort();
    };
  }, [imageId]);

  return (
    <Grid size={4}>
      <Card>
        <CardContent
          sx={{
            height: 400,
            backgroundImage: imgUrl ? `url(${imgUrl})` : 'none',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        />
        {/* <CardActions sx={{ justifyContent: 'center', paddingBlock: 2 }}>
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
        </CardActions> */}
      </Card>
    </Grid>
  );
}

export default FaceRegistrationPage;
