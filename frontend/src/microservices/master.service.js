import { apiClient, unwrap, normalizeUnitsList } from './http.client';

export const masterService = {
    getUnits: async () => {
        const response = await apiClient.get('/main/units');
        const data = unwrap(response.data);
        return normalizeUnitsList(data);
    },

    getDistilleryUnits: async () => {
        const response = await apiClient.get('/main/distillery-units');
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

    getStopageById: async (sid) => {
        const response = await apiClient.get('/main/add-stopage', { params: { sid } });
        return unwrap(response.data);
    },

    saveStopage: async (payload) => {
        const response = await apiClient.post('/main/add-stopage-2', payload);
        return unwrap(response.data);
    },

    getGroupModes: async (params) => {
        const response = await apiClient.get('/main/add-mode-group-view', { params });
        return unwrap(response.data);
    },

    getModeBind: async (params) => {
        const response = await apiClient.get('/main/mode-bind', { params });
        return unwrap(response.data);
    },

    getAddModeGroup: async (params) => {
        const response = await apiClient.get('/main/add-mode-group', { params });
        return unwrap(response.data);
    },

    saveAddModeGroup: async (payload) => {
        const response = await apiClient.post('/main/add-mode-group-2', payload);
        return unwrap(response.data);
    },

    getCenters: async (params) => {
        const response = await apiClient.get('/report/centre-code', { params });
        return response.data;
    }
};
