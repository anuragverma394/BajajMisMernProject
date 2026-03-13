import React, { useState } from 'react';
import { FaFileExcel, FaSearch, FaArrowLeft, FaPrint, FaMoneyBillWave } from 'react-icons/fa';
import '../../styles/Report.css';
import '../../styles/LoansummaryRpt.css';

const Report_LoansummaryRpt = () => {
  const [formData, setFormData] = useState({
    factory: '',
    fromDate: '',
    toDate: '',
    reportType: '1'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Search with:', formData);
    // API call logic will go here
  };

  const handleExport = () => {
    console.log('Exporting to Excel...');
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

                <div className="py-[15px] px-[20px] bg-[#E8F5E9] border-b border-b-[#e0e0e0] text-[#666] text-[13px] uppercase">
                    LOAN SUMMARY
                </div>

                <div className="p-[25px] bg-white">
                    <div className="grid gap-[30px] mb-[25px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Factory</label>
                            <select

                value={formData.factory}
                onChange={handleChange}
                name="factory" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="">All</option>
                                <option value="1">Unit 1</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">From Date</label>
                            <input
                type="text"
                placeholder="01/01/2000"

                value={formData.fromDate}
                onChange={handleChange}
                name="fromDate" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">To Date</label>
                            <input
                type="text"
                placeholder="dd/mm/yyyy"

                value={formData.toDate}
                onChange={handleChange}
                name="toDate" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Report Type</label>
                            <select

                value={formData.reportType}
                onChange={handleChange}
                name="reportType" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="1">Loan Summary</option>
                                <option value="2">Factory Loan Summary</option>
                                <option value="3">Other Balance Report</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-[8px]">
                        <button onClick={handleSubmit} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Search
                        </button>
                        <button onClick={handlePrint} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            print
                        </button>
                        <button onClick={handleExport} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Excel
                        </button>
                        <button onClick={() => window.history.back()} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Exit
                        </button>
                    </div>
                </div>
            </div>
            <div className="report-card-content">
                <div className="report-table-container">
                    {formData.reportType === '1' &&
          <table className="report-table" id="example">
                            <thead>
                                <tr>
                                    <th rowSpan="2" className="align-middle">Sr. No.</th>
                                    <th rowSpan="2" className="align-middle">Unit Name</th>
                                    <th colSpan="3" className="text-center">Needy & Sugar</th>
                                    <th colSpan="3" className="text-center">Agri Inputs & Other Loan</th>
                                    <th colSpan="3" className="text-center">Grand Total</th>
                                    <th rowSpan="2" className="align-middle">Cannot be deducted...</th>
                                    <th rowSpan="2" className="align-middle">Remarks</th>
                                </tr>
                                <tr>
                                    <th>Total Loan</th><th>Deducted</th><th>Balance</th>
                                    <th>Total Loan</th><th>Deducted</th><th>Balance</th>
                                    <th>Total Loan</th><th>Deducted</th><th>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="13" className="text-center py-8 text-slate-400">
                                        No data found. Please select filters and click Search.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
          }

                    {formData.reportType === '2' &&
          <table className="report-table" id="example">
                            <thead>
                                <tr>
                                    <th rowSpan="2" className="align-middle">Sr. No.</th>
                                    <th rowSpan="2" className="align-middle">Unit Name</th>
                                    <th colSpan="4" className="text-center">Balance Factory Loan</th>
                                    <th rowSpan="2" className="align-middle">Balance Society Loan</th>
                                    <th rowSpan="2" className="align-middle">Grand Total</th>
                                    <th rowSpan="2" className="align-middle">Remarks</th>
                                </tr>
                                <tr>
                                    <th>Needy & Sugar</th>
                                    <th>Agri Inputs & Other</th>
                                    <th>Total</th>
                                    <th>Non-Deductible</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="9" className="text-center py-8 text-slate-400">
                                        No data found. Please select filters and click Search.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
          }

                    {formData.reportType === '3' &&
          <table className="report-table" id="example">
                            <thead>
                                <tr>
                                    <th>Sr. No.</th>
                                    <th>Unit Name</th>
                                    <th>Loan Head</th>
                                    <th>Total loan Amount (Lac Rs.)</th>
                                    <th>Amount already Recovered (Lac Rs.)</th>
                                    <th>Balance Amount to be recovered (Lac Rs.)</th>
                                    <th>Amount not recoverable (Lac Rs.)</th>
                                    <th>Recoverable from SS 2024-25? (Y/N)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-slate-400">
                                        No data found. Please select filters and click Search.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
          }
                </div>
            </div>
        </div>);

};

export default Report_LoansummaryRpt;