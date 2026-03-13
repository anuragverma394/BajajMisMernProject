import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { accountReportsService, masterService } from '../../microservices/api.service';
import '../../styles/CapasityutilisationFromdate.css';

const AccountReports_CapasityutilisationFromdate = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Form Search State
  const [unitsMaster, setUnitsMaster] = useState([]);
  const [unitCode, setUnitCode] = useState('0');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportRows, setReportRows] = useState([]);
  const [factoryHeaders, setFactoryHeaders] = useState([]);

  React.useEffect(() => {
    const loadUnits = async () => {
      try {
        const response = await masterService.getUnits();
        setUnitsMaster(response || []);
      } catch (error) {
        console.error("Error fetching units:", error);
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
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
      };

      const params = {
        F_code: unitCode,
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate)
      };
      const response = await accountReportsService.getCapacityUtilisationPeriodical(params);

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
        toast.success('Periodical Report synchronized successfully!');
      } else {
        toast.error(response.message || 'Failed to load report');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error('Connection error while fetching report');
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

    const printContent = tableRef.current.outerHTML;
    const printWindow = window.open('', '_blank', 'width=1000,height=1000');
    printWindow.document.write(`
            <html>
                <head>
                    <title>Capacity Utilisation Periodical</title>
                    <style>
                        body { font-family: sans-serif; }
                        h2, h4 { text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid black; padding: 8px; text-align: right; }
                        th { background-color: #e5e7eb; text-align: center; }
                        td:first-child, th:first-child { text-align: left; }
                    </style>
                </head>
                <body>
                    <h2>Bajaj Group</h2>
                    <h4>Capacity Utilisation Periodical</h4>
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
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            {/* Card with teal header */}
            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
                <div className="bg-[#1F9E8A] text-white py-[12px] px-[20px] text-[15px] font-medium">
                    Capacity Utilisation Periodical
                </div>

                <div className="p-[25px] bg-[#fcfcfc]">
                    <div className="grid gap-[30px] mb-[25px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Units</label>
                            <select

                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="0">All</option>
                                {unitsMaster.map((f, idx) => <option key={`${f.id ?? 'unit'}-${idx}`} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">From Date</label>
                            <input
                type="date"

                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">To Date</label>
                            <input
                type="date"

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
                            <thead className="bg-indigo-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-800 sticky left-0 bg-indigo-100 z-20 whitespace-nowrap border-b border-r border-indigo-200">
                                        Particulars
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-800 whitespace-nowrap border-b border-r border-indigo-200">
                                        UOM
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-sm font-bold text-blue-900 whitespace-nowrap border-b border-indigo-200 bg-indigo-100">
                                        Total
                                    </th>
                                    {factoryHeaders.map((header, idx) =>
                <th key={`${header}-${idx}`} scope="col" className="px-6 py-4 text-right text-sm font-bold text-slate-800 whitespace-nowrap border-b border-r border-indigo-200">
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
                                        <td className="px-6 py-3 text-sm text-right font-bold text-blue-800 bg-indigo-50/30 border-r border-slate-200 font-mono">
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

export default AccountReports_CapasityutilisationFromdate;
