import { apiClient, unwrap, normalizeUnitsList } from './http.client';

export const masterService = {
    getUnits: async () => {
        const response = await apiClient.get('/main/units');
        const data = unwrap(response.data);
        return normalizeUnitsList(data);
    },

    getSeasons: async (params) => {
        const response = await apiClient.get('/main/seasons', { params });
        return unwrap(response.data);
    },

    getStoppages: async (params) => {
        const response = await apiClient.get('/main/stoppages', { params });
        return unwrap(response.data);
    },

    getGroupModes: async (params) => {
        const response = await apiClient.get('/main/add-mode-group-view', { params });
        return unwrap(response.data);
    },

    getCenters: async (params) => {
        const response = await apiClient.get('/report/centre-code', { params });
        return response.data;
    }
};
