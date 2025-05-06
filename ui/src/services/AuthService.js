import axios from 'axios';

const url = import.meta.env.VITE_SERVICE_URL;
const module = '/auth';

const endpoints = {
  register: (payload, signal) => {
    return axios.post(`${url}${module}/register`, payload, {
      signal,
      // headers: {
      //     'Content-Type': 'multipart/form-data',
      // },
    });
  },
  login: (payload, signal) => {
    return axios.post(`${url}${module}/login`, payload, { signal });
  },
  logout: (signal) => {
    return axios.post(`${url}${module}/logout`, { signal });
  },
};

export default endpoints;
