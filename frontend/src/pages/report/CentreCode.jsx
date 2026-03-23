import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaFileExcel, FaSearch } from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, reportService } from '../../microservices/api.service';
import '../../styles/base.css';
import '../../styles/Report.css';

const formatDdMmYyyy = (date = new Date()) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = String(date.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
};

const normalizeUnit = (u) => ({
    code: String(u?.F_Code || u?.f_Code || u?.id || '').trim(),
    name: String(u?.F_Name || u?.f_Name || u?.name || '').trim()
});

const Report_CentreCode = () => {
    const tableRef = useRef(null);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [societyRows, setSocietyRows] = useState([]);

    const [filters, setFilters] = useState({
        unit: '',
        fromDate: formatDdMmYyyy(new Date()),
        toDate: formatDdMmYyyy(new Date())
    });

    useEffect(() => {
        masterService
            .getUnits()
            .then((d) => {
                const list = Array.isArray(d) ? d.map(normalizeUnit).filter((u) => u.code) : [];
                setUnits(list);
            })
            .catch(() => { });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!filters.unit) {
            toast.error('Please select a unit.');
            return;
        }
        if (!filters.fromDate || !filters.toDate) {
            toast.error('Please select date range.');
            return;
        }
        setLoading(true);
        try {
            const response = await reportService.getCentreCode({
                F_code: filters.unit,
                FormDate: filters.fromDate,
                ToDate: filters.toDate
            });
            const payload = response?.data;
            if (Array.isArray(payload)) {
                setRows(payload);
                setSocietyRows([]);
                if (!payload.length) toast('No data found.');
            } else {
                const centres = Array.isArray(payload?.centres) ? payload.centres : [];
                const societies = Array.isArray(payload?.societies) ? payload.societies : [];
                setRows(centres);
                setSocietyRows(societies);
                if (!centres.length && !societies.length) toast('No data found.');
            }
        } catch (error) {
            console.error('CentreCode fetch failed', error);
            toast.error('Failed to load report.');
            setRows([]);
            setSocietyRows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!rows.length && !societyRows.length) {
            toast.error('No data to export.');
            return;
        }
        if (window.exportTableToCSV) {
            window.exportTableToCSV('centre-code-table', 'CentreCodeReport.csv');
            if (societyRows.length) {
                window.exportTableToCSV('society-code-table', 'SocietyWisePurchase.csv');
            }
            return;
        }
        toast.error('Export utility not available.');
    };

    const totals = useMemo(() => {
        const t = {
            earlyW: 0, earlyA: 0,
            generalW: 0, generalA: 0,
            rejectedW: 0, rejectedA: 0,
            burntW: 0, burntA: 0,
            totalW: 0, totalA: 0
        };
        rows.forEach((r) => {
            const earlyW = Number(r.Early_Value || 0);
            const earlyA = Number(r.Early_Amount || 0);
            const generalW = Number(r.Genral_Value || 0);
            const generalA = Number(r.Genral_Amount || 0);
            const rejectedW = Number(r.Rejected_Value || 0);
            const rejectedA = Number(r.Rejected_Amount || 0);
            const burntW = Number(r.BurntCane_Value || 0);
            const burntA = Number(r.BurntCane_Amount || 0);
            t.earlyW += earlyW; t.earlyA += earlyA;
            t.generalW += generalW; t.generalA += generalA;
            t.rejectedW += rejectedW; t.rejectedA += rejectedA;
            t.burntW += burntW; t.burntA += burntA;
            t.totalW += earlyW + generalW + rejectedW + burntW;
            t.totalA += earlyA + generalA + rejectedA + burntA;
        });
        return t;
    }, [rows]);

    return (
        <div className="report-container animate-in fade-in duration-500">
            <Toaster position="top-right" />
            <div className="report-card">
                <div className="report-card-header">
                    <h2 className="report-card-title">
                        Centre/Variety Group Wise Cane Purchase Report
                    </h2>
                </div>

                <div className="report-card-content">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="report-form-group">
                            <label htmlFor="unit">Units</label>
                            <select
                                id="unit"
                                name="unit"
                                className="report-form-control"
                                value={filters.unit}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Unit</option>
                                {units.map((u) => (
                                    <option key={u.code} value={u.code}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="report-form-group">
                            <label htmlFor="fromDate">Form Date</label>
                            <input
                                type="text"
                                id="fromDate"
                                name="fromDate"
                                className="report-form-control"
                                placeholder="dd/MM/yyyy"
                                value={filters.fromDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="report-form-group">
                            <label htmlFor="toDate">To Date</label>
                            <input
                                type="text"
                                id="toDate"
                                name="toDate"
                                className="report-form-control"
                                placeholder="dd/MM/yyyy"
                                value={filters.toDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="md:col-span-3 flex gap-4">
                            <button type="submit" className="report-btn report-btn-success" disabled={loading}>
                                <FaSearch /> {loading ? 'Loading...' : 'Search'}
                            </button>
                            <button type="button" className="report-btn report-btn-primary" onClick={handleExport}>
                                <FaFileExcel /> Excel
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="report-card">
                <div className="report-card-content">
                    <div className="report-table-container">
                        <table className="report-table" id="centre-code-table" ref={tableRef}>
                            <thead>
                                <tr>
                                    <th rowSpan="2">SI</th>
                                    <th rowSpan="2">Centre Code</th>
                                    <th rowSpan="2">Centre Name</th>
                                    <th rowSpan="2">Distance(Km.)</th>
                                    <th colSpan="3" className="text-center">Early</th>
                                    <th colSpan="3" className="text-center">General</th>
                                    <th colSpan="3" className="text-center">Rejected</th>
                                    <th colSpan="3" className="text-center">Burnt</th>
                                    <th colSpan="2" className="text-center">Total</th>
                                </tr>
                                <tr>
                                    <th>Rate</th><th>Weight(Q)</th><th>Amount</th>
                                    <th>Rate</th><th>Weight(Q)</th><th>Amount</th>
                                    <th>Rate</th><th>Weight(Q)</th><th>Amount</th>
                                    <th>Rate</th><th>Weight(Q)</th><th>Amount</th>
                                    <th>Weight(Q)</th><th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan="18" className="text-center py-8 text-slate-400">
                                            {loading ? 'Loading...' : 'No data found. Please select filters and click Search.'}
                                        </td>
                                    </tr>
                                )}
                                {rows.map((r, idx) => {
                                    const earlyW = Number(r.Early_Value || 0);
                                    const earlyA = Number(r.Early_Amount || 0);
                                    const generalW = Number(r.Genral_Value || 0);
                                    const generalA = Number(r.Genral_Amount || 0);
                                    const rejectedW = Number(r.Rejected_Value || 0);
                                    const rejectedA = Number(r.Rejected_Amount || 0);
                                    const burntW = Number(r.BurntCane_Value || 0);
                                    const burntA = Number(r.BurntCane_Amount || 0);
                                    const burntRate = burntW > 0 ? (burntA / burntW) : 0;
                                    return (
                                        <tr key={`${r.CentreCode}-${idx}`}>
                                            <td>{idx + 1}</td>
                                            <td>{r.CentreCode}</td>
                                            <td>{r.CentreName}</td>
                                            <td className="text-right">{Number(r.c_Distance || 0).toFixed(2)}</td>
                                            <td className="text-right">{Number(r.Early_Rate || 0).toFixed(2)}</td>
                                            <td className="text-right">{earlyW}</td>
                                            <td className="text-right">{earlyA}</td>
                                            <td className="text-right">{Number(r.Genral_Rate || 0).toFixed(2)}</td>
                                            <td className="text-right">{generalW}</td>
                                            <td className="text-right">{generalA}</td>
                                            <td className="text-right">{Number(r.Rejected_Rate || 0).toFixed(2)}</td>
                                            <td className="text-right">{rejectedW}</td>
                                            <td className="text-right">{rejectedA}</td>
                                            <td className="text-right">{burntRate.toFixed(2)}</td>
                                            <td className="text-right">{burntW}</td>
                                            <td className="text-right">{burntA}</td>
                                            <td className="text-right">{earlyW + generalW + rejectedW + burntW}</td>
                                            <td className="text-right">{earlyA + generalA + rejectedA + burntA}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {rows.length > 0 && (
                                <tfoot>
                                    <tr>
                                        <th colSpan="4" className="text-right">Total:</th>
                                        <th></th>
                                        <th className="text-right">{totals.earlyW}</th>
                                        <th className="text-right">{totals.earlyA}</th>
                                        <th></th>
                                        <th className="text-right">{totals.generalW}</th>
                                        <th className="text-right">{totals.generalA}</th>
                                        <th></th>
                                        <th className="text-right">{totals.rejectedW}</th>
                                        <th className="text-right">{totals.rejectedA}</th>
                                        <th></th>
                                        <th className="text-right">{totals.burntW}</th>
                                        <th className="text-right">{totals.burntA}</th>
                                        <th className="text-right">{totals.totalW}</th>
                                        <th className="text-right">{totals.totalA}</th>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>

            <div className="report-card">
                <div className="report-card-content">
                    <div className="report-table-container">
                        <table className="report-table" id="society-code-table">
                            <thead>
                                <tr>
                                    <th rowSpan="2">SI</th>
                                    <th rowSpan="2">Society Code</th>
                                    <th rowSpan="2">Society Name</th>
                                    <th rowSpan="2">Gate/Centre</th>
                                    <th colSpan="2" className="text-center">Early</th>
                                    <th colSpan="2" className="text-center">General</th>
                                    <th colSpan="2" className="text-center">Rejected</th>
                                    <th colSpan="2" className="text-center">Burnt</th>
                                    <th colSpan="2" className="text-center">Total</th>
                                </tr>
                                <tr>
                                    <th>Weight(Q)</th><th>Amount</th>
                                    <th>Weight(Q)</th><th>Amount</th>
                                    <th>Weight(Q)</th><th>Amount</th>
                                    <th>Weight(Q)</th><th>Amount</th>
                                    <th>Weight(Q)</th><th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {societyRows.length === 0 && (
                                    <tr>
                                        <td colSpan="14" className="text-center py-8 text-slate-400">
                                            {loading ? 'Loading...' : 'No data found. Please select filters and click Search.'}
                                        </td>
                                    </tr>
                                )}
                                {societyRows.map((row, idx) => {
                                    const isTotalRow = ['total gate', 'total centre', 'grand total'].includes(
                                        String(row.Type || '').toLowerCase()
                                    );
                                    if (isTotalRow) {
                                        return (
                                            <tr key={`${row.Type}-${idx}`} className="bg-green-100 font-semibold">
                                                <td colSpan="4" className="text-right">{row.Type}:</td>
                                                <td className="text-right">{Number(row.Early_Weight || 0).toFixed(2)}</td>
                                                <td className="text-right">{Number(row.Early_Amount || 0).toFixed(2)}</td>
                                                <td className="text-right">{Number(row.General_Weight || 0).toFixed(2)}</td>
                                                <td className="text-right">{Number(row.General_Amount || 0).toFixed(2)}</td>
                                                <td className="text-right">{Number(row.Rejected_Weight || 0).toFixed(2)}</td>
                                                <td className="text-right">{Number(row.Rejected_Amount || 0).toFixed(2)}</td>
                                                <td className="text-right">{Number(row.Burnt_Weight || 0).toFixed(2)}</td>
                                                <td className="text-right">{Number(row.Burnt_Amount || 0).toFixed(2)}</td>
                                                <td className="text-right">{Number(row.Weight || 0).toFixed(2)}</td>
                                                <td className="text-right">{Number(row.Amount || 0).toFixed(2)}</td>
                                            </tr>
                                        );
                                    }
                                    const currentCode = String(row.so_code || '');
                                    const prevCode = idx > 0 ? String(societyRows[idx - 1].so_code || '') : '';
                                    const showCode = currentCode && currentCode !== prevCode;
                                    const labelIndex = showCode ? societyRows.filter((r, i) => i <= idx && String(r.so_code || '') !== '' && (i === 0 || String(societyRows[i - 1].so_code || '') !== String(r.so_code || ''))).length : '';
                                    return (
                                        <tr key={`${row.so_code || 'x'}-${row.Type}-${idx}`}>
                                            <td>{showCode ? labelIndex : ''}</td>
                                            <td>{showCode ? row.so_code : ''}</td>
                                            <td>{showCode ? row.SO_Name : ''}</td>
                                            <td>{row.Type}</td>
                                            <td className="text-right">{Number(row.Early_Weight || 0).toFixed(2)}</td>
                                            <td className="text-right">{Number(row.Early_Amount || 0).toFixed(2)}</td>
                                            <td className="text-right">{Number(row.General_Weight || 0).toFixed(2)}</td>
                                            <td className="text-right">{Number(row.General_Amount || 0).toFixed(2)}</td>
                                            <td className="text-right">{Number(row.Rejected_Weight || 0).toFixed(2)}</td>
                                            <td className="text-right">{Number(row.Rejected_Amount || 0).toFixed(2)}</td>
                                            <td className="text-right">{Number(row.Burnt_Weight || 0).toFixed(2)}</td>
                                            <td className="text-right">{Number(row.Burnt_Amount || 0).toFixed(2)}</td>
                                            <td className="text-right">{Number(row.Weight || 0).toFixed(2)}</td>
                                            <td className="text-right">{Number(row.Amount || 0).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Report_CentreCode;
