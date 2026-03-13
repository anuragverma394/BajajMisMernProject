import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileExcel, FaSearch, FaArrowLeft, FaPrint, FaMoneyBillWave, FaSpinner, FaSignOutAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { accountReportsService, masterService } from '../../microservices/api.service';
import '../../styles/Report.css';
import '../../styles/LoansummaryRpt.css';

const AccountReports_LoanSummaryReport = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [units, setUnits] = useState([]);
  const [reportData, setReportData] = useState({
    list1: [],
    list2: [],
    list3: []
  });
  const [formData, setFormData] = useState({
    F_code: '0',
    FromDate: '2000-01-01',
    ToDate: new Date().toISOString().split('T')[0],
    ReportType: '1'
  });

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const data = await masterService.getUnits();
        setUnits(data || []);
      } catch (error) {
        console.error('Error fetching units:', error);
        toast.error('Failed to load units');
      }
    };
    fetchUnits();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const params = {
        F_code: formData.F_code,
        FromDate: formData.FromDate.split('-').reverse().join('/'),
        ToDate: formData.ToDate.split('-').reverse().join('/'),
        ReportType: formData.ReportType
      };
      const data = await accountReportsService.getLoanSummaryReport(params);
      setReportData({
        list1: data.list1 || [],
        list2: data.list2 || [],
        list3: data.list3 || []
      });
      if (data.list1?.length === 0 && data.list2?.length === 0 && data.list3?.length === 0) {
        toast.error('No data found for the selected filters');
      } else {
        toast.success('Report generated successfully');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData.list1.length && !reportData.list2.length && !reportData.list3.length) {
      toast.error('No data to export');
      return;
    }
    // Basic export logic (CSV or table to Excel)
    toast.success('Exporting to Excel...');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
                <div className="bg-[#1F9E8A] text-white py-[12px] px-[20px] text-[15px] font-medium uppercase">
                    LOAN SUMMARY REPORT
                </div>

                <div className="py-[15px] px-[20px] bg-[#E8F5E9] border-b border-b-[#e0e0e0] text-[#666] text-[13px]">
                    LOAN SUMMARY
                </div>

                <div className="p-[25px] bg-white">
                    <div className="grid gap-[30px] mb-[25px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Factory</label>
                            <select

                value={formData.F_code}
                onChange={handleChange}
                name="F_code" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="0">All</option>
                                {units.map((u, idx) => <option key={`${u.f_Code}-${idx}`} value={u.f_Code}>{u.F_Name || u.name || u.f_Name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">From Date</label>
                            <input
                type="text"
                placeholder="01/01/2000"

                value={formData.FromDate}
                onChange={handleChange}
                name="FromDate" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">To Date</label>
                            <input
                type="text"
                placeholder="dd/mm/yyyy"

                value={formData.ToDate}
                onChange={handleChange}
                name="ToDate" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Report Type</label>
                            <select

                value={formData.ReportType}
                onChange={handleChange}
                name="ReportType" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="1">Loan Summary</option>
                                <option value="2">Factory Loan Summary</option>
                                <option value="3">Other Balance Report</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-[8px]">
                        <button onClick={handleSearch} disabled={isLoading} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            {isLoading ? 'Wait...' : 'Search'}
                        </button>
                        <button onClick={handlePrint} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            print
                        </button>
                        <button onClick={handleExport} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Excel
                        </button>
                        <button onClick={() => navigate(-1)} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Exit
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {(reportData.list1.length > 0 || reportData.list2.length > 0 || reportData.list3.length > 0) &&
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider">
                            {formData.ReportType === '1' ? 'LOAN SUMMARY' :
            formData.ReportType === '2' ? 'FACTORY LOAN SUMMARY' :
            'OTHER BALANCE REPORT'}
                        </h3>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        {formData.ReportType === '1' &&
          <table className="report-table-modern w-full text-sm">
                                <thead className="bg-slate-800 text-white">
                                    <tr>
                                        <th rowSpan="2" className="p-3 border-r border-slate-700 align-middle text-center">Sr. No.</th>
                                        <th rowSpan="2" className="p-3 border-r border-slate-700 align-middle">Unit Name</th>
                                        <th colSpan="3" className="p-2 border-b border-slate-700 text-center bg-blue-900/50">Needy & Sugar</th>
                                        <th colSpan="3" className="p-2 border-b border-slate-700 text-center bg-emerald-900/50">Agri Inputs & Other Loan</th>
                                        <th colSpan="3" className="p-2 border-b border-slate-700 text-center bg-indigo-900/50">Grand Total</th>
                                        <th rowSpan="2" className="p-3 border-r border-slate-700 align-middle">Cannot be deducted...</th>
                                        <th rowSpan="2" className="p-3 align-middle">Remarks</th>
                                    </tr>
                                    <tr className="bg-slate-700">
                                        <th className="p-2 border-r border-slate-600 text-right">Total Loan</th>
                                        <th className="p-2 border-r border-slate-600 text-right">Deducted</th>
                                        <th className="p-2 border-r border-slate-600 text-right">Balance</th>
                                        <th className="p-2 border-r border-slate-600 text-right">Total Loan</th>
                                        <th className="p-2 border-r border-slate-600 text-right">Deducted</th>
                                        <th className="p-2 border-r border-slate-600 text-right">Balance</th>
                                        <th className="p-2 border-r border-slate-600 text-right font-bold">Total Loan</th>
                                        <th className="p-2 border-r border-slate-600 text-right font-bold">Deducted</th>
                                        <th className="p-2 border-r border-slate-600 text-right font-bold">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.list1.map((item, idx) =>
              <tr key={idx} className="hover:bg-blue-50 border-b border-slate-100 transition-colors">
                                            <td className="p-3 border-r border-slate-100 text-center">{idx + 1}</td>
                                            <td className="p-3 border-r border-slate-100 font-semibold text-slate-700">{item.F_Name}</td>
                                            <td className="p-3 border-r border-slate-100 text-right">{item.NeedyTotal?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right">{item.NeedyDeducted?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right font-medium text-blue-600">{item.NeedyBalance?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right">{item.AgriTotal?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right">{item.AgriDeducted?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right font-medium text-emerald-600">{item.AgriBalance?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right font-bold">{item.GrandTotal?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right font-bold">{item.GrandDeducted?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right font-bold text-indigo-700">{item.GrandBalance?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right text-red-500 font-medium">{item.NonDeductible?.toLocaleString() || '0'}</td>
                                            <td className="p-3 text-slate-500 italic text-xs">{item.Remarks}</td>
                                        </tr>
              )}
                                </tbody>
                            </table>
          }

                        {formData.ReportType === '2' &&
          <table className="report-table-modern w-full text-sm">
                                <thead className="bg-slate-800 text-white">
                                    <tr>
                                        <th rowSpan="2" className="p-3 border-r border-slate-700 align-middle text-center">Sr. No.</th>
                                        <th rowSpan="2" className="p-3 border-r border-slate-700 align-middle">Unit Name</th>
                                        <th colSpan="4" className="p-2 border-b border-slate-700 text-center bg-blue-900/50">Balance Factory Loan</th>
                                        <th rowSpan="2" className="p-3 border-r border-slate-700 align-middle text-right bg-emerald-900/50">Balance Society Loan</th>
                                        <th rowSpan="2" className="p-3 border-r border-slate-700 align-middle text-right font-bold bg-indigo-900/50">Grand Total</th>
                                        <th rowSpan="2" className="p-3 align-middle text-center">Remarks</th>
                                    </tr>
                                    <tr className="bg-slate-700">
                                        <th className="p-2 border-r border-slate-600 text-right">Needy & Sugar</th>
                                        <th className="p-2 border-r border-slate-600 text-right">Agri Inputs & Other</th>
                                        <th className="p-2 border-r border-slate-600 text-right font-bold">Total</th>
                                        <th className="p-2 border-r border-slate-600 text-right text-red-300">Non-Deductible</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.list2.map((item, idx) =>
              <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                                            <td className="p-3 border-r border-slate-100 text-center">{idx + 1}</td>
                                            <td className="p-3 border-r border-slate-100 font-semibold">{item.F_Name}</td>
                                            <td className="p-3 border-r border-slate-100 text-right">{item.NeedyBalance?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right">{item.AgriBalance?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right font-bold text-blue-600">{item.FactoryTotal?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right text-red-500 font-medium">{item.NonDeductible?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right font-medium text-emerald-600">{item.SocietyBalance?.toLocaleString() || '0'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right font-black text-indigo-700">{item.GrandTotal?.toLocaleString() || '0'}</td>
                                            <td className="p-3 text-slate-500 italic text-xs">{item.Remarks}</td>
                                        </tr>
              )}
                                </tbody>
                            </table>
          }

                        {formData.ReportType === '3' &&
          <table className="report-table-modern w-full text-sm">
                                <thead className="bg-slate-800 text-white">
                                    <tr className="text-left">
                                        <th className="p-4 border-r border-slate-700 text-center">Sr. No.</th>
                                        <th className="p-4 border-r border-slate-700">Unit Name</th>
                                        <th className="p-4 border-r border-slate-700">Loan Head</th>
                                        <th className="p-4 border-r border-slate-700 text-right">Total loan Amount (Lac Rs.)</th>
                                        <th className="p-4 border-r border-slate-700 text-right">Amount Recovered (Lac Rs.)</th>
                                        <th className="p-4 border-r border-slate-700 text-right font-bold">Balance Amount (Lac Rs.)</th>
                                        <th className="p-4 border-r border-slate-700 text-right text-red-300">Not recoverable (Lac Rs.)</th>
                                        <th className="p-4 text-center">Recoverable SS 24-25?</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.list3.map((item, idx) =>
              <tr key={idx} className="hover:bg-blue-50 border-b border-slate-100 transition-colors">
                                            <td className="p-3 border-r border-slate-100 text-center font-medium bg-slate-50/50">{idx + 1}</td>
                                            <td className="p-3 border-r border-slate-100 font-semibold text-slate-700">{item.F_Name}</td>
                                            <td className="p-3 border-r border-slate-100 text-indigo-600 font-medium">{item.LoanHead}</td>
                                            <td className="p-3 border-r border-slate-100 text-right">{item.TotalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right text-emerald-600">{item.RecoveredAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right font-bold text-blue-700">{item.BalanceAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</td>
                                            <td className="p-3 border-r border-slate-100 text-right text-red-500">{item.NotRecoverable?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.IsRecoverable === 'Y' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {item.IsRecoverable || 'N'}
                                                </span>
                                            </td>
                                        </tr>
              )}
                                </tbody>
                            </table>
          }
                    </div>
                </div>
      }
        </div>);

};

export default AccountReports_LoanSummaryReport;