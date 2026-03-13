import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { accountReportsService, masterService } from '../../microservices/api.service';
import '../../styles/CaneQtyandSugarCapacity.css';

const AccountReports_CaneQtyandSugarCapacity = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Form Search State
  const [factories, setFactories] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const units = await masterService.getUnits();
        setFactories(units);
      } catch (error) {
        toast.error("Failed to fetch unit master");
      }
    };
    loadUnits();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!toDate || !fromDate) {
      toast.error('Please select both From Date and To Date.');
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
        F_code: unitCode || '0',
        FDate: formatDate(fromDate),
        TDate: formatDate(toDate)
      };
      const response = await accountReportsService.getCaneQtySugarCapacity(params);
      setReportData(response.data);
      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) {
      toast.error("No data to export!");
      return;
    }
    toast.error("Export to Excel functionality requires a library like xlsx.");
    // Simulated export logic here.
  };

  const handlePrint = () => {
    if (!reportData) {
      toast.error("No data to print!");
      return;
    }

    // Print Logic (Simplistic approach mimicking legacy logic)
    const printContent = tableRef.current.outerHTML;
    const printWindow = window.open('', '_blank', 'width=1000,height=1000');
    printWindow.document.write(`
            <html>
                <head>
                    <title>Print Cane Qty and Sugar Capacity</title>
                    <style>
                        body { font-family: sans-serif; }
                        h2, h4 { text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid black; padding: 8px; text-align: right; }
                        th { background-color: #f2f2f2; }
                        td:first-child, th:first-child { text-align: left; }
                    </style>
                </head>
                <body>
                    <h2>Bajaj Group</h2>
                    <h4>Cane Qty and Sugar Capacity</h4>
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

  const unitKey = (unit, idx) => `${unit?.F_Code ?? unit?.f_Code ?? unit?.id ?? unit?.F_Name ?? unit?.name ?? 'unit'}-${idx}`;

  // Calculate aggregated totals based on reportData array
  const calcTotal = (key) => reportData?.reduce((acc, curr) => acc + curr[key], 0) || 0;

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            {/* Card with teal header */}
            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
                <div className="bg-[#1F9E8A] text-white py-[12px] px-[20px] text-[15px] font-medium">
                    Cane Purchase Movement
                </div>

                <div className="p-[25px] bg-[#fcfcfc]">
                    <div className="grid gap-[30px] mb-[25px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Units</label>
                            <select

                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="0">All</option>
                                {factories.map((f, idx) => <option key={`${f.id ?? 'factory'}-${idx}`} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">From Date</label>
                            <input
                type="text"

                placeholder="dd/mm/yyyy"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">To Date</label>
                            <input
                type="text"

                placeholder="dd/mm/yyyy"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>
                    </div>

                    <div className="flex gap-[8px]">
                        <button onClick={handleSearch} disabled={isLoading} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Search
                        </button>
                        <button onClick={handleExport} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Export
                        </button>
                        <button onClick={handlePrint} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            btnprint
                        </button>
                        <button onClick={() => navigate(-1)} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Exit
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Table Data */}
            {reportData &&
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="overflow-x-auto max-h-[600px] border-b border-slate-200">
                        <table ref={tableRef} className="min-w-full divide-y divide-slate-200 border-collapse">
                            <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-700 sticky left-0 bg-slate-100 z-20 whitespace-nowrap border-r border-slate-200">
                                        Cane Crushed
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-center text-sm font-bold text-slate-700 whitespace-nowrap border-r border-slate-200">
                                        UOM
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-sm font-bold text-teal-800 whitespace-nowrap border-r border-slate-200 bg-teal-50/50">
                                        Total
                                    </th>
                                    {reportData.map((unit, idx) =>
                <th key={unitKey(unit, idx)} scope="col" className="px-6 py-4 text-right text-sm font-bold text-slate-700 whitespace-nowrap border-r border-slate-200">
                                            {unit.F_Name}
                                        </th>
                )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">

                                {/* Opening Stock */}
                                <tr className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 text-sm font-medium text-slate-900 sticky left-0 bg-white border-r border-slate-200 z-10">Opening Stock</td>
                                    <td className="px-6 py-3 text-sm text-center text-slate-500 font-mono border-r border-slate-200">QTL</td>
                                    <td className="px-6 py-3 text-sm text-right font-bold text-teal-700 border-r border-slate-200 bg-teal-50/30">{calcTotal('openingStock').toLocaleString()}</td>
                                    {reportData.map((unit, idx) =>
                <td key={unitKey(unit, idx)} className="px-6 py-3 text-sm text-right text-slate-700 border-r border-slate-200">{unit.openingStock.toLocaleString()}</td>
                )}
                                </tr>

                                {/* Purchase */}
                                <tr className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 text-sm font-medium text-slate-900 sticky left-0 bg-white border-r border-slate-200 z-10">Add : Purchase</td>
                                    <td className="px-6 py-3 text-sm text-center text-slate-500 font-mono border-r border-slate-200">QTL</td>
                                    <td className="px-6 py-3 text-sm text-right font-bold text-teal-700 border-r border-slate-200 bg-teal-50/30">{calcTotal('purchase').toLocaleString()}</td>
                                    {reportData.map((unit, idx) =>
                <td key={unitKey(unit, idx)} className="px-6 py-3 text-sm text-right text-slate-700 border-r border-slate-200">{unit.purchase.toLocaleString()}</td>
                )}
                                </tr>

                                {/* Received Inter Unit */}
                                <tr className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 text-sm font-medium text-slate-900 sticky left-0 bg-white border-r border-slate-200 z-10">Add : Received from Inter Unit</td>
                                    <td className="px-6 py-3 text-sm text-center text-slate-500 font-mono border-r border-slate-200">QTL</td>
                                    <td className="px-6 py-3 text-sm text-right font-bold text-teal-700 border-r border-slate-200 bg-teal-50/30">{calcTotal('receivedInter').toLocaleString()}</td>
                                    {reportData.map((unit, idx) =>
                <td key={unitKey(unit, idx)} className="px-6 py-3 text-sm text-right text-slate-700 border-r border-slate-200">{unit.receivedInter.toLocaleString()}</td>
                )}
                                </tr>

                                {/* Transfer Inter Unit */}
                                <tr className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 text-sm font-medium text-slate-900 sticky left-0 bg-white border-r border-slate-200 z-10 text-red-600">Less : Transfer Inter Unit</td>
                                    <td className="px-6 py-3 text-sm text-center text-slate-500 font-mono border-r border-slate-200">QTL</td>
                                    <td className="px-6 py-3 text-sm text-right font-bold text-red-700 border-r border-slate-200 bg-teal-50/30">{calcTotal('transferInter').toLocaleString()}</td>
                                    {reportData.map((unit, idx) =>
                <td key={unitKey(unit, idx)} className="px-6 py-3 text-sm text-right text-red-600 border-r border-slate-200">{unit.transferInter.toLocaleString()}</td>
                )}
                                </tr>

                                {/* Total Purchase Subtotal */}
                                <tr className="bg-slate-100 font-semibold border-y border-slate-300">
                                    <td className="px-6 py-3 text-sm text-slate-900 sticky left-0 bg-slate-100 border-r border-slate-300 z-10">Total Purchase</td>
                                    <td className="px-6 py-3 text-sm text-center text-slate-600 font-mono border-r border-slate-300">QTL</td>
                                    <td className="px-6 py-3 text-sm text-right text-teal-800 border-r border-slate-300">{calcTotal('totalPurchase').toLocaleString()}</td>
                                    {reportData.map((unit, idx) =>
                <td key={unitKey(unit, idx)} className="px-6 py-3 text-sm text-right text-slate-800 border-r border-slate-300">{unit.totalPurchase.toLocaleString()}</td>
                )}
                                </tr>

                                {/* Crushed Categories */}
                                {[
              { label: "Cane Crushed - For C Molasses", key: "cMolasses" },
              { label: "Cane Crushed - For B Molasses", key: "bMolasses" },
              { label: "Cane Crushed - For Syrup", key: "syrup" },
              { label: "Cane Crushed - For T Syrup", key: "tSyrup" }].
              map((row) =>
              <tr key={row.key} className="hover:bg-slate-50 transition-colors text-orange-800">
                                        <td className="px-6 py-3 text-sm font-medium sticky left-0 bg-white border-r border-slate-200 z-10">{row.label}</td>
                                        <td className="px-6 py-3 text-sm text-center text-slate-500 font-mono border-r border-slate-200">QTL</td>
                                        <td className="px-6 py-3 text-sm text-right font-bold text-orange-700 border-r border-slate-200 bg-orange-50/30">{calcTotal(row.key).toLocaleString()}</td>
                                        {reportData.map((unit, idx) =>
                <td key={unitKey(unit, idx)} className="px-6 py-3 text-sm text-right text-orange-700 border-r border-slate-200">{unit[row.key].toLocaleString()}</td>
                )}
                                    </tr>
              )}

                                {/* Total Crushed Subtotal */}
                                <tr className="bg-orange-50 font-semibold border-y border-orange-200">
                                    <td className="px-6 py-3 text-sm text-orange-900 sticky left-0 bg-orange-50 border-r border-orange-200 z-10">Total Cane Crushed</td>
                                    <td className="px-6 py-3 text-sm text-center text-slate-600 font-mono border-r border-orange-200">QTL</td>
                                    <td className="px-6 py-3 text-sm text-right font-bold text-orange-800 border-r border-orange-200">{calcTotal('totalCrushed').toLocaleString()}</td>
                                    {reportData.map((unit, idx) =>
                <td key={unitKey(unit, idx)} className="px-6 py-3 text-sm text-right text-orange-800 border-r border-orange-200">{unit.totalCrushed.toLocaleString()}</td>
                )}
                                </tr>

                                {/* Less Driage */}
                                <tr className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 text-sm font-medium text-slate-900 sticky left-0 bg-white border-r border-slate-200 z-10 text-red-600">Less : Driage</td>
                                    <td className="px-6 py-3 text-sm text-center text-slate-500 font-mono border-r border-slate-200">QTL</td>
                                    <td className="px-6 py-3 text-sm text-right font-bold text-red-700 border-r border-slate-200 bg-teal-50/30">{calcTotal('driage').toLocaleString()}</td>
                                    {reportData.map((unit, idx) =>
                <td key={unitKey(unit, idx)} className="px-6 py-3 text-sm text-right text-red-600 border-r border-slate-200">{unit.driage.toLocaleString()}</td>
                )}
                                </tr>

                                {/* Final Closing Stock */}
                                <tr className="bg-emerald-50 font-bold border-y-2 border-emerald-300 text-lg">
                                    <td className="px-6 py-4 text-emerald-900 sticky left-0 bg-emerald-50 border-r border-emerald-300 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Closing Stock</td>
                                    <td className="px-6 py-4 text-center text-emerald-700 font-mono border-r border-emerald-300">QTL</td>
                                    <td className="px-6 py-4 text-right text-emerald-800 border-r border-emerald-300">{calcTotal('closingStock').toLocaleString()}</td>
                                    {reportData.map((unit, idx) =>
                <td key={unitKey(unit, idx)} className="px-6 py-4 text-right text-emerald-800 border-r border-emerald-300">{unit.closingStock.toLocaleString()}</td>
                )}
                                </tr>

                            </tbody>
                        </table>
                    </div>
                </div>
      }
        </div>);

};

export default AccountReports_CaneQtyandSugarCapacity;
