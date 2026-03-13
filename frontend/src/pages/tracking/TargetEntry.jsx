import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, trackingService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const TARGET_TYPES = [
{ value: '0', label: 'None' },
{ value: '1', label: 'Cane Sowing' },
{ value: '2', label: 'Variety Replacement' },
{ value: '3', label: 'Soil Treatment' }];


const Tracking_TargetEntry = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('0');
  const [targetType, setTargetType] = useState('0');

  const [areaSettings, setAreaSettings] = useState({ big: false, marginal: false, small: false, all: true });
  const [supplierSettings, setSupplierSettings] = useState({ supplier: false, nonSupplier: false, surveyed: false, all: true });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [targetPercent, setTargetPercent] = useState('0');
  const [applyAll, setApplyAll] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => setUnits([]));
  }, []);

  const loadOfficers = async (unit) => {
    if (!unit) {
      setOfficers([]);
      setSelectedOfficer('0');
      return;
    }
    try {
      const res = await trackingService.getUnitOfficers({ unit });
      const list = Array.isArray(res?.data) ? res.data : [];
      setOfficers(list);
      setSelectedOfficer('0');
    } catch {
      setOfficers([]);
      setSelectedOfficer('0');
      toast.error('Failed to load officers.');
    }
  };

  const onUnitChange = (value) => {
    setSelectedUnit(value);
    setRows([]);
    loadOfficers(value);
  };

  const setAreaValue = (key) => {
    if (key === 'all') {
      const val = !areaSettings.all;
      setAreaSettings({ big: val, marginal: val, small: val, all: val });
      return;
    }
    const next = { ...areaSettings, [key]: !areaSettings[key] };
    next.all = next.big && next.marginal && next.small;
    setAreaSettings(next);
  };

  const setSupplierValue = (key) => {
    if (key === 'all') {
      const val = !supplierSettings.all;
      setSupplierSettings({ supplier: val, nonSupplier: val, surveyed: val, all: val });
      return;
    }
    const next = { ...supplierSettings, [key]: !supplierSettings[key] };
    next.all = next.supplier && next.nonSupplier && next.surveyed;
    setSupplierSettings(next);
  };

  const areaConts = useMemo(() => {
    const parts = [];
    if (!areaSettings.all) {
      if (areaSettings.big) parts.push('big');
      if (areaSettings.marginal) parts.push('marginal');
      if (areaSettings.small) parts.push('small');
    }
    return parts.join(',');
  }, [areaSettings]);

  const supplierConts = useMemo(() => {
    const parts = [];
    if (!supplierSettings.all) {
      if (supplierSettings.supplier) parts.push('supplier');
      if (supplierSettings.nonSupplier) parts.push('nonSupplier');
      if (supplierSettings.surveyed) parts.push('surveyed');
    }
    return parts.join(',');
  }, [supplierSettings]);

  const handleSearch = async () => {
    if (!selectedUnit) {
      toast.error('Please select unit.');
      return;
    }
    setLoading(true);
    try {
      const res = await trackingService.getTargetEntryData({
        unit: selectedUnit,
        officer: selectedOfficer,
        targetType,
        area: areaConts,
        supplier: supplierConts
      });
      const data = Array.isArray(res?.data) ? res.data : [];
      const mapped = data.map((r) => ({
        officer_code: Number(r.officer_code || r.cdo_code || 0),
        officer_name: String(r.officer_name || r.cdo_name || ''),
        cdo_code: Number(r.cdo_code || r.officer_code || 0),
        village_code: Number(r.village_code || r.v_code || 0),
        total_grower: Number(r.total_grower || r.totalgrower || 0),
        target_grower: Number(r.target_grower || r.totaltargetgrower || 0),
        target_percent: Number(r.target_percent || r.target || 0)
      }));
      setRows(mapped);
      if (!mapped.length) toast.error('No Record Available');
    } catch {
      setRows([]);
      toast.error('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const updateRowPercent = (index, percentValue) => {
    const p = Number(percentValue || 0);
    setRows((prev) => prev.map((r, i) =>
    i === index ?
    {
      ...r,
      target_percent: p,
      target_grower: Math.round(Number(r.total_grower || 0) * p / 100)
    } :
    r
    ));
  };

  const applyPercentToAll = (checked) => {
    setApplyAll(checked);
    if (!checked) return;
    const p = Number(targetPercent || 0);
    setRows((prev) => prev.map((r) => ({
      ...r,
      target_percent: p,
      target_grower: Math.round(Number(r.total_grower || 0) * p / 100)
    })));
  };

  const handleSave = async () => {
    if (!selectedUnit || rows.length === 0) {
      toast.error('No data to save.');
      return;
    }
    setSaveLoading(true);
    try {
      const payload = {
        unit: selectedUnit,
        targetType,
        area: areaConts,
        supplier: supplierConts,
        entries: rows
      };
      const res = await trackingService.saveTargets(payload);
      toast.success(res?.message || 'Targets saved successfully.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save targets.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
      <Toaster position="top-right" />

      <div className={__cx("page-card", "rounded-lg")}>
        <div className={__cx("page-card-header", "text-center text-[15px]")}>
          Target Entry Set Up
        </div>

        <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
          <div className={__cx("form-grid-3", "mb-[10px]")}>
            <div className="form-group">
              <label>Units</label>
              <select className="form-control" value={selectedUnit} onChange={(e) => onUnitChange(e.target.value)}>
                <option value="">All</option>
                {units.map((u, idx) =>
                <option key={`${u.F_Code || u.f_Code || u.id}-${idx}`} value={u.F_Code || u.f_Code || u.id}>
                    {u.F_Name || u.F_NAME || u.name}
                  </option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Officer</label>
              <select
                className="form-control"
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                disabled={!selectedUnit}>
                
                <option value="0">All</option>
                {officers.map((o) =>
                <option key={o.cdo_code} value={o.cdo_code}>
                    {o.cdo_name}
                  </option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Target Type</label>
              <select className="form-control" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
                {TARGET_TYPES.map((t) =>
                <option key={t.value} value={t.value}>{t.label}</option>
                )}
              </select>
            </div>
          </div>

          <div className={__cx("form-grid-2", "gap-[16px]")}>
            <div className={__cx("page-card", "mb-[0px]")}>
              <div className={__cx("page-card-body", "p-[0px]")}>
                <div className="py-[12px] px-[16px] border-b border-b-[#ddd] text-[15px]">Cla CriteArea Setting</div>
                <div className="py-[12px] px-[16px] grid gap-[12px]">
                  <label><input type="checkbox" checked={areaSettings.big} onChange={() => setAreaValue('big')} />Big</label>
                  <label><input type="checkbox" checked={areaSettings.marginal} onChange={() => setAreaValue('marginal')} />Marginal</label>
                  <label><input type="checkbox" checked={areaSettings.small} onChange={() => setAreaValue('small')} />Small</label>
                  <label><input type="checkbox" checked={areaSettings.all} onChange={() => setAreaValue('all')} />All</label>
                </div>
              </div>
            </div>

            <div className={__cx("page-card", "mb-[0px]")}>
              <div className={__cx("page-card-body", "p-[0px]")}>
                <div className="py-[12px] px-[16px] border-b border-b-[#ddd] text-[15px]">Supplier Surveyed Setting</div>
                <div className="py-[12px] px-[16px] grid gap-[12px]">
                  <label><input type="checkbox" checked={supplierSettings.supplier} onChange={() => setSupplierValue('supplier')} />Supplier</label>
                  <label><input type="checkbox" checked={supplierSettings.nonSupplier} onChange={() => setSupplierValue('nonSupplier')} />Non Supplier</label>
                  <label><input type="checkbox" checked={supplierSettings.surveyed} onChange={() => setSupplierValue('surveyed')} />Surveyed</label>
                  <label><input type="checkbox" checked={supplierSettings.all} onChange={() => setSupplierValue('all')} />All</label>
                </div>
              </div>
            </div>
          </div>

          <div className={__cx("form-actions", "border-t-0 mt-[10px] pt-[0]")}>
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>Exit</button>
          </div>

          {rows.length > 0 &&
          <div className={__cx("page-card", "mt-[12px] mb-[0px]")}>
              <div className={__cx("page-card-body", "py-[12px] px-[16px]")}>
                <div className="flex justify-end gap-[14px] mb-[10px]">
                  <div className={__cx("form-group", "max-w-[120px] min-w-[120px]")}>
                    <label>Target Percent</label>
                    <input type="number" className="form-control" value={targetPercent} onChange={(e) => setTargetPercent(e.target.value)} />
                  </div>
                  <div className={__cx("form-group", "max-w-[110px] min-w-[110px]")}>
                    <label>Apply All</label>
                    <input type="checkbox" checked={applyAll} onChange={(e) => applyPercentToAll(e.target.checked)} className="w-[20px] h-[20px] mt-[8px]" />
                  </div>
                </div>

                <div className={__cx("table-wrapper", "max-h-[45vh] overflow-y-auto")}>
                  <table className={__cx("data-table", "min-w-[1100px]")}>
                    <thead>
                      <tr>
                        <th>Officer Code</th>
                        <th>Officer Name</th>
                        <th>Total Grower</th>
                        <th>Target Grower</th>
                        <th>Target %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, index) =>
                    <tr key={`${r.officer_code}-${index}`}>
                          <td>{r.officer_code}</td>
                          <td>{r.officer_name}</td>
                          <td>{r.total_grower}</td>
                          <td>{r.target_grower}</td>
                          <td>
                            <input
                          type="number"
                          className={__cx("form-control", "max-w-[120px]")}
                          value={r.target_percent}
                          onChange={(e) => updateRowPercent(index, e.target.value)} />

                        
                          </td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>

                <div className={__cx("form-actions", "border-t-0 mt-[10px] pt-[0px] justify-end")}>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saveLoading}>
                    {saveLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>);

};

export default Tracking_TargetEntry;