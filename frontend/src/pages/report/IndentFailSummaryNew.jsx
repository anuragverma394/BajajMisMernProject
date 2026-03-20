import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';

const formatDmy = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const parseDmy = (value) => {
  const parts = String(value || '').split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(d.getTime()) ? null : d;
};

const truncateDecimal = (value, precision) => {
  const step = Math.pow(10, precision);
  return Math.trunc(Number(value || 0) * step) / step;
};

const IndentFailSummaryNew = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ Pdate: '', Cdate: '' });
  const [filters, setFilters] = useState({
    factory: 'All',
    date: ''
  });

  useEffect(() => {
    masterService.getUnits()
      .then((d) => {
        const data = Array.isArray(d) ? d : d.data || [];
        setUnits(data);
      })
      .catch(() => {});

    reportService.getIndentFailSummaryNewMeta()
      .then((res) => {
        const date = res?.data?.date || '';
        setFilters((prev) => ({ ...prev, date }));
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrevDate = () => {
    const d = parseDmy(filters.date) || new Date();
    d.setDate(d.getDate() - 1);
    setFilters((prev) => ({ ...prev, date: formatDmy(d) }));
  };

  const handleNextDate = () => {
    const d = parseDmy(filters.date) || new Date();
    d.setDate(d.getDate() + 1);
    setFilters((prev) => ({ ...prev, date: formatDmy(d) }));
  };

  const handleSearch = async () => {
    if (!filters.factory || filters.factory === 'All') {
      toast.error('Please Select Factory');
      return;
    }
    setLoading(true);
    try {
      const response = await reportService.getIndentFailSummaryNew({
        F_code: filters.factory,
        Date: filters.date
      });
      if (response?.success) {
        const data = response.data || {};
        setRows(Array.isArray(data.IFSList) ? data.IFSList : []);
        setMeta({ Pdate: data.Pdate || '', Cdate: data.Cdate || '' });
        if (!data.IFSList || data.IFSList.length === 0) {
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
    return rows.map((r, i) => {
      const indQty = Number(r.ERINDQTY || 0);
      const indWt = Number(r.EINDWT || 0);
      const actWt = Number(r.EACTWT || 0);
      const pdBal = Number(r.PdBal || 0);
      const cdBal = Number(r.CdBal || 0);
      const turnUp = Number(r.TdWtIndent || 0);

      let failPurchy = 0;
      let failActual = 0;
      if (indQty > 0 && indWt > 0) {
        failPurchy = truncateDecimal(((indQty - indWt) / indQty) * 100, 2);
        failActual = truncateDecimal(((indQty - actWt) / indQty) * 100, 2);
      }

      const mbPrev = indQty - pdBal;
      const mbCur = indQty - cdBal;
      let turnUpPct = 0;
      if (mbPrev > 0) {
        turnUpPct = Number(((turnUp / mbPrev) * 100).toFixed(2));
      }

      let expected = 0;
      if (i > 0) {
        const prev = rows[i - 1];
        const prevIndQty = Number(prev.ERINDQTY || 0);
        const prevPdBal = Number(prev.PdBal || 0);
        const prevTurnUp = Number(prev.TdWtIndent || 0);
        let avgperc1 = 0;
        if (prevIndQty - prevPdBal > 0) {
          avgperc1 = Number(((prevTurnUp / (prevIndQty - prevPdBal)) * 100).toFixed(2));
        }
        expected = Number(((indQty - cdBal) * avgperc1 / 100).toFixed(0));
      }

      return {
        date: r.IS_IS_DT,
        indentQty: r.ERINDQTY,
        indentWt: r.EINDWT,
        actWt: r.EACTWT,
        failPurchy,
        failActual,
        runningBal: r.RunningBal,
        mbPrev,
        turnUp,
        turnUpPct,
        mbCur,
        expected
      };
    });
  }, [rows]);

  const totals = useMemo(() => {
    return computedRows.reduce(
      (acc, row) => {
        acc.turnUp += Number(row.turnUp || 0);
        acc.expected += Number(row.expected || 0);
        return acc;
      },
      { turnUp: 0, expected: 0 }
    );
  }, [computedRows]);

  return (
    <div className="p-5 bg-white min-h-screen font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]">
      <Toaster position="top-right" />

      <div className="bg-[#129a81] text-white py-2.5 px-5 text-sm font-semibold rounded-t">
        INDENT FAILURE AVAILABILITY
      </div>

      <div className="border border-[#e2e8f0] rounded-b">
        <div className="bg-[#e6f3e6] text-[#2e7d32] py-2 px-5 text-[13px] font-semibold border-b border-[#c8e6c9]">
          INDENT FAILURE AVAILABILITY
        </div>

        <div className="p-6 border-b border-[#e2e8f0] bg-white">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="w-[260px]">
              <label className="block text-[13px] font-semibold text-[#333] mb-2">Factory</label>
              <select
                name="factory"
                value={filters.factory}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-[#cbd5e1] rounded text-[13px] bg-white"
              >
                <option value="All">All</option>
                {units.map((unit, idx) => (
                  <option key={`${unit.F_Code || unit.id}-${idx}`} value={unit.F_Code || unit.id}>
                    {unit.F_Name || unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-[280px]">
              <label className="block text-[13px] font-semibold text-[#333] mb-2">Date</label>
              <div className="flex gap-2">
                <button type="button" onClick={handlePrevDate} className="py-2 px-3 bg-[#16a085] text-white rounded">
                  &lt;
                </button>
                <input
                  type="text"
                  name="date"
                  value={filters.date}
                  onChange={handleChange}
                  placeholder="dd/MM/yyyy"
                  className="w-full py-2 px-3 border border-[#cbd5e1] rounded text-[13px] bg-white"
                />
                <button type="button" onClick={handleNextDate} className="py-2 px-3 bg-[#16a085] text-white rounded">
                  &gt;
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2 rounded text-[13px] font-medium text-white min-w-[90px] bg-[#16a085]"
            >
              {loading ? '...' : 'Search'}
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 rounded text-[13px] font-medium text-white min-w-[90px] bg-[#16a085]"
            >
              Print
            </button>
            <button
              onClick={() => window.exportTableToCSV?.('indent-fail-summary-new-table', 'INDENT_FAILURE_AVAILABILITY.csv')}
              className="px-5 py-2 rounded text-[13px] font-medium text-white min-w-[90px] bg-[#16a085]"
            >
              Excel
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded text-[13px] font-medium text-white min-w-[90px] bg-[#16a085]"
            >
              Exit
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="overflow-x-auto border border-[#e2e8f0] rounded">
            <table id="indent-fail-summary-new-table" className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-[#dff0d8] text-[#2e2e2e] font-semibold">
                  <th className="p-2 border border-[#b7d3b0]">Date</th>
                  <th className="p-2 border border-[#b7d3b0]">Indent Qty(Qtls)</th>
                  <th className="p-2 border border-[#b7d3b0]">Indent Weighted Qty(Qtls)</th>
                  <th className="p-2 border border-[#b7d3b0]">Actual Weighted Qty(Qtls)</th>
                  <th className="p-2 border border-[#b7d3b0]">Failure % Interms Of Purchy</th>
                  <th className="p-2 border border-[#b7d3b0]">Failure % Interms Of Actual Weight(Qtls)</th>
                  <th className="p-2 border border-[#b7d3b0]">Running Balance</th>
                  <th className="p-2 border border-[#b7d3b0]">Morning Balance At 6AM {meta.Pdate}</th>
                  <th className="p-2 border border-[#b7d3b0]">Turn Up Ondated {meta.Pdate}</th>
                  <th className="p-2 border border-[#b7d3b0]">Turn Up Perc(%)</th>
                  <th className="p-2 border border-[#b7d3b0]">Morning Balance At 6AM {meta.Cdate}</th>
                  <th className="p-2 border border-[#b7d3b0]">Expected Weight Today</th>
                </tr>
              </thead>
              <tbody>
                {computedRows.map((row, idx) => (
                  <tr key={idx} className="bg-[#f7fbf4]">
                    <td className="p-2 border border-[#b7d3b0]">{row.date}</td>
                    <td className="p-2 border border-[#b7d3b0] text-right">{row.indentQty}</td>
                    <td className="p-2 border border-[#b7d3b0] text-right">{row.indentWt}</td>
                    <td className="p-2 border border-[#b7d3b0] text-right">{row.actWt}</td>
                    <td className="p-2 border border-[#b7d3b0] text-right">{row.failPurchy}</td>
                    <td className="p-2 border border-[#b7d3b0] text-right">{row.failActual}</td>
                    <td className="p-2 border border-[#b7d3b0] text-right">{row.runningBal}</td>
                    <td className="p-2 border border-[#b7d3b0] text-right">{row.mbPrev}</td>
                    <td className="p-2 border border-[#b7d3b0] text-right">{row.turnUp}</td>
                    <td className="p-2 border border-[#b7d3b0] text-right">{row.turnUpPct}</td>
                    <td className="p-2 border border-[#b7d3b0] text-right">{row.mbCur}</td>
                    <td className="p-2 border border-[#b7d3b0] text-right">{row.expected}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#dff0d8] font-semibold">
                  <td className="p-2 border border-[#b7d3b0]" colSpan={8}></td>
                  <td className="p-2 border border-[#b7d3b0] text-right">{totals.turnUp.toFixed(2)}</td>
                  <td className="p-2 border border-[#b7d3b0]"></td>
                  <td className="p-2 border border-[#b7d3b0]"></td>
                  <td className="p-2 border border-[#b7d3b0] text-right">{totals.expected.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndentFailSummaryNew;
