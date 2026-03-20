import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { whatsappService, masterService } from '../../microservices/api.service';
import { openPrintWindow } from '../../utils/print';

const WhatsApp_ActualVarietyWiseArea = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [caneAreaType, setCaneAreaType] = useState('1');
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const response = await masterService.getUnits();
        const unitsData = response.data || response;
        setUnits(Array.isArray(unitsData) ? unitsData : []);
      } catch (error) {
        toast.error('Failed to fetch factories');
      }
    };
    loadUnits();
  }, []);

  const handleSearch = async () => {
    if (!selectedUnit) {
      toast.error('Please select a factory');
      return;
    }
    setIsLoading(true);
    setReportData([]);
    try {
      const payload = await whatsappService.getVarietyArea({
        unit: selectedUnit,
        date: reportDate,
        type: caneAreaType
      });
      const rows = payload?.data ?? payload ?? [];
      setReportData(Array.isArray(rows) ? rows : []);
      toast.success('Variety data loaded');
    } catch (error) {
      toast.error('Failed to load variety data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('actual-variety-report');
    openPrintWindow({
      title: `Actual Variety Wise Area - ${reportDate}`,
      subtitle: caneAreaType === '1' ? 'As Per First Survey' : 'As Per Caneup Portal',
      contentHtml: printContent ? printContent.outerHTML : ''
    });
  };

  const handleExcelExport = () => {
    if (window.exportTableToCSV) {
      window.exportTableToCSV('actual-variety-table', 'ActualVarietyWiseArea.csv');
      toast.success('Excel exported');
      return;
    }
    toast.error('Export utility not available');
  };

  const hasData = reportData.length > 0;

  const formatNumber = useMemo(
    () => (value, digits = 3) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return '0';
      return n.toFixed(digits);
    },
    []
  );

  return (
    <div className="px-4 pb-10">
      <Toaster position="top-right" />
      <div className="rounded-lg border border-emerald-200 bg-white shadow-sm">
        <div className="rounded-t-lg bg-emerald-600 px-6 py-3 text-white">
          <h1 className="text-base font-semibold">Actual Variety Wise Area And Supply</h1>
        </div>
        <div className="border border-emerald-100 bg-emerald-50 px-6 py-3 text-emerald-900">
          Actual Variety Wise Area And Supply
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-emerald-900">Type of cane Area</label>
              <select
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={caneAreaType}
                onChange={(e) => setCaneAreaType(e.target.value)}
              >
                <option value="1">As Per First Survey</option>
                <option value="2">As Per Caneup Portal</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-emerald-900">Factory</label>
              <select
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="">Select Factory</option>
                {units.map((unit, idx) => (
                  <option key={`${unit.id ?? 'unit'}-${idx}`} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-emerald-900">Date</label>
              <input
                type="date"
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-70"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handlePrint}
              disabled={!hasData}
              className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-70"
            >
              Print
            </button>
            <button
              onClick={handleExcelExport}
              disabled={!hasData}
              className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-70"
            >
              Excel
            </button>
            <button
              onClick={() => navigate('/WhatsApp/WhatsAppDashboard')}
              className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-emerald-200 bg-white shadow-sm">
        <div className="p-4" id="actual-variety-report">
          <div className="max-h-[520px] overflow-auto">
            <table id="actual-variety-table" className="min-w-[1200px] table-auto border-collapse text-sm">
              <thead className="sticky top-0 bg-emerald-100">
                <tr>
                  <th rowSpan={2} className="border border-emerald-200 px-2 py-2 text-center">S.No</th>
                  <th rowSpan={2} className="border border-emerald-200 px-2 py-2 text-center">Variety Code</th>
                  <th rowSpan={2} className="border border-emerald-200 px-2 py-2 text-center">Variety Name</th>
                  <th colSpan={7} className="border border-emerald-200 px-2 py-2 text-center">Cane Area</th>
                  <th colSpan={2} className="border border-emerald-200 px-2 py-2 text-center">Cane Purchase</th>
                </tr>
                <tr>
                  <th className="border border-emerald-200 px-2 py-2 text-center">Ratoon</th>
                  <th className="border border-emerald-200 px-2 py-2 text-center">Plant</th>
                  <th className="border border-emerald-200 px-2 py-2 text-center">Autumn</th>
                  <th className="border border-emerald-200 px-2 py-2 text-center">Total</th>
                  <th className="border border-emerald-200 px-2 py-2 text-center">%age</th>
                  <th className="border border-emerald-200 px-2 py-2 text-center">Est.Production (Soc Yield 85%)</th>
                  <th className="border border-emerald-200 px-2 py-2 text-center">%age</th>
                  <th className="border border-emerald-200 px-2 py-2 text-center">Total Purchase</th>
                  <th className="border border-emerald-200 px-2 py-2 text-center">%age</th>
                </tr>
              </thead>
              <tbody>
                {!hasData && (
                  <tr>
                    <td colSpan={12} className="border border-emerald-200 px-4 py-6 text-center text-sm text-slate-500">
                      {isLoading ? 'Loading data...' : 'No data found. Please select filters and click Search.'}
                    </td>
                  </tr>
                )}
                {reportData.map((item, index) => {
                  const isTotalRow = String(item.VarietyCode || '').includes('Total');
                  const rowClass = isTotalRow ? 'bg-emerald-50 font-semibold' : 'bg-white';
                  return (
                    <tr key={`${item.VarietyCode}-${index}`} className={rowClass}>
                      <td className="border border-emerald-200 px-2 py-2 text-center">{item.SN || ''}</td>
                      <td className="border border-emerald-200 px-2 py-2 text-center">{item.VarietyCode}</td>
                      <td className="border border-emerald-200 px-2 py-2">{item.VarietyName}</td>
                      <td className="border border-emerald-200 px-2 py-2 text-right">{formatNumber(item.CRatoon)}</td>
                      <td className="border border-emerald-200 px-2 py-2 text-right">{formatNumber(item.CPlant)}</td>
                      <td className="border border-emerald-200 px-2 py-2 text-right">{formatNumber(item.CAutumn)}</td>
                      <td className="border border-emerald-200 px-2 py-2 text-right">{formatNumber(item.CTotal)}</td>
                      <td className="border border-emerald-200 px-2 py-2 text-right">{formatNumber(item.APerc, 2)}</td>
                      <td className="border border-emerald-200 px-2 py-2 text-right">{formatNumber(item.SYeild, 2)}</td>
                      <td className="border border-emerald-200 px-2 py-2 text-right">{formatNumber(item.YeildPerc, 2)}</td>
                      <td className="border border-emerald-200 px-2 py-2 text-right">{formatNumber(item.TotPurchse, 2)}</td>
                      <td className="border border-emerald-200 px-2 py-2 text-right">{formatNumber(item.PurchasePerc, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsApp_ActualVarietyWiseArea;


