import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import '../../styles/Report.css';
import { openPrintWindow } from '../../utils/print';

const AccountReports_SugarReport = () => {
    const navigate = useNavigate();
    const tableRef = useRef(null);

    // Form Search State
    const [unitCode, setUnitCode] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Mock Data mimicking the complex Sugar Report ViewModel
    const [reportMonths, setReportMonths] = useState([]);
    const [reportRows, setReportRows] = useState([]);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (fromDate) {
            const minDate = new Date('2022-10-01');
            const selectedDate = new Date(fromDate);
            if (selectedDate < minDate) {
                toast.error('Data not available before 01/10/2022.');
                setFromDate('');
                return;
            }
        }

        setIsLoading(true);
        // Simulate network API request
        setTimeout(() => {
            const months = ['Oct-23', 'Nov-23', 'Dec-23'];

            // Structured data mimicking the .NET HTML rows
            const rows = [
                { sr: "1", label: "Date of Start of Season (Cane Crushing)", um: "--", isBold: false, data: ["15.10.2023", "15.10.2023", "15.10.2023"] },
                { sr: "2", label: "No. of Days Plant Run", um: "Days", isBold: false, data: ["17", "30", "31"] },
                { sr: "3", label: "Cane Crushing:", um: "", isBold: true, isHeader: true, data: [] },
                { sr: "", label: "Opening Stock (+)", um: "QTL", isBold: false, data: ["0", "4500", "5200"] },
                { sr: "", label: "Cane Purchase (+) (at Centre and at Gate)", um: "QTL", isBold: false, data: ["120000", "350000", "410000"] },
                { sr: "", label: "Cane Purchase (received from Other Unit) (+)", um: "QTL", isBold: false, data: ["5000", "12000", "8000"] },
                { sr: "", label: "Cane sent to Other Unit (-)", um: "QTL", isBold: false, data: ["0", "0", "0"] },
                { sr: "", label: "Cane Crushed - Final Molasses (-)", um: "QTL", isBold: false, data: ["110000", "320000", "380000"] },
                { sr: "", label: "Closing Stock (at Centre and at Gate)", um: "QTL", isBold: false, data: ["4500", "5200", "6500"] },
                { sr: "4", label: "Sugar (including BISS) :", um: "", isBold: true, isHeader: true, data: [] },
                { sr: "", label: "Opening stock (Finished Sugar)", um: "", isBold: true, data: [] },
                { sr: "", label: "Sugar At Factory + depot (+)", um: "QTL", isBold: false, data: ["80000", "95000", "110000"] },
                { sr: "", label: "BISS (+)", um: "QTL", isBold: false, data: ["1500", "1200", "1000"] },
                { sr: "", label: "Sub Total (Opening Stock)", um: "QTL", isBold: true, data: ["81500", "96200", "111000"] },
                { sr: "", label: "Production (as per RG-1)", um: "", isBold: true, data: [] },
                { sr: "", label: "Finished Sugar from cane (+)", um: "QTL", isBold: false, data: ["45000", "130000", "155000"] },
                { sr: "", label: "Sub Total (Production)", um: "QTL", isBold: true, data: ["45000", "130000", "155000"] },
                { sr: "", label: "Sales :", um: "QTL", isBold: true, data: [] },
                { sr: "", label: "Finished Sugar (-)", um: "QTL", isBold: false, data: ["30000", "85000", "100000"] },
                { sr: "", label: "Export (-)", um: "QTL", isBold: false, data: ["0", "20000", "15000"] },
                { sr: "", label: "Total of Closing Stock", um: "QTL", isBold: true, data: ["96200", "111000", "141000"] },
                { sr: "5", label: "Sugar in Process:", um: "", isBold: true, isHeader: true, data: [] },
                { sr: "", label: "Opening Stock", um: "QTL", isBold: false, data: ["120", "150", "200"] },
                { sr: "", label: "Closing Stock", um: "QTL", isBold: false, data: ["150", "200", "180"] },
                { sr: "", label: "Recovery Derived", um: "%", isBold: true, data: ["9.45", "9.62", "9.81"] },
                { sr: "6", label: "Syrup : (Sugar Division)", um: "", isBold: true, isHeader: true, data: [] },
                { sr: "", label: "Opening stock (+)", um: "QTL", isBold: false, data: ["0", "500", "600"] },
                { sr: "", label: "Production -From Cane (+)", um: "QTL", isBold: false, data: ["1500", "4000", "5200"] },
                { sr: "", label: "Closing Stock", um: "QTL", isBold: false, data: ["500", "600", "800"] }
            ];

            setReportMonths(months);
            setReportRows(rows);
            setIsLoading(false);
            toast.success('Sugar Report generated successfully!');
        }, 800);
    };

    const handleExport = () => {
        if (reportRows.length === 0) {
            toast.error("No data to export!");
            return;
        }
        toast.error("Export to Excel functionality requires a library like xlsx.");
    };

    const handlePrint = () => {
        if (reportRows.length === 0) {
            toast.error("No data to print!");
            return;
        }
        openPrintWindow({
            title: "Sugar Report",
            subtitle: `From: ${fromDate || 'N/A'} To: ${toDate || 'N/A'}`,
            contentHtml: tableRef.current ? tableRef.current.outerHTML : ""
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
            <Toaster position="top-right" />
            <div className="page-content">

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-700 to-teal-500 px-6 py-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-700 tracking-tight">
                                Sugar Report
                            </h2>
                        </div>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSearch}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Units</label>
                                    <select
                                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 py-3 text-sm bg-slate-50"
                                        value={unitCode}
                                        onChange={(e) => setUnitCode(e.target.value)}
                                    >
                                        <option value="">-- All Units --</option>
                                        <option value="1">Unit 1</option>
                                        <option value="2">Unit 2</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">From Date</label>
                                    <input
                                        type="date"
                                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 py-3 text-sm bg-slate-50"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">To Date</label>
                                    <input
                                        type="date"
                                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 py-3 text-sm bg-slate-50"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                                <button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 text-slate-700 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center">
                                    {isLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-search mr-2"></i>}
                                    Search
                                </button>
                                <button type="button" onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-slate-700 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center">
                                    <i className="fas fa-file-excel mr-2"></i> Export
                                </button>
                                <button type="button" onClick={handlePrint} className="bg-sky-600 hover:bg-sky-700 text-slate-700 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center">
                                    <i className="fas fa-print mr-2"></i> Print
                                </button>
                                <button type="button" onClick={() => navigate(-1)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl shadow-sm border border-slate-200 transition-colors ml-auto flex items-center">
                                    <i className="fas fa-sign-out-alt mr-2"></i> Exit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Report Table Data */}
                {reportRows.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="overflow-x-auto max-h-[700px]">
                            <table ref={tableRef} className="min-w-full divide-y divide-slate-200 border-collapse">
                                <thead className="bg-teal-50 sticky top-0 z-20 shadow-sm">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-sm font-bold text-slate-800 sticky left-0 bg-teal-100 z-30 whitespace-nowrap border-b border-r border-teal-200 w-16">
                                            Sr.No.
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-slate-800 sticky left-16 bg-teal-100 z-30 whitespace-nowrap border-b border-r border-teal-200 min-w-[350px]">
                                            Particulars
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-center text-sm font-bold text-slate-800 sticky left-[414px] bg-teal-100 z-30 whitespace-nowrap border-b border-r border-teal-200">
                                            U/M
                                        </th>
                                        {reportMonths.map((m, idx) => (
                                            <th key={idx} scope="col" className="px-6 py-3 text-right text-sm font-bold text-slate-800 whitespace-nowrap border-b border-r border-teal-200 bg-teal-50">
                                                {m}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {reportRows.map((row, idx) => {
                                        const isMainHeader = row.isHeader;
                                        const bgClass = isMainHeader ? "bg-slate-100 text-teal-900" : "hover:bg-slate-50";
                                        const textClass = row.isBold ? "font-bold" : "font-medium text-slate-700";

                                        return (
                                            <tr key={idx} className={`${bgClass} transition-colors`}>
                                                <td className={`px-4 py-2 text-sm sticky left-0 bg-white border-r border-slate-200 z-10 ${isMainHeader ? 'bg-slate-100' : ''}`}>
                                                    {row.sr}
                                                </td>
                                                <td className={`px-6 py-2 text-sm sticky left-16 bg-white border-r border-slate-200 z-10 ${textClass} ${isMainHeader ? 'bg-slate-100' : ''}`}>
                                                    {row.label}
                                                </td>
                                                <td className={`px-4 py-2 text-sm text-center text-slate-500 sticky left-[414px] bg-white border-r border-slate-200 z-10 ${isMainHeader ? 'bg-slate-100' : ''}`}>
                                                    {!isMainHeader && row.um}
                                                </td>
                                                {reportMonths.map((m, mIdx) => (
                                                    <td key={mIdx} className={`px-6 py-2 text-sm text-right border-r border-slate-200 font-mono ${textClass}`}>
                                                        {row.data[mIdx] ? row.data[mIdx] : ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountReports_SugarReport;
