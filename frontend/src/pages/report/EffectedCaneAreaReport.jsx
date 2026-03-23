import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportService, masterService } from '../../microservices/api.service';
import { openPrintWindow } from '../../utils/print';

const Report_EffectedCaneAreaReport = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    F_code: '',
    CaneArea: '1',
    stateDropdown: '2'
  });

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const units = await masterService.getUnits();
        setFactories(Array.isArray(units) ? units : []);
      } catch (error) {
        toast.error('Failed to load factory units');
      }
    };
    loadUnits();
  }, []);

  const handleSearch = async () => {
    if (!filters.F_code || filters.F_code === 'All') {
      toast.error('Please select a factory unit');
      return;
    }
    setLoading(true);
    try {
      const response = await reportService.getEffectedCaneAreaReport({
        F_code: filters.F_code,
        CaneArea: filters.CaneArea,
        stateDropdown: filters.stateDropdown || '2'
      });
      const rows = response?.data ?? response ?? [];
      setReportData(Array.isArray(rows) ? rows : []);
      toast.success('Analysis complete');
    } catch (error) {
      toast.error('An error occurred during verification');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('effected-report-print');
    openPrintWindow({
      title: 'Effected Cane Area Report',
      contentHtml: printContent ? printContent.outerHTML : ''
    });
  };

  const handleExport = () => {
    if (!reportData.length) return;
    if (window.exportTableToCSV) {
      window.exportTableToCSV('effected-cane-area-table', 'EffectedCaneAreaReport.csv');
      return;
    }
    toast.error('Export utility not available');
  };

  const totals = useMemo(() => {
    const pickNumber = (row, keys = []) => {
      for (const k of keys) {
        const v = row?.[k];
        if (v !== undefined && v !== null && v !== '') return Number(v) || 0;
      }
      return 0;
    };
    const sum = (keys) => reportData.reduce((acc, row) => acc + pickNumber(row, Array.isArray(keys) ? keys : [keys]), 0);
    const totalCaneArea = sum(['TotalCaneArea', 'TOTALCANEAREA', 'totalcanearea']);
    const effected = sum(['EffectedCaneArea', 'EFFECTEDCANEAREA', 'effectedcanearea']);
    const percent = totalCaneArea > 0 ? (effected * 100) / totalCaneArea : 0;
    return {
      NoOfMember: sum(['NoOfMember', 'NOOFMEMBER', 'noofmember', 'No_of_member']),
      BondedMember: sum(['BondedMember', 'BONDEDMEMBER', 'bondedmember']),
      CLA: sum(['CLA', 'Cla', 'cla']),
      TotalCaneArea: totalCaneArea,
      MoreThanCLA: sum(['MoreThanCLA', 'MORETHANCLA', 'morethancla']),
      ZeroCLA: sum(['ZeroCLA', 'ZEROCLA', 'zerocla']),
      NonMem: sum(['NonMem', 'NONMEM', 'nonmem']),
      LockGrower: sum(['LockGrower', 'LOCKGROWER', 'lockgrower']),
      Total: sum(['Total', 'TOTAL', 'total']),
      EffectedCaneArea: effected,
      Percent: percent
    };
  }, [reportData]);

  const formatNum = (value, digits = 3) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '0';
    return n.toFixed(digits);
  };

  return (
    <div className="px-4 pb-10">
      <Toaster position="top-right" />
      <div className="rounded-lg border border-emerald-200 bg-white shadow-sm">
        <div className="rounded-t-lg bg-emerald-600 px-6 py-3 text-white">
          <h1 className="text-base font-semibold">Effected Cane Area Report</h1>
        </div>
        <div className="border border-emerald-100 bg-emerald-50 px-6 py-3 text-emerald-900">
          Effected Cane Area Report Season 2526 (Only Final Villages)
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-emerald-900">Type of cane Area</label>
              <select
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={filters.CaneArea}
                onChange={(e) => setFilters({ ...filters, CaneArea: e.target.value })}
              >
                <option value="1">As Per First Survey</option>
                <option value="2">As Per Caneup Portal</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-emerald-900">Factory</label>
              <select
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={filters.F_code}
                onChange={(e) => setFilters({ ...filters, F_code: e.target.value })}
              >
                <option value="">Select Factory</option>
                {factories.map((f, idx) => {
                  const value = f?.id || f?.F_Code || f?.f_Code || '';
                  const label = f?.F_Name || f?.f_Name || f?.name || value;
                  return (
                    <option key={`${value || 'factory'}-${idx}`} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
            {filters.F_code === '63' && (
              <div>
                <label className="text-sm font-semibold text-emerald-900">Target State</label>
                <select
                  className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  value={filters.stateDropdown}
                  onChange={(e) => setFilters({ ...filters, stateDropdown: e.target.value })}
                >
                  <option value="2">All States</option>
                  <option value="0">Uttar Pradesh (U.P)</option>
                  <option value="1">Bihar</option>
                </select>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-70"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handleExport}
              disabled={!reportData.length}
              className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-70"
            >
              Excel
            </button>
            <button
              onClick={handlePrint}
              disabled={!reportData.length}
              className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-70"
            >
              Print
            </button>
            <button
              onClick={() => navigate(-1)}
              className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-emerald-200 bg-white shadow-sm" id="effected-report-print">
        <div className="p-4">
          <div className="max-h-[520px] overflow-auto">
            <table id="effected-cane-area-table" className="mx-auto min-w-[1200px] table-auto border-collapse text-sm">
              <thead className="sticky top-0 bg-emerald-100">
                <tr>
                  <th rowSpan={2} className="border border-emerald-200 px-3 py-3 text-center font-semibold text-emerald-900">S.No</th>
                  <th rowSpan={2} className="border border-emerald-200 px-3 py-3 text-center font-semibold text-emerald-900">Grower Vill</th>
                  <th rowSpan={2} className="border border-emerald-200 px-3 py-3 text-center font-semibold text-emerald-900">Village Name</th>
                  <th rowSpan={2} className="border border-emerald-200 px-3 py-3 text-center font-semibold text-emerald-900">No of Member</th>
                  <th rowSpan={2} className="border border-emerald-200 px-3 py-3 text-center font-semibold text-emerald-900">Bonded Member</th>
                  <th rowSpan={2} className="border border-emerald-200 px-3 py-3 text-center font-semibold text-emerald-900">CLA</th>
                  <th rowSpan={2} className="border border-emerald-200 px-3 py-3 text-center font-semibold text-emerald-900">Total Cane Area</th>
                  <th colSpan={5} className="border border-emerald-200 px-3 py-3 text-center font-semibold text-emerald-900">Calendring Not Done</th>
                  <th rowSpan={2} className="border border-emerald-200 px-3 py-3 text-center font-semibold text-emerald-900">Effected Cane Area</th>
                  <th rowSpan={2} className="border border-emerald-200 px-3 py-3 text-center font-semibold text-emerald-900">%Age</th>
                </tr>
                <tr>
                  <th className="border border-emerald-200 px-3 py-2 text-center font-semibold text-emerald-900">More Than CLA</th>
                  <th className="border border-emerald-200 px-3 py-2 text-center font-semibold text-emerald-900">Zero CLA</th>
                  <th className="border border-emerald-200 px-3 py-2 text-center font-semibold text-emerald-900">Non Mem</th>
                  <th className="border border-emerald-200 px-3 py-2 text-center font-semibold text-emerald-900">Lock Grower</th>
                  <th className="border border-emerald-200 px-3 py-2 text-center font-semibold text-emerald-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {!reportData.length && (
                  <tr>
                    <td colSpan={14} className="border border-emerald-200 px-4 py-6 text-center text-sm text-slate-500">
                      {loading ? 'Loading data...' : 'No data found. Please select filters and click Search.'}
                    </td>
                  </tr>
                )}
                {reportData.map((row, idx) => {
                  const highlight = Number(row?.IsReadyForAmty || row?.ISREADYFORAMTY || 0) === 1;
                  const growerVill = row?.V_Code ?? row?.V_CODE ?? row?.v_code ?? row?.VCode ?? '';
                  const villageName = row?.V_Name || row?.V_NAME || row?.VNAME || row?.v_name || row?.VName || row?.VILLAGE_NAME || row?.VILLAGENAME || row?.VILL_NAME || row?.VILLNAME || row?.VILLAGE || row?.VILL_NM || row?.VILL_NM1 || row?.V_NM || row?.VNAME1 || '';
                  const noOfMember = row?.NoOfMember || row?.NoofMember || row?.NO_OF_MEMBER || row?.NO_OF_MEM || row?.NOOFMEMBER || row?.NOOFMEM || row?.NOOFMEM1 || row?.noofmember || row?.No_of_member || row?.MEMBERCOUNT || row?.MEMBERS || row?.NOMEMBER || row?.NO_MEMBER || row?.MEMBER_COUNT || row?.MEMCOUNT || row?.['No of Member'] || row?.['No Of Member'] || row?.['No_Of_Member'] || row?.['NoOfMember'] || row?.['NOOFMEMBER'] || 0;
                  return (
                    <tr key={`${row?.V_Code}-${idx}`} className={highlight ? 'bg-emerald-200' : 'bg-emerald-50'}>
                      <td className="border border-emerald-200 px-3 py-2 text-center">{idx + 1}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-center">{growerVill}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-left font-medium text-emerald-950">{villageName}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-right font-semibold">{noOfMember}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-right">{row?.BondedMember ?? row?.BONDEDMEMBER ?? row?.bondedmember ?? 0}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-right">{formatNum(row?.CLA ?? row?.Cla ?? row?.cla)}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-right">{formatNum(row?.TotalCaneArea ?? row?.TOTALCANEAREA ?? row?.totalcanearea)}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-right">{formatNum(row?.MoreThanCLA ?? row?.MORETHANCLA ?? row?.morethancla)}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-right">{formatNum(row?.ZeroCLA ?? row?.ZEROCLA ?? row?.zerocla)}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-right">{formatNum(row?.NonMem ?? row?.NONMEM ?? row?.nonmem)}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-right">{formatNum(row?.LockGrower ?? row?.LOCKGROWER ?? row?.lockgrower)}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-right">{formatNum(row?.Total ?? row?.TOTAL ?? row?.total)}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-right font-semibold">{formatNum(row?.EffectedCaneArea ?? row?.EFFECTEDCANEAREA ?? row?.effectedcanearea)}</td>
                      <td className="border border-emerald-200 px-3 py-2 text-right font-semibold">{formatNum(row?.Percent ?? row?.PERCENT ?? row?.percent, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              {reportData.length > 0 && (
                <tfoot>
                  <tr className="bg-emerald-100 font-semibold">
                    <td colSpan={3} className="border border-emerald-200 px-2 py-2 text-center">Total</td>
                    <td className="border border-emerald-200 px-2 py-2 text-right">{totals.NoOfMember}</td>
                    <td className="border border-emerald-200 px-2 py-2 text-right">{totals.BondedMember}</td>
                    <td className="border border-emerald-200 px-2 py-2 text-right">{formatNum(totals.CLA)}</td>
                    <td className="border border-emerald-200 px-2 py-2 text-right">{formatNum(totals.TotalCaneArea)}</td>
                    <td className="border border-emerald-200 px-2 py-2 text-right">{formatNum(totals.MoreThanCLA)}</td>
                    <td className="border border-emerald-200 px-2 py-2 text-right">{formatNum(totals.ZeroCLA)}</td>
                    <td className="border border-emerald-200 px-2 py-2 text-right">{formatNum(totals.NonMem)}</td>
                    <td className="border border-emerald-200 px-2 py-2 text-right">{formatNum(totals.LockGrower)}</td>
                    <td className="border border-emerald-200 px-2 py-2 text-right">{formatNum(totals.Total)}</td>
                    <td className="border border-emerald-200 px-2 py-2 text-right">{formatNum(totals.EffectedCaneArea)}</td>
                    <td className="border border-emerald-200 px-2 py-2 text-right">{formatNum(totals.Percent, 2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report_EffectedCaneAreaReport;
