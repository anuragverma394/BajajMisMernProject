import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import '../../styles/Report.css';
import '../../styles/Report.css';

const AccountReports_CogenReport = () => {
    const navigate = useNavigate();
    const tableRef = useRef(null);

    // Form Search State
    const [unitCode, setUnitCode] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Mock Data mimicking the complex Cogen Report ViewModel mapping
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
        // Simulate network API request to load the ViewModel MonthlyData breakdown
        setTimeout(() => {
            const months = ['Oct-23', 'Nov-23', 'Dec-23'];

            // Structured data mimicking the .NET HTML rows from CogenReportViewModel
            const rows = [
                { sr: "1", label: "Co Gen Start date", um: "--", isBold: false, data: ["15.10.2023", "15.10.2023", "15.10.2023"] },
                { sr: "2", label: "Co Gen Run days", um: "Days", isBold: false, data: ["17", "30", "31"] },
                { sr: "3", label: "Own Bagasse", um: "", isBold: true, data: [] },
                { sr: "", label: "Opening Stock (+)", um: "QTL", isBold: false, data: ["0", "4500", "5200"] },
                { sr: "", label: "Recd from Self Sugar Plant (+)", um: "QTL", isBold: false, data: ["120000", "350000", "410000"] },
                { sr: "", label: "Recd from Other Plants (Qty as per MM) (+)", um: "QTL", isBold: false, data: ["5000", "12000", "8000"] },
                { sr: "", label: "Consumption (-)", um: "QTL", isBold: false, data: ["115000", "310000", "390000"] },
                { sr: "", label: "Transfer to Distt Division (-)", um: "QTL", isBold: false, data: ["2000", "5000", "8000"] },
                { sr: "", label: "Excess / (Shortage) (+ / -)", um: "QTL", isBold: false, data: ["0", "0", "0"] },
                { sr: "", label: "Closing Stock Derived", um: "QTL", isBold: true, data: ["4500", "5200", "8000"] },
                { sr: "4", label: "Bagasse Purchased from Outside Vendors", um: "", isBold: true, data: [] },
                { sr: "", label: "Opening Stock (+)", um: "QTL", isBold: false, data: ["150", "300", "450"] },
                { sr: "", label: "Purchase from Outside (+)", um: "QTL", isBold: false, data: ["1200", "800", "2000"] },
                { sr: "", label: "Consumption (-)", um: "QTL", isBold: false, data: ["1050", "650", "2250"] },
                { sr: "", label: "Closing Stock", um: "QTL", isBold: true, data: ["300", "450", "200"] },
                { sr: "5", label: "LIVE STEAM", um: "", isBold: true, data: [] },
                { sr: "", label: "Bagasse Consumed(-)", um: "QTL", isBold: false, data: ["116050", "310650", "392250"] },
                { sr: "", label: "Bio Gas Consumed in Boiler (-)", um: "NMQ", isBold: false, data: ["500", "800", "1200"] },
                { sr: "", label: "Slop Consumed In Boiler (-)", um: "QTL", isBold: false, data: ["150", "350", "600"] },
                { sr: "", label: "Live steam Generated from Bagasse", um: "MT", isBold: false, data: ["24500", "65000", "82000"] },
                { sr: "", label: "(Sub Total of Steam generation)", um: "MT", isBold: true, data: ["24800", "65500", "82800"] },
                { sr: "", label: "Live steam received from Distillery Boiler", um: "MT", isBold: false, data: ["50", "80", "120"] },
                { sr: "", label: "Live steam given to Sugar Division(-)", um: "MT", isBold: false, data: ["18000", "48000", "62000"] },
                { sr: "", label: "Live steam given to Distillery Division (-)", um: "MT", isBold: false, data: ["4000", "12000", "15000"] },
                { sr: "6", label: "EXHAUST STEAM", um: "", isBold: true, data: [] },
                { sr: "", label: "Exhaust Steam Generated (+)", um: "MT", isBold: false, data: ["15000", "35000", "45000"] },
                { sr: "", label: "Exhaust Steam Given to Sugar Division(-)", um: "MT", isBold: false, data: ["12000", "28000", "38000"] },
                { sr: "", label: "Exhaust Steam Given to Distillery (-)", um: "MT", isBold: false, data: ["2500", "6000", "6500"] },
                { sr: "7", label: "Power", um: "", isBold: true, data: [] },
                { sr: "", label: "Production of Power (+)", um: "KWH", isBold: false, data: ["1850000", "4500000", "5800000"] },
                { sr: "", label: "Power Export to UPPCL (-)", um: "KWH", isBold: false, data: ["800000", "2500000", "3200000"] },
                { sr: "", label: "Power Banked during the month (-)", um: "KWH", isBold: false, data: ["150000", "350000", "450000"] },
                { sr: "", label: "Power Transfer to Sugar Division (-)", um: "KWH", isBold: false, data: ["800000", "1450000", "1850000"] },
                { sr: "8", label: "Banked Power", um: "", isBold: true, data: [] },
                { sr: "", label: "Opening Stock - Banked with UPPCL", um: "KWH", isBold: false, data: ["0", "150000", "500000"] },
                { sr: "", label: "Power Banked during the month(as above)(+)", um: "KWH", isBold: false, data: ["150000", "350000", "450000"] },
                { sr: "", label: "Closing Stock (Banking power with UPPCL)", um: "KWH", isBold: true, data: ["150000", "500000", "950000"] },
                { sr: "", label: "Ratio", um: "", isBold: true, data: [] },
                { sr: "", label: "Bagasse to Steam Ratio", um: "%", isBold: false, data: ["2.10", "2.09", "2.08"] }
            ];

            setReportMonths(months);
            setReportRows(rows);
            setIsLoading(false);
            toast.success('Cogen Report generated successfully!');
        }, 800);
    };

    const handleExport = () => {
        if (reportRows.length === 0) {
            toast.error("No data to export!");
            return;
        }
        toast.error("Export to Excel functionality requires external library mapping.");
    };

    const handlePrint = () => {
        if (reportRows.length === 0) {
            toast.error("No data to print!");
            return;
        }

        const printContent = tableRef.current.outerHTML;
        const printWindow = window.open('', '_blank', 'width=1000,height=1000');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Cogen Report Print</title>
                    <style>
                        body { font-family: sans-serif; }
                        h2, h4 { text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                        th, td { border: 1px solid black; padding: 4px; text-align: right; }
                        th { background-color: #f2f2f2; text-align: center; }
                        td:nth-child(2) { text-align: left; }
                        .bold td { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h2>Bajaj Group</h2>
                    <h4>Cogen Report</h4>
                    <p>From: ${fromDate || 'N/A'} To: ${toDate || 'N/A'}</p>
                    ${printContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <div className="cogen-report-container animate-in fade-in duration-500">
            <Toaster position="top-right" />
            <div className="page-content">

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-700 tracking-tight flex items-center gap-2">
                                <i className="fas fa-bolt"></i> Cogen Report
                            </h2>
                        </div>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSearch}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Units</label>
                                    <select
                                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 py-3 text-sm bg-slate-50"
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
                                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 py-3 text-sm bg-slate-50"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">To Date</label>
                                    <input
                                        type="date"
                                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 py-3 text-sm bg-slate-50"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                                <button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-slate-700 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center">
                                    {isLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-search mr-2"></i>}
                                    Search
                                </button>
                                <button type="button" onClick={handleExport} className="bg-teal-600 hover:bg-teal-700 text-slate-700 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center">
                                    <i className="fas fa-file-excel mr-2"></i> Export
                                </button>
                                <button type="button" onClick={handlePrint} className="bg-sky-600 hover:bg-sky-700 text-slate-700 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center">
                                    <i className="fas fa-print mr-2"></i> Print
                                </button>
                                <button type="button" onClick={() => navigate(-1)} className="bg-slate-500 hover:bg-slate-600 text-slate-700 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors ml-auto flex items-center">
                                    <i className="fas fa-sign-out-alt mr-2"></i> Exit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Report Table Data */}
                {reportRows.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden cogen-table-wrapper animate-in slide-in-from-bottom-4 duration-500">
                        <table ref={tableRef} className="cogen-table text-sm">
                            <thead className="cogen-sticky-header">
                                <tr>
                                    <th className="cogen-header-sticky-col-1 w-[60px]">Sr.No.</th>
                                    <th className="cogen-header-sticky-col-2 w-[300px]">Particulars</th>
                                    <th className="cogen-header-sticky-col-3 w-[80px]">U/M</th>
                                    {reportMonths.map((m, idx) => (
                                        <th key={idx} className="text-right px-4 py-3 border-r border-[#047857]/20 whitespace-nowrap min-w-[120px]">
                                            {m}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {reportRows.map((row, idx) => {
                                    const trClass = row.isBold ? "row-bold" : "";

                                    return (
                                        <tr key={idx} className={`${trClass} border-b border-gray-100`}>
                                            <td className="cogen-sticky-col-1 text-center py-2 px-3 text-gray-500 text-xs">
                                                {row.sr}
                                            </td>
                                            <td className="cogen-sticky-col-2 py-2 px-4 text-gray-800">
                                                {row.label}
                                            </td>
                                            <td className="cogen-sticky-col-3 text-center py-2 px-3 text-gray-500 font-medium">
                                                {!row.isBold && row.um}
                                            </td>
                                            {reportMonths.map((m, mIdx) => (
                                                <td key={mIdx} className="text-right py-2 px-4 border-r border-gray-100 font-mono text-gray-700">
                                                    {row.data[mIdx] ? row.data[mIdx] : ''}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountReports_CogenReport;
