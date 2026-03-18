
import React, { useEffect, useState } from 'react';
import { FaFileExcel, FaSearch, FaArrowLeft, FaPrint, FaMoneyBillWave } from 'react-icons/fa';
import '../../styles/Report.css';
import '../../styles/LoansummaryRpt.css';
import { accountReportsService, masterService } from '../../microservices/api.service';
import { toast } from 'react-hot-toast';

const Report_LoansummaryRpt = () => {
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e) => {
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

      const list1Raw = data.list1 || [];
      const list2Raw = data.list2 || [];
      const list3Raw = data.list3 || [];

      const list1 = list1Raw.map((item) => {
        const needyTotal = Number(item.NeedySugarLoan || 0);
        const needyDeducted = Number(item.NeedySugarDeduct || 0);
        const needyBalance = needyTotal - needyDeducted;
        const agriTotal = Number(item.AgriInputsOther || 0);
        const agriDeducted = Number(item.AgriInputsOtherDeduct || 0);
        const agriBalance = agriTotal - agriDeducted;
        return {
          F_Name: item.Fname || item.F_Name || '',
          NeedyTotal: needyTotal,
          NeedyDeducted: needyDeducted,
          NeedyBalance: needyBalance,
          AgriTotal: agriTotal,
          AgriDeducted: agriDeducted,
          AgriBalance: agriBalance,
          GrandTotal: needyTotal + agriTotal,
          GrandDeducted: needyDeducted + agriDeducted,
          GrandBalance: needyBalance + agriBalance,
          NonDeductible: 0,
          Remarks: ''
        };
      });

      if (list1.length) {
        const totals = list1.reduce(
          (acc, r) => {
            acc.NeedyTotal += r.NeedyTotal;
            acc.NeedyDeducted += r.NeedyDeducted;
            acc.NeedyBalance += r.NeedyBalance;
            acc.AgriTotal += r.AgriTotal;
            acc.AgriDeducted += r.AgriDeducted;
            acc.AgriBalance += r.AgriBalance;
            acc.GrandTotal += r.GrandTotal;
            acc.GrandDeducted += r.GrandDeducted;
            acc.GrandBalance += r.GrandBalance;
            return acc;
          },
          {
            NeedyTotal: 0,
            NeedyDeducted: 0,
            NeedyBalance: 0,
            AgriTotal: 0,
            AgriDeducted: 0,
            AgriBalance: 0,
            GrandTotal: 0,
            GrandDeducted: 0,
            GrandBalance: 0
          }
        );
        list1.push({
          F_Name: 'Total',
          ...totals,
          NonDeductible: 0,
          Remarks: '',
          isTotal: true
        });
      }

      const list2 = list2Raw.map((item) => {
        const needyBalance = Number(item.NeedySugarLoan || 0);
        const agriBalance = Number(item.AgriInputsOther || 0);
        const factoryTotal = needyBalance + agriBalance;
        const societyBalance = Number(item.SocietyTotal || 0);
        return {
          F_Name: item.Fname || item.F_Name || '',
          NeedyBalance: needyBalance,
          AgriBalance: agriBalance,
          FactoryTotal: factoryTotal,
          NonDeductible: 0,
          SocietyBalance: societyBalance,
          GrandTotal: factoryTotal + societyBalance,
          Remarks: ''
        };
      });

      if (list2.length) {
        const totals = list2.reduce(
          (acc, r) => {
            acc.NeedyBalance += r.NeedyBalance;
            acc.AgriBalance += r.AgriBalance;
            acc.FactoryTotal += r.FactoryTotal;
            acc.SocietyBalance += r.SocietyBalance;
            acc.GrandTotal += r.GrandTotal;
            return acc;
          },
          {
            NeedyBalance: 0,
            AgriBalance: 0,
            FactoryTotal: 0,
            SocietyBalance: 0,
            GrandTotal: 0
          }
        );
        list2.push({
          F_Name: 'Total',
          ...totals,
          NonDeductible: 0,
          Remarks: '',
          isTotal: true
        });
      }

      const list3 = list3Raw.map((item) => {
        const totalAmount = Number(item.AgriInputsOther || 0);
        const recoveredAmount = Number(item.NeedySugarDeduct || 0);
        const balanceAmount = totalAmount - recoveredAmount;
        return {
          F_Name: item.Fname || item.F_Name || '',
          LoanHead: item.LoanCategory || '',
          TotalAmount: totalAmount,
          RecoveredAmount: recoveredAmount,
          BalanceAmount: balanceAmount,
          NotRecoverable: 0,
          IsRecoverable: 'Y'
        };
      });

      setReportData({ list1, list2, list3 });
      if (!list1.length && !list2.length && !list3.length) {
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
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-[8px]">
                        <button onClick={handleSubmit} disabled={isLoading} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            {isLoading ? 'Wait...' : 'Search'}
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
                    {formData.ReportType === '1' &&
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
                                {reportData.list1.length === 0 &&
                <tr>
                                    <td colSpan="13" className="text-center py-8 text-slate-400">
                                        No data found. Please select filters and click Search.
                                    </td>
                                </tr>}
                                {reportData.list1.map((item, idx) =>
                <tr key={idx} className={item.isTotal ? 'bg-[#37d39a] font-semibold' : ''}>
                                    <td>{item.isTotal ? '' : idx + 1}</td>
                                    <td>{item.F_Name}</td>
                                    <td align="right">{item.NeedyTotal?.toFixed ? item.NeedyTotal.toFixed(2) : item.NeedyTotal}</td>
                                    <td align="right">{item.NeedyDeducted?.toFixed ? item.NeedyDeducted.toFixed(2) : item.NeedyDeducted}</td>
                                    <td align="right">{item.NeedyBalance?.toFixed ? item.NeedyBalance.toFixed(2) : item.NeedyBalance}</td>
                                    <td align="right">{item.AgriTotal?.toFixed ? item.AgriTotal.toFixed(2) : item.AgriTotal}</td>
                                    <td align="right">{item.AgriDeducted?.toFixed ? item.AgriDeducted.toFixed(2) : item.AgriDeducted}</td>
                                    <td align="right">{item.AgriBalance?.toFixed ? item.AgriBalance.toFixed(2) : item.AgriBalance}</td>
                                    <td align="right">{item.GrandTotal?.toFixed ? item.GrandTotal.toFixed(2) : item.GrandTotal}</td>
                                    <td align="right">{item.GrandDeducted?.toFixed ? item.GrandDeducted.toFixed(2) : item.GrandDeducted}</td>
                                    <td align="right">{item.GrandBalance?.toFixed ? item.GrandBalance.toFixed(2) : item.GrandBalance}</td>
                                    <td align="right">0</td>
                                    <td></td>
                                </tr>
                )}
                            </tbody>
                        </table>
          }

                    {formData.ReportType === '1' &&
          <table className="report-table" id="example" style={{ marginTop: '16px' }}>
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
                                    <th>Cannot be deducted from this year's sugarcane price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.list2.length === 0 &&
                <tr>
                                    <td colSpan="9" className="text-center py-8 text-slate-400">
                                        No data found. Please select filters and click Search.
                                    </td>
                                </tr>}
                                {reportData.list2.map((item, idx) =>
                <tr key={idx} className={item.isTotal ? 'bg-[#37d39a] font-semibold' : ''}>
                                    <td>{item.isTotal ? '' : idx + 1}</td>
                                    <td>{item.F_Name}</td>
                                    <td align="right">{item.NeedyBalance?.toFixed ? item.NeedyBalance.toFixed(2) : item.NeedyBalance}</td>
                                    <td align="right">{item.AgriBalance?.toFixed ? item.AgriBalance.toFixed(2) : item.AgriBalance}</td>
                                    <td align="right">{item.FactoryTotal?.toFixed ? item.FactoryTotal.toFixed(2) : item.FactoryTotal}</td>
                                    <td align="right">0</td>
                                    <td align="right">{item.SocietyBalance?.toFixed ? item.SocietyBalance.toFixed(2) : item.SocietyBalance}</td>
                                    <td align="right">{item.GrandTotal?.toFixed ? item.GrandTotal.toFixed(2) : item.GrandTotal}</td>
                                    <td></td>
                                </tr>
                )}
                            </tbody>
                        </table>
          }

                    {formData.ReportType === '2' &&
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
                                {reportData.list2.length === 0 &&
                <tr>
                                    <td colSpan="9" className="text-center py-8 text-slate-400">
                                        No data found. Please select filters and click Search.
                                    </td>
                                </tr>}
                                {reportData.list2.map((item, idx) =>
                <tr key={idx} className={item.isTotal ? 'bg-[#37d39a] font-semibold' : ''}>
                                    <td>{item.isTotal ? '' : idx + 1}</td>
                                    <td>{item.F_Name}</td>
                                    <td align="right">{item.NeedyBalance?.toFixed ? item.NeedyBalance.toFixed(2) : item.NeedyBalance}</td>
                                    <td align="right">{item.AgriBalance?.toFixed ? item.AgriBalance.toFixed(2) : item.AgriBalance}</td>
                                    <td align="right">{item.FactoryTotal?.toFixed ? item.FactoryTotal.toFixed(2) : item.FactoryTotal}</td>
                                    <td align="right">0</td>
                                    <td align="right">{item.SocietyBalance?.toFixed ? item.SocietyBalance.toFixed(2) : item.SocietyBalance}</td>
                                    <td align="right">{item.GrandTotal?.toFixed ? item.GrandTotal.toFixed(2) : item.GrandTotal}</td>
                                    <td></td>
                                </tr>
                )}
                            </tbody>
                        </table>
          }

                </div>
            </div>
        </div>);

};

export default Report_LoansummaryRpt;
