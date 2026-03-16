import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { accountReportsService, masterService } from '../../microservices/api.service';
import { openPrintWindow } from '../../utils/print';
import '../../styles/VarietyWiseCanePurchase_1.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");const AccountReports_VarietyWiseCanePurchase = () => {const navigate = useNavigate();const tableRef = useRef(null); // Form Search State
  const [unitCode, setUnitCode] = useState('');const [fromDate, setFromDate] = useState('');const [toDate, setToDate] = useState('');
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
      }
    };
    fetchUnits();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!toDate) {
      toast.error('Please select a To Date.');
      return;
    }

    setIsLoading(true);
    try {
      const params = {
        F_code: unitCode,
        FDate: fromDate,
        TDate: toDate
      };
      const response = await accountReportsService.getVarietyWiseCanePurchase(params);
      if (response.status === 'success') {
        setFactories(response.factories);
        setReportRows(response.data);
        toast.success('Variety data synchronized!');
      } else {
        toast.error(response.message || 'Failed to load variety data');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error('Connection error while fetching variety data');
    } finally {
      setIsLoading(false);
    }
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
    openPrintWindow({
      title: "Variety Wise Cane Purchase",
      subtitle: `From: ${fromDate || 'N/A'} To: ${toDate || 'N/A'}`,
      contentHtml: tableRef.current ? tableRef.current.outerHTML : ""
    });
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            {/* Card with teal header */}
            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
                <div className="bg-[#1F9E8A] text-white py-[12px] px-[20px] text-[15px] font-medium">
                    Variety Wise Cane Purchase
                </div>

                <div className="p-[25px] bg-[#fcfcfc]">
                    <div className="grid gap-[30px] mb-[25px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Units</label>
                            <select

                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="">All</option>
                                {units.map((unit, idx) =>
                <option key={`${unit.f_Code || unit.F_CODE || unit.id}-${idx}`} value={unit.f_Code || unit.F_CODE || unit.id}>
                                        {unit.F_Name || unit.F_NAME || unit.name}
                                    </option>
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

            {/* Report Table Data */}
            {
      reportRows.length > 0 &&
      <div className={__cx("page-card", "mt-[10px]")}>
                        <div className={__cx("table-wrapper", "max-h-[65vh] overflow-y-auto")}>
                            <table ref={tableRef} className="data-table">
                                <thead>
                                    <tr>
                                        <th className="text-left">Particulars</th>
                                        <th className="text-left">Cane Varieties</th>
                                        <th className="text-center w-[60px]">UOM</th>
                                        <th className="text-right">Total</th>
                                        {factories.map((f, idx) =>
                <th key={idx} className="text-right min-w-[120px]">
                                                {f.F_Name || f}
                                            </th>
                )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportRows.map((row, rIdx) => {
                if (row.type === "SummaryHeader") {
                  return (
                    <tr key={rIdx} className="bg-[#f5f5f5]">
                                                    <td colSpan={factories.length + 4} className="text-center p-[12px] font-bold text-[#333] uppercase tracking-[2px] text-[12px]">
                                                        ─── SUMMARY ───
                                                    </td>
                                                </tr>);

                }

                const isBold = row.isBold || row.isMain;

                return (
                  <tr key={rIdx} className={isBold ? "font-bold bg-[#f0fdf4]" : ""}>
                                                <td className={row.isMain ? "font-bold pl-[12px] text-[#333]" : "font-normal pl-[28px] text-[#666]"}>
                                                    {row.particular}
                                                </td>
                                                <td className="text-[#444]">
                                                    {row.variety}
                                                </td>
                                                <td className="text-center text-[#888] text-[12px] font-[monospace]">
                                                    {row.uom}
                                                </td>
                                                <td className="text-right font-bold text-[#008080]">
                                                    {parseFloat(row.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                {factories.map((f, mIdx) => {
                      const val = row.data && row.data[mIdx] ? parseFloat(row.data[mIdx]) : 0;
                      return (
                        <td key={mIdx} className={isBold ? "text-right text-[#333]" : "text-right text-[#666]"}>
                                                            {val !== 0 ? val.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                        </td>);

                    })}
                                            </tr>);

              })}
                                </tbody>
                            </table>
                        </div>
                    </div>

      }
        </div>);

};

export default AccountReports_VarietyWiseCanePurchase;
