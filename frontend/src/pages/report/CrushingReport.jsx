import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, reportService } from '../../microservices/api.service';
import '../../styles/base.css';
import '../../styles/CrushingReport.css';

const formatDdMmYyyy = (date = new Date()) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
};

const normalizeUnit = (u) => ({
  code: String(u?.F_Code || u?.f_Code || u?.id || '').trim(),
  name: String(u?.F_Name || u?.f_Name || u?.name || '').trim()
});

const unwrapPayload = (payload) => {
  if (!payload) return {};
  if (payload.data !== undefined) {
    if (Array.isArray(payload.data)) return payload.data[0] || {};
    return payload.data || {};
  }
  if (Array.isArray(payload)) return payload[0] || {};
  return payload;
};

const Report_CrushingReport = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState({});
  const [status, setStatus] = useState({ remark: '', ok: false, bad: false });

  const [filters, setFilters] = useState({
    unit: '',
    date: formatDdMmYyyy(new Date()),
    cropDays: ''
  });

  useEffect(() => {
    masterService
      .getUnits()
      .then((d) => {
        const units = Array.isArray(d) ? d.map(normalizeUnit).filter((u) => u.code) : [];
        setFactories(units);
      })
      .catch(() => { });
  }, []);

  const fetchBulbStatus = async (factoryCode) => {
    if (!factoryCode) return;
    try {
      const response = await reportService.getCrushingBulb({ F_code: factoryCode });
      const data = unwrapPayload(response);
      setStatus({
        remark: String(data.STP_Remark || ''),
        ok: Number(data.STP_PIO || 0) === 1,
        bad: Number(data.STP_PIM || 0) === 1
      });
    } catch (error) {
      setStatus({ remark: '', ok: false, bad: false });
    }
  };

  const fetchLatestDate = async (factoryCode) => {
    try {
      const response = await reportService.getLatestCrushingDate({ FACTCODE: factoryCode });
      const data = unwrapPayload(response);
      const latest = String(data?.date || '').trim();
      return latest;
    } catch (error) {
      return '';
    }
  };

  const applyReportData = (data) => {
    const payload = unwrapPayload(data);
    if (payload) {
      const num = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      const setIfEmpty = (key, value) => {
        if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
          payload[key] = value;
        }
      };

      const gate = {
        OYNos: num(payload.lblGateOYNos),
        OYWt: num(payload.lblGateOYWt),
        AtDNos: num(payload.lblGateAtDNos),
        AtDWt: num(payload.lblGateAtDWt),
        ODCNos: num(payload.lblGateODCNos),
        ODCWt: num(payload.lblGateODCWt),
        TDCNos: num(payload.lblGateTDCNos),
        TDCWt: num(payload.lblGateTDCWt)
      };
      const center = {
        OYNos: num(payload.lblCenterOYNos),
        OYWt: num(payload.lblCenterOYWt),
        AtDNos: num(payload.lblCenterAtDNos),
        AtDWt: num(payload.lblCenterAtDWt),
        ODCNos: num(payload.lblCenterODCNos),
        ODCWt: num(payload.lblCenterODCWt),
        TDCNos: num(payload.lblCenterTDCNos),
        TDCWt: num(payload.lblCenterTDCWt)
      };

      const gtCenOYNos = gate.OYNos + center.OYNos;
      const gtCenOYWt = gate.OYWt + center.OYWt;
      const gtCenAtDNos = gate.AtDNos + center.AtDNos;
      const gtCenAtDWt = gate.AtDWt + center.AtDWt;
      const gtCenODCNos = gate.ODCNos + center.ODCNos;
      const gtCenODCWt = gate.ODCWt + center.ODCWt;
      const gtCenTDCNos = gate.TDCNos + center.TDCNos;
      const gtCenTDCWt = gate.TDCWt + center.TDCWt;

      setIfEmpty('lblGtCenOYNos', String(gtCenOYNos));
      setIfEmpty('lblGtCenOYWt', gtCenOYWt.toFixed(2));
      setIfEmpty('lblGtCenAtDNos', String(gtCenAtDNos));
      setIfEmpty('lblGtCenAtDWt', gtCenAtDWt.toFixed(2));
      setIfEmpty('lblGtCenODCNos', String(gtCenODCNos));
      setIfEmpty('lblGtCenODCWt', gtCenODCWt.toFixed(2));
      setIfEmpty('lblGtCenODCAvg', gtCenODCNos > 0 ? (gtCenODCWt / gtCenODCNos).toFixed(2) : '0.00');
      setIfEmpty('lblGtCenTDCNos', String(gtCenTDCNos));
      setIfEmpty('lblGtCenTDCWt', gtCenTDCWt.toFixed(2));
      setIfEmpty('lblGtCenTDCAvg', gtCenTDCNos > 0 ? (gtCenTDCWt / gtCenTDCNos).toFixed(2) : '0.00');
    }
    setReport(payload || {});
    if (payload?.lblcrop) {
      setFilters((prev) => ({ ...prev, cropDays: String(payload.lblcrop) }));
    }
    if (payload?.dtpDate) {
      setFilters((prev) => ({ ...prev, date: String(payload.dtpDate) }));
    }
  };

  const loadFactoryData = async (opts = {}) => {
    const unit = opts.unit ?? filters.unit;
    let date = opts.date ?? filters.date;
    if (!unit) return;
    setLoading(true);
    try {
      if (!date) {
        date = await fetchLatestDate(unit);
      }
      const response = await reportService.getCrushingFactoryData({
        FACTCODE: unit,
        Date: date,
        DATE: date
      });
      applyReportData(response);
      await fetchBulbStatus(unit);
    } catch (error) {
      toast.error('Failed to load crushing report');
      setReport({});
    } finally {
      setLoading(false);
    }
  };

  const refreshModewise = async () => {
    if (!filters.unit) { toast.error('Please select a factory'); return; }
    setLoading(true);
    try {
      const response = await reportService.getCrushingModewiseData({
        FACTCODE: filters.unit,
        Date: filters.date,
        DATE: filters.date
      });
      applyReportData(response);
      await fetchBulbStatus(filters.unit);
      toast.success('Data refreshed');
    } catch (error) {
      toast.error('Failed to refresh crushing report');
      setReport({});
    } finally {
      setLoading(false);
    }
  };


  const yardRows = [
    { label: 'Cart', key: 'Cart' },
    { label: 'Small Trolly', key: 'Trolly40' },
    { label: 'Large Trolly', key: 'Trolly60' },
    { label: 'Pvt Truck', key: 'Truck' }
  ];

  const shifts = useMemo(() => ({
    A: [
      { label: '06 AM To 07 AM', wt: 'lbl6amto7amWt', total: 'lbl6amto7amTWt' },
      { label: '07 AM To 08 AM', wt: 'lbl7amto8amWt', total: 'lbl7amto8amTWt' },
      { label: '08 AM To 09 AM', wt: 'lbl8amto9amWt', total: 'lbl8amto9amTWt' },
      { label: '09 AM To 10 AM', wt: 'lbl9amto10amWt', total: 'lbl9amto10amTWt' },
      { label: '10 AM To 11 AM', wt: 'lbl10amto11amWt', total: 'lbl10amto11amTWt' },
      { label: '11 AM To 12 PM', wt: 'lbl11amto12pmWt', total: 'lbl11amto12pmTWt' },
      { label: '12 PM To 01 PM', wt: 'lbl12pmto1pmWt', total: 'lbl12pmto1pmTWt' },
      { label: '01 PM To 02 PM', wt: 'lbl1pmto2pmWt', total: 'lbl1pmto2pmTWt' }
    ],
    B: [
      { label: '02 PM To 03 PM', wt: 'lbl2pmto3pmWt', total: 'lbl2pmto3pmTWt' },
      { label: '03 PM To 04 PM', wt: 'lbl3pmto4pmWt', total: 'lbl3pmto4pmTWt' },
      { label: '04 PM To 05 PM', wt: 'lbl4pmto5pmWt', total: 'lbl4pmto5pmTWt' },
      { label: '05 PM To 06 PM', wt: 'lbl5pmto6pmWt', total: 'lbl5pmto6pmTWt' },
      { label: '06 PM To 07 PM', wt: 'lbl6pmto7pmWt', total: 'lbl6pmto7pmTWt' },
      { label: '07 PM To 08 PM', wt: 'lbl7pmto8pmWt', total: 'lbl7pmto8pmTWt' },
      { label: '08 PM To 09 PM', wt: 'lbl8pmto9pmWt', total: 'lbl8pmto9pmTWt' },
      { label: '09 PM To 10 PM', wt: 'lbl9pmto10pmWt', total: 'lbl9pmto10pmTWt' }
    ],
    C: [
      { label: '10 PM To 11 PM', wt: 'lbl10pmto11pmWt', total: 'lbl10pmto11pmTWt' },
      { label: '11 PM To 12 PM', wt: 'lbl11pmto12pmWt', total: 'lbl11pmto12pmTWt' },
      { label: '12 AM To 01 AM', wt: 'lbl12amto1amWt', total: 'lbl12amto1amTWt' },
      { label: '01 AM To 02 AM', wt: 'lbl1amto2amWt', total: 'lbl1amto2amTWt' },
      { label: '02 AM To 03 AM', wt: 'lbl2amto3amWt', total: 'lbl2amto3amTWt' },
      { label: '03 AM To 04 AM', wt: 'lbl3amto4amWt', total: 'lbl3amto4amTWt' },
      { label: '04 AM To 05 AM', wt: 'lbl4amto5amWt', total: 'lbl4amto5amTWt' },
      { label: '05 AM To 06 AM', wt: 'lbl5amto6amWt', total: 'lbl5amto6amTWt' }
    ]
  }), []);

  const val = (key, fallback = '0') => {
    const v = report?.[key];
    if (v === null || v === undefined || v === '') return fallback;
    return String(v);
  };

  const unitOptions = useMemo(() => factories, [factories]);

  return (
    <div className="crushing-page">
      <Toaster position="top-right" />

      <div className="page-card crushing-card">
        <div className="page-card-header crushing-header">CRUSHING REPORT</div>

        <div className="page-card-body">
          <div className="crushing-section-title">YARD POSITIONS</div>

          <div className="crushing-filter-row">
            <div className="form-group">
              <label>Factory</label>
              <select
                className="form-control"
                value={filters.unit}
                onChange={(e) => {
                  const nextUnit = e.target.value;
                  setFilters((prev) => ({ ...prev, unit: nextUnit }));
                  if (nextUnit) {
                    fetchLatestDate(nextUnit).then((latest) => {
                      if (latest) {
                        setFilters((prev) => ({ ...prev, date: latest }));
                        loadFactoryData({ unit: nextUnit, date: latest });
                      } else {
                        toast.error('No crushing data found for this factory');
                        loadFactoryData({ unit: nextUnit, date: filters.date });
                      }
                    });
                  }
                }}
              >
                <option value="">-- Select Factory --</option>
                {unitOptions.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="text"
                className="form-control"
                value={filters.date}
                placeholder="dd/mm/yyyy"
                onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="form-group crushing-crop">
              <label>Crop Days</label>
              <input type="text" className="form-control" value={filters.cropDays || val('lblcrop', '')} readOnly />
            </div>

            <button className="btn btn-primary crushing-refresh" onClick={refreshModewise} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>

            <div className="crushing-status">
              {status.ok && (
                <div className="crushing-status-item ok">
                  <span className="bulb" />
                  <span>{status.remark || 'Online'}</span>
                </div>
              )}
              {status.bad && (
                <div className="crushing-status-item bad">
                  <span className="bulb" />
                  <span>{status.remark || 'Offline'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="table-wrapper crushing-table-wrap">
            <table className="crushing-table">
              <thead>
                <tr>
                  <th className="crushing-head-left"></th>
                  <th colSpan="2" className="crushing-head">Out Yard</th>
                  <th colSpan="2" className="crushing-head">At Donga</th>
                  <th colSpan="3" className="crushing-head">On Date Crushed</th>
                  <th colSpan="3" className="crushing-head">Todate Crushed</th>
                </tr>
                <tr>
                  <th className="crushing-subhead"> </th>
                  <th className="crushing-subhead">Nos</th>
                  <th className="crushing-subhead">Weight(Q)</th>
                  <th className="crushing-subhead">Nos</th>
                  <th className="crushing-subhead">Weight(Q)</th>
                  <th className="crushing-subhead">Nos</th>
                  <th className="crushing-subhead">Weight(Q)</th>
                  <th className="crushing-subhead">Avg(Q)</th>
                  <th className="crushing-subhead">Nos</th>
                  <th className="crushing-subhead">Weight(Q)</th>
                  <th className="crushing-subhead">Avg(Q)</th>
                </tr>
              </thead>
              <tbody>
                {yardRows.map((row) => (
                  <tr key={row.key}>
                    <td className="crushing-mode">{row.label}</td>
                    <td>{val(`lbl${row.key}OYNos`)}</td>
                    <td>{val(`lbl${row.key}OYWt`, '0.00')}</td>
                    <td>{val(`lbl${row.key}AtDNos`)}</td>
                    <td>{val(`lbl${row.key}AtDWt`, '0.00')}</td>
                    <td>{val(`lbl${row.key}ODCNos`)}</td>
                    <td>{val(`lbl${row.key}ODCWt`, '0.00')}</td>
                    <td>{val(`lbl${row.key}ODCAvg`, '0.00')}</td>
                    <td>{val(`lbl${row.key}TDCNos`)}</td>
                    <td>{val(`lbl${row.key}TDCWt`, '0.00')}</td>
                    <td>{val(`lbl${row.key}TDCAvg`, '0.00')}</td>
                  </tr>
                ))}
                <tr className="crushing-total">
                  <td>Gate Total</td>
                  <td>{val('lblGateOYNos')}</td>
                  <td>{val('lblGateOYWt', '0.00')}</td>
                  <td>{val('lblGateAtDNos')}</td>
                  <td>{val('lblGateAtDWt', '0.00')}</td>
                  <td>{val('lblGateODCNos')}</td>
                  <td>{val('lblGateODCWt', '0.00')}</td>
                  <td>{val('lblGateODCAvg', '0.00')}</td>
                  <td>{val('lblGateTDCNos')}</td>
                  <td>{val('lblGateTDCWt', '0.00')}</td>
                  <td>{val('lblGateTDCAvg', '0.00')}</td>
                </tr>
                <tr className="crushing-total">
                  <td>Center</td>
                  <td>{val('lblCenterOYNos')}</td>
                  <td>{val('lblCenterOYWt', '0.00')}</td>
                  <td>{val('lblCenterAtDNos')}</td>
                  <td>{val('lblCenterAtDWt', '0.00')}</td>
                  <td>{val('lblCenterODCNos')}</td>
                  <td>{val('lblCenterODCWt', '0.00')}</td>
                  <td>{val('lblCenterODCAvg', '0.00')}</td>
                  <td>{val('lblCenterTDCNos')}</td>
                  <td>{val('lblCenterTDCWt', '0.00')}</td>
                  <td>{val('lblCenterTDCAvg', '0.00')}</td>
                </tr>
                <tr className="crushing-grand">
                  <td>Gate + Center</td>
                  <td>{val('lblGtCenOYNos')}</td>
                  <td>{val('lblGtCenOYWt', '0.00')}</td>
                  <td>{val('lblGtCenAtDNos')}</td>
                  <td>{val('lblGtCenAtDWt', '0.00')}</td>
                  <td>{val('lblGtCenODCNos')}</td>
                  <td>{val('lblGtCenODCWt', '0.00')}</td>
                  <td>{val('lblGtCenODCAvg', '0.00')}</td>
                  <td>{val('lblGtCenTDCNos')}</td>
                  <td>{val('lblGtCenTDCWt', '0.00')}</td>
                  <td>{val('lblGtCenTDCAvg', '0.00')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="crushing-shifts">
            {['A', 'B', 'C'].map((shiftKey) => (
              <table className="crushing-shift-table" key={shiftKey}>
                <thead>
                  <tr>
                    <th>{`Shift ${shiftKey}`}</th>
                    <th>Weight(Q)</th>
                    <th>Total Wt(Q)</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts[shiftKey].map((row) => (
                    <tr key={row.label}>
                      <td className="crushing-shift-time">{row.label}</td>
                      <td>{val(row.wt, '0.00')}</td>
                      <td>{val(row.total, '0.00')}</td>
                    </tr>
                  ))}
                  <tr className="crushing-shift-total">
                    <td>{`SHIFT-${shiftKey} TOTAL`}</td>
                    <td>{val(`lbl${shiftKey}total`, '0.00')}</td>
                    <td>{val(`lbl${shiftKey}total`, '0.00')}</td>
                  </tr>
                </tbody>
              </table>
            ))}
          </div>

          <div className="crushing-summary">
            <table className="crushing-summary-table">
              <tbody>
                <tr>
                  <td className="summary-head">CANE PURCHASING</td>
                  <td className="summary-subhead">YESTERDAY</td>
                  <td className="summary-subhead">TODAY</td>
                  <td className="summary-head">CENTER OPERATED</td>
                  <td>{val('lblopr', '0.00')}</td>
                  <td className="summary-head">TRUCK IN TRANSIT YESTERDAY</td>
                  <td>{val('lbltransitwtyesterday', '0.00')}</td>
                  <td className="summary-head">CRUSH RATE PER HR.</td>
                  <td>{val('lblcrushrate', '0.00')}</td>
                </tr>
                <tr>
                  <td className="summary-head">06 AM TO 06 PM</td>
                  <td>{val('lblYes6AMto6PMWT', '0.00')}</td>
                  <td>{val('lblToday6AMto6PMWT', '0.00')}</td>
                  <td className="summary-head">PURCHASE AT CENTER</td>
                  <td>{val('lblCenPur', '0.00')}</td>
                  <td className="summary-head">TRUCK IN TRANSIT TODAY</td>
                  <td>{val('lblTRANSTODAY', '0.00')}</td>
                  <td className="summary-head">EXPECTED CRUSH</td>
                  <td>{val('lblExp', '0.00')}</td>
                </tr>
                <tr>
                  <td className="summary-head">06 PM TO 06 AM</td>
                  <td>{val('lblYes6PMto6AMWT', '0.00')}</td>
                  <td>{val('lblToday6PMto6AMWT', '0.00')}</td>
                  <td className="summary-head">TRUCK DISPATCHED</td>
                  <td>{val('lblTruckDisp', '0.00')}</td>
                  <td className="summary-head">YARD+DONGA</td>
                  <td>{val('lbltyarddobga', '0.00')}</td>
                  <td className="summary-head">AVAILABLE CANE FOR NEXT HOUR</td>
                  <td>{val('lblNHour', '0.00')}</td>
                </tr>
                <tr>
                  <td className="summary-total">TOTAL</td>
                  <td className="summary-total">{val('lblYESToT', '0.00')}</td>
                  <td className="summary-total">{val('lblToDToT', '0.00')}</td>
                  <td className="summary-total">TRUCK RECEIVED</td>
                  <td className="summary-total">{val('lblTruckRecv', '0.00')}</td>
                  <td className="summary-total">YARD+DONGA+TRANSIT</td>
                  <td className="summary-total">{val('lblYDTWEIGHT', '0.00')}</td>
                  <td className="summary-total">CAPACITY UTILISATION TODAY/TODATE</td>
                  <td className="summary-total">{val('Label51', '')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="crushing-actions">
          <button className="btn btn-primary" onClick={() => toast.info('Excel Export...')}>Excel</button>
          <button className="btn btn-primary" onClick={() => window.print()}>Print</button>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Exit</button>
        </div>
      </div>
    </div>
  );
};

export default Report_CrushingReport;
