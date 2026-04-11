import axios, {type AxiosError, type InternalAxiosRequestConfig} from 'axios';
import {API_URL} from '@/utils/constants';

const api = axios.create({
    baseURL: API_URL,
    headers: {'Content-Type': 'application/json'},
    timeout: 15_000,
    withCredentials: true,
});

// ─── Response interceptor: handle 401 → refresh or redirect ─────────────────

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/me'];

function isAuthRequest(url?: string): boolean {
    if (!url) return false;
    return AUTH_PATHS.some((p) => url.includes(p));
}

let isRefreshing = false;
let failedQueue: Array<{
    resolve: () => void;
    reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown) {
    failedQueue.forEach((p) => {
        if (error) p.reject(error);
        else p.resolve();
    });
    failedQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if (
            error.response?.status !== 401 ||
            originalRequest._retry ||
            isAuthRequest(originalRequest.url)
        ) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise<void>((resolve, reject) => {
                failedQueue.push({resolve, reject});
            }).then(() => api(originalRequest));
        }

        isRefreshing = true;
        originalRequest._retry = true;

        try {
            await axios.post(`${API_URL}/v1/auth/refresh`, null, {
                withCredentials: true,
            });

            processQueue(null);

            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);

export default api;
