import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, trackingService } from '../../microservices/api.service';
import '../../styles/base.css';
import '../../styles/TargetRpt.css';

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

const Tracking_TargetRpt = () => {
  const navigate = useNavigate();

  const [units, setUnits] = useState([]);
  const [zones, setZones] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const [filters, setFilters] = useState({
    unit: '0',
    zone: '0',
    block: '0',
    fromDate: formatDdMmYyyy(new Date()),
    toDate: formatDdMmYyyy(new Date())
  });

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const data = await masterService.getUnits();
        const normalized = (Array.isArray(data) ? data : [])
          .map(normalizeUnit)
          .filter((x) => x.code);
        setUnits(normalized);
      } catch (error) {
        toast.error('Failed to load units');
      }
    };
    loadUnits();
  }, []);

  const handleFilterChange = async (field, value) => {
    const next = { ...filters, [field]: value };
    setFilters(next);

    if (field === 'unit') {
      setFilters((prev) => ({ ...prev, unit: value, zone: '0', block: '0' }));
      setBlocks([]);
      try {
        const zoneData = await trackingService.getZones({ unit: value, factCode: value });
        setZones(Array.isArray(zoneData) ? zoneData : []);
      } catch (error) {
        setZones([]);
        toast.error('Failed to load zones');
      }
      return;
    }

    if (field === 'zone') {
      setFilters((prev) => ({ ...prev, zone: value, block: '0' }));
      if (!value || value === '0') {
        setBlocks([]);
        return;
      }
      try {
        const blockData = await trackingService.getBlocks({
          unit: filters.unit,
          factCode: filters.unit,
          zoneCode: value,
          zonecode: value
        });
        setBlocks(Array.isArray(blockData) ? blockData : []);
      } catch (error) {
        setBlocks([]);
        toast.error('Failed to load blocks');
      }
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const payload = {
        unit: filters.unit,
        zone: filters.zone,
        block: filters.block,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        starttime: filters.fromDate,
        endtime: filters.toDate
      };
      const response = await trackingService.getTargetReport(payload);
      const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setRows(data);
      if (!data.length) {
        toast.error('No data found');
      }
    } catch (error) {
      setRows([]);
      toast.error('Failed to fetch target report');
    } finally {
      setLoading(false);
    }
  };

  const unitOptions = useMemo(() => units, [units]);

  return (
    <div className="target-rpt-page">
      <Toaster position="top-right" />

      <div className="page-card">
        <div className="page-card-header target-rpt-header">Target Report</div>

        <div className="page-card-body">
          <div className="target-rpt-filter-grid">
            <div className="form-group">
              <label>Units</label>
              <select className="form-control" value={filters.unit} onChange={(e) => handleFilterChange('unit', e.target.value)}>
                <option value="0">All</option>
                {unitOptions.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Zone</label>
              <select className="form-control" value={filters.zone} onChange={(e) => handleFilterChange('zone', e.target.value)}>
                <option value="0">-Please Select-</option>
                {zones.map((z, idx) => (
                  <option key={`${z.z_code}-${idx}`} value={z.z_code}>
                    {z.z_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Block</label>
              <select className="form-control" value={filters.block} onChange={(e) => handleFilterChange('block', e.target.value)}>
                <option value="0">-Please Select-</option>
                {blocks.map((b, idx) => (
                  <option key={`${b.bl_code}-${idx}`} value={b.bl_code}>
                    {b.bl_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>From Date</label>
              <input
                type="text"
                className="form-control"
                value={filters.fromDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                placeholder="dd/mm/yyyy"
              />
            </div>

            <div className="form-group">
              <label>To Date</label>
              <input
                type="text"
                className="form-control"
                value={filters.toDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                placeholder="dd/mm/yyyy"
              />
            </div>
          </div>

          <div className="form-actions target-rpt-actions">
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              Exit
            </button>
          </div>

          <div className="table-wrapper target-rpt-table-wrap">
            <table className="data-table target-rpt-table">
              <thead>
                <tr>
                  <th>Zone Code</th>
                  <th>Zone Name</th>
                  <th>Block Code</th>
                  <th>Block Name</th>
                  <th>NOS Of Farmer</th>
                  <th>VillCode</th>
                  <th>Grower Code</th>
                  <th>Village Name</th>
                  <th>Grower Name</th>
                  <th>Officer Name</th>
                  <th>Image</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr key={`${row.srnno || idx}-${row.g_code || ''}`}>
                      <td>{row.z_code}</td>
                      <td>{row.z_name}</td>
                      <td>{row.bl_code}</td>
                      <td>{row.bl_name}</td>
                      <td>{row.nos}</td>
                      <td>{row.v_code}</td>
                      <td>{row.g_code}</td>
                      <td>{row.v_name}</td>
                      <td>{row.g_name}</td>
                      <td>{row.name}</td>
                      <td>
                        {row.TRG_IMG ? (
                          <button type="button" className="target-rpt-image-btn" onClick={() => setPreviewImage(row.TRG_IMG)}>
                            View
                          </button>
                        ) : (
                          ''
                        )}
                      </td>
                      <td>{row.TRG_REM}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="target-rpt-empty-cell"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {previewImage ? (
        <div className="target-rpt-modal-backdrop" onClick={() => setPreviewImage('')}>
          <div className="target-rpt-modal-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="target-rpt-modal-close" onClick={() => setPreviewImage('')}>
              x
            </button>
            <img src={previewImage} alt="Meeting" className="target-rpt-modal-image" />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Tracking_TargetRpt;
