import { apiClient, postDashboard } from './http.client';

export const dashboardService = {
    getMarketingData: async (params = {}) => postDashboard('/main/home-fact', params, 'marketing'),
    getSurveyData: async (params = {}) => postDashboard('/main/home-fact', params, 'survey'),
    getYeastOvershoots: async (params = {}) => postDashboard('/main/over-shoot-for-centers', params),
    getTokenGrossTare: async (params = {}) => postDashboard('/main/token-gross-tare', params),
    getPurchaseOvershoots: async (params = {}) => postDashboard('/main/over-shoot-for-centers', params)
};
