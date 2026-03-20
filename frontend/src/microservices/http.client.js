/**
 * http.client.js
 * Shared Axios instance + interceptors + utility helpers.
 * Import this in every service file.
 */
import axios from 'axios';

export const apiClient = axios.create({
    baseURL:
        import.meta.env.VITE_MICROSERVICE_GATEWAY_URL ||
        import.meta.env.VITE_API_GATEWAY_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' }
});

// ── Helpers ────────────────────────────────────────────────────────────────
export const isDev = Boolean(import.meta?.env?.DEV);

export const unwrap = (payload) =>
    payload && payload.data !== undefined ? payload.data : payload;

export const normalizeIsoDate = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const ddmmyyyy = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (ddmmyyyy) {
        const [, dd, mm, yyyy] = ddmmyyyy;
        return `${yyyy}-${mm}-${dd}`;
    }
    return '';
};

export const toLegacyDateRange = (params = {}) => {
    const fromRaw = params.dateFrom || params.fromDate || params.DtFrom || '';
    const toRaw = params.dateTo || params.toDate || params.DtTo || '';
    const from = normalizeIsoDate(fromRaw);
    const to = normalizeIsoDate(toRaw);
    if (!from || !to) return '';
    return `${from} - ${to}`;
};

export const massecuiteRouteMap = {
    A: { base: 'amassecuite', view: 'amassecuite-view' },
    A1: { base: 'a1-massecuite', view: 'a1-massecuite-view' },
    B: { base: 'bmassecuite', view: 'bmassecuite-view' },
    C: { base: 'cmassecuite', view: 'cmassecuite-view' },
    C1: { base: 'c1-massecuite', view: 'c1-massecuite-view' },
    R1: { base: 'r1', view: 'r1-view' },
    R2: { base: 'r2', view: 'r2-view' }
};

export const normalizeMassecuiteType = (type) =>
    massecuiteRouteMap[String(type || '').toUpperCase()] || massecuiteRouteMap.A;

// ── Debug helpers (dev only) ───────────────────────────────────────────────
const collectDuplicateRecords = (rows = [], pickKey) => {
    const bucket = new Map();
    rows.forEach((row, index) => {
        const raw = pickKey(row);
        const key = raw === undefined || raw === null || String(raw).trim() === '' ? '' : String(raw).trim();
        if (!key) return;
        if (!bucket.has(key)) bucket.set(key, []);
        bucket.get(key).push({ index, row });
    });
    return Array.from(bucket.entries()).filter(([, items]) => items.length > 1);
};

export const debugDuplicateRecords = (label, rows, pickKey) => {
    if (!isDev || !Array.isArray(rows) || !rows.length) return;
    const duplicates = collectDuplicateRecords(rows, pickKey);
    if (!duplicates.length) return;
    console.warn(`[KEY_DEBUG] Duplicate keys in ${label}`,
        duplicates.map(([key, items]) => ({ key, count: items.length, records: items.map((e) => e.row) }))
    );
};

export const debugDuplicateIdsInPayload = (payload, endpoint = '') => {
    if (!isDev || payload === null || payload === undefined) return;
    const datasets = Array.isArray(payload)
        ? [{ label: 'root', rows: payload }]
        : Object.entries(payload || {})
            .filter(([, value]) => Array.isArray(value))
            .map(([name, value]) => ({ label: name, rows: value }));
    datasets.forEach(({ label, rows }) => {
        if (!rows.length || typeof rows[0] !== 'object' || rows[0] === null) return;
        debugDuplicateRecords(
            `${endpoint || 'response'}:${label}`,
            rows,
            (row) => row?.id ?? row?.ID ?? row?.f_Code ?? row?.F_Code ?? row?.Code ?? row?.code
        );
    });
};

export const normalizeUnitsList = (payload) => {
    const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.recordsets?.[0])
                ? payload.recordsets[0]
                : [];
    const seen = new Set();
    const normalizedRows = rows.map((row) => {
        const code = String(row?.f_Code ?? row?.F_Code ?? row?.id ?? '').trim();
        const name = String(row?.F_Name ?? row?.f_Name ?? row?.name ?? '').trim();
        return {
            ...row,
            f_Code: code || row?.f_Code || row?.F_Code || row?.id || '',
            F_Code: code || row?.F_Code || row?.f_Code || row?.id || '',
            id: code || row?.id || '',
            F_Name: name || row?.F_Name || row?.f_Name || row?.name || ''
        };
    });
    debugDuplicateRecords('masterService.getUnits', normalizedRows, (row) => row?.id || row?.F_Code || row?.f_Code);
    return normalizedRows.filter((row, index) => {
        const key = String(row.id || row.F_Code || row.f_Code || `idx-${index}`);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export const buildDashboardPayload = (params = {}, defaultType) => {
    const dateFrom = normalizeIsoDate(params.dateFrom || params.fromDate || params.DtFrom || '');
    const dateTo = normalizeIsoDate(params.dateTo || params.toDate || params.DtTo || '');
    return {
        ...params,
        dateFrom: dateFrom || params.dateFrom,
        dateTo: dateTo || params.dateTo,
        F_Code: params.factoryCode || params.F_Code || '',
        txtdaterange: params.txtdaterange || (dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : ''),
        ...(defaultType ? { Type: params.type || defaultType } : {})
    };
};

export const postDashboard = async (path, params = {}, defaultType) => {
    const payload = buildDashboardPayload(params, defaultType);
    const response = await apiClient.post(path, payload);
    return response.data;
};

// ── Request interceptor: attach JWT ───────────────────────────────────────
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: 401 → logout, debug duplicates ─────────────────
apiClient.interceptors.response.use(
    (response) => {
        debugDuplicateIdsInPayload(response?.data, response?.config?.url || '');
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
