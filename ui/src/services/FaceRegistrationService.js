import axios from 'axios';

const url = import.meta.env.VITE_SERVICE_URL;
const module = '/face-registration';

const endpoints = {
  registerFaces: (payload, signal) => {
    return axios.post(`${url}${module}/register-faces`, payload, {
      signal,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getRegisteredFaces: (signal) => {
    return axios.get(`${url}${module}/get-registered-faces`, { signal });
  },
  getRegisteredFaceContentById: (id, signal) => {
    return axios.get(`${url}${module}/get-registered-face-content/${id}`, {
      signal,
      responseType: 'blob',
    });
  },
  // verifyFace: `${url}${module}/verify-face`,
  // getFaceData: `${url}${module}/get-face-data`,
  // deleteFaceData: `${url}${module}/delete-face-data`,
  // getFaceVerificationResult: `${url}${module}/get-face-verification-result`,
};

export default endpoints;
