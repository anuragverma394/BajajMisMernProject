import { apiClient } from './http.client';

export const whatsappService = {
    getVarietyArea: async (params) => {
        const response = await apiClient.get('/whats-app/actual-variety-wise-area', { params });
        return response.data;
    },

    getDistilleryReport: async (params) => {
        const from = params?.fromDate || params?.Date || params?.date || '';
        const to = params?.toDate || params?.Date || params?.date || from;
        const factoryCode = params?.factoryCode || params?.F_code || params?.unit || '';
        const response = await apiClient.get('/main/distillery-report-entry-view', { params: { factoryCode, fromDate: from, toDate: to } });
        return response.data;
    },

    getDistilleryEntries: async (params) => {
        const from = params?.fromDate || params?.Date || params?.date || '';
        const to = params?.toDate || params?.Date || params?.date || from;
        const factoryCode = params?.factoryCode || params?.F_code || params?.unit || '';
        const response = await apiClient.get('/main/distillery-report-entry-view', { params: { factoryCode, fromDate: from, toDate: to } });
        return response.data;
    },

    saveDistilleryEntry: async (payload) => {
        const response = await apiClient.post('/main/distillery-report-entry-2', payload);
        return response.data;
    }
};

export const accountReportsService = {
    getCapacityUtilisation: async (params) => {
        const response = await apiClient.get('/account-reports/capasityutilisation', { params });
        return response.data;
    },

    getCapacityUtilisationPeriodical: async (params) => {
        const response = await apiClient.get('/account-reports/capasityutilisation-fromdate', { params });
        return response.data;
    },
    getDistilleryReport: async (params) => {
        const response = await apiClient.get('/account-reports/distilleryreport', { params });
        return response.data;
    },

    getVarietyWiseCanePurchase: async (params) => {
        const response = await apiClient.get('/account-reports/variety-wise-cane-purchase', { params });
        return response.data;
    },

    getVarietyWiseCanePurchaseAmt: async (params) => {
        const response = await apiClient.get('/account-reports/variety-wise-cane-purchase-amt', { params });
        return response.data;
    },

    getCaneQtySugarCapacity: async (params) => {
        const response = await apiClient.get('/account-reports/cane-qtyand-sugar-capacity', { params });
        return response.data;
    },

    getLoanSummaryReport: async (params) => {
        const response = await apiClient.get('/report/loansummary-rpt', { params });
        return response.data?.data ?? response.data;
    }
};

export const distilleryService = {
    getBHeavyReport: async (params) => (await apiClient.get('/distillery/bheavy-ethanol-report', { params })).data,
    getCHeavyReport: async (params) => (await apiClient.get('/distillery/cheavy-ethanol-report', { params })).data,
    getSyrupReport: async (params) => (await apiClient.get('/distillery/syrup-ethanol-report', { params })).data,
    getDistilleryReportA: async (params) => (await apiClient.get('/account-reports/distillery-report-a', { params })).data
};

export const transferUnitService = {
    getList: async (factoryCode = '') => {
        const res = await apiClient.get('/account-reports/transferand-recieved-unit', { params: { factoryCode } });
        return res.data?.data ?? res.data;
    },
    getById: async (id) => {
        const res = await apiClient.get('/account-reports/transferand-recieved-unit', { params: { Rid: id } });
        return res.data?.data ?? res.data;
    },
    create: async (payload) => {
        const res = await apiClient.post('/account-reports/transferand-recieved-unit-2', { ...payload, Command: 'btninsert' });
        return res.data?.data ?? res.data;
    },
    update: async (id, payload) => {
        const res = await apiClient.post('/account-reports/transferand-recieved-unit-2', { ...payload, id, Command: 'btupdate' });
        return res.data?.data ?? res.data;
    },
    deleteRecord: async (id) => {
        const res = await apiClient.post('/account-reports/transferand-recieved-unit-2', { id, Command: 'delete' });
        return res.data?.data ?? res.data;
    }
};

export const dailyCaneEntryService = {
    getList: async (params = {}) => (await apiClient.get('/main/sugar-whats-app-report-view', { params })).data,
    getProdTypes: async () => {
        const res = await apiClient.get('/main/distillery-prod-types');
        return res.data?.data ?? res.data;
    },
    getNewReportData: async (params = {}) => {
        const date = params.C_date || params.Cn_Date || params.Date || params.date || '';
        const factory = params.F_code || params.factoryCode || params.Cn_Unit || '';
        return (await apiClient.get('/main/sugar-whats-app-report-new-data', { params: { C_date: date, F_code: factory } })).data;
    },
    getSummaryReport: async (params = {}) => {
        const date = params.Cn_Date || params.Date || params.date || params.fromDate || '';
        const factory = params.F_code || params.factoryCode || params.Cn_Unit || '';
        return (await apiClient.get('/main/sugar-whats-app-reports-data', { params: { Cn_Date: date, F_code: factory } })).data;
    },
    getById: async (id) => (await apiClient.get('/main/sugar-whats-app-report', { params: { sid: id } })).data,
    create: async (payload) => (await apiClient.post('/main/sugar-whats-app-report-2', { ...payload, Command: 'btninsert' })).data,
    update: async (id, payload) => (await apiClient.post('/main/sugar-whats-app-report-2', { ...payload, id, Command: 'btupdate' })).data,
    deleteRecord: async (id) => (await apiClient.post('/main/sugar-whats-app-report-2', { id, Command: 'delete' })).data
};

export const dailyRainfallService = {
    getList: async (params = {}) => (await apiClient.get('/main/daily-rainfallview', { params })).data,
    getById: async (id) => (await apiClient.get('/main/daily-rainfall-id', { params: { RD_ID: id } })).data,
    create: async (payload) => (await apiClient.post('/main/daily-rainfall-2', payload)).data,
    update: async (id, payload) => (await apiClient.post('/main/daily-rainfall-2', { ...payload, id })).data,
    deleteRecord: async (id) => (await apiClient.get('/main/daily-rainfall-delete', { params: { RD_ID: id } })).data
};

export const distilleryEntryService = {
    getList: async (params = {}) => {
        const res = await apiClient.get('/main/distillery-report-entry-view', { params });
        return res.data?.data ?? res.data;
    },
    getById: async (id) => {
        const res = await apiClient.get('/main/distillery-report-entry', { params: { sid: id } });
        return res.data?.data ?? res.data;
    },
    create: async (payload) => {
        const res = await apiClient.post('/main/distillery-report-entry-2', { ...payload, Command: 'btninsert' });
        return res.data?.data ?? res.data;
    },
    update: async (id, payload) => {
        const res = await apiClient.post('/main/distillery-report-entry-2', { ...payload, id, Command: 'btupdate' });
        return res.data?.data ?? res.data;
    },
    deleteRecord: async (id) => {
        const res = await apiClient.get('/main/distillery-report-entry-delete', { params: { id } });
        return res.data?.data ?? res.data;
    }
};

export const addBudgetService = {
    getList: async (params = {}) => (await apiClient.get('/lab/add-budgetview', { params })).data,
    getById: async (id, params = {}) => (await apiClient.get('/lab/add-budget-by-id', { params: { ...params, WB_Id: id, WB_ID: id, id } })).data,
    create: async (payload) => (await apiClient.post('/lab/add-budget-2', payload)).data,
    update: async (id, payload) => (await apiClient.post('/lab/add-budget-2', { ...payload, id: 'btupdate', Rid: id })).data,
    deleteRecord: async (id, params = {}) => (await apiClient.get('/lab/add-budget-delete', { params: { ...params, WB_ID: id, WB_Id: id, id } })).data
};

export const addCanePlanService = {
    getSeason: async () => (await apiClient.get('/main/seasons')).data,
    getList: async (params = {}) => (await apiClient.get('/lab/add-cane-plan-view', { params })).data,
    getById: async (id) => (await apiClient.get('/lab/add-cane-plan-id', { params: { Rid: id } })).data,
    create: async (payload) => (await apiClient.post('/lab/add-cane-plan-2', payload)).data,
    update: async (id, payload) => (await apiClient.post('/lab/add-cane-plan-2', { ...payload, id: 'btupdate', Rid: id })).data,
    deleteRecord: async (id) => (await apiClient.get('/lab/add-cane-plan-search-id', { params: { Rid: id, delete: 1 } })).data
};

export const monthlyEntryReportService = {
    getParameters: async () => (await apiClient.get('/main/monthly-entry-report-view')).data,
    getList: async (params = {}) => (await apiClient.get('/main/monthly-entry-report-view', { params })).data,
    getById: async (id) => (await apiClient.get('/main/monthly-entry-report', { params: { id } })).data,
    create: async (payload) => (await apiClient.post('/main/monthly-entry-report-2', payload)).data,
    update: async (id, payload) => (await apiClient.post('/main/monthly-entry-report-2', { ...payload, id })).data,
    deleteRecord: async (id) => (await apiClient.post('/main/monthly-entry-report-2', { id, Command: 'delete' })).data
};

export const labModulePermissionService = {
    getUsers: async (factoryCode = '') => (await apiClient.get('/user-management/get-user-fact-data', { params: { fcode: factoryCode } })).data,
    savePermissions: async (payload) => (await apiClient.post('/user-management/update-lap-notification', payload)).data
};
