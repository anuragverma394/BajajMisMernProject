import { apiClient } from './http.client';

export const reportService = {
    getCenterPurchases: async (params) => {
        const response = await apiClient.get('/report/centre-purchase', { params });
        return response.data;
    },

    getTruckDispatchWeighed: async (params) => {
        const response = await apiClient.get('/report/truck-dispatch-weighed', { params });
        return response.data;
    },

    getIndentFailSummary: async (params) => {
        const response = await apiClient.get('/report/indent-fail-summary', { params });
        return response.data;
    },
    getIndentFailSummaryNew: async (params) => {
        const response = await apiClient.get('/report/indent-fail-summary-new-data', { params });
        return response.data;
    },
    getIndentFailSummaryNewMeta: async () => {
        const response = await apiClient.get('/report/indent-fail-summary-new');
        return response.data;
    },
    getIndentFailDetails: async (params) => {
        const response = await apiClient.get('/report/indent-faill-details-data', { params });
        return response.data;
    },

    getCrushingFactoryData: async (params) => {
        const response = await apiClient.get('/report/loadfactorydata', { params });
        return response.data;
    },

    getCrushingModewiseData: async (params) => {
        const response = await apiClient.get('/report/loadmodewisedata', { params });
        return response.data;
    },

    getCrushingBulb: async (params) => {
        const response = await apiClient.get('/report/imagesblub', { params });
        return response.data;
    },
    getLatestCrushingDate: async (params) => {
        const response = await apiClient.get('/report/latest-crushing-date', { params });
        return response.data;
    },

    getAnalysisData: async (params) => {
        const response = await apiClient.get('/report/analysisdata', { params });
        return response.data;
    },

    getSurveyPlot: async (params) => {
        const response = await apiClient.get('/report/survey-plot', { params });
        return response.data;
    },

    getGeneralReport: async (params = {}) => {
        const { reportName, ...rest } = params;
        const routeMap = {
            'centre-purchase': 'centre-purchase',
            'analysis-data': 'analysisdata',
            'budget-vs-actual': 'budget-vsactual',
            'driage-centre-clerk-summary': 'driage-centre-clerk-detail',
            'driage-clerk-centre-summary': 'driage-clerk-centre-detail',
            'driage-clerk-summary': 'driage-clerk-summary',
            'driage-center-summary': 'driage-summary',
            'indent-fail-summary': 'indent-fail-summary',
            'truck-dispatch-weighed': 'truck-dispatch-weighed'
        };
        const route = routeMap[reportName] || reportName;
        const response = await apiClient.get(`/report/${route}`, { params: rest });
        return response.data;
    },

    getDriageClerkSummary: async (params) => {
        const response = await apiClient.get('/report/driage-clerk-summary', { params });
        return response.data;
    },

    getHourlyCaneArrival: async (params) => {
        const response = await apiClient.get('/report/hourly-cane-arrival', { params });
        return response.data;
    },

    getEffectedCaneAreaReport: async (params) => {
        const response = await apiClient.get('/report/effected-cane-area-report', { params });
        return response.data;
    },

    getSummaryReportUnitWise: async (params) => {
        const response = await apiClient.get('/report/summary-report-unit-wise', { params });
        return response.data;
    },

    getTargetActualMISReport: async (params) => {
        const response = await apiClient.get('/report/target-actual-misreport', { params });
        return response.data;
    },

    getTargetActualMISPeriodReport: async (params) => {
        const response = await apiClient.get('/report/target-actual-misperiod-report', { params });
        return response.data;
    },

    getDriageClerkCentreDetail: async (params) => {
        const response = await apiClient.get('/report/driage-clerk-centre-detail', { params });
        return response.data;
    }
};
