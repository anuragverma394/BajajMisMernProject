import { apiClient } from './http.client';

export const authService = {
    login: async (credentials = {}) => {
        const payload = {
            Name: credentials.Name || credentials.username || credentials.userid || '',
            Password: credentials.Password || credentials.password || '',
            season: credentials.season || localStorage.getItem('season') || '2526'
        };
        const response = await apiClient.post('/account/login', payload);
        const data = response.data || {};
        return {
            status: data.success ? 'success' : 'error',
            message: data.message || '',
            token: data.token,
            data: { user: data.user || null }
        };
    },

    register: async (userData) => {
        const response = await apiClient.post('/account/register', userData);
        return response.data;
    },

    getProfile: async () => {
        const response = await apiClient.get('/account/page-load');
        return response.data;
    }
};
