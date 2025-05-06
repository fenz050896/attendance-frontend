import axios from 'axios';

const url = import.meta.env.VITE_SERVICE_URL;
const module = '/user-profile';

const endpoints = {
    update: (signal, data) => {
        return axios.put(`${url}${module}`, data, { signal });
    },
    generateContextKey: (signal) => {
        return axios.post(`${url}${module}/generate-context-key`, {}, { signal });
    },
    checkSavedContextKey: (signal) => {
        return axios.get(`${url}${module}/check-saved-context-key`, { signal });
    },
    openSavedContextKey: (signal, payload) => {
        return axios.post(`${url}${module}/open-saved-context-key`, payload, { signal });
    },
};

export default endpoints;
