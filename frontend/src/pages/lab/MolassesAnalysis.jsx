import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { labService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';
import '../../styles/MolassesAnalysis.css';

const SECTIONS = [
  { title: 'A Heavy', prefix: 'AH' },
  { title: 'A Light', prefix: 'AL' },
  { title: 'A1', prefix: 'A1' },
  { title: 'B Heavy', prefix: 'BH' },
  { title: 'C Light', prefix: 'CL' },
  { title: 'C1 Heavy', prefix: 'CH' },
  { title: 'Melt', prefix: 'MELT' },
  { title: 'Final', prefix: 'FM' }
];

const toDDMMYYYY = (dateObj) => {
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const normalizeDateInput = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(raw)) return raw.replace(/-/g, '/');
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [yyyy, mm, dd] = raw.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
  return raw;
};

const toTimeOptions = () => {
  const out = [];
  for (let h = 1; h <= 24; h += 1) {
    const from = (h - 1) % 24;
    const to = h % 24;
    const from12 = ((from + 11) % 12) + 1;
    const to12 = ((to + 11) % 12) + 1;
    const fm = from < 12 ? 'AM' : 'PM';
    const tm = to < 12 ? 'AM' : 'PM';
    out.push({ value: String(h), label: `${String(from12).padStart(2, '0')}${fm}-${String(to12).padStart(2, '0')}${tm}` });
  }
  return out;
};

const calcPurity = (bx, pol) => {
  const b = parseFloat(bx || 0);
  const p = parseFloat(pol || 0);
  if (!Number.isFinite(b) || !Number.isFinite(p) || b <= 0) return '0.00';
  return ((p / b) * 100).toFixed(2);
};

const initialData = () => {
  const base = {
    FACTORY: '',
    DDATE: toDDMMYYYY(new Date()),
    TIME: '1',
    LOCATION_CODE: 'P1'
  };
  SECTIONS.forEach((s) => {
    base[`${s.prefix}_BX`] = '0.00';
    base[`${s.prefix}_POL`] = '0.00';
    base[`${s.prefix}_PY`] = '0.00';
  });
  return base;
};

const MolassesAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const editFactory = params.get('FACTORY') || params.get('FACT') || '';
  const editDate = params.get('DDATE') || params.get('DATE') || '';
  const editTime = params.get('TIME') || params.get('HOUR') || '';
  const editLocation = params.get('LOCATION') || params.get('LOCATION_CODE') || 'P1';

  const [formData, setFormData] = useState(initialData);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const timeOptions = useMemo(() => toTimeOptions(), []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const unitList = await masterService.getUnits();
        if (!mounted) return;
        const list = Array.isArray(unitList) ? unitList : [];
        setUnits(list);
        if (!editFactory && list.length) {
          setFormData((prev) => ({
            ...prev,
            FACTORY: String(list[0]?.f_Code ?? list[0]?.F_Code ?? list[0]?.id ?? '')
          }));
        }

        if (editFactory && editDate && editTime) {
          setIsEdit(true);
          setLoading(true);
          const rows = await labService.getMolassesAnalysisById({
            FACTORY: editFactory,
            DDATE: editDate,
            TIME: editTime,
            LOCATION: editLocation
          });
          const row = Array.isArray(rows) && rows.length ? rows[0] : null;
          if (row && mounted) {
            setFormData((prev) => ({
              ...prev,
              ...row,
              FACTORY: String(row?.FACTORY ?? editFactory),
              DDATE: normalizeDateInput(row?.DDATE ?? editDate),
              TIME: String(row?.TIME ?? editTime),
              LOCATION_CODE: String(row?.LOCATION_CODE ?? editLocation ?? 'P1')
            }));
          }
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [editFactory, editDate, editTime, editLocation]);

  const handleField = (name, value) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name.endsWith('_BX') || name.endsWith('_POL')) {
        const prefix = name.split('_')[0];
        next[`${prefix}_PY`] = calcPurity(next[`${prefix}_BX`], next[`${prefix}_POL`]);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!formData.FACTORY) {
      toast.error('Please select factory');
      return;
    }
    if (!normalizeDateInput(formData.DDATE) || !formData.TIME) {
      toast.error('Date and time are required');
      return;
    }
    setLoading(true);
    try {
      await labService.saveMolassesAnalysis({
        ...formData,
        FACTORY: String(formData.FACTORY),
        DDATE: normalizeDateInput(formData.DDATE),
        TIME: String(formData.TIME),
        LOCATION_CODE: String(formData.LOCATION_CODE || 'P1'),
        id: isEdit ? 'btupdate' : 'btninsert'
      });
      toast.success(isEdit ? 'Record updated' : 'Record saved');
      if (!isEdit) {
        setFormData((prev) => ({ ...initialData(), FACTORY: prev.FACTORY }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      await labService.deleteMolassesAnalysis({
        FACTORY: formData.FACTORY,
        DDATE: normalizeDateInput(formData.DDATE),
        TIME: formData.TIME,
        LOCATION_CODE: formData.LOCATION_CODE || 'P1'
      });
      toast.success('Record deleted');
      navigate('/Lab/MolassesAnalysisView');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mola-page">
      <Toaster position="top-right" />
      <div className="page-card">
        <div className="page-card-header mola-header">MOLASSES ANALYSIS</div>
        <div className="page-card-body">
          <div className="mola-panel">
            <div className="mola-panel-title">MOLASSES ANALYSIS</div>
            <div className="mola-panel-body">
              <div className="mola-meta-grid">
                <div className="form-group">
                  <label>Factory</label>
                  <select className="form-control" value={formData.FACTORY} onChange={(e) => handleField('FACTORY', e.target.value)}>
                    <option value="">Select Factory</option>
                    {units.map((u, idx) => {
                      const code = u?.f_Code ?? u?.F_Code ?? u?.id ?? '';
                      const name = u?.F_Name ?? u?.f_Name ?? u?.name ?? `Unit ${idx + 1}`;
                      return (
                        <option key={`${String(code)}-${idx}`} value={code}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input className="form-control" type="text" value={formData.DDATE} onChange={(e) => handleField('DDATE', e.target.value)} placeholder="DD/MM/YYYY" />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <select className="form-control" value={String(formData.TIME)} onChange={(e) => handleField('TIME', e.target.value)}>
                    {timeOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mola-cards-grid">
            {SECTIONS.map((s) => (
              <div className="mola-card" key={s.prefix}>
                <div className="mola-card-title">{s.title}</div>
                <div className="mola-card-body">
                  <div className="mola-three">
                    <div className="form-group">
                      <label>Brix</label>
                      <input className="form-control" type="number" step="0.01" min="0" value={formData[`${s.prefix}_BX`]} onChange={(e) => handleField(`${s.prefix}_BX`, e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>POL</label>
                      <input className="form-control" type="number" step="0.01" min="0" value={formData[`${s.prefix}_POL`]} onChange={(e) => handleField(`${s.prefix}_POL`, e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Purity</label>
                      <input className="form-control" type="text" value={formData[`${s.prefix}_PY`]} readOnly />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mola-actions">
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Please wait...' : isEdit ? 'Update' : 'Save'}
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/Lab/MolassesAnalysisView')}>View</button>
            {isEdit ? <button className="btn btn-primary" onClick={handleDelete} disabled={loading}>Delete</button> : null}
            <button className="btn btn-primary" onClick={() => navigate('/Lab/MolassesAnalysisView')}>Exit</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MolassesAnalysis;



