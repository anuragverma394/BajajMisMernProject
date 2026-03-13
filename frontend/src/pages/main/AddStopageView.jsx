import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService } from '../../microservices/api.service';
import './MainListView.css';

const normalizeStoppageRows = (rows = []) => {
  return rows.map((item) => ({
    id: item.id ?? item.STPID ?? null,
    factoryName: item.factoryName ?? item.unit ?? item.F_Name ?? '-',
    mode: item.mode ?? item.STP_PIO ?? '-',
    remark: item.remark ?? item.STP_Remark ?? '-'
  }));
};

export default function Main_AddStopageView() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stoppages, setStoppages] = useState([]);

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
      const data = await masterService.getStoppages({ unit: unitCode });
      const rows = normalizeStoppageRows(Array.isArray(data) ? data : []);
      setStoppages(rows);
      if (!rows.length) {
        toast.error('No stoppage data found.');
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to load stoppage data';
      toast.error(message);
      setStoppages([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mlv">
      <Toaster position="top-right" />
      <div className="mlv__card">
        <div className="mlv__titlebar">
          Stopage View
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
              onClick={() => navigate('/Main/AddStopage')}
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

          <div className="mlv__table-wrap mlv__table-wrap--scroll">
            <table className="mlv__table mlv__table--min-900">
              <thead>
                <tr className="mlv__tr-head">
                  <th className="mlv__th">Factory Name</th>
                  <th className="mlv__th">Operation mode</th>
                  <th className="mlv__th">Remark</th>
                </tr>
              </thead>
              <tbody>
                {stoppages.length ? (
                  stoppages.map((row, idx) => (
                    <tr key={`${row.id ?? 'stoppage'}-${idx}`}>
                      <td className="mlv__td mlv__td--violet">{row.factoryName || '-'}</td>
                      <td className="mlv__td mlv__td--violet">{row.mode || '-'}</td>
                      <td className="mlv__td mlv__td--violet">{row.remark || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="mlv__td mlv__td--empty">
                      {isLoading ? 'Loading...' : 'No stoppage data found.'}
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



