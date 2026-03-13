import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService } from '../../microservices/api.service';
import '../../styles/ReportNew.css';

const ReportNew_ApiStatusReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null); // For Modal

  const [form, setForm] = useState({
    F_code: '0',
    Type: '0', // 0: All, 1: Pending, 2: Success, 3: Failed
    ApiType: '0', // 0: All, 1: Distillery, 2: Sugar
    FromDate: new Date().toISOString().split('T')[0],
    ToDate: new Date().toISOString().split('T')[0]
  });

  async function fetchUnits() {
    try {
      const allUnits = await masterService.getUnits();
      setUnits(Array.isArray(allUnits) ? allUnits : []);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  }

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulating the API call
    setTimeout(() => {
      const mockData = [
      {
        OTH_NO: 'TK-8890',
        OTH_ITEM: 'SUG-001',
        IT_DESC: 'SULFURED SUGAR',
        OTH_TRUCK: 'UP14-BT-9901',
        Status: 'FAILED',
        OTH_API_REM: 'Network timeout while pushing to central ERP.',
        OTH_API_LHTM: '2024-02-26 14:10:05',
        oth_tpt_nm: 'Express Logistics',
        OTH_GROSS: 450.50,
        OTH_TARE: 120.20,
        OTH_GROSS_DATE: '26/02/2024',
        OTH_GROSS_TIME: '12:30',
        OTH_TARE_DATE: '26/02/2024',
        OTH_TAREDATETIME: '13:45'
      },
      {
        OTH_NO: 'TK-8891',
        OTH_ITEM: 'DIST-002',
        IT_DESC: 'ETHANOL',
        OTH_TRUCK: 'HR55-CC-1122',
        Status: 'SUCCESS',
        OTH_API_REM: 'Pushed successfully.',
        OTH_API_LHTM: '2024-02-26 14:15:22',
        oth_tpt_nm: 'National Transport',
        OTH_GROSS: 380.00,
        OTH_TARE: 110.00,
        OTH_GROSS_DATE: '26/02/2024',
        OTH_GROSS_TIME: '12:45',
        OTH_TARE_DATE: '26/02/2024',
        OTH_TAREDATETIME: '14:00'
      }];

      setReportData(mockData);
      setLoading(false);
      toast.success('API statuses fetched!');
    }, 1000);
  };

  const handleResend = (id) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Resending API for Token ${id}...`,
        success: 'API Request Resent Successfully!',
        error: 'Resend failed. Try again.'
      }
    );
  };

  const handleExport = () => {
    toast.success("Exporting to Excel...");
  };

  const StatusModal = ({ content, onClose }) => {
    if (!content) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in">
                    <div className="p-6 border-bottom border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800">API Status Details</h3>
                    </div>
                    <div className="p-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-sm break-words whitespace-pre-wrap">
                            {content}
                        </div>
                    </div>
                    <div className="p-6 border-top border-slate-100 flex justify-end gap-3">
                        <button onClick={() => {
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `api-log-${Date.now()}.txt`;
              a.click();
              toast.success("Log downloaded");
            }} className="btn-report btn-secondary">
                            Download Log
                        </button>
                        <button onClick={onClose} className="btn-report btn-primary">
                            Close
                        </button>
                    </div>
                </div>
            </div>);

  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            {selectedStatus && <StatusModal content={selectedStatus} onClose={() => setSelectedStatus(null)} />}

            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
                <div className="bg-[#1F9E8A] text-white py-[12px] px-[20px] text-[15px] font-medium">
                    Api Status Report
                </div>

                <div className="py-[15px] px-[20px] bg-[#E8F5E9] border-b border-b-[#e0e0e0] text-[#666] text-[13px]">
                    Api Status Report
                </div>

                <div className="p-[25px] bg-white">
                    <div className="grid gap-[20px] mb-[25px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Factory</label>
                            <select

                value={form.F_code}
                onChange={handleInputChange}
                name="F_code" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white">
                
                                <option value="0">All</option>
                                {units.map((u, idx) => <option key={`${u.f_Code}-${idx}`} value={u.f_Code}>{u.F_Name || u.name || u.f_Name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Api Status</label>
                            <select

                value={form.Type}
                onChange={handleInputChange}
                name="Type" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white">
                
                                <option value="0">All</option>
                                <option value="1">Pending</option>
                                <option value="2">Success</option>
                                <option value="3">Failed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">From Date</label>
                            <input
                type="text"
                placeholder="DD/MM/YYYY"

                value={form.FromDate}
                onChange={handleInputChange}
                name="FromDate" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">To Date</label>
                            <input
                type="text"
                placeholder="DD/MM/YYYY"

                value={form.ToDate}
                onChange={handleInputChange}
                name="ToDate" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white" />
              
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Api Type</label>
                            <select

                value={form.ApiType}
                onChange={handleInputChange}
                name="ApiType" className="w-[100%] py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white">
                
                                <option value="0">All</option>
                                <option value="1">Distillery</option>
                                <option value="2">Sugar</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-[8px]">
                        <button onClick={handleSearch} disabled={loading} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            {loading ? 'Wait...' : 'Search'}
                        </button>
                        <button onClick={handleExport} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Export Excel
                        </button>
                        <button onClick={() => navigate(-1)} className="bg-[#FF4D6D] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Exit
                        </button>
                    </div>
                </div>
            </div>

            {loading &&
      <div className="results-card loading-overlay">
                    <div className="spinner"></div>
                    <p>Checking API Gateways...</p>
                </div>
      }

            {!loading && reportData &&
      <div className="results-card animate-in slide-in-bottom">
                    <div className="table-responsive">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Token No</th>
                                    <th>Item Code</th>
                                    <th>Item Description</th>
                                    <th>Truck Number</th>
                                    <th>Sync Status</th>
                                    <th>Reports</th>
                                    <th>Actions</th>
                                    <th>Last Hit</th>
                                    <th>Transporter</th>
                                    <th>Gross/Tare</th>
                                    <th>Net Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((item, idx) =>
              <tr key={idx}>
                                        <td className="font-bold text-indigo-600">{item.OTH_NO}</td>
                                        <td>{item.OTH_ITEM}</td>
                                        <td>{item.IT_DESC}</td>
                                        <td>{item.OTH_TRUCK}</td>
                                        <td>
                                            <span className={`status-badge ${item.Status === 'SUCCESS' ? 'status-success' :
                  item.Status === 'FAILED' ? 'status-failed' : 'status-pending'}`
                  }>
                                                {item.Status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                    onClick={() => setSelectedStatus(item.OTH_API_REM)}
                    className="text-primary hover:underline font-semibold">
                    
                                                View Log
                                            </button>
                                        </td>
                                        <td>
                                            <button
                    onClick={() => handleResend(item.OTH_NO)}
                    className="btn-report btn-secondary py-1 px-3 text-xs"
                    disabled={item.Status === 'SUCCESS'}>
                    
                                                Resend
                                            </button>
                                        </td>
                                        <td className="text-xs text-slate-500">{item.OTH_API_LHTM}</td>
                                        <td className="text-sm">{item.oth_tpt_nm}</td>
                                        <td className="text-xs">
                                            G: {item.OTH_GROSS}<br />
                                            T: {item.OTH_TARE}
                                        </td>
                                        <td className="font-bold">{item.OTH_GROSS - item.OTH_TARE}</td>
                                    </tr>
              )}
                            </tbody>
                        </table>
                    </div>
                </div>
      }

            {!loading && !reportData &&
      <div className="results-card p-12 text-center text-slate-400">
                    <i className="fas fa-satellite fa-3x mb-4 opacity-20"></i>
                    <h3>Gateway Monitor Idle</h3>
                    <p>Search by factory and date range to monitor API connectivity.</p>
                </div>
      }
        </div>);

};

export default ReportNew_ApiStatusReport;