import { apiClient, unwrap, normalizeMassecuiteType } from './http.client';

export const labService = {
    getDailyAnalysis: async (params = {}) => {
        const isSingle = !!(params.DDATE && params.MILL_NO && (params.FACTORY || params.factory) && params.TIME1);
        const endpoint = isSingle ? '/lab/daily-lab-analysis-entry' : '/lab/daily-lab-analysis-view';
        const merged = { ...params, FACTORY: params.FACTORY || params.factory, factory: params.factory || params.FACTORY };
        const response = await apiClient.get(endpoint, { params: merged });
        return unwrap(response.data);
    },

    saveDailyAnalysis: async (data = {}) => {
        const isSugarBag = !!(data.H_DATE || data.TIME || data.COL2 !== undefined);
        const endpoint = isSugarBag ? '/lab/sugar-bag-produced-add-2' : '/lab/daily-lab-analysis-add-2';
        const response = await apiClient.post(endpoint, data);
        return response.data;
    },

    updateDailyAnalysis: async (id, data = {}) => {
        const response = await apiClient.post('/lab/daily-lab-analysis-add-2', { ...data, id: 'btupdate', Rid: id });
        return response.data;
    },

    deleteDailyAnalysis: async (params = {}) => {
        const response = await apiClient.get('/lab/daily-lab-analysis-add-delete', { params });
        return response.data;
    },

    getMassecuite: async (params = {}) => {
        const typeConfig = normalizeMassecuiteType(params.type);
        if (params.SLNO || params.id || params.Rid) {
            const response = await apiClient.get(`/lab/${typeConfig.base}-upid`, {
                params: { ...params, Rid: params.Rid || params.SLNO || params.id, id: params.id || params.SLNO || params.Rid }
            });
            return unwrap(response.data);
        }
        const response = await apiClient.get(`/lab/${typeConfig.base}`, { params });
        return unwrap(response.data);
    },

    getMassecuiteView: async (params = {}) => {
        const typeConfig = normalizeMassecuiteType(params.type);
        const response = await apiClient.get(`/lab/${typeConfig.view}`, {
            params: { ...params, FACTORY: params.factory || params.FACTORY, DDATE: params.date || params.DDATE }
        });
        return unwrap(response.data);
    },

    saveMassecuite: async (type, data) => {
        const typeConfig = normalizeMassecuiteType(type);
        const response = await apiClient.post(`/lab/${typeConfig.base}-2`, data);
        return response.data;
    },

    updateMassecuite: async (type, id, data) => {
        const typeConfig = normalizeMassecuiteType(type);
        const response = await apiClient.post(`/lab/${typeConfig.base}-2`, { ...data, id: 'btupdate', Rid: id, SLNO: id });
        return response.data;
    },

    deleteMassecuite: async (type, id) => {
        const typeConfig = normalizeMassecuiteType(type);
        const response = await apiClient.get(`/lab/${typeConfig.base}-delete`, { params: { Rid: id, SLNO: id, id } });
        return response.data;
    },

    getCanePlan: async (params) => unwrap((await apiClient.get('/lab/add-cane-plan-view', { params })).data),
    saveCanePlan: async (data) => (await apiClient.post('/lab/add-cane-plan-2', data)).data,
    deleteCanePlan: async (id) => (await apiClient.get('/lab/add-cane-plan-search-id', { params: { Rid: id, delete: 1 } })).data,

    getBMassecuiteView: async (factory, date) => unwrap((await apiClient.get('/lab/bmassecuite-view', { params: { factory, date, FACTORY: factory, DDATE: date } })).data),
    getCMassecuiteView: async (factory, date) => unwrap((await apiClient.get('/lab/cmassecuite-view', { params: { factory, date, FACTORY: factory, DDATE: date } })).data),
    getC1MassecuiteView: async (factory, date) => unwrap((await apiClient.get('/lab/c1-massecuite-view', { params: { factory, date, FACTORY: factory, DDATE: date } })).data),
    getR1View: async (factory, date) => unwrap((await apiClient.get('/lab/r1-view', { params: { factory, date, FACTORY: factory, DDATE: date } })).data),
    getR2View: async (factory, date) => unwrap((await apiClient.get('/lab/r2-view', { params: { factory, date, FACTORY: factory, DDATE: date } })).data),
    getBcMagmaView: async (factory, date) => unwrap((await apiClient.get('/lab/bc-magma-view', { params: { factory, date, FACTORY: factory, DDATE: date } })).data),
    getBcMagmaById: async (params = {}) => unwrap((await apiClient.get('/lab/bc-magma-upid', { params })).data),
    getMolassesAnalysisView: async (factory, date) => unwrap((await apiClient.get('/lab/molasses-analysis-view', { params: { factory, date, FACTORY: factory, DDATE: date } })).data),
    getMolassesAnalysisById: async (params = {}) => unwrap((await apiClient.get('/lab/molasses-analysis-upid', { params })).data),

    saveMolassesAnalysis: async (data) => (await apiClient.post('/lab/molasses-analysis-2', data)).data,
    deleteMolassesAnalysis: async (params = {}) => (await apiClient.get('/lab/molasses-analysis-delete', { params })).data,
    saveBcMagma: async (data) => (await apiClient.post('/lab/bc-magma-2', data)).data,
    deleteBcMagma: async (params = {}) => (await apiClient.get('/lab/bc-magma-delete', { params })).data,
    saveSugarBagProduced: async (data) => (await apiClient.post('/lab/sugar-bag-produced-add-2', data)).data,
    getSugarBagProducedView: async (factory, date) =>
        unwrap((await apiClient.get('/lab/sugar-bag-produced-view', { params: { factory, date, FACTORY: factory, H_DATE: date, DDATE: date } })).data)
};
