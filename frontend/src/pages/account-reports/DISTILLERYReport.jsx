import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import '../../styles/Report.css';
import '../../styles/DISTILLERYReport.css';
import { openPrintWindow } from '../../utils/print';
import { accountReportsService, masterService } from '../../microservices/api.service';

const AccountReports_DISTILLERYReport = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Form Search State
  const [unitCode, setUnitCode] = useState('0');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [units, setUnits] = useState([]);

  // Mock Data mimicking the complex DistilleryReportViewModel MonthlyData mapping
  const [reportMonths, setReportMonths] = useState([]);
  const [reportRows, setReportRows] = useState([]);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const list = await masterService.getUnits();
        setUnits(Array.isArray(list) ? list : []);
      } catch (error) {
        toast.error('Failed to fetch units');
      }
    };
    loadUnits();
  }, []);

  const formatMonth = (isoDate) => {
    const dt = new Date(isoDate);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleString('en-US', { month: 'short', year: '2-digit' });
  };

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
    try {
      const params = {
        F_Code: unitCode,
        FDate: fromDate || toDate,
        TDate: toDate
      };
      const response = await accountReportsService.getDistilleryReport(params);
      if (response?.status !== 'success') {
        toast.error(response?.message || 'Failed to fetch report');
        return;
      }
      const monthlyData = response?.data?.monthlyData || [];
      const months = Array.from(new Set(monthlyData.map((m) => formatMonth(m.MonthEndDate)).filter(Boolean)));

      const rowDefs = [
        { sr: "1", label: "Own Bagasse", um: "", isBold: true },
        { sr: "", label: "Recd from Self Sugar Plant (+)", um: "QTL", key: "AS_SD_BAG_TR_OWN_DIST" },
        { sr: "", label: "Recd from Other Plants (Qty as per MM) (+)", um: "QTL", key: "AS_DISTBO_BAG_RECD_OTH_PL" },
        { sr: "", label: "Recd from Cogen Div. (+)", um: "QTL", key: "AS_DISTBO_BAG_RECD_COGEN" },
        { sr: "", label: "Consumption (-)", um: "QTL", key: "AS_DISTBO_BAG_CONSU" },
        { sr: "", label: "Excess / (Shortage) (+ / -)", um: "QTL", key: "AS_DISTBO_BAG_EX_SH" },
        { sr: "", label: "Closing Stock", um: "QTL", key: "Closing_Stock_Own_Baggase" },
        { sr: "", label: "Closing Stock as per SAP", um: "QTL", key: "AS_DISTBO_BAG_CLSTOCK" },
        { sr: "", label: "Check", um: "QTL", key: "Check" },
        { sr: "", label: "Break up of closing stock", um: "QTL", isBold: false },
        { sr: "", label: "Bagasse in transit", um: "", key: "AS_DISTBO_BAG_TRANSIT" },
        { sr: "", label: "Physical Closing Stock at Plant", um: "QTL", key: "AS_DISTBO_BAG_PHY_STOCK" },
        { sr: "2", label: "Bagasse Purchased from Outside Vendors:", um: "", isBold: true },
        { sr: "", label: "Opening stock (Finished Sugar)", um: "", isBold: true },
        { sr: "", label: "Purchase from Outside (+)", um: "QTL", key: "AS_DISTBO_BAG_PUR_OOTSIDE" },
        { sr: "", label: "Recd from Cogen Div. (+)", um: "QTL", key: "Bagasse_Purchased_from_Outside_Vendors_recd_from_cogen_div" },
        { sr: "", label: "Consumption (-)", um: "QTL", key: "AS_DISTBO_BAG_CONSU" },
        { sr: "", label: "Excess / (Shortage) (+ / -)", um: "QTL", key: "AS_DISTBO_BAG_EX_SH" },
        { sr: "", label: "Closing Stock", um: "QTL", key: "Closing_Stock_from_outside_vendors" },
        { sr: "", label: "LIVE STEAM :", um: "", isBold: true },
        { sr: "", label: "Bagasse Consumed (-)", um: "QTL", key: "Live_steam_bagasse_consumed" },
        { sr: "", label: "Bio Gas Consumed in Boiler (-)", um: "NMQ", key: "AS_DISTBO_LS_BIOG_CONSU" },
        { sr: "", label: "Slop Consumed In Boiler (-)", um: "QTL", key: "AS_DISTBO_LS_SLOP_CONSU" },
        { sr: "", label: "Live steam Generated from Bagasse", um: "MT", key: "AS_DISTBO_LS_GENET_BAG", isBold: true },
        { sr: "", label: "Live steam Generated from Bio Gas", um: "MT", key: "AS_DISTBO_LS_GENET_BOIG" },
        { sr: "", label: "Live steam Generated from Slop", um: "MT", key: "AS_DISTBO_LS_GENET_SLOP" },
        { sr: "", label: "Sub Total of Steam generation", um: "MT", key: "Sub_Total_of_Steam_generation", isBold: true },
        { sr: "", label: "Live steam received from Cogen Boiler", um: "MT", key: "Live_steam_received_from_Cogen_Boiler", isBold: true },
        { sr: "", label: "Total Live Steam available at Distllery", um: "MT", key: "Total_Live_Steam_available_at_Distllery", isBold: true },
        { sr: "", label: "Live steam given to Sugar Division (-)", um: "MT", key: "AS_DISTBO_LS_GIV_SUG" },
        { sr: "", label: "Live steam given to Cogen Division (-)", um: "MT", key: "AS_COG_LS_GIV_DIST" },
        { sr: "", label: "Live steam Consumed in Distillery Division(-)", um: "MT", key: "AS_DISTBO_LS_CONSU_DIST" },
        { sr: "", label: "Live steam Consumed in Distillery Division (Boiler)/Captive (-)", um: "MT", key: "AS_DISTBO_LS_CONSU_DISTBOI" },
        { sr: "", label: "Live steam given to Disttilery Back pressure Turbine (-)", um: "MT", key: "AS_DISTBO_LS_GIV_BACKP_TURB" },
        { sr: "", label: "Live steam Given to Distillery Condensate Turbine (-)", um: "MT", key: "AS_DISTBO_LS_GIV_CONDE_TURB" },
        { sr: "", label: "Losses Etc (-)", um: "MT", key: "AS_DISTBO_LS_LOSSES" },
        { sr: "", label: "Check", um: "MT", key: "Check_1" },
        { sr: "", label: "EXHAUST STEAM", um: "", isBold: true },
        { sr: "", label: "Live steam given to Turbine Back Pressure", um: "MT", key: "AS_DISTBO_LS_GIV_BACKP_TURB" },
        { sr: "", label: "Exhaust Steam Generated (+)", um: "MT", key: "Exhaust_Steam_Generated" },
        { sr: "", label: "Exhaust Steam Given to Sugar Division (-)", um: "MT", key: "AS_DISTBO_EXS_GIV_SUG" },
        { sr: "", label: "Exhaust Steam Given to Distillery process (-)", um: "MT", key: "AS_DISTBO_EXS_GIV_DIST", isBold: true },
        { sr: "", label: "Exhaust Steam Losses etc (-)", um: "MT", key: "AS_DISTBO_EXS_LOSSES" },
        { sr: "", label: "Check", um: "MT", key: "Check_2" },
        { sr: "", label: "Disttilery Turbine:", um: "", isBold: true },
        { sr: "", label: "Live steam consumed", um: "MT", key: "Live_steam_consumed" },
        { sr: "", label: "Production of Power (+)", um: "KWH", key: "AS_DISTBO_TUR_PROD_POWER" },
        { sr: "", label: "Power Export to UPPCL (-)", um: "KWH", key: "AS_DISTBO_TUR_EXP_UPPCL" },
        { sr: "", label: "Power Export to UPPCL Previous month adjustment(+ / -)", um: "KWH", key: "AS_DISTBO_TUR_EXP_LMONTH", isBold: true },
        { sr: "", label: "Power Banked during the month (-)", um: "%", key: "AS_DISTBO_TUR_BNK_MONTH", isBold: true },
        { sr: "", label: "Power Transfer to Sugar Division (-)", um: "%", key: "AS_DISTBO_TUR_TR_POWER_SUG", isBold: true },
        { sr: "", label: "Power Transfer to Distillery Division (self) for Process (-)", um: "QTL", key: "AS_DISTBO_TUR_TR_DIST_PROCESS" },
        { sr: "", label: "Power Captive Consumption by Disttilery Boiler (-)", um: "QTL", key: "AS_DISTBO_TUR_DIST_BOI" },
        { sr: "", label: "Power Transfer to Co gen Division (-)", um: "QTL", key: "AS_DISTBO_TUR_TR_CONGEN" },
        { sr: "", label: "Power Transfer to ECO Tech (-)", um: "QTL", key: "AS_DISTBO_TUR_ECOT" },
        { sr: "", label: "Losses Etc (-)", um: "QTL", key: "AS_DISTBO_TUR_LOSSES" },
        { sr: "", label: "Total", um: "QTL", key: "Total", isBold: true },
        { sr: "", label: "Distillery Boiler ratio", um: "", isBold: true },
        { sr: "", label: "Bagasse to Steam Ratio", um: "%", key: "Bagasse_to_Steam_Ratio" },
        { sr: "", label: "Bio Gas to Steam ratio", um: "%", key: "Bio_Gas_to_Steam_ratio" },
        { sr: "", label: "Slop to Steam ratio", um: "%", key: "Slop_to_Steam_ratio" }
      ];

      const rows = rowDefs.map((row) => ({
        ...row,
        data: row.key ? monthlyData.map((m) => Number(m[row.key] || 0)) : []
      }));

      setReportMonths(months);
      setReportRows(rows);
      toast.success('Distillery Boiler Report generated successfully!');
    } catch (error) {
      toast.error('Failed to fetch report');
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
      title: "Distillery Boiler Report",
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
                    Distillery Boiler Report
                </div>

                <div className="p-[25px] bg-[#fcfcfc]">
                    <div className="grid gap-[30px] mb-[25px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Factory</label>
                            <select
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)} className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                                <option value="0">All</option>
                                {units.map((u, idx) => (
                                  <option key={`${u.F_Code || u.f_Code || idx}`} value={u.F_Code || u.f_Code}>
                                    {u.F_Name || u.f_Name}
                                  </option>
                                ))}
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
              <th key={idx} className="text-center px-4 py-3 border-r border-[#0f7f6b] whitespace-nowrap min-w-[120px]">
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
                                        <td className="distillery-sticky-col-1 text-center py-2 px-3 text-slate-700 text-xs">
                                            {row.sr}
                                        </td>
                                        <td className="distillery-sticky-col-2 py-2 px-4 text-slate-900 break-words">
                                            {row.label}
                                        </td>
                                        <td className="distillery-sticky-col-3 text-center py-2 px-3 text-slate-700 font-medium">
                                            {!row.isBold && row.um}
                                        </td>
                                        {reportMonths.map((m, mIdx) =>
                  <td key={mIdx} className="text-right py-2 px-4 border-r border-slate-200 font-mono text-slate-800">
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
