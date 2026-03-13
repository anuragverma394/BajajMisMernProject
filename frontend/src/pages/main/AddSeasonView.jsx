import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService } from '../../microservices/api.service';
import './MainListView.css';

const normalizeSeasonRows = (rows = []) => {
  return rows.map((item) => ({
    id: item.id ?? item.f_Code ?? item.FACTORY ?? null,
    seasonStartDate: item.seasonStartDate ?? item.S_SEASONSTARTDATE ?? '',
    shiftStartTime: item.shiftStartTime ?? item.S_SHIFTSTARTTIME ?? '00:00',
    shiftHour: item.shiftHour ?? item.S_SHIFTHOUR ?? 0,
    changeTime: item.changeTime ?? item.S_CHEDATETIME ?? '00:00',
    gateCode: item.gateCode ?? item.S_SGT_CD ?? ''
  }));
};

export default function Main_AddSeasonView() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const data = await masterService.getUnits();
        setUnits(Array.isArray(data) ? data : []);
      } catch {
        setUnits([]);
      }
    };
    loadUnits();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const data = await masterService.getSeasons({ unit: unitCode });
      const rows = normalizeSeasonRows(Array.isArray(data) ? data : []);
      setSeasons(rows);
      if (!rows.length) {
        toast.error('No season data found.');
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to load season data';
      toast.error(message);
      setSeasons([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mlv">
      <Toaster position="top-right" />
      <div className="mlv__card">
        <div className="mlv__titlebar">
          Season View
        </div>

        <div className="mlv__content">
          <div className="mlv__field-label">Units</div>

          <select
            value={unitCode}
            onChange={(e) => setUnitCode(e.target.value)}
            className="mlv__select"
          >
            <option value="">All</option>
            {units.map((u, idx) => (
              <option key={`${u.f_Code ?? u.id}-${idx}`} value={u.f_Code ?? u.id}>
                {u.F_Name || u.name}
              </option>
            ))}
          </select>

          <div className="mlv__actions">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="mlv__btn mlv__btn--search"
            >
              {isLoading ? '...' : 'Search'}
            </button>
            <button
              onClick={() => navigate('/Main/AddSeason')}
              className="mlv__btn"
            >
              Add New
            </button>
            <button
              onClick={() => navigate(-1)}
              className="mlv__btn"
            >
              Exit
            </button>
          </div>

          <div className="mlv__table-wrap">
            <table className="mlv__table">
              <thead>
                <tr className="mlv__tr-head">
                  <th className="mlv__th">SEASON START DATE</th>
                  <th className="mlv__th">SHIFT START TIME</th>
                  <th className="mlv__th">SHIFT HOUR</th>
                  <th className="mlv__th">CHANGE DATE TIME</th>
                  <th className="mlv__th">GATE CODE</th>
                </tr>
              </thead>
              <tbody>
                {seasons.length ? (
                  seasons.map((row, idx) => (
                    <tr key={`${row.id ?? 'season'}-${idx}`}>
                      <td className="mlv__td mlv__td--violet">{row.seasonStartDate || '-'}</td>
                      <td className="mlv__td mlv__td--violet">{row.shiftStartTime || '00:00'}</td>
                      <td className="mlv__td mlv__td--violet">{row.shiftHour ?? 0}</td>
                      <td className="mlv__td mlv__td--violet">{row.changeTime || '00:00'}</td>
                      <td className="mlv__td mlv__td--violet">{row.gateCode || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="mlv__td mlv__td--empty">
                      {isLoading ? 'Loading...' : 'No season data found.'}
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
}



