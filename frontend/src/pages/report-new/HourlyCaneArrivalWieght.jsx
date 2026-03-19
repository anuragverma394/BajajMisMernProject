import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportNewService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';

const formatTodayDmy = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const toDmy = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return raw;
};

const addDays = (dmy, days) => {
  const [dd, mm, yyyy] = dmy.split('/').map(Number);
  const date = new Date(yyyy, (mm || 1) - 1, dd || 1);
  date.setDate(date.getDate() + days);
  const dd2 = String(date.getDate()).padStart(2, '0');
  const mm2 = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy2 = date.getFullYear();
  return `${dd2}-${mm2}-${yyyy2}`;
};

const HourlyCaneArrivalWieght = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState([]);
  const [filters, setFilters] = useState({
    F_code: '',
    Fdate: formatTodayDmy()
  });
  const [reportData, setReportData] = useState([]);
  const [grandTotals, setGrandTotals] = useState(null);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : d?.data || [])).catch(() => {});
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    const date = toDmy(filters.Fdate);
    if (!filters.F_code) {
      toast.error('Please select a unit.');
      return;
    }
    if (!date) {
      toast.error('Please select a date.');
      return;
    }
    setLoading(true);
    try {
      const response = await reportNewService.getHourlyCaneArrivalWeight({
        F_code: filters.F_code,
        Fdate: date
      });
      const data = response?.data || response?.Data || [];
      const totals = response?.grandTotals || null;
      if ((response?.status === 'success' || response?.success === true || response?.API_STATUS === 'OK') && data.length >= 0) {
        setReportData(data);
        if (!data.length) toast.error('No data available.');
        setGrandTotals(totals);
      } else {
        toast.error(response?.message || response?.Message || 'No data available.');
        setGrandTotals(null);
      }
    } catch (error) {
      toast.error('Failed to fetch hourly data.');
      setGrandTotals(null);
    } finally {
      setLoading(false);
    }
  };

  const baseDate = toDmy(filters.Fdate) || formatTodayDmy();
  const headerDates = {
    d2: addDays(baseDate, -2),
    d1: addDays(baseDate, -1),
    d0: addDays(baseDate, 0)
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <Toaster position="top-right" />

      <div className="rounded-lg border border-emerald-200 bg-white shadow-sm">
        <div className="rounded-t-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
          Hourly Cane Arrival Weight
        </div>

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">Units</label>
              <select
                name="F_code"
                value={filters.F_code}
                onChange={handleFilterChange}
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select Unit</option>
                {units.map((unit, idx) => (
                  <option key={`${unit.F_Code || unit.id}-${idx}`} value={unit.F_Code || unit.id}>
                    {unit.F_Name || unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">Date</label>
              <input
                type="text"
                name="Fdate"
                value={filters.Fdate}
                onChange={handleFilterChange}
                placeholder="DD/MM/YYYY"
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Excel
              </button>
              <button
                onClick={() => window.print()}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Print
              </button>
              <button
                onClick={() => navigate(-1)}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Exit
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-emerald-200">
            <table className="min-w-[1000px] border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-50 text-emerald-800">
                  <th rowSpan={2} className="border border-emerald-200 px-2 py-2 text-center">Date<br />Hours</th>
                  <th colSpan={3} className="border border-emerald-200 px-2 py-2 text-center">{headerDates.d2}</th>
                  <th colSpan={3} className="border border-emerald-200 px-2 py-2 text-center">{headerDates.d1}</th>
                  <th colSpan={3} className="border border-emerald-200 px-2 py-2 text-center">{headerDates.d0}</th>
                </tr>
                <tr className="bg-emerald-50 text-emerald-800">
                  {['Gate', 'Center', 'Total', 'Gate', 'Center', 'Total', 'Gate', 'Center', 'Total'].map((label, idx) => (
                    <th key={`${label}-${idx}`} className="border border-emerald-200 px-2 py-2 text-center">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="border border-emerald-100 px-4 py-10 text-center text-slate-400">
                      No data found. Select a unit and date, then click Search.
                    </td>
                  </tr>
                ) : (
                  <>
                    {reportData.map((row, idx) => {
                    const gate2 = (Number(row.TwoDBeforeCart) || 0) + (Number(row.TwoDBeforeTrolly) || 0);
                    const center2 = Number(row.TwoDBeforeTruck) || 0;
                    const total2 = gate2 + center2;

                    const gate1 = (Number(row.OneDBeforeCart) || 0) + (Number(row.OneDBeforeTrolly) || 0);
                    const center1 = Number(row.OneDBeforeTruck) || 0;
                    const total1 = gate1 + center1;

                    const gate0 = (Number(row.RDBeforeCart) || 0) + (Number(row.RDBeforeTrolly) || 0);
                    const center0 = Number(row.RDBeforeTruck) || 0;
                    const total0 = gate0 + center0;

                    return (
                      <tr key={`${row.DIS_HOU || 'row'}-${idx}`} className="border-b border-emerald-100">
                        <td className="border border-emerald-100 px-2 py-1 text-left">{row.DIS_HOU}</td>
                        <td className="border border-emerald-100 px-2 py-1 text-right">{gate2.toFixed(2)}</td>
                        <td className="border border-emerald-100 px-2 py-1 text-right">{center2.toFixed(2)}</td>
                        <td className="border border-emerald-100 px-2 py-1 text-right">{total2.toFixed(2)}</td>
                        <td className="border border-emerald-100 px-2 py-1 text-right">{gate1.toFixed(2)}</td>
                        <td className="border border-emerald-100 px-2 py-1 text-right">{center1.toFixed(2)}</td>
                        <td className="border border-emerald-100 px-2 py-1 text-right">{total1.toFixed(2)}</td>
                        <td className="border border-emerald-100 px-2 py-1 text-right">{gate0.toFixed(2)}</td>
                        <td className="border border-emerald-100 px-2 py-1 text-right">{center0.toFixed(2)}</td>
                        <td className="border border-emerald-100 px-2 py-1 text-right">{total0.toFixed(2)}</td>
                      </tr>
                    );
                    })}
                    {grandTotals && (
                      <tr className="bg-emerald-50 font-semibold">
                        <td className="border border-emerald-200 px-2 py-1 text-left">Total</td>
                        <td className="border border-emerald-200 px-2 py-1 text-right">{((Number(grandTotals.TwoDBeforeCart) || 0) + (Number(grandTotals.TwoDBeforeTrolly) || 0)).toFixed(2)}</td>
                        <td className="border border-emerald-200 px-2 py-1 text-right">{(Number(grandTotals.TwoDBeforeTruck) || 0).toFixed(2)}</td>
                        <td className="border border-emerald-200 px-2 py-1 text-right">{((Number(grandTotals.TwoDBeforeCart) || 0) + (Number(grandTotals.TwoDBeforeTrolly) || 0) + (Number(grandTotals.TwoDBeforeTruck) || 0)).toFixed(2)}</td>
                        <td className="border border-emerald-200 px-2 py-1 text-right">{((Number(grandTotals.OneDBeforeCart) || 0) + (Number(grandTotals.OneDBeforeTrolly) || 0)).toFixed(2)}</td>
                        <td className="border border-emerald-200 px-2 py-1 text-right">{(Number(grandTotals.OneDBeforeTruck) || 0).toFixed(2)}</td>
                        <td className="border border-emerald-200 px-2 py-1 text-right">{((Number(grandTotals.OneDBeforeCart) || 0) + (Number(grandTotals.OneDBeforeTrolly) || 0) + (Number(grandTotals.OneDBeforeTruck) || 0)).toFixed(2)}</td>
                        <td className="border border-emerald-200 px-2 py-1 text-right">{((Number(grandTotals.RDBeforeCart) || 0) + (Number(grandTotals.RDBeforeTrolly) || 0)).toFixed(2)}</td>
                        <td className="border border-emerald-200 px-2 py-1 text-right">{(Number(grandTotals.RDBeforeTruck) || 0).toFixed(2)}</td>
                        <td className="border border-emerald-200 px-2 py-1 text-right">{((Number(grandTotals.RDBeforeCart) || 0) + (Number(grandTotals.RDBeforeTrolly) || 0) + (Number(grandTotals.RDBeforeTruck) || 0)).toFixed(2)}</td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HourlyCaneArrivalWieght;
