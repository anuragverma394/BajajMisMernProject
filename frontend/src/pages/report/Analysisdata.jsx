import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, reportService } from '../../microservices/api.service';
import '../../styles/base.css';
import '../../styles/Analysisdata.css';

const formatDdMmYyyy = (date = new Date()) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
};

const normalizeUnit = (unit) => ({
  code: String(unit?.F_Code || unit?.f_Code || unit?.id || '').trim(),
  name: String(unit?.F_Name || unit?.f_Name || unit?.name || '').trim()
});

const toNumber = (value) => {
  const num = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isNaN(num) ? 0 : num;
};

const pickValue = (row, keys, fallback = '') => {
  if (!row) return fallback;
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
    const lowerKey = key.toLowerCase();
    const match = Object.keys(row).find((k) => k.toLowerCase() === lowerKey);
    if (match && row[match] !== undefined && row[match] !== null && row[match] !== '') return row[match];
  }
  return fallback;
};

const extractRecordsets = (payload) => {
  if (Array.isArray(payload?.recordsets)) return payload.recordsets;
  if (Array.isArray(payload?.data?.recordsets)) return payload.data.recordsets;
  return [];
};

const normalizeRows = (rows = []) => (Array.isArray(rows) ? rows : []);

const buildMainRows = (rows) => normalizeRows(rows).map((row) => ({
  time: pickValue(row, ['Time', 'TIME', 'Hour', 'HOUR', 'tm'], ''),
  caneCrush: pickValue(row, ['CaneCrush', 'Cane_Crush', 'CaneCrushed', 'CANECRUSH'], 0),
  juiceInTon: pickValue(row, ['JuiceInTon', 'Juice_Ton', 'JUICETON', 'JuiceTon'], 0),
  juicePct: pickValue(row, ['JuicePct', 'JuicePercent', 'JUICEPERCENT', 'Juice%'], 0),
  waterInTon: pickValue(row, ['WaterInTon', 'Water_Ton', 'WATERTON', 'WaterTon'], 0),
  waterPct: pickValue(row, ['WaterPct', 'WaterPercent', 'WATERPERCENT', 'Water%'], 0),
  dmf: pickValue(row, ['DMF', 'Dmf'], 0),
  sugarBags: pickValue(row, ['SugarBags', 'Sugar_Bags', 'Bags'], 0),
  baggingRecoveryPct: pickValue(row, ['BaggingRecoveryPct', 'BaggingRecovery', 'BaggingRecovery%'], 0)
}));

const buildAnalysisRows = (rows) => normalizeRows(rows).map((row) => ({
  time: pickValue(row, ['Time', 'TIME', 'Hour', 'HOUR'], ''),
  primaryBrix: pickValue(row, ['PrimaryBrix', 'Brix', 'PRIMBRIX'], 0),
  primaryPol: pickValue(row, ['PrimaryPol', 'Pol', 'PRIMPOL'], 0),
  primaryPurity: pickValue(row, ['PrimaryPurity', 'Purity', 'PRIMPURITY'], 0),
  mixBrix: pickValue(row, ['MixBrix', 'MixJuiceBrix', 'MIXBRIX'], 0),
  mixPol: pickValue(row, ['MixPol', 'MixJuicePol', 'MIXPOL'], 0),
  mixPurity: pickValue(row, ['MixPurity', 'MixJuicePurity', 'MIXPURITY'], 0),
  brixMl: pickValue(row, ['BrixML', 'BrixMl', 'Brix_ML', 'BrixMLJ'], 0)
}));

const buildBagasseRows = (rows) => normalizeRows(rows).map((row) => ({
  time: pickValue(row, ['Time', 'TIME', 'Hour', 'HOUR'], ''),
  pol: pickValue(row, ['Pol', 'POL'], 0),
  mois: pickValue(row, ['Mois', 'MOIS', 'Moisture'], 0)
}));

const buildMolassesRows = (rows) => normalizeRows(rows).map((row) => ({
  time: pickValue(row, ['Time', 'TIME', 'Hour', 'HOUR'], ''),
  brix: pickValue(row, ['Brix', 'BRIX'], 0),
  pol: pickValue(row, ['Pol', 'POL'], 0),
  purity: pickValue(row, ['Purity', 'PURITY'], 0),
  quadBrix: pickValue(row, ['QuadBrix', 'Quad', 'Quad_Brix', 'BrixQuad'], 0)
}));

const sumRows = (rows, key) => rows.reduce((acc, row) => acc + toNumber(row[key]), 0);

const Report_Analysisdata = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mainRows, setMainRows] = useState([]);
  const [analysisRows, setAnalysisRows] = useState([]);
  const [bagasseRows, setBagasseRows] = useState([]);
  const [molassesRows, setMolassesRows] = useState([]);
  const [filters, setFilters] = useState({
    unit: '0',
    date: formatDdMmYyyy(new Date())
  });

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Please login again.');
      navigate('/login', { replace: true });
      return;
    }

    // Load units
    masterService
      .getUnits()
      .then((data) => setUnits(Array.isArray(data) ? data.map(normalizeUnit).filter((u) => u.code) : []))
      .catch((error) => {
        console.error('Failed to load units:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login', { replace: true });
        }
      });
  }, [navigate]);

  const parsePayload = (payload) => {
    const recordsets = extractRecordsets(payload);
    const mainSet = recordsets[0] || payload?.data || [];
    const analysisSet = recordsets[1] || [];
    const bagasseSet = recordsets[2] || [];
    const molassesSet = recordsets[3] || [];

    setMainRows(buildMainRows(mainSet));
    setAnalysisRows(buildAnalysisRows(analysisSet));
    setBagasseRows(buildBagasseRows(bagasseSet));
    setMolassesRows(buildMolassesRows(molassesSet));
  };

  const handleSearch = async () => {
    // Validate inputs
    if (!filters.unit || filters.unit === '0') {
      toast.error('Please select a factory/unit');
      return;
    }
    if (!filters.date) {
      toast.error('Please select a date');
      return;
    }

    setLoading(true);
    try {
      const response = await reportService.getAnalysisData({
        F_code: filters.unit,
        Date: filters.date
      });
      parsePayload(response || {});
      toast.success('Data loaded successfully');
    } catch (error) {
      console.error('Analysis data fetch error:', error);
      
      // Handle 401 Unauthorized - redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please login again.');
        navigate('/login', { replace: true });
        return;
      }

      // Handle other errors
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Failed to load analysis data';
      toast.error(errorMessage);
      
      // Clear data on error
      setMainRows([]);
      setAnalysisRows([]);
      setBagasseRows([]);
      setMolassesRows([]);
    } finally {
      setLoading(false);
    }
  };


  const totals = useMemo(() => ({
    caneCrush: sumRows(mainRows, 'caneCrush'),
    juiceInTon: sumRows(mainRows, 'juiceInTon'),
    juicePct: '',
    waterInTon: sumRows(mainRows, 'waterInTon'),
    waterPct: '',
    dmf: '',
    sugarBags: sumRows(mainRows, 'sugarBags'),
    baggingRecoveryPct: ''
  }), [mainRows]);

  return (
    <div className="analysis-page">
      <Toaster position="top-right" />

      <div className="page-card analysis-card">
        <div className="page-card-header analysis-header">Analysis Data as On</div>
        <div className="page-card-body">
          <div className="analysis-filters">
            <div className="form-group">
              <label>Units</label>
              <select
                className="form-control"
                value={filters.unit}
                onChange={(e) => setFilters((prev) => ({ ...prev, unit: e.target.value }))}
              >
                <option value="0">All</option>
                {units.map((unit) => (
                  <option key={unit.code} value={unit.code}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="text"
                className="form-control"
                placeholder="dd/mm/yyyy"
                value={filters.date}
                onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="analysis-status">
              <span className="analysis-bulb" />
            </div>
          </div>

          <div className="analysis-actions">
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </button>
            <button className="btn btn-primary" onClick={() => toast.info('Exporting Excel...')}>
              Excel
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              Print
            </button>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              Exit
            </button>
          </div>

          <div className="analysis-grid">
            <div className="analysis-left">
              <div className="analysis-table-wrap">
                <table className="analysis-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Cane Crush</th>
                      <th>Juice In Ton</th>
                      <th>Juice %</th>
                      <th>Water In Ton</th>
                      <th>Water %</th>
                      <th>DMF</th>
                      <th>Sugar Bags</th>
                      <th>Bagging Recovery%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainRows.length === 0 && (
                      <tr>
                        <td colSpan="9" className="analysis-empty">No data found.</td>
                      </tr>
                    )}
                    {mainRows.map((row, idx) => (
                      <tr key={`${row.time}-${idx}`}>
                        <td>{row.time}</td>
                        <td>{row.caneCrush}</td>
                        <td>{row.juiceInTon}</td>
                        <td>{row.juicePct}</td>
                        <td>{row.waterInTon}</td>
                        <td>{row.waterPct}</td>
                        <td>{row.dmf}</td>
                        <td>{row.sugarBags}</td>
                        <td>{row.baggingRecoveryPct}</td>
                      </tr>
                    ))}
                    {mainRows.length > 0 && (
                      <tr className="analysis-total">
                        <td>Total</td>
                        <td>{totals.caneCrush}</td>
                        <td>{totals.juiceInTon}</td>
                        <td>{totals.juicePct}</td>
                        <td>{totals.waterInTon}</td>
                        <td>{totals.waterPct}</td>
                        <td>{totals.dmf}</td>
                        <td>{totals.sugarBags}</td>
                        <td>{totals.baggingRecoveryPct}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="analysis-right">
              <div className="analysis-subcard">
                <div className="analysis-subhead">ANALYSIS DATA AS ON:</div>
                <div className="analysis-subtable-wrap">
                  <table className="analysis-subtable">
                    <thead>
                      <tr>
                        <th rowSpan="2">Time</th>
                        <th colSpan="3">Primary</th>
                        <th colSpan="4">Mix Juice</th>
                      </tr>
                      <tr>
                        <th>Brix</th>
                        <th>Pol</th>
                        <th>Purity</th>
                        <th>Brix</th>
                        <th>Pol</th>
                        <th>Purity</th>
                        <th>BrixML</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisRows.length === 0 && (
                        <tr>
                          <td colSpan="8" className="analysis-empty">No data found.</td>
                        </tr>
                      )}
                      {analysisRows.map((row, idx) => (
                        <tr key={`${row.time}-${idx}`}>
                          <td>{row.time}</td>
                          <td>{row.primaryBrix}</td>
                          <td>{row.primaryPol}</td>
                          <td>{row.primaryPurity}</td>
                          <td>{row.mixBrix}</td>
                          <td>{row.mixPol}</td>
                          <td>{row.mixPurity}</td>
                          <td>{row.brixMl}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="analysis-bottom">
                <div className="analysis-subcard">
                  <div className="analysis-subhead">BAGASSE</div>
                  <div className="analysis-subtable-wrap">
                    <table className="analysis-subtable">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Pol</th>
                          <th>Mois.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bagasseRows.length === 0 && (
                          <tr>
                            <td colSpan="3" className="analysis-empty">No data found.</td>
                          </tr>
                        )}
                        {bagasseRows.map((row, idx) => (
                          <tr key={`${row.time}-${idx}`}>
                            <td>{row.time}</td>
                            <td>{row.pol}</td>
                            <td>{row.mois}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="analysis-subcard">
                  <div className="analysis-subhead">FINAL MOLASSES</div>
                  <div className="analysis-subtable-wrap">
                    <table className="analysis-subtable">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Brix</th>
                          <th>Pol</th>
                          <th>Purity</th>
                          <th>Quad Brix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {molassesRows.length === 0 && (
                          <tr>
                            <td colSpan="5" className="analysis-empty">No data found.</td>
                          </tr>
                        )}
                        {molassesRows.map((row, idx) => (
                          <tr key={`${row.time}-${idx}`}>
                            <td>{row.time}</td>
                            <td>{row.brix}</td>
                            <td>{row.pol}</td>
                            <td>{row.purity}</td>
                            <td>{row.quadBrix}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report_Analysisdata;
