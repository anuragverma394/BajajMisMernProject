import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, reportService } from '../../microservices/api.service';

const formatTodayDmy = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const toDmy = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    return raw;
};

const valueOrZero = (value) => {
    if (value === null || value === undefined || value === '') return '0';
    return String(value);
};

const Report_TargetActualMISReport = () => {
    const navigate = useNavigate();
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [filters, setFilters] = useState({
        F_Code: '',
        Date: formatTodayDmy()
    });

    useEffect(() => {
        masterService.getUnits()
            .then((response) => {
                const data = Array.isArray(response) ? response : response?.data || [];
                setUnits(data);
            })
            .catch(() => {
                setUnits([]);
            });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearch = async () => {
        const date = toDmy(filters.Date);
        if (!date) {
            toast.error('Please select a date.');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                FactoryName: filters.F_Code || '0',
                CPDate: date
            };
            const response = await reportService.getTargetActualMISReport(payload);
            const data = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response)
                    ? response
                    : response?.recordsets?.[0] || response?.data || [];
            setRows(data);
            if (!data.length) {
                toast.error('No data found for the selected filters.');
            }
        } catch (error) {
            toast.error('Failed to fetch report data.');
        } finally {
            setLoading(false);
        }
    };

    const caneHeaders = useMemo(() => ['SYRUP', 'BHy', 'CHy', 'TOTAL'], []);
    const metricGroups = useMemo(() => ([
        { label: 'Pol%Cane', target: 'POL_PERC_TARGET', onDate: 'POL_PERC_ONDATE', toDate: 'POL_PERC_TODATE' },
        { label: 'Recovery%', target: 'REC_PERC_TARGET', onDate: 'REC_PERC_ONDATE', toDate: 'REC_PERC_TODATE' },
        { label: 'Production (Qtls)', target: 'SG_PROD_TARGET', onDate: 'SG_PROD_ONDATE', toDate: 'SG_PROD_TODATE' },
        { label: 'BH%', target: 'BH_PERC_TARGET', onDate: 'BH_PERC_ONDATE', toDate: 'BH_PERC_TODATE' },
        { label: 'BH QTY', target: 'BH_QTY_TARGET', onDate: 'BH_QTY_ONDATE', toDate: 'BH_QTY_TODATE' },
        { label: 'CH%', target: 'CH_PERC_TARGET', onDate: 'CH_PERC_ONDATE', toDate: 'CH_PERC_TODATE' },
        { label: 'CH QTY', target: 'CH_QTY_TARGET', onDate: 'CH_QTY_ONDATE', toDate: 'CH_QTY_TODATE' },
        { label: 'Loss In Molasses%Cane', target: 'MOL_PERC_BCHY_TARGET', onDate: 'MOL_PERC_BCHY_ONDATE', toDate: 'MOL_PERC_BCHY_TODATE' },
        { label: 'Steam % Cane', target: 'STCANE_PERC_TARGET', onDate: 'STCANE_PERC_ONDATE', toDate: 'STCANE_PERC_TODATE' },
        { label: 'Bagasse Saving %', target: 'BAGASE_PERC_TARGET', onDate: 'BAGASE_PERC_ONDATE', toDate: 'BAGASE_PERC_TODATE' },
        { label: 'Bagasse Produced Qty', target: 'BAGASE_QTY_TARGET', onDate: 'BAGASE_QTY_ONDATE', toDate: 'BAGASE_QTY_TODATE' },
        { label: 'Total Alcohol Production(LL)', target: 'ALHL_TOTAL_TARGET', onDate: 'ALHL_TOTAL_ONDATE', toDate: 'ALHL_TOTAL_TODATE' },
        { label: 'Power Produced (KWH)', target: 'POWER_PRODUCED_TARGET', onDate: 'POWER_PRODUCED_ONDATE', toDate: 'POWER_PRODUCED_TODATE' },
        { label: 'Power export (KWH)', target: 'POWER_EXPORT_TARGET', onDate: 'POWER_EXPORT_ONDATE', toDate: 'POWER_EXPORT_TODATE' }
    ]), []);

    return (
        <div className="min-h-screen bg-slate-50 p-4">
            <Toaster position="top-right" />

            <div className="rounded-lg border border-emerald-200 bg-white shadow-sm">
                <div className="rounded-t-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
                    Target VS Actual Report
                </div>
                <div className="space-y-4 p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-xs font-semibold text-slate-700">Factory</label>
                            <select
                                name="F_Code"
                                value={filters.F_Code}
                                onChange={handleChange}
                                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="">All</option>
                                {units.map((unit, idx) => (
                                    <option key={`${unit.F_Code || unit.id}-${idx}`} value={unit.F_Code || unit.id}>
                                        {unit.F_Name || unit.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold text-slate-700">Date</label>
                            <input
                                name="Date"
                                value={filters.Date}
                                onChange={handleChange}
                                placeholder="DD/MM/YYYY"
                                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex flex-wrap items-end gap-2">
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                                Print
                            </button>
                            <button
                                onClick={() => toast.success('Export queued.')}
                                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                                Excel
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                                Exit
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-emerald-200">
                        <table className="min-w-[2400px] border-collapse text-xs">
                            <thead>
                                <tr className="bg-emerald-50 text-emerald-800">
                                    <th rowSpan={3} className="border border-emerald-200 px-2 py-2 text-left">FACTORY</th>
                                    <th colSpan={4} className="border border-emerald-200 px-2 py-2 text-center">CANE PLANNING</th>
                                    <th colSpan={4} className="border border-emerald-200 px-2 py-2 text-center">Achieved</th>
                                    <th colSpan={4} className="border border-emerald-200 px-2 py-2 text-center">Bal.To Be Achieved</th>
                                    {metricGroups.map((group) => (
                                        <th key={group.label} colSpan={3} className="border border-emerald-200 px-2 py-2 text-center">
                                            {group.label}
                                        </th>
                                    ))}
                                </tr>
                                <tr className="bg-emerald-50 text-emerald-700">
                                    <th colSpan={12} className="border border-emerald-200 px-2 py-2 text-center">Cane (LQ)</th>
                                    {metricGroups.map((group) => (
                                        <th key={`${group.label}-sub`} colSpan={3} className="border border-emerald-200 px-2 py-2 text-center">
                                            TARGET / ONDATE / TODATE
                                        </th>
                                    ))}
                                </tr>
                                <tr className="bg-emerald-50 text-emerald-800">
                                    {caneHeaders.map((label, idx) => (
                                        <th key={`cp-${idx}`} className="border border-emerald-200 px-2 py-2 text-center">{label}</th>
                                    ))}
                                    {caneHeaders.map((label, idx) => (
                                        <th key={`ach-${idx}`} className="border border-emerald-200 px-2 py-2 text-center">{label}</th>
                                    ))}
                                    {caneHeaders.map((label, idx) => (
                                        <th key={`bal-${idx}`} className="border border-emerald-200 px-2 py-2 text-center">{label}</th>
                                    ))}
                                    {metricGroups.map((group) => (
                                        <React.Fragment key={`${group.label}-cols`}>
                                            <th className="border border-emerald-200 px-2 py-2 text-center">TARGET</th>
                                            <th className="border border-emerald-200 px-2 py-2 text-center">ONDATE</th>
                                            <th className="border border-emerald-200 px-2 py-2 text-center">TODATE</th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={1 + 12 + metricGroups.length * 3} className="border border-emerald-100 px-4 py-10 text-center text-slate-400">
                                            No data found. Select a factory and date, then click Search.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row, idx) => {
                                        const isSummary = ['WZ', 'CZ', 'EZ', 'TOTAL'].includes(String(row.FACTORY || '').toUpperCase());
                                        return (
                                            <tr key={`${row.FACTORY || 'row'}-${idx}`} className={isSummary ? 'bg-emerald-100 font-semibold' : 'bg-white'}>
                                                <td className="border border-emerald-100 px-2 py-1 text-left">{row.FACTORY || '-'}</td>
                                                <td className="border border-emerald-100 px-2 py-1 text-center">{valueOrZero(row.CPSYRUP)}</td>
                                                <td className="border border-emerald-100 px-2 py-1 text-center">{valueOrZero(row.CPBHY)}</td>
                                                <td className="border border-emerald-100 px-2 py-1 text-center">{valueOrZero(row.CPFM)}</td>
                                                <td className="border border-emerald-100 px-2 py-1 text-center">{valueOrZero(row.CPTOTAL)}</td>
                                                <td className="border border-emerald-100 px-2 py-1 text-center">{valueOrZero(row.ACH_SYRUP)}</td>
                                                <td className="border border-emerald-100 px-2 py-1 text-center">{valueOrZero(row.ACH_BHY)}</td>
                                                <td className="border border-emerald-100 px-2 py-1 text-center">{valueOrZero(row.ACH_FM)}</td>
                                                <td className="border border-emerald-100 px-2 py-1 text-center">{valueOrZero(row.ACHTOTAL)}</td>
                                                <td className="border border-emerald-100 px-2 py-1 text-center">{valueOrZero(row.BL_ACH_SYRUP)}</td>
                                                <td className="border border-emerald-100 px-2 py-1 text-center">{valueOrZero(row.BL_ACH_BHY)}</td>
                                                <td className="border border-emerald-100 px-2 py-1 text-center">{valueOrZero(row.BL_ACH_FM)}</td>
                                                <td className="border border-emerald-100 px-2 py-1 text-center">{valueOrZero(row.BLTOTAL)}</td>
                                                {metricGroups.map((group) => (
                                                    <React.Fragment key={`${group.label}-${idx}`}>
                                                        <td className="border border-emerald-100 px-2 py-1 text-center">
                                                            {valueOrZero(row[group.target])}
                                                        </td>
                                                        <td className="border border-emerald-100 px-2 py-1 text-center">
                                                            {valueOrZero(row[group.onDate])}
                                                        </td>
                                                        <td className="border border-emerald-100 px-2 py-1 text-center">
                                                            {valueOrZero(row[group.toDate])}
                                                        </td>
                                                    </React.Fragment>
                                                ))}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Report_TargetActualMISReport;
