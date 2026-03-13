import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService } from '../../microservices/api.service';
import '../../styles/ReportNew.css';

const ReportNew_SampleOfTransporter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  const [form, setForm] = useState({
    Zone: '0',
    F_code: '0',
    TR_CODE: '0',
    FromDate: new Date().toISOString().split('T')[0],
    ToDate: new Date().toISOString().split('T')[0]
  });

  async function fetchUnits() {
    try {
      // Mocking the behavior of Zoneunitdatadist from .NET
      const allUnits = await masterService.getUnits();
      if (form.Zone === '0') {
        setUnits(allUnits);
      } else {
        // Filter based on Zone (Central, West, East)
        const filtered = allUnits.filter((u) => u.zone === form.Zone);
        setUnits(filtered);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  }

  useEffect(() => {
    fetchUnits();
  }, [form.Zone]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (form.TR_CODE === '0') {
      toast.error('Please Select Payment Type!');
      return;
    }

    setLoading(true);
    // Simulating the getdataCanePurcaseReport from .NET
    setTimeout(() => {
      // Mock Detailed Data
      const mockDetailed = [
      {
        SrNo: 1,
        F_name: 'KINAUNI',
        billno: 'B2024-001',
        FromDate: '2024-01-01',
        ToDate: '2024-01-15',
        tr_code: 101,
        tr_name: 'Rahul Logistics',
        recordCount: 45,
        weight: 1250.50,
        amount: 250000,
        diffwt: 10.20,
        diffamt: 2000,
        totalamt: 252000,
        sec: 5000,
        tds: 2500,
        other: 1500,
        totded: 9000,
        netpaidamount: 243000
      },
      {
        SrNo: 2,
        F_name: 'BILAI',
        billno: 'B2024-002',
        FromDate: '2024-01-01',
        ToDate: '2024-01-15',
        tr_code: 102,
        tr_name: 'Sharma Carriers',
        recordCount: 30,
        weight: 800.75,
        amount: 160000,
        diffwt: 5.40,
        diffamt: 1080,
        totalamt: 161080,
        sec: 3200,
        tds: 1600,
        other: 800,
        totded: 5600,
        netpaidamount: 155480
      }];


      // Mock Summary Data (By Factory)
      const mockSummary = [
      {
        SrNo: 1,
        F_name: 'KINAUNI',
        weight: 1250.50,
        amount: 250000,
        diffwt: 10.20,
        diffamt: 2000,
        totalamt: 252000,
        sec: 5000,
        tds: 2500,
        other: 1500,
        totded: 9000,
        netpaidamount: 243000
      },
      {
        SrNo: 2,
        F_name: 'BILAI',
        weight: 800.75,
        amount: 160000,
        diffwt: 5.40,
        diffamt: 1080,
        totalamt: 161080,
        sec: 3200,
        tds: 1600,
        other: 800,
        totded: 5600,
        netpaidamount: 155480
      }];


      setReportData(mockDetailed);
      setSummaryData(mockSummary);
      setLoading(false);
      toast.success('Data fetched successfully!');
    }, 1200);
  };

  const handleExport = () => {
    toast.success("Exporting to Excel...");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
                <div className="bg-[#1F9E8A] text-white py-[12px] px-[20px] text-[15px] font-medium">
                    Transporter / Loader Bill
                </div>

                <div className="py-[15px] px-[20px] bg-[#E8F5E9] border-b border-b-[#e0e0e0] text-[#666] text-[13px]">
                    Transporter / Loader Bill
                </div>

                <div className="p-[25px] bg-white">
                    <div className="grid gap-[30px] mb-[15px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Zone</label>
                            <select

                value={form.Zone}
                onChange={handleInputChange}
                name="Zone" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="0">All</option>
                                <option value="CZ">Central Zone</option>
                                <option value="WZ">West Zone</option>
                                <option value="EZ">East Zone</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Unit</label>
                            <select

                value={form.F_code}
                onChange={handleInputChange}
                name="F_code" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="0">All</option>
                                {units.map((u, idx) => <option key={`${u.f_Code}-${idx}`} value={u.f_Code}>{u.F_Name || u.name || u.f_Name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Payment Type</label>
                            <select

                value={form.TR_CODE}
                onChange={handleInputChange}
                name="TR_CODE"
                required className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white">
                
                                <option value="0">Please Select</option>
                                <option value="1">Transporter</option>
                                <option value="2">Loader</option>
                                <option value="3">Tol</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">From Date</label>
                            <input
                type="date"

                value={form.FromDate}
                onChange={handleInputChange}
                name="FromDate" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>
                    </div>

                    <div className="grid gap-[30px] mb-[25px]">
                        <div className="max-w-[300px]">
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">To Date</label>
                            <input
                type="date"

                value={form.ToDate}
                onChange={handleInputChange}
                name="ToDate" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>
                    </div>

                    <div className="flex items-center gap-[8px]">
                        <button onClick={handleSearch} disabled={loading} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            {loading ? 'Wait...' : 'Search'}
                        </button>
                        <button onClick={handleExport} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Export Excel
                        </button>
                        <button onClick={() => navigate(-1)} className="bg-[#FF4D6D] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Exit
                        </button>
                        <div className="flex items-center gap-[5px] ml-[5px]">
                            <input type="checkbox" checked={showSummary} onChange={(e) => setShowSummary(e.target.checked)} id="showSummaryCheck" className="cursor-pointer" />
                            <label htmlFor="showSummaryCheck" className="text-[13px] text-[#333] cursor-pointer">Show Only Summary</label>
                        </div>
                    </div>
                </div>
            </div>

            {loading &&
      <div className="results-card loading-overlay">
                    <div className="spinner"></div>
                    <p>Generating Report...</p>
                </div>
      }

            {!loading && (reportData || summaryData) &&
      <div className="results-card animate-in slide-in-bottom">
                    <div className="table-responsive">
                        {showSummary ?
          <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Sr.No</th>
                                        <th>Factory Name</th>
                                        <th>Cane Weight (Qttls)</th>
                                        <th>Amount (Rs)</th>
                                        <th>Extra Wt (Qtls)</th>
                                        <th>Extra Amt (Rs)</th>
                                        <th>Total Amt (Rs)</th>
                                        <th>Retention (Rs)</th>
                                        <th>TDS Amount (Rs)</th>
                                        <th>Other Ded (Rs)</th>
                                        <th>Total Ded (Rs)</th>
                                        <th>Net Payable (Rs)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryData.map((item, idx) =>
              <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td className="font-bold">{item.F_name}</td>
                                            <td>{item.weight.toFixed(2)}</td>
                                            <td>{item.amount.toLocaleString()}</td>
                                            <td>{item.diffwt.toFixed(2)}</td>
                                            <td>{item.diffamt.toLocaleString()}</td>
                                            <td className="font-bold text-slate-800">{item.totalamt.toLocaleString()}</td>
                                            <td>{item.sec.toLocaleString()}</td>
                                            <td>{item.tds.toLocaleString()}</td>
                                            <td>{item.other.toLocaleString()}</td>
                                            <td className="text-red-500 font-semibold">{item.totded.toLocaleString()}</td>
                                            <td className="font-bold text-emerald-600">{item.netpaidamount.toLocaleString()}</td>
                                        </tr>
              )}
                                    <tr className="summary-row">
                                        <td colSpan="2">GRAND TOTAL</td>
                                        <td>{summaryData.reduce((acc, curr) => acc + curr.weight, 0).toFixed(2)}</td>
                                        <td>{summaryData.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</td>
                                        <td>{summaryData.reduce((acc, curr) => acc + curr.diffwt, 0).toFixed(2)}</td>
                                        <td>{summaryData.reduce((acc, curr) => acc + curr.diffamt, 0).toLocaleString()}</td>
                                        <td>{summaryData.reduce((acc, curr) => acc + curr.totalamt, 0).toLocaleString()}</td>
                                        <td>{summaryData.reduce((acc, curr) => acc + curr.sec, 0).toLocaleString()}</td>
                                        <td>{summaryData.reduce((acc, curr) => acc + curr.tds, 0).toLocaleString()}</td>
                                        <td>{summaryData.reduce((acc, curr) => acc + curr.other, 0).toLocaleString()}</td>
                                        <td>{summaryData.reduce((acc, curr) => acc + curr.totded, 0).toLocaleString()}</td>
                                        <td>{summaryData.reduce((acc, curr) => acc + curr.netpaidamount, 0).toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table> :

          <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Sr.No</th>
                                        <th>Factory</th>
                                        <th>Bill No</th>
                                        <th>Cycle</th>
                                        <th>Code</th>
                                        <th>Name</th>
                                        <th>Trips</th>
                                        <th>Weight (Qt)</th>
                                        <th>Amount (Rs)</th>
                                        <th>Total Amt (Rs)</th>
                                        <th>Total Ded (Rs)</th>
                                        <th>Net Payable</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((item, idx) =>
              <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td>{item.F_name}</td>
                                            <td>{item.billno}</td>
                                            <td>{item.FromDate} - {item.ToDate}</td>
                                            <td>{item.tr_code}</td>
                                            <td className="font-semibold">{item.tr_name}</td>
                                            <td>{item.recordCount}</td>
                                            <td>{item.weight.toFixed(2)}</td>
                                            <td>{item.amount.toLocaleString()}</td>
                                            <td className="font-bold">{item.totalamt.toLocaleString()}</td>
                                            <td className="text-red-500">{item.totded.toLocaleString()}</td>
                                            <td className="font-bold text-emerald-600">{item.netpaidamount.toLocaleString()}</td>
                                        </tr>
              )}
                                </tbody>
                            </table>
          }
                    </div>
                </div>
      }

            {!loading && !reportData && !summaryData &&
      <div className="results-card p-12 text-center text-slate-400">
                    <i className="fas fa-info-circle fa-3x mb-4 opacity-20"></i>
                    <h3>No report generated yet</h3>
                    <p>Select your filters and click Search to view the transporter bills.</p>
                </div>
      }
        </div>);

};

export default ReportNew_SampleOfTransporter;