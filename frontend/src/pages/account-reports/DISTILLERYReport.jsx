import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import '../../styles/Report.css'; // Importing specific CSS for the Distillery report DataGrid styling
import '../../styles/Report.css';

const AccountReports_DISTILLERYReport = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Form Search State
  const [unitCode, setUnitCode] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock Data mimicking the complex DistilleryReportViewModel MonthlyData mapping
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

      // Structured data mimicking the .NET HTML rows from DistilleryReportViewModel
      const rows = [
      { sr: "1", label: "Own Bagasse", um: "", isBold: true, data: [] },
      { sr: "", label: "Recd from Self Sugar Plant (+)", um: "QTL", isBold: false, data: ["24000", "55000", "65000"] },
      { sr: "", label: "Recd from Other Plants (Qty as per MM) (+)", um: "QTL", isBold: false, data: ["1200", "4000", "3000"] },
      { sr: "", label: "Recd from Cogen Div. (+)", um: "QTL", isBold: false, data: ["0", "5000", "7000"] },
      { sr: "", label: "Consumption (-)", um: "QTL", isBold: false, data: ["25000", "60000", "72000"] },
      { sr: "", label: "Excess / (Shortage) (+ / -)", um: "QTL", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Closing Stock", um: "QTL", isBold: false, data: ["200", "4200", "7200"] },
      { sr: "", label: "Closing Stock as per SAP", um: "QTL", isBold: false, data: ["200", "4200", "7200"] },
      { sr: "", label: "Check", um: "QTL", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Break up of closing stock", um: "QTL", isBold: false, data: [] },
      { sr: "", label: "Bagasse in transit", um: "", isBold: false, data: ["0", "500", "100"] },
      { sr: "", label: "Physical Closing Stock at Plant", um: "QTL", isBold: false, data: ["200", "3700", "7100"] },
      { sr: "2", label: "Bagasse Purchased from Outside Vendors:", um: "", isBold: true, data: [] },
      { sr: "", label: "Opening stock (Finished Sugar)", um: "", isBold: true, data: [] },
      { sr: "", label: "Purchase from Outside (+)", um: "QTL", isBold: false, data: ["0", "2000", "5000"] },
      { sr: "", label: "Recd from Cogen Div. (+)", um: "QTL", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Consumption (-)", um: "QTL", isBold: false, data: ["0", "1500", "4800"] },
      { sr: "", label: "Excess / (Shortage) (+ / -)", um: "QTL", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Closing Stock", um: "QTL", isBold: false, data: ["0", "500", "700"] },
      { sr: "", label: "LIVE STEAM :", um: "", isBold: true, data: [] },
      { sr: "", label: "Bagasse Consumed (-)", um: "QTL", isBold: false, data: ["25000", "61500", "76800"] },
      { sr: "", label: "Bio Gas Consumed in Boiler (-)", um: "NMQ", isBold: false, data: ["120000", "350000", "480000"] },
      { sr: "", label: "Slop Consumed In Boiler (-)", um: "QTL", isBold: false, data: ["1500", "4000", "5500"] },
      { sr: "", label: "Live steam Generated from Bagasse", um: "MT", isBold: true, data: ["5500", "13500", "16800"] },
      { sr: "", label: "Live steam Generated from Bio Gas", um: "MT", isBold: false, data: ["2000", "5800", "8000"] },
      { sr: "", label: "Live steam Generated from Slop", um: "MT", isBold: false, data: ["300", "800", "1100"] },
      { sr: "", label: "Sub Total of Steam generation", um: "MT", isBold: true, data: ["7800", "20100", "25900"] },
      { sr: "", label: "Live steam received from Cogen Boiler", um: "MT", isBold: true, data: ["0", "200", "500"] },
      { sr: "", label: "Total Live Steam available at Distllery", um: "MT", isBold: true, data: ["7800", "20300", "26400"] },
      { sr: "", label: "Live steam given to Sugar Division (-)", um: "MT", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Live steam given to Cogen Division (-)", um: "MT", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Live steam Consumed in Distillery Division(-)", um: "MT", isBold: false, data: ["7500", "19000", "25000"] },
      { sr: "", label: "Live steam Consumed in Distillery Division (Boiler)/Captive (-)", um: "MT", isBold: false, data: ["150", "400", "550"] },
      { sr: "", label: "Live steam given to Disttilery Back pressure Turbine (-)", um: "MT", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Live steam Given to Distillery Condensate Turbine (-)", um: "MT", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Losses Etc (-)", um: "MT", isBold: false, data: ["150", "900", "850"] },
      { sr: "", label: "Check", um: "MT", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "EXHAUST STEAM", um: "", isBold: true, data: [] },
      { sr: "", label: "Live steam given to Turbine Back Pressure", um: "MT", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Exhaust Steam Generated (+)", um: "MT", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Exhaust Steam Given to Sugar Division (-)", um: "MT", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Exhaust Steam Given to Distillery process (-)", um: "MT", isBold: true, data: ["0", "0", "0"] },
      { sr: "", label: "Exhaust Steam Losses etc (-)", um: "MT", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Check", um: "MT", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Disttilery Turbine:", um: "", isBold: true, data: [] },
      { sr: "", label: "Live steam consumed", um: "MT", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Production of Power (+)", um: "KWH", isBold: false, data: ["850000", "2100000", "2800000"] },
      { sr: "", label: "Power Export to UPPCL (-)", um: "KWH", isBold: false, data: ["400000", "1100000", "1400000"] },
      { sr: "", label: "Power Export to UPPCL Previous month adjustment(+ / -)", um: "KWH", isBold: true, data: ["0", "0", "0"] },
      { sr: "", label: "Power Banked during the month (-)", um: "%", isBold: true, data: ["0", "0", "0"] },
      { sr: "", label: "Power Transfer to Sugar Division (-)", um: "%", isBold: true, data: ["0", "150000", "250000"] },
      { sr: "", label: "Power Transfer to Distillery Division (self) for Process (-)", um: "QTL", isBold: false, data: ["350000", "700000", "950000"] },
      { sr: "", label: "Power Captive Consumption by Disttilery Boiler (-)", um: "QTL", isBold: false, data: ["50000", "80000", "120000"] },
      { sr: "", label: "Power Transfer to Co gen Division (-)", um: "QTL", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Power Transfer to ECO Tech (-)", um: "QTL", isBold: false, data: ["0", "0", "0"] },
      { sr: "", label: "Losses Etc (-)", um: "QTL", isBold: false, data: ["50000", "70000", "80000"] },
      { sr: "", label: "Total", um: "QTL", isBold: true, data: ["850000", "2100000", "2800000"] },
      { sr: "", label: "Distillery Boiler ratio", um: "", isBold: true, data: [] },
      { sr: "", label: "Bagasse to Steam Ratio", um: "%", isBold: false, data: ["2.20", "2.19", "2.18"] },
      { sr: "", label: "Bio Gas to Steam ratio", um: "%", isBold: false, data: ["0.016", "0.016", "0.016"] },
      { sr: "", label: "Slop to Steam ratio", um: "%", isBold: false, data: ["0.20", "0.20", "0.20"] }];


      setReportMonths(months);
      setReportRows(rows);
      setIsLoading(false);
      toast.success('Distillery Boiler Report generated successfully!');
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
                    <title>Distillery Boiler Report Print</title>
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
                    <h4>Distillery Boiler Report</h4>
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
                                <option value="1">Unit 1</option>
                                <option value="2">Unit 2</option>
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
            {reportRows.length > 0 &&
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden distillery-table-wrapper animate-in slide-in-from-bottom-4 duration-500">
                    <table ref={tableRef} className="distillery-table text-sm">
                        <thead className="distillery-sticky-header">
                            <tr>
                                <th className="distillery-header-sticky-col-1 w-[60px]">Sr.No.</th>
                                <th className="distillery-header-sticky-col-2 w-[350px]">Particulars</th>
                                <th className="distillery-header-sticky-col-3 w-[80px]">U/M</th>
                                {reportMonths.map((m, idx) =>
              <th key={idx} className="text-right px-4 py-3 border-r border-[#7e22ce]/20 whitespace-nowrap min-w-[120px]">
                                        {m}
                                    </th>
              )}
                            </tr>
                        </thead>
                        <tbody>
                            {reportRows.map((row, idx) => {
              const trClass = row.isBold ? "row-bold" : "";

              return (
                <tr key={idx} className={`${trClass} border-b border-gray-100`}>
                                        <td className="distillery-sticky-col-1 text-center py-2 px-3 text-gray-500 text-xs">
                                            {row.sr}
                                        </td>
                                        <td className="distillery-sticky-col-2 py-2 px-4 text-gray-800 break-words">
                                            {row.label}
                                        </td>
                                        <td className="distillery-sticky-col-3 text-center py-2 px-3 text-gray-500 font-medium">
                                            {!row.isBold && row.um}
                                        </td>
                                        {reportMonths.map((m, mIdx) =>
                  <td key={mIdx} className="text-right py-2 px-4 border-r border-gray-100 font-mono text-gray-700">
                                                {row.data[mIdx] ? row.data[mIdx] : ''}
                                            </td>
                  )}
                                    </tr>);

            })}
                        </tbody>
                    </table>
                </div>
      }
        </div>);

};

export default AccountReports_DISTILLERYReport;