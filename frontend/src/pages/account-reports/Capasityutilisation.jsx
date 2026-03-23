import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { accountReportsService, masterService } from '../../microservices/api.service';
import '../../styles/Capasityutilisation.css';
import { openPrintWindow } from '../../utils/print';

const AccountReports_Capasityutilisation = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Form Search State
  const [factories, setFactories] = useState([]);
  const [unitCode, setUnitCode] = useState('0');
  const [toDate, setToDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportRows, setReportRows] = useState([]);
  const [factoryHeaders, setFactoryHeaders] = useState([]);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const units = await masterService.getUnits();
        setFactories(units || []);
      } catch (error) {
        toast.error("Failed to fetch unit master");
      }
    };
    loadUnits();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!toDate) {
      toast.error('Please select a To Date first.');
      return;
    }

    setIsLoading(true);
    try {
      const formatDate = (dateStr) => {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
      };

      const params = { F_code: unitCode, toDate: formatDate(toDate) };
      const response = await accountReportsService.getCapacityUtilisation(params);

      if (response.status === 'success') {
        const data = response.data;
        setFactoryHeaders(data.map((d) => d.factory));

        // Pivot data
        const rows = [
        { particulars: "Crushing Capacity Per Day", uom: "TCD", key: "OperationalCapacity" },
        { particulars: "Total Plant Run Days", uom: "Days", key: "TotalPlantRunDays" },
        { particulars: "Total Capacity Available for Plant", uom: "Capacity", key: "TotalCapacityAvailableforPlant" },
        { particulars: "Total Cane Crushed", uom: "Tonnes", key: "TotalCaneCrushed" },
        { particulars: "Capacity Utilisation on Run Day Basis", uom: "Percentage", key: "ToDateCapUt" }].
        map((row) => {
          const factoryValues = data.map((d) => d[row.key]);
          const total = factoryValues.reduce((a, b) => a + b, 0);
          return { ...row, total, factoryValues };
        });

        setReportRows(rows);
        toast.success('Report generated successfully!');
      } else {
        toast.error(response.message || 'Failed to generate report');
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (reportRows.length === 0) {
      toast.error("No data to export!");
      return;
    }
    toast.error("Export to Excel functionality mapping required.");
  };

  const handlePrint = () => {
    if (reportRows.length === 0) {
      toast.error("No data to print!");
      return;
    }
    openPrintWindow({
      title: "Capacity Utilisation",
      subtitle: `To Date: ${toDate || 'N/A'}`,
      contentHtml: tableRef.current ? tableRef.current.outerHTML : ""
    });
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            {/* Card with teal header */}
            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
                <div className="bg-[#1F9E8A] text-white py-[12px] px-[20px] text-[15px] font-medium">
                    Capacity Utilisation
                </div>

                <div className="p-[25px] bg-[#fcfcfc]">
                    <div className="grid gap-[30px] mb-[25px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Units</label>
                            <select

                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="0">All</option>
                                {factories.map((f, idx) => (
                                  <option key={`${f.F_Code || f.f_Code || idx}`} value={f.F_Code || f.f_Code}>
                                    {f.F_Name || f.f_Name}
                                  </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">To Date</label>
                            <input
                type="date"

                value={toDate}
                onChange={(e) => setToDate(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>

                        {/* Empty div for the third column */}
                        <div></div>
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
            {reportRows.length > 0 &&
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="overflow-x-auto max-h-[600px]">
                        <table ref={tableRef} id="example" className="min-w-full divide-y divide-slate-200 border-collapse">
                            <thead className="bg-emerald-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-800 sticky left-0 bg-emerald-100 z-20 whitespace-nowrap border-b border-r border-emerald-200">
                                        Particulars
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-800 whitespace-nowrap border-b border-r border-emerald-200">
                                        UOM
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-sm font-bold text-teal-900 whitespace-nowrap border-b border-emerald-200 bg-emerald-100">
                                        Total
                                    </th>
                                    {factoryHeaders.map((header, idx) =>
                <th key={`${header}-${idx}`} scope="col" className="px-6 py-4 text-right text-sm font-bold text-slate-800 whitespace-nowrap border-b border-r border-emerald-200">
                                            {header}
                                        </th>
                )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {reportRows.map((row, idx) =>
              <tr key={`${row.key || row.particulars}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 text-sm font-medium text-slate-900 sticky left-0 bg-white border-r border-slate-200 z-10">
                                            {row.particulars}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-700 border-r border-slate-200">
                                            {row.uom}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-right font-bold text-teal-800 bg-emerald-50/30 border-r border-slate-200 font-mono">
                                            {row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        {row.factoryValues.map((val, fIdx) =>
                <td key={`${row.key || row.particulars}-${fIdx}`} className="px-6 py-3 text-sm text-right text-slate-700 border-r border-slate-200 font-mono">
                                                {val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                )}
                                    </tr>
              )}
                            </tbody>
                        </table>
                    </div>
                </div>
      }
        </div>);

};

export default AccountReports_Capasityutilisation;
