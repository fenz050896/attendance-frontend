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
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';

import CenterFocusStrongOutlinedIcon from '@mui/icons-material/CenterFocusStrongOutlined';

import useSnackbar from '../../hooks/Snackbar';
import useBoundStore from '../../stores';
import FaceVerificationService from '../../services/FaceVerificationService';

function AbsencePage() {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const contextIsOpened = useBoundStore((state) => state.contextOpened);
  const hasRegisteredFaces = useBoundStore((state) => state.hasRegisteredFaces);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const cameraRef = useRef(null);
  const runningVerification = useRef(null);

  const capture = useCallback(() => {
    if (cameraRef.current) {
      const imageSrc = cameraRef.current?.getScreenshot();
      setCapturedImage(imageSrc);
    }
    return;
  }, [cameraRef]);

  const handleGoToProfilePage = () => {
    navigate('/profile');
  };
  const handleGoToFaceRegistrationPage = () => {
    navigate('/face-registration');
  };

  useEffect(() => {
    if (capturedImage) {
      const verifyFace = async () => {
        try {
          setLoading(true);
          const capturedImageFile = await fetch(capturedImage);
          const blobFile = await capturedImageFile.blob();
          const formData = new FormData();
          const filename = dayjs().format('YYYY-MM-DD_HH-mm-ss');
          formData.append('captured_image', blobFile, `${filename}_face_verify.jpg`);

          const ctrl = new AbortController();
          runningVerification.current = ctrl;

          const response = await FaceVerificationService.verifyFace(
            formData,
            ctrl.signal
          );

          console.log(response.data);
        } catch (err) {
          showSnackbar({
            message: err,
            severity: 'error',
          });
        } finally {
          setCapturedImage(null);
          setLoading(false);
        }
      };

      verifyFace();
    }

    return () => {
      runningVerification.current?.abort();
      runningVerification.current = null;
    };
  }, [capturedImage]);

  return (
    <Grid container>
      {!contextIsOpened && (
        <Grid size={12} sx={{ marginBlockEnd: 2 }}>
          <Alert
            variant="outlined"
            severity="info"
            sx={{ alignItems: 'center' }}
          >
            Anda belum membuka konteks untuk keperluan enkripsi dan dekripsi,
            silakan buka pada
            <Button variant="text" color="info" onClick={handleGoToProfilePage}>
              Halaman ini
            </Button>
          </Alert>
        </Grid>
      )}
      {hasRegisteredFaces ? (
        <Grid size={12} sx={{ marginBlockEnd: 2 }}>
          <Card>
            <CardContent sx={{ justifyContent: 'center' }}>
              <Box
                sx={{
                  // display: openCamera ? 'flex' : 'none',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: 640,
                    height: 480,
                  }}
                >
                  {loading && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 640,
                        height: 480,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        boxSizing: 'border-box',
                        zIndex: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <CircularProgress size="4rem" />
                    </Box>
                  )}
                  {capturedImage ? (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                        backgroundImage: `url(${capturedImage})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        width: 640,
                        height: 480,
                      }}
                    />
                  ) : (
                    <Webcam
                      audio={false}
                      screenshotFormat="image/jpeg"
                      ref={cameraRef}
                      width={640}
                      height={480}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                      }}
                    />
                  )}
                </Box>
              </Box>
            </CardContent>
            <CardActions
              sx={{
                // display: openCamera ? 'flex' : 'none',
                display: 'flex',
                justifyContent: 'center',
                paddingBlock: 2,
              }}
            >
              {/* {capturedImage ? (
                <Button
                  onClick={capture}
                  startIcon={<CenterFocusStrongOutlinedIcon />}
                  variant="contained"
                  color="primary"
                >
                  Ambil
                </Button>
              ) : ( */}
              <Button
                disabled={loading || capturedImage}
                loading={loading || capturedImage}
                onClick={capture}
                startIcon={<CenterFocusStrongOutlinedIcon />}
                variant="contained"
                color="primary"
              >
                Ambil
              </Button>
              {/* )} */}
            </CardActions>
          </Card>
        </Grid>
      ) : (
        <Alert
          variant="outlined"
          severity="error"
          sx={{ alignItems: 'center' }}
        >
          Anda belum mendaftarkan wajah Anda, silakan daftar pada
          <Button
            variant="text"
            color="error"
            onClick={handleGoToFaceRegistrationPage}
          >
            Halaman ini
          </Button>
        </Alert>
      )}
    </Grid>
  );
}

export default AbsencePage;
