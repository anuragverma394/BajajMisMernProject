import { apiClient } from './http.client';

export const trackingService = {
    getLiveLocation: async (params) => {
        const response = await apiClient.get('/tracking/live-location-rpt', { params });
        return response.data;
    },

    getTargetReport: async (params) => {
        const response = await apiClient.get('/tracking/target-rpt', { params });
        return response.data;
    },

    getPerformanceReport: async (params) => {
        const response = await apiClient.get('/tracking/tracking-report', { params });
        return response.data;
    },

    getGrowerMeetingReport: async (params) => {
        const response = await apiClient.get('/tracking/grower-meeting-report', { params });
        return response.data;
    },

    getZones: async (params) => {
        const response = await apiClient.get('/tracking/unit-zone', { params });
        return response.data;
    },

    getBlocks: async (params) => {
        const response = await apiClient.get('/tracking/unit-zone-block', { params });
        return response.data;
    },

    getTargetEntryData: async (params) => {
        const response = await apiClient.get('/tracking/target-entry', { params });
        return response.data;
    },

    getUnitOfficers: async (params) => {
        const response = await apiClient.get('/tracking/unit-wise-officer', { params });
        return response.data;
    },

    saveTargets: async (payload) => {
        const response = await apiClient.post('/tracking/target-entry-2', payload);
        return response.data;
    },

    getHistoryTrail: async (params) => {
        const response = await apiClient.get('/tracking/tracking-map-live', { params });
        return response.data;
    },

    getEmpLiveLocation: async (params) => {
        const response = await apiClient.get('/tracking/view-map-live', { params });
        return response.data;
    },

    getExecutiveSummary: async (params) => {
        const response = await apiClient.get('/tracking/tracking-report-data', { params });
        return response.data;
    }
};
