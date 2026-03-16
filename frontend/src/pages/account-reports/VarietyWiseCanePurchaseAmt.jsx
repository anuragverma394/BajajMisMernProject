import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Search, FileSpreadsheet, Printer, LogOut, IndianRupee, Building2, Calendar, LayoutDashboard } from 'lucide-react';
import { accountReportsService, masterService } from '../../microservices/api.service';
import { openPrintWindow } from '../../utils/print';
import '../../styles/VarietyWiseCanePurchaseAmt.css';

const AccountReports_VarietyWiseCanePurchaseAmt = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Form Search State
  const [unitCode, setUnitCode] = useState('0');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Data from Backend
  const [units, setUnits] = useState([]);
  const [factories, setFactories] = useState([]);
  const [reportRows, setReportRows] = useState([]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await masterService.getUnits();
        setUnits(response || []);
      } catch (error) {
        console.error("Error fetching units:", error);
        toast.error("Failed to load unit master");
      }
    };
    fetchUnits();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    if (!toDate) {
      toast.error('Please select a To Date.');
      return;
    }

    setIsLoading(true);
    try {
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
      };

      const params = {
        F_code: unitCode,
        FDate: formatDate(fromDate),
        TDate: formatDate(toDate)
      };
      const response = await accountReportsService.getVarietyWiseCanePurchaseAmt(params);
      if (response.status === 'success') {
        setFactories(response.factories);
        setReportRows(response.data);
        toast.success('Variety data synchronized!');
      } else {
        toast.error(response.message || 'Failed to load report data');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error('Connection error while fetching report data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (reportRows.length === 0) {
      toast.error("No data to export!");
      return;
    }
    toast.success("Excel generation started...");
    // Placeholder for real Excel export
  };

  const handlePrint = () => {
    if (reportRows.length === 0) {
      toast.error("No data to print!");
      return;
    }
    openPrintWindow({
      title: "Variety Wise Cane Purchase Amount",
      subtitle: `Period: ${fromDate || 'Start'} to ${toDate || 'End'}`,
      contentHtml: tableRef.current ? tableRef.current.outerHTML : ""
    });
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            {/* Card with teal header */}
            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
                <div className="bg-[#1F9E8A] text-white py-[12px] px-[20px] text-[15px] font-medium">
                    Variety Wise Cane Purchase Amount
                </div>

                <div className="p-[25px] bg-[#fcfcfc]">
                    <div className="grid gap-[30px] mb-[25px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Units</label>
                            <select

                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="0">All</option>
                                {units.map((unit, idx) =>
                <option key={`${unit.id ?? 'unit'}-${idx}`} value={unit.id}>{unit.name}</option>
                )}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">From Date</label>
                            <input
                type="text"

                placeholder="DD/MM/YYYY"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">To Date</label>
                            <input
                type="text"

                placeholder="DD/MM/YYYY"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>
                    </div>

                    <div className="flex gap-[8px]">
                        <button onClick={handleSearch} disabled={isLoading} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            {isLoading ? 'Wait...' : 'Search'}
                        </button>
                        <button onClick={handleExport} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Export
                        </button>
                        <button onClick={handlePrint} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Print
                        </button>
                        <button onClick={() => navigate(-1)} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Exit
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Section */}
            {reportRows.length > 0 ?
      <div className="report-main-content">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Report Output</span>
                        <button
            onClick={handleExport}
            className="btn-action-premium">
            
                            <FileSpreadsheet size={16} className="text-emerald-600" /> DOWNLOAD EXCEL
                        </button>
                    </div>

                    <div className="table-wrapper-premium">
                        <table ref={tableRef} className="variety-amt-table">
                            <thead className="variety-amt-sticky-header">
                                <tr>
                                    <th className="variety-amt-header-sticky-col-1 w-[180px]">Particulars</th>
                                    <th className="variety-amt-header-sticky-col-2 w-[270px]">Cane Varieties</th>
                                    <th className="variety-amt-header-sticky-col-3 w-[80px] text-center">UOM</th>
                                    <th className="text-right">Grand Total</th>
                                    {factories.map((f, idx) =>
                <th key={idx} className="text-right">
                                            {f}
                                        </th>
                )}
                                </tr>
                            </thead>
                            <tbody>
                                {reportRows.map((row, rIdx) => {
                if (row.type === "SummaryHeader") {
                  return (
                    <tr key={`${row.id ?? 'row'}-${rIdx}`} className="bg-slate-50">
                                                <td colSpan={factories.length + 4} className="py-4 text-center">
                                                    <span className="text-sm font-bold text-slate-800 uppercase tracking-[0.2em] flex items-center justify-center gap-4">
                                                        <div className="h-[1px] w-8 bg-slate-300" />
                                                        SUMMARY DATA
                                                        <div className="h-[1px] w-8 bg-slate-300" />
                                                    </span>
                                                </td>
                                            </tr>);

                }

                const isSummary = row.particular === "Variety Wise Amount" || row.particular === "Variety Wise Ratio";
                const isBold = row.isBold || isSummary;
                const textClass = isBold ? "text-slate-900" : "text-slate-700";

                return (
                  <tr key={`${row.id ?? 'row'}-${rIdx}`}>
                                            <td className="variety-amt-sticky-col-1 font-semibold text-slate-500">
                                                {row.particular}
                                            </td>
                                            <td className="variety-amt-sticky-col-2 font-medium text-slate-700">
                                                {row.variety}
                                            </td>
                                            <td className="variety-amt-sticky-col-3 font-bold text-slate-400 text-center">
                                                {row.uom}
                                            </td>
                                            <td className={`text-right ${isBold ? 'text-slate-900 font-extrabold' : 'text-slate-700 font-semibold'}`}>
                                                {Number(row.total).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                            </td>
                                            {factories.map((f, mIdx) =>
                    <td key={mIdx} className={`text-right ${textClass}`}>
                                                    {Number(row.data[mIdx] || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                </td>
                    )}
                                        </tr>);

              })}
                            </tbody>
                        </table>
                    </div>
                </div> :

      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-xl shadow-sm border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                        <Search size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Report Data</h3>
                    <p className="text-slate-500 max-w-sm">Select a date range and click analyze to generate your variety wise cane purchase amount report.</p>
                </div>
      }
        </div>);

};

export default AccountReports_VarietyWiseCanePurchaseAmt;
