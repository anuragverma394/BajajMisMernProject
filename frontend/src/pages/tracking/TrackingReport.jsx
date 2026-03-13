import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { trackingService, masterService } from '../../microservices/api.service';

const normalizeUnit = (unit) => ({
  code: String(unit?.F_Code || unit?.f_Code || unit?.id || '').trim(),
  name: String(unit?.F_Name || unit?.f_Name || unit?.name || '').trim()
});

const Tracking_TrackingReport = () => {
  const navigate = useNavigate();

  const [factories, setFactories] = useState([]);
  const [zones, setZones] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const [filters, setFilters] = useState({
    unit: '',
    zone: '0',
    block: '0',
    fromDate: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const units = await masterService.getUnits();
        const normalized = (Array.isArray(units) ? units : [])
          .map(normalizeUnit)
          .filter((unit) => unit.code);
        setFactories(normalized);
      } catch (error) {
        toast.error('Failed to load units');
      }
    };
    loadUnits();
  }, []);

  const handleFilterChange = async (field, value) => {
    if (field === 'unit') {
      setFilters((prev) => ({ ...prev, unit: value, zone: '0', block: '0' }));
      setRows([]);
      setBlocks([]);
      try {
        const zoneData = await trackingService.getZones({ unit: value || '0', factCode: value || '0' });
        setZones(Array.isArray(zoneData) ? zoneData : []);
      } catch (error) {
        setZones([]);
        toast.error('Failed to load zones');
      }
      return;
    }

    if (field === 'zone') {
      setFilters((prev) => ({ ...prev, zone: value, block: '0' }));
      setRows([]);
      if (!value || value === '0') {
        setBlocks([]);
        return;
      }

      try {
        const blockData = await trackingService.getBlocks({
          zoneCode: value,
          zonecode: value,
          unit: filters.unit || '0',
          factCode: filters.unit || '0'
        });
        setBlocks(Array.isArray(blockData) ? blockData : []);
      } catch (error) {
        setBlocks([]);
        toast.error('Failed to load blocks');
      }
      return;
    }

    if (field === 'block') {
      setFilters((prev) => ({ ...prev, block: value }));
      setRows([]);
      return;
    }

    if (field === 'fromDate') {
      setFilters((prev) => ({ ...prev, fromDate: value }));
      setRows([]);
    }
  };

  const handleSearch = async () => {
    if (!filters.unit) {
      toast.error('Please select a unit');
      return;
    }

    setLoading(true);
    try {
      const data = await trackingService.getPerformanceReport({
        unit: filters.unit,
        zone: filters.zone,
        block: filters.block,
        date: filters.fromDate,
        fromDate: filters.fromDate
      });
      const normalized = Array.isArray(data) ? data : [];
      const flatRows = [];

      normalized.forEach((zoneItem) => {
        const zoneName = zoneItem?.zone || '-';
        (zoneItem?.blocks || []).forEach((blockItem) => {
          const blockName = blockItem?.block || '-';
          (blockItem?.staff || []).forEach((staff) => {
            flatRows.push({
              zone: zoneName,
              block: blockName,
              empCode: staff?.empCode || '-',
              empName: staff?.empName || '-',
              duty: staff?.duty || '-',
              start: staff?.start || '-',
              end: staff?.end || '-',
              distance: staff?.distance || '-',
              growers: staff?.growers ?? 0
            });
          });
        });
      });

      setRows(flatRows);
      if (!flatRows.length) toast.error('No records found');
    } catch (error) {
      console.error('TrackingReport search failed:', error);
      toast.error('Failed to fetch tracking report');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedUnitName = useMemo(() => {
    const unit = factories.find((factory) => String(factory.code) === String(filters.unit));
    return unit?.name || '';
  }, [factories, filters.unit]);

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#f3f3f3] p-5">
      <Toaster position="top-right" />

      <div className="rounded-xl border border-[#d7dde8] bg-white overflow-hidden">
        <div className="bg-[#169f8e] px-4 py-3 text-white text-[34px] font-semibold leading-tight">
          Target Tracking Report
        </div>

        <div className="bg-[#f6f4f2] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="mb-2 block text-[14px] font-semibold text-[#111]">Units</label>
              <select
                value={filters.unit}
                onChange={(e) => handleFilterChange('unit', e.target.value)}
                className="h-11 w-full rounded-md border border-[#cfd5e3] bg-white px-4 text-[15px] text-[#4a5671] outline-none"
              >
                <option value="">-Please Select-</option>
                {factories.map((f, idx) => (
                  <option key={`${f.code || 'factory'}-${idx}`} value={f.code}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-semibold text-[#111]">Zone</label>
              <select
                value={filters.zone}
                onChange={(e) => handleFilterChange('zone', e.target.value)}
                className="h-11 w-full rounded-md border border-[#cfd5e3] bg-white px-4 text-[15px] text-[#4a5671] outline-none"
              >
                <option value="0">-Please Select-</option>
                {zones.map((z, idx) => (
                  <option key={`${z.z_code || 'z'}-${idx}`} value={z.z_code}>
                    {z.z_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-semibold text-[#111]">Block</label>
              <select
                value={filters.block}
                onChange={(e) => handleFilterChange('block', e.target.value)}
                className="h-11 w-full rounded-md border border-[#cfd5e3] bg-white px-4 text-[15px] text-[#4a5671] outline-none"
              >
                <option value="0">-Please Select-</option>
                {blocks.map((b, idx) => (
                  <option key={`${b.bl_code || 'b'}-${idx}`} value={b.bl_code}>
                    {b.bl_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-semibold text-[#111]">From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                className="h-11 w-full rounded-md border border-[#cfd5e3] bg-white px-4 text-[15px] text-[#4a5671] outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="h-[44px] min-w-[80px] rounded-md bg-[#169f8e] px-5 text-[13px] font-medium text-white disabled:opacity-70"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={() => {
                setFilters({ unit: '', zone: '0', block: '0', fromDate: new Date().toISOString().split('T')[0] });
                setZones([]);
                setBlocks([]);
                setRows([]);
              }}
              className="h-[44px] min-w-[80px] rounded-md bg-[#169f8e] px-5 text-[13px] font-medium text-white"
            >
              Excel
            </button>
            <button
              onClick={() => navigate('/Tracking/TrackingDashboard')}
              className="h-[44px] min-w-[80px] rounded-md bg-[#169f8e] px-5 text-[13px] font-medium text-white"
            >
              Exit
            </button>
          </div>

          <div className="mt-6 max-h-[420px] overflow-auto rounded border border-[#a9c7a3] bg-white">
            <table className="w-full min-w-[1250px] border-collapse">
              <thead>
                <tr className="bg-[#808080] text-white">
                  <th className="border border-[#b7bcc6] p-3 text-left text-[14px] font-semibold">Zone</th>
                  <th className="border border-[#b7bcc6] p-3 text-left text-[14px] font-semibold">Block</th>
                  <th className="border border-[#b7bcc6] p-3 text-left text-[14px] font-semibold">EmpCode</th>
                  <th className="border border-[#b7bcc6] p-3 text-left text-[14px] font-semibold">EmpName</th>
                  <th className="border border-[#b7bcc6] p-3 text-left text-[14px] font-semibold">On Duty/Leave</th>
                  <th className="border border-[#b7bcc6] p-3 text-left text-[14px] font-semibold">StartTime</th>
                  <th className="border border-[#b7bcc6] p-3 text-left text-[14px] font-semibold">EndTime</th>
                  <th className="border border-[#b7bcc6] p-3 text-left text-[14px] font-semibold">TravelDistance</th>
                  <th className="border border-[#b7bcc6] p-3 text-left text-[14px] font-semibold">Met with Grower(Nos)</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((r, idx) => (
                    <tr key={`${r.empCode}-${idx}`} className="bg-[#fff] hover:bg-[#f9fbff]">
                      <td className="border border-[#d2d7df] p-3 text-[13px] text-[#334155]">{r.zone}</td>
                      <td className="border border-[#d2d7df] p-3 text-[13px] text-[#334155]">{r.block}</td>
                      <td className="border border-[#d2d7df] p-3 text-[13px] text-[#334155]">{r.empCode}</td>
                      <td className="border border-[#d2d7df] p-3 text-[13px] text-[#334155]">{r.empName}</td>
                      <td className="border border-[#d2d7df] p-3 text-[13px] text-[#334155]">{r.duty}</td>
                      <td className="border border-[#d2d7df] p-3 text-[13px] text-[#334155]">{r.start}</td>
                      <td className="border border-[#d2d7df] p-3 text-[13px] text-[#334155]">{r.end}</td>
                      <td className="border border-[#d2d7df] p-3 text-[13px] text-[#334155]">{r.distance}</td>
                      <td className="border border-[#d2d7df] p-3 text-[13px] text-[#334155]">{r.growers}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="border border-[#d2d7df] p-4 text-center text-[13px] text-[#6b7280]">
                      {loading
                        ? 'Loading tracking report...'
                        : selectedUnitName
                        ? 'No records found for selected filters'
                        : 'Select filters and click Search'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracking_TrackingReport;
