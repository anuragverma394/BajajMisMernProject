import { apiClient } from './http.client';

export const surveyService = {
    getActualVarietyWise: async (params) => {
        const response = await apiClient.get('/survey-report/survey-actual-varietywise', { params });
        return response.data;
    },

    getDailyTeamWiseProgress: async (params) => {
        const response = await apiClient.get('/survey-report/daily-team-wise-survey-progress-report', { params });
        return response.data;
    },

    getDailyTeamWiseHourlyProgress: async (params) => {
        const response = await apiClient.get('/survey-report/daily-team-wise-hourly-survey-progress-report', { params });
        return response.data;
    },

    getFinalVillageFirstSurvey: async (params) => {
        const response = await apiClient.get('/survey-report/final-village-first-survey-report', { params });
        return response.data;
    },

    getFinalVillageFirstSurveySummery: async (params) => {
        const response = await apiClient.get('/survey-report/final-village-first-survey-summery-report', { params });
        return response.data;
    },

    getFactoryWiseCaneArea: async (params) => {
        const response = await apiClient.get('/survey-report/factory-wise-cane-area-report', { params });
        return response.data;
    },

    getCaneVarietyVillageGrower: async (params) => {
        const response = await apiClient.get('/survey-report/cane-vierity-village-grower', { params });
        return response.data;
    },

    getCategoryWiseSummary: async (params) => {
        const response = await apiClient.get('/survey-report/category-wise-summary', { params });
        return response.data;
    },

    getPlotWiseDetails: async (params) => {
        const response = await apiClient.get('/survey-report/plot-wise-details', { params });
        return response.data;
    },

    getWeeklyIndents: async (params) => {
        const response = await apiClient.get('/survey-report/weekly-submissionof-indents', { params });
        return response.data;
    },

    getWeeklyPlanting: async (params) => {
        const response = await apiClient.get('/survey-report/weekly-submissionof-autumn-planting-indent', { params });
        return response.data;
    },

    getSurveyUnitWiseStatus: async (params) => {
        const response = await apiClient.get('/survey-report/survey-unit-wise-survey-status', { params });
        return response.data;
    },

    getSurveyUnitWiseAreaSummary: async (params) => {
        const response = await apiClient.get('/survey-report/survey-unit-wise-survey-area-summary', { params });
        return response.data;
    },

    getEffectedCaneArea: async (params) => {
        const response = await apiClient.get('/report/effected-cane-area-report', { params });
        return response.data;
    },

    getHourlyCaneArrival: async (params) => {
        const response = await apiClient.get('/report/hourly-cane-arrival', { params });
        return response.data;
    }
};
