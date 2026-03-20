import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';

const formatDmy = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const toApiDate = (value) => {
  if (!value) return '';
  const parts = value.includes('/') ? value.split('/') : value.split('-');
  if (parts.length !== 3) return value;
  const [dd, mm, yyyy] = parts;
  return `${dd}/${mm}/${yyyy}`;
};

const truncateDecimal = (value, precision) => {
  const step = Math.pow(10, precision);
  return Math.trunc(Number(value || 0) * step) / step;
};

const Report_IndentFaillDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [formData, setFormData] = useState({
    factory: '',
    date: formatDmy(new Date())
  });

  useEffect(() => {
    masterService.getUnits()
      .then((d) => {
        const data = Array.isArray(d) ? d : d.data || [];
        setUnits(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const dateParam = queryParams.get('Date');
    const factParam = queryParams.get('FACT');
    if (dateParam || factParam) {
      setFormData({
        date: dateParam ? dateParam.replaceAll('/', '-') : formatDmy(new Date()),
        factory: factParam || ''
      });
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!formData.factory) {
      toast.error('Please Select Factory');
      return;
    }
    if (!formData.date) {
      toast.error('Please Select Date');
      return;
    }
    setLoading(true);
    try {
      const response = await reportService.getIndentFailDetails({
        FACT: formData.factory,
        Date: toApiDate(formData.date)
      });
      if (response?.success) {
        setRows(Array.isArray(response.data) ? response.data : []);
        if (!response.data || response.data.length === 0) {
          toast.error(response.message || 'No records found');
        }
      } else {
        toast.error(response?.message || 'No records found');
      }
    } catch (error) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const computedRows = useMemo(() => {
    return rows.map((r) => {
      const earlyQty = Number(r.ERINDQTY || 0);
      const earlyWt = Number(r.EINDWT || 0);
      const earlyAct = Number(r.EACTWT || 0);
      const otherQty = Number(r.OTINDQTY || 0);
      const otherWt = Number(r.OTINDWT || 0);
      const otherAct = Number(r.OTACTWT || 0);
      const totalQty = Number(r.TOTINDQTY || 0);
      const totalWt = Number(r.TOTINDWT || 0);
      const totalAct = Number(r.TOTACTWT || 0);

      const earlyFailPur = earlyQty > 0 ? truncateDecimal(((earlyQty - earlyWt) / earlyQty) * 100, 2) : 0;
      const earlyFailAct = earlyQty > 0 ? truncateDecimal(((earlyQty - earlyAct) / earlyQty) * 100, 2) : 0;
      const otherFailPur = otherQty > 0 ? truncateDecimal(((otherQty - otherWt) / otherQty) * 100, 2) : 0;
      const otherFailAct = otherQty > 0 ? truncateDecimal(((otherQty - otherAct) / otherQty) * 100, 2) : 0;
      const totalFailPur = totalQty > 0 ? truncateDecimal(((totalQty - totalWt) / totalQty) * 100, 2) : 0;
      const totalFailAct = totalQty > 0 ? truncateDecimal(((totalQty - totalAct) / totalQty) * 100, 2) : 0;

      return {
        center: r.IS_CNT_CD,
        centerName: r.C_NAME,
        earlyQty,
        earlyWt,
        earlyAct,
        earlyFailPur,
        earlyFailAct,
        otherQty,
        otherWt,
        otherAct,
        otherFailPur,
        otherFailAct,
        totalQty,
        totalWt,
        totalAct,
        totalFailPur,
        totalFailAct,
        pipBal: r.PIPBALIND,
        totalBal: r.TOTBALIND,
        todayBal: r.BALTOTINDQTY
      };
    });
  }, [rows]);

  return (
    <div className="p-5 bg-[#f5f4ec] min-h-screen font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]">
      <Toaster position="top-right" />
      <div className="bg-[#1f9a8b] text-white py-3 px-5 rounded-t">
        <div className="flex items-center gap-3">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          <div className="text-sm font-semibold">INDENT FAILURE DETAIL</div>
        </div>
        <button className="mt-2 text-white text-sm" onClick={() => navigate(-1)}>
          &larr; Back
        </button>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-b p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-[13px] font-semibold mb-2">Factory</label>
            <select
              name="factory"
              value={formData.factory}
              onChange={handleChange}
              className="w-full py-2 px-3 border border-[#cbd5e1] rounded text-[13px] bg-white"
            >
              <option value="">Select Factory</option>
              {units.map((unit, idx) => (
                <option key={`${unit.F_Code || unit.id}-${idx}`} value={unit.F_Code || unit.id}>
                  {unit.F_Name || unit.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-2">Date</label>
            <input
              type="text"
              name="date"
              value={formData.date}
              onChange={handleChange}
              placeholder="dd-MM-yyyy"
              className="w-full py-2 px-3 border border-[#cbd5e1] rounded text-[13px] bg-white"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSearch} disabled={loading} className="px-4 py-2 bg-[#1f9a8b] text-white rounded">
              Search
            </button>
            <button onClick={() => window.exportTableToCSV?.('indent-fail-detail-table', 'INDENT_FAILURE_DETAIL.csv')} className="px-4 py-2 bg-[#1f9a8b] text-white rounded">
              Excel
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-[#1f9a8b] text-white rounded">
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white border border-[#e2e8f0] rounded p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse" id="indent-fail-detail-table">
            <thead>
              <tr className="bg-[#1f9a8b] text-white">
                <th rowSpan="2" className="p-2 border border-[#1a7f73]">Center</th>
                <th rowSpan="2" className="p-2 border border-[#1a7f73]">Center Name</th>
                <th colSpan="5" className="p-2 border border-[#1a7f73] text-center">Early</th>
                <th colSpan="5" className="p-2 border border-[#1a7f73] text-center">Other Than Early</th>
                <th colSpan="5" className="p-2 border border-[#1a7f73] text-center">Total</th>
                <th colSpan="3" className="p-2 border border-[#1a7f73] text-center">Balance Indent</th>
              </tr>
              <tr className="bg-[#1f9a8b] text-white">
                <th className="p-2 border border-[#1a7f73]">Indent Qty</th>
                <th className="p-2 border border-[#1a7f73]">Ind Wt Qty</th>
                <th className="p-2 border border-[#1a7f73]">Act Wt Qty</th>
                <th className="p-2 border border-[#1a7f73]">Fail % (Pur)</th>
                <th className="p-2 border border-[#1a7f73]">Fail % (Act)</th>
                <th className="p-2 border border-[#1a7f73]">Indent Qty</th>
                <th className="p-2 border border-[#1a7f73]">Ind Wt Qty</th>
                <th className="p-2 border border-[#1a7f73]">Act Wt Qty</th>
                <th className="p-2 border border-[#1a7f73]">Fail % (Pur)</th>
                <th className="p-2 border border-[#1a7f73]">Fail % (Act)</th>
                <th className="p-2 border border-[#1a7f73]">Indent Qty</th>
                <th className="p-2 border border-[#1a7f73]">Ind Wt Qty</th>
                <th className="p-2 border border-[#1a7f73]">Act Wt Qty</th>
                <th className="p-2 border border-[#1a7f73]">Fail % (Pur)</th>
                <th className="p-2 border border-[#1a7f73]">Fail % (Act)</th>
                <th className="p-2 border border-[#1a7f73]">Today Bal</th>
                <th className="p-2 border border-[#1a7f73]">Pipeline (2d)</th>
                <th className="p-2 border border-[#1a7f73]">Total Bal</th>
              </tr>
            </thead>
            <tbody>
              {computedRows.length === 0 && (
                <tr>
                  <td colSpan="20" className="text-center py-8 text-slate-400">
                    No data found. Please select filters and click Search.
                  </td>
                </tr>
              )}
              {computedRows.map((row, idx) => (
                <tr key={idx} className="bg-white">
                  <td className="p-2 border border-[#e2e8f0]">{row.center}</td>
                  <td className="p-2 border border-[#e2e8f0]">{row.centerName}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.earlyQty}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.earlyWt}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.earlyAct}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.earlyFailPur}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.earlyFailAct}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.otherQty}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.otherWt}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.otherAct}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.otherFailPur}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.otherFailAct}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.totalQty}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.totalWt}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.totalAct}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.totalFailPur}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.totalFailAct}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.todayBal}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.pipBal}</td>
                  <td className="p-2 border border-[#e2e8f0] text-right">{row.totalBal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Report_IndentFaillDetails;
