import { apiClient, unwrap } from './http.client';

export const userManagementService = {
    getUsers: async (params) => {
        const response = await apiClient.get('/user-management/users', { params });
        return unwrap(response.data);
    },

    getUserTypes: async () => {
        const response = await apiClient.get('/user-management/user-types');
        return unwrap(response.data);
    },

    getUsersByFactory: async (fcode) => {
        const response = await apiClient.get('/user-management/get-user-data-by-fact1', { params: { F_code: fcode } });
        return unwrap(response.data);
    },

    getUserRightsView: async (params = {}) => {
        const response = await apiClient.get('/user-management/add-user-view-right', { params });
        return unwrap(response.data);
    },

    createUser: async (userData) => {
        const response = await apiClient.post('/user-management/users', userData);
        return response.data;
    },

    getRoles: async (params = {}) => {
        const response = await apiClient.get('/user-management/roles', { params });
        return unwrap(response.data);
    },

    getRoleByCode: async (roleCode) => {
        const response = await apiClient.get('/user-management/add-roll', { params: { sid: roleCode } });
        return unwrap(response.data);
    },

    getRolePermissions: async (roleCode = '') => {
        const response = await apiClient.get('/user-management/add-user-roll-data', { params: { R_Code: roleCode } });
        return unwrap(response.data);
    },

    getModeGroups: async () => {
        const response = await apiClient.get('/main/add-mode-group-view', { params: { Commmand: 'Search' } });
        return unwrap(response.data);
    },

    getUserByCode: async (userId) => {
        const response = await apiClient.get(`/user-management/user-details/${userId}`);
        return unwrap(response.data);
    },

    getRollData: async (params) => {
        const response = await apiClient.get('/user-management/get-roll-data-single', { params });
        return unwrap(response.data);
    },

    getRollDetails: async (rcodes) => {
        const payload = { rcode: JSON.stringify(Array.isArray(rcodes) ? rcodes : []) };
        const response = await apiClient.post('/user-management/roll-detail-data', payload);
        return unwrap(response.data);
    },

    getRollModules: async (params) => {
        const response = await apiClient.get('/user-management/roll-modual-data', { params });
        return unwrap(response.data);
    },

    saveUserRights: async (payload = {}) => {
        const command = String(payload.Command || '').toLowerCase();
        const normalized = { ...payload, Command: command === 'update' || command === 'btupdate' ? 'btupdate' : 'btninsert' };
        const response = await apiClient.post('/user-management/add-user-right-insert', normalized);
        return response.data;
    },

    saveRole: async (payload = {}) => {
        const command = String(payload.Command || '').toLowerCase();
        const normalized = { ...payload, Command: command === 'btupdate' ? 'btupdate' : 'btninsert' };
        const response = await apiClient.post('/user-management/add-roll-2', normalized);
        return response.data;
    },

    deleteUserRights: async (id, userId) => {
        const response = await apiClient.get('/user-management/btndelete-click', { params: { id, Userid: userId } });
        return response.data;
    }
};
