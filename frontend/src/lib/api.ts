import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy is set in vite.config.ts or we assume same origin in prod
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Special case: don't log out if fetching global repos fails due to lack of admin permissions
        const isGlobalRepoFetch = error.config?.url?.includes('/registry/repositories') && error.response?.status === 403;

        if ((error.response?.status === 401 || error.response?.status === 403) && !isGlobalRepoFetch) {
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
