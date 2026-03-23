import { apiClient } from './http.client';

export const reportNewService = {
    getHourlyCaneArrivalWeight: async (params) => {
        const response = await apiClient.get('/report-new/hourly-cane-arrival-wieght', { params });
        return response.data;
    },

    getIndentPurchaseReport: async (params) => {
        const response = await apiClient.get('/report-new/indent-purchase-report-new', { params });
        return response.data;
    },

    getCenterIndentPurchaseReport: async (params) => {
        const response = await apiClient.get('/report-new/center-indent-purchase-report', { params });
        return response.data;
    },

    getCentrePurchaseTruckReport: async (params) => {
        const response = await apiClient.get('/report-new/centre-purchase-truck-report-new', { params });
        return response.data;
    },

    getCanePurchaseReport: async (params) => {
        const response = await apiClient.get('/report-new/cane-purchase-report', { params });
        return response.data;
    },

    getCenterBlanceReport: async (params) => {
        const response = await apiClient.get('/report-new/center-blance-report', { params });
        return response.data;
    },

    getCenterBind: async (params) => {
        const response = await apiClient.get('/report-new/center-bind', { params });
        return response.data;
    },

    getIndentFailSummary: async (params) => {
        const response = await apiClient.get('/report/indent-fail-summary-new', { params });
        return response.data;
    },

    getTargetActualMisSapNew: async (params) => {
        const response = await apiClient.get('/report-new/target-actual-mis-sap-new', { params });
        return response.data;
    },

    getTargetActualMISDataMis: async (params) => {
        const response = await apiClient.get('/report-new/target-actual-misdata-mis', { params });
        return response.data;
    },

    getExceptionReports: async (params) => {
        const response = await apiClient.get('/new-report/exception-report-master', { params });
        return response.data;
    },

    getSampleOfTransporter: async (params) => {
        const response = await apiClient.get('/report-new/sample-of-transporter', { params });
        return response.data;
    },

    saveExceptionReport: async (data) => {
        const response = await apiClient.post('/new-report/exception-report-master-2', data);
        return response.data;
    },

    updateExceptionReport: async (id, data) => {
        const response = await apiClient.post('/new-report/exception-report-master-2', { ...data, id });
        return response.data;
    },

    deleteExceptionReport: async (id) => {
        const response = await apiClient.post('/new-report/exception-report-master-2', { id, Command: 'delete' });
        return response.data;
        
    }
};
