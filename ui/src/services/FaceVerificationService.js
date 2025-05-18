import axios from 'axios';

const url = import.meta.env.VITE_SERVICE_URL;
const module = '/face-verification';

const endpoints = {
  verifyFace: (payload, signal) => {
    return axios.post(`${url}${module}`, payload, {
      signal,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default endpoints;
