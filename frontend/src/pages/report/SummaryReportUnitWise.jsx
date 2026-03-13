import React, { useEffect, useMemo, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, trackingService } from '../../microservices/api.service';
import '../../styles/base.css';

const Report_SummaryReportUnitWise = () => {
  const [factories, setFactories] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [trackingDate, setTrackingDate] = useState('');
  const [userCode, setUserCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryRows, setSummaryRows] = useState([]);
  const [offlineRows, setOfflineRows] = useState([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalUser, setHistoryModalUser] = useState(null);
  const [historyDate, setHistoryDate] = useState('');
  const [historyFromTime, setHistoryFromTime] = useState('0800');
  const [historyToTime, setHistoryToTime] = useState('1219');

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const units = await masterService.getUnits();
        const list = Array.isArray(units) ? units : [];
        setFactories(list);
        if (list.length) {
          const first = list[0];
          setUnitCode(String(first.F_Code || first.f_Code || first.id || ''));
        }
      } catch (error) {
        toast.error('Failed to load factory list');
      }
    };
    loadInitial();

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    setTrackingDate(`${dd}/${mm}/${yyyy}`);
  }, []);

  const selectedFactoryLabel = useMemo(() => {
    const row = factories.find((f) => String(f.F_Code || f.f_Code || f.id || '') === String(unitCode));
    return row ? String(row.F_Name || row.name || '') : '';
  }, [factories, unitCode]);

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const res = await trackingService.getExecutiveSummary({
        factoryCode: unitCode,
        date: trackingDate,
        userCode
      });

      const payload = res?.data;
      if (payload && !Array.isArray(payload)) {
        const nextSummary = Array.isArray(payload.summary) ? payload.summary : [];
        const nextOffline = Array.isArray(payload.offlineUsers) ? payload.offlineUsers : [];
        setSummaryRows(nextSummary);
        setOfflineRows(nextOffline);
        if (!nextSummary.length) {
          toast.error('No tracking data found for selected filters');
        }
      } else {
        const flat = Array.isArray(payload) ? payload : Array.isArray(res) ? res : [];
        setSummaryRows(flat);
        setOfflineRows([]);
        if (!flat.length) {
          toast.error('No tracking data found for selected filters');
        }
      }
    } catch (error) {
      console.error('SummaryReportUnitWise search failed', error);
      toast.error(error?.response?.data?.message || 'Failed to retrieve tracking data');
      setSummaryRows([]);
      setOfflineRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toSlashDate = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
    if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw.replace(/-/g, '/');
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [yyyy, mm, dd] = raw.split('-');
      return `${dd}/${mm}/${yyyy}`;
    }
    return raw;
  };

  const toDashDate = (value) => toSlashDate(value).replace(/\//g, '-');

  const openHistoryModal = (row) => {
    setHistoryModalUser(row || null);
    setHistoryDate(toSlashDate(trackingDate));
    setHistoryFromTime('0800');
    setHistoryToTime('1219');
    setHistoryModalOpen(true);
  };

  const handleHistoryView = () => {
    if (!historyModalUser?.Userid) {
      toast.error('User code missing');
      return;
    }
    const dt = toDashDate(historyDate || trackingDate);
    const url = `/Tracking/TrackingMapLive?EmpID=${encodeURIComponent(historyModalUser.Userid)}&DtFrom=${encodeURIComponent(dt)}&DtTo=${encodeURIComponent(dt)}&TimeFrom=${encodeURIComponent(historyFromTime)}&TimeTo=${encodeURIComponent(historyToTime)}`;
    window.open(url, '_blank');
    setHistoryModalOpen(false);
  };

  return (
    <div className="py-[12px] px-[16px] bg-[#f6f7fb] min-h-[calc(100vh - 120px)]">
      <Toaster position="top-right" />

      <div className="page-card rounded-[10px]">
        <div className="page-card-header text-[15px]">Tracking Executive Report</div>

        <div className="page-card-body p-[18px]">
          <div className="bg-[#e2efda] py-[10px] px-[15px] rounded mb-[14px] text-[13px] text-[#3c763d]">
            Tracking Executive Report With Allotted Time
          </div>

          <div className="grid gap-[14px] mb-[10px]">
            <div className="form-group">
              <label className="font-bold">Factory</label>
              <select className="form-control" value={unitCode} onChange={(e) => setUnitCode(e.target.value)}>
                {factories.map((u, idx) => (
                  <option key={`${u.F_Code || u.f_Code || u.id}-${idx}`} value={u.F_Code || u.f_Code || u.id}>
                    {u.F_Name || u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="font-bold">Tracking Date</label>
              <input
                type="text"
                className="form-control"
                value={trackingDate}
                onChange={(e) => setTrackingDate(e.target.value)}
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div className="form-group">
              <label className="font-bold">User Code</label>
              <input
                type="text"
                className="form-control"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="User code"
              />
            </div>
          </div>

          <div className="flex gap-[8px] mb-[14px]">
            <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button className="btn btn-primary" onClick={() => toast.success('Excel export started')}>
              Excel
            </button>
          </div>

          <div className="overflow-auto border border-[#9ec89e]">
            <table className="w-[100%] min-w-[1100px]">
              <thead>
                <tr>
                  <th rowSpan={2} className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Factory</th>
                  <th rowSpan={2} className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Total Tracking User</th>
                  <th rowSpan={2} className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Active User</th>
                  <th colSpan={3} className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Active Hours</th>
                  <th colSpan={3} className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Cover Distance</th>
                </tr>
                <tr>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Average</th>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Min</th>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Max</th>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Average</th>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Min</th>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Max</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.length ? summaryRows.map((row, idx) => (
                  <tr key={`${row.factid || idx}`}>
                    <td className="border border-[#9ec89e] p-[10px]">{row.F_NAME || selectedFactoryLabel || '-'}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-right">{row.TotalTrackingUser ?? 0}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-right">{row.ActiveUser ?? 0}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-right">{row.AvgActiveHours || 'hours minutes'}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-right">{row.MinActiveHours || 'hours minutes'}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-right">{row.MaxActiveHours || 'hours minutes'}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-right">{row.AvgCoverDistance ?? ''}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-right">{row.MinCoverDistance ?? ''}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-right">{row.MaxCoverDistance ?? ''}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={9} className="border border-[#9ec89e] p-[16px] text-center text-[#6b7280]">
                      {isLoading ? 'Loading...' : 'No data found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-[18px] font-semibold m-[18px 0 10px]">Offline Users</div>
          <div className="overflow-auto border border-[#9ec89e]">
            <table className="w-[100%] min-w-[980px]">
              <thead>
                <tr>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Sr NO</th>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Employee Name</th>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Mobile No</th>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Start Time</th>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">End Time</th>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Active Hours</th>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Distance Covers</th>
                  <th className="bg-[#c6d8c2] border border-[#9ec89e] p-[10px]">Tracking</th>
                </tr>
              </thead>
              <tbody>
                {offlineRows.length ? offlineRows.map((row, idx) => (
                  <tr key={`${row.Userid || idx}-${idx}`}>
                    <td className="border border-[#9ec89e] p-[10px] text-[#ef6f6f]">{idx + 1}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-[#ef6f6f]">{row.Name || '-'}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-[#ef6f6f]">{row.MobNo || '-'}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-[#ef6f6f]">{row.MinTime || '-'}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-[#ef6f6f]">{row.MaxTime || '-'}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-[#ef6f6f]">{row.ActiveHours || '0'}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-[#ef6f6f]">{row.DistanceCovers ?? 0}</td>
                    <td className="border border-[#9ec89e] p-[10px] text-center">
                      <button
                        className="border border-[#d1d5db] rounded py-[4px] px-[8px] bg-white"
                        onClick={() => openHistoryModal(row)}
                        title="History Tracking"
                      >
                        <i className="fas fa-route"></i>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="border border-[#9ec89e] p-[16px] text-center text-[#6b7280]">
                      No offline users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {historyModalOpen && (
        <div className="fixed z-[1000] bg-[rgba(0,0,0,0.35)] flex items-start justify-center pt-[110px]">
          <div className="w-[min(980px, 92vw)] bg-white rounded-lg shadow-[0 8px 26px rgba(0,0,0,0.28)] p-[20px 24px 24px]">
            <div className="text-center text-[15px] font-semibold mb-[12px]">History Tracking</div>
            <div className="grid gap-[28px] border-t border-t-[#e5e7eb] pt-[14px]">
              <div>
                <label className="block font-bold mb-[4px]">Date</label>
                <input
                  type="text"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  className="w-[100%] h-[42px] border border-[#9ca3af] rounded-[2px] py-[0] px-[10px]"
                />
              </div>
              <div>
                <label className="block font-bold mb-[4px]">Time From</label>
                <input
                  type="text"
                  value={historyFromTime}
                  onChange={(e) => setHistoryFromTime(e.target.value)}
                  className="w-[100%] h-[42px] border border-[#cbd5e1] rounded-md py-[0] px-[12px]"
                />
              </div>
              <div>
                <label className="block font-bold mb-[4px]">Time To</label>
                <input
                  type="text"
                  value={historyToTime}
                  onChange={(e) => setHistoryToTime(e.target.value)}
                  className="w-[100%] h-[42px] border border-[#cbd5e1] rounded-md py-[0] px-[12px]"
                />
              </div>
            </div>
            <div className="flex justify-center gap-[8px] mt-[10px]">
              <button onClick={handleHistoryView} className="bg-[#1f9e8a] text-white border-0 rounded-md py-[10px] px-[24px] text-[13px]">View</button>
              <button onClick={() => setHistoryModalOpen(false)} className="bg-[#f4b400] text-white border-0 rounded-md py-[10px] px-[24px] text-[13px]">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report_SummaryReportUnitWise;

