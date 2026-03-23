import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { masterService } from '../../microservices/api.service';
import { reportNewService } from '../../microservices/report-new.service';

const formatDmy = (date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const ReportNew_ApiStatusReport = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const [form, setForm] = useState({
    F_code: '0',
    Type: '0',
    ApiType: '0',
    FromDate: formatDmy(new Date()),
    ToDate: formatDmy(new Date())
  });

  useEffect(() => {
    let mounted = true;
    masterService.getUnits()
      .then((rows) => {
        if (!mounted) return;
        setUnits(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!mounted) return;
        setUnits([]);
      });
    return () => { mounted = false; };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await reportNewService.getApiStatusReport(form);
      const rows = Array.isArray(response?.data) ? response.data
        : Array.isArray(response?.data?.data) ? response.data.data
          : Array.isArray(response?.data?.rows) ? response.data.rows
            : Array.isArray(response?.data?.recordsets?.[0]) ? response.data.recordsets[0]
              : Array.isArray(response?.data?.data?.rows) ? response.data.data.rows
                : [];
      setReportData(rows);
      if (!rows.length) toast.error('No records found.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load data');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (id) => {
    const factoryCode = form.F_code || '0';
    try {
      toast.loading(`Resending API for Token ${id}...`, { id: 'resend' });
      await reportNewService.resendApiStatusReport({ id, fcode: factoryCode, FactoryCode: factoryCode });
      toast.success('API Request Resent Successfully!', { id: 'resend' });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Resend failed. Try again.', { id: 'resend' });
    }
  };

  const handleExport = () => {
    if (!reportData.length) {
      toast.error('No data to export');
      return;
    }
    const headers = [
      'Token No', 'Item Code', 'Item Description', 'Truck Number', 'API Status Type', 'API Status',
      'Resend', 'Pushd Date time', 'Transporter Name', 'Gross Weight', 'Tare Weight', 'Net Qty',
      'Gross Date', 'Gross Time', 'Tare Date', 'Tare time'
    ];
    const rows = reportData.map((r) => [
      r.OTH_NO ?? '',
      r.OTH_ITEM ?? '',
      r.IT_DESC ?? '',
      r.OTH_TRUCK ?? '',
      r.Status ?? '',
      r.OTH_API_REM ?? '',
      '',
      r.OTH_API_LHTM ?? '',
      r.oth_tpt_nm ?? '',
      r.OTH_GROSS ?? '',
      r.OTH_TARE ?? '',
      (Number(r.OTH_GROSS || 0) - Number(r.OTH_TARE || 0)).toFixed(3),
      r.OTH_GROSS_DATE ?? '',
      r.OTH_GROSS_TIME ?? '',
      r.OTH_TARE_DATE ?? '',
      r.OTH_TAREDATETIME ?? ''
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-status-report-${Date.now()}.csv`;
    a.click();
  };

  const modal = selectedStatus ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">API Status Details</h3>
        </div>
        <div className="p-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-sm break-words whitespace-pre-wrap">
            {selectedStatus}
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={() => {
              const blob = new Blob([selectedStatus], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `api-log-${Date.now()}.txt`;
              a.click();
              toast.success('Log downloaded');
            }}
            className="bg-slate-200 text-slate-700 px-4 py-2 rounded"
          >
            Download Log
          </button>
          <button
            onClick={() => setSelectedStatus(null)}
            className="bg-[#129a81] text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const nowTime = useMemo(() => {
    const dt = new Date();
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }, []);

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins',Arial,sans-serif]">
      <Toaster position="top-right" />
      {modal}

      <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
        <div className="bg-[#129a81] text-white py-[12px] px-[20px] text-[15px] font-medium">
          Api Status Report
        </div>
        <div className="py-[15px] px-[20px] bg-[#E8F5E9] border-b border-b-[#e0e0e0] text-[#666] text-[13px]">
          Api Status Report
        </div>
        <div className="p-[25px] bg-white">
          <div className="grid gap-[20px] mb-[25px] grid-cols-1 md:grid-cols-5">
            <div>
              <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Factory</label>
              <select
                value={form.F_code}
                onChange={handleInputChange}
                name="F_code"
                className="w-full py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#333] bg-white"
              >
                <option value="0">All</option>
                {units.map((u, idx) => (
                  <option key={`${u.f_Code || u.F_Code || u.id}-${idx}`} value={u.f_Code || u.F_Code || u.id}>
                    {u.F_Name || u.f_Name || u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Api Status</label>
              <select
                value={form.Type}
                onChange={handleInputChange}
                name="Type"
                className="w-full py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white"
              >
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
                name="FromDate"
                className="w-full py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white"
              />
            </div>

            <div>
              <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">To Date</label>
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={form.ToDate}
                onChange={handleInputChange}
                name="ToDate"
                className="w-full py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white"
              />
            </div>

            <div>
              <label className="block mb-[8px] text-[13px] text-[#111] font-semibold">Api Type</label>
              <select
                value={form.ApiType}
                onChange={handleInputChange}
                name="ApiType"
                className="w-full py-[10px] px-[12px] text-[13px] border border-[#ddd] rounded text-[#666] bg-white"
              >
                <option value="0">All</option>
                <option value="1">Distillery</option>
                <option value="2">Sugar</option>
              </select>
            </div>
          </div>

          <div className="flex gap-[8px]">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-[#129a81] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer"
            >
              {loading ? 'Wait...' : 'Search'}
            </button>
            <button
              onClick={handleExport}
              className="bg-[#129a81] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer"
            >
              Export Excel
            </button>
            <button
              onClick={() => navigate(-1)}
              className="bg-[#ff5c5c] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      <div className="border border-[#d1d1d1] rounded-lg overflow-hidden bg-white shadow-md">
        <div className="bg-[#129a81] text-white py-[10px] px-[15px] text-[15px] font-semibold text-center">
          Api Status Report
        </div>
        <div className="bg-[#129a81] text-white px-[12px] py-[8px] flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className="font-semibold">DATE</span>
            <input
              value={form.ToDate}
              readOnly
              className="bg-white text-[#333] px-3 py-1 rounded w-[120px]"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">Time :</span>
            <input
              value={nowTime}
              readOnly
              className="bg-white text-[#333] px-3 py-1 rounded w-[80px]"
            />
          </div>
        </div>
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full text-sm text-left border border-[#cfd8dc]">
            <thead className="bg-[#E8F5E9] sticky top-0 text-[#333]">
              <tr>
                <th className="border px-3 py-2 text-center">Token No</th>
                <th className="border px-3 py-2">Item Code</th>
                <th className="border px-3 py-2">Item Description</th>
                <th className="border px-3 py-2">Truck Number</th>
                <th className="border px-3 py-2">API Status Type</th>
                <th className="border px-3 py-2">API Status</th>
                <th className="border px-3 py-2">Resend</th>
                <th className="border px-3 py-2">Pushd Date time</th>
                <th className="border px-3 py-2">Transporter Name</th>
                <th className="border px-3 py-2">Gross Weight</th>
                <th className="border px-3 py-2">Tare Weight</th>
                <th className="border px-3 py-2">Net Qty</th>
                <th className="border px-3 py-2">Gross Date</th>
                <th className="border px-3 py-2">Gross Time</th>
                <th className="border px-3 py-2">Tare Date</th>
                <th className="border px-3 py-2">Tare time</th>
              </tr>
            </thead>
            <tbody>
              {!reportData?.length ? (
                <tr>
                  <td colSpan="16" className="text-center py-4 text-gray-500">
                    {loading ? 'Loading...' : 'No Data Found'}
                  </td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx} className="border-t hover:bg-[#f1f8e9]">
                    <td className="border px-3 py-2 text-center">{row.OTH_NO}</td>
                    <td className="border px-3 py-2">{row.OTH_ITEM}</td>
                    <td className="border px-3 py-2">{row.IT_DESC}</td>
                    <td className="border px-3 py-2">{row.OTH_TRUCK}</td>
                    <td className="border px-3 py-2">{row.Status}</td>
                    <td className="border px-3 py-2">
                      {row.OTH_API_REM ? (
                        <button
                          onClick={() => setSelectedStatus(row.OTH_API_REM)}
                          className="bg-[#43d08a] text-white px-3 py-1 rounded"
                        >
                          Api Status
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="border px-3 py-2">
                      <button
                        onClick={() => handleResend(row.OTH_NO)}
                        className="bg-[#43d08a] text-white px-3 py-1 rounded"
                      >
                        Resend
                      </button>
                    </td>
                    <td className="border px-3 py-2">{row.OTH_API_LHTM}</td>
                    <td className="border px-3 py-2">{row.oth_tpt_nm}</td>
                    <td className="border px-3 py-2">{row.OTH_GROSS}</td>
                    <td className="border px-3 py-2">{row.OTH_TARE}</td>
                    <td className="border px-3 py-2">
                      {(Number(row.OTH_GROSS || 0) - Number(row.OTH_TARE || 0)).toFixed(3)}
                    </td>
                    <td className="border px-3 py-2">{row.OTH_GROSS_DATE}</td>
                    <td className="border px-3 py-2">{row.OTH_GROSS_TIME}</td>
                    <td className="border px-3 py-2">{row.OTH_TARE_DATE}</td>
                    <td className="border px-3 py-2">{row.OTH_TAREDATETIME}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportNew_ApiStatusReport;
