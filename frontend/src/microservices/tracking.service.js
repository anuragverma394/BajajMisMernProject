import { apiClient, unwrap } from './http.client';

export const trackingService = {
    getLiveLocation: async (params) => {
        const response = await apiClient.get('/tracking/live-location-rpt', { params });
        return unwrap(response.data);
    },

    getTargetReport: async (params) => {
        const response = await apiClient.get('/tracking/target-rpt', { params });
        return unwrap(response.data);
    },

    getPerformanceReport: async (params) => {
        const response = await apiClient.get('/tracking/tracking-report', { params });
        return unwrap(response.data);
    },

    getGrowerMeetingReport: async (params) => {
        const response = await apiClient.get('/tracking/grower-meeting-report', { params });
        return unwrap(response.data);
    },

    getZones: async (params) => {
        const response = await apiClient.get('/tracking/unit-zone', { params });
        return unwrap(response.data);
    },

    getBlocks: async (params) => {
        const response = await apiClient.get('/tracking/unit-zone-block', { params });
        return unwrap(response.data);
    },

    getTargetEntryData: async (params) => {
        const response = await apiClient.get('/tracking/target-entry', { params });
        return unwrap(response.data);
    },

    getUnitOfficers: async (params) => {
        const response = await apiClient.get('/tracking/unit-wise-officer', { params });
        return unwrap(response.data);
    },

    saveTargets: async (payload) => {
        const response = await apiClient.post('/tracking/target-entry-2', payload);
        return unwrap(response.data);
    },

    getHistoryTrail: async (params) => {
        const response = await apiClient.get('/tracking/tracking-map-live', { params });
        return unwrap(response.data);
    },

    getEmpLiveLocation: async (params) => {
        const response = await apiClient.get('/tracking/view-map-live', { params });
        return unwrap(response.data);
    },

    getExecutiveSummary: async (params) => {
        const response = await apiClient.get('/tracking/tracking-report-data', { params });
        return unwrap(response.data);
    }
};
