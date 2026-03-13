import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { distilleryService, masterService } from '../../microservices/api.service';
import '../../styles/DistilleryReportA_1.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const AccountReports_DistilleryReportA = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [factories, setFactories] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [reportMonths, setReportMonths] = useState([]);
  const [reportRows, setReportRows] = useState([]);

  useEffect(() => {
    const loadFactories = async () => {
      try {
        const response = await masterService.getUnits();
        setFactories(response.data || response);
      } catch (error) {
        toast.error("Failed to load factories");
      }
    };
    loadFactories();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!unitCode) {
      toast.error("Please select a factory");
      return;
    }

    setIsLoading(true);
    try {
      // In a real scenario, this would call distilleryService.getDistilleryReportA
      // For now, we simulate with the data structure we have
      setTimeout(() => {
        const months = ['Oct-23', 'Nov-23', 'Dec-23'];
        const rows = [
        { sr: "1", label: "Syrup : (Distillery Division)", um: "", isBold: true, data: [] },
        { sr: "", label: "Opening stock (+)", um: "QTL", isBold: false, data: ["0", "1500", "3000"] },
        { sr: "", label: "Received from Own Plant (+)", um: "QTL", isBold: false, data: ["20000", "50000", "75000"] },
        { sr: "", label: "Received from Other Plant (+)", um: "QTL", isBold: false, data: ["500", "1200", "2000"] },
        { sr: "", label: "Consumption (-)", um: "QTL", isBold: false, data: ["19000", "48000", "72000"] },
        { sr: "", label: "Transit Loss (-)", um: "QTL", isBold: false, data: ["0", "200", "400"] },
        { sr: "", label: "Closing Stock", um: "QTL", isBold: false, data: ["1500", "4500", "7600"] },
        { sr: "", label: "Closing Stock as per SAP", um: "QTL", isBold: false, data: ["1500", "4500", "7600"] },
        { sr: "", label: "Check", um: "QTL", isBold: false, data: ["0", "0", "0"] },
        { sr: "2", label: "C Heavy Molasses", um: "", isBold: true, data: [] },
        { sr: "", label: "Opening stock (+)", um: "QTL", isBold: false, data: ["500", "800", "1200"] },
        { sr: "", label: "Received from Own Plant (+)", um: "QTL", isBold: false, data: ["10000", "25000", "40000"] },
        { sr: "", label: "Closing Stock", um: "QTL", isBold: true, data: ["900", "2550", "3400"] }];

        setReportMonths(months);
        setReportRows(rows);
        setIsLoading(false);
        toast.success('Report assembled successfully');
      }, 800);
    } catch (error) {
      toast.error("Failed to generate report");
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = tableRef.current.outerHTML;
    const win = window.open('', '', 'width=1000,height=800');
    win.document.write(`
            <html>
                <head>
                    <title>Distillery Report A</title>
                    <style>
                        table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 11px; }
                        th, td { border: 1px solid #333; padding: 6px; text-align: left; }
                        th { background: #f0f0f0; }
                        .text-right { text-align: right; }
                        .row-bold { font-weight: bold; background: #fafafa; }
                    </style>
                </head>
                <body>
                    <h2>Bajaj Group</h2>
                    <h4>Distillery Report A</h4>
                    ${printContent}
                </body>
            </html>
        `);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleExport = () => {
    const table = tableRef.current;
    if (!table) return;
    const blob = new Blob([table.outerHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Distillery_Report_A_${unitCode}.xls`;
    a.click();
    toast.success("Downloading Excel...");
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            {/* Card with teal header */}
            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
                <div className="bg-[#1F9E8A] text-white py-[12px] px-[20px] text-[15px] font-medium">
                    Distillery Report
                </div>

                <div className="p-[25px] bg-[#fcfcfc]">
                    <div className="grid gap-[30px] mb-[25px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Factory</label>
                            <select

                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="">All</option>
                                {factories.map((f, idx) => <option key={`${f.id ?? 'factory'}-${idx}`} value={f.id}>{f.name}</option>)}
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

            {isLoading ?
      <div className="dra-loading">
                    <div className="dra-spinner"></div>
                    <p>Aggregating distillery data...</p>
                </div> :
      reportRows.length > 0 ?
      <div className="dra-table-container">
                    <table ref={tableRef} className="dra-premium-table">
                        <thead>
                            <tr>
                                <th className="dra-sr-col">Sr.</th>
                                <th className="dra-particular-col">Particulars</th>
                                <th className="dra-um-col">U/M</th>
                                {reportMonths.map((m, idx) =>
              <th key={idx} className="text-right">{m}</th>
              )}
                            </tr>
                        </thead>
                        <tbody>
                            {reportRows.map((row, idx) =>
            <tr key={idx} className={row.isBold ? 'row-bold' : ''}>
                                    <td className="dra-sr-col">{row.sr}</td>
                                    <td className="dra-particular-col">{row.label}</td>
                                    <td className="dra-um-col">{row.um}</td>
                                    {reportMonths.map((_, mIdx) =>
              <td key={mIdx} className="text-right">
                                            {row.data[mIdx] || '-'}
                                        </td>
              )}
                                </tr>
            )}
                        </tbody>
                    </table>
                </div> :

      <div className={__cx("dra-loading", "opacity-[0.5]")}>
                    <i className="fas fa-info-circle fa-2x mb-3"></i>
                    <p>Select criteria and search to display report.</p>
                </div>
      }
        </div>);

};

export default AccountReports_DistilleryReportA;