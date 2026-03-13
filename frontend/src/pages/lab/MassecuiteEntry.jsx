import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Save, LogOut } from 'lucide-react';
import { labService, masterService } from '../../microservices/api.service';
import './MassecuiteEntry.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");const toIsoDateInput = (value) => {const raw = String(value || '').trim();if (!raw) return '';if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(raw)) {const [dd, mm, yyyy] = raw.replace(/-/g, '/').split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  return raw;
};

const toDDMMYYYY = (dateObj) => {
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const toDisplayDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(raw)) return raw.replace(/-/g, '/');
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [yyyy, mm, dd] = raw.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
  return raw;
};

const to24HourOptions = () => {
  const options = [];
  for (let hour = 1; hour <= 24; hour += 1) {
    const from = (hour - 1) % 24;
    const to = hour % 24;
    const from12 = (from + 11) % 12 + 1;
    const to12 = (to + 11) % 12 + 1;
    const fromMeridiem = from < 12 ? 'AM' : 'PM';
    const toMeridiem = to < 12 ? 'AM' : 'PM';
    const label = `${String(from12).padStart(2, '0')}${fromMeridiem}-${String(to12).padStart(2, '0')}${toMeridiem}`;
    options.push({ value: String(hour), label });
  }
  return options;
};

const MassecuiteEntry = ({ type, title }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const isAType = String(type || '').toUpperCase() === 'A';
  const hourOptions = to24HourOptions();

  const initialFormState = {
    FACTORY: '',
    DDATE: isAType ? toDDMMYYYY(new Date()) : new Date().toISOString().split('T')[0],
    HOUR: '',
    STRIKE_NO: '',
    PAN_NO: '1',
    START_AT: '0',
    DROP_AT: '0',
    DROP_BY: '0',
    CRYST_NO: '0',
    ANAL_BX: '0',
    ANAL_POL: '0',
    ANAL_PY: '0',
    QTY: '0',
    LOCATION_CODE: ''
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => {});
    const slno = searchParams.get('SLNO');
    if (slno) {
      const factory = searchParams.get('FACTORY') || '';
      const date = searchParams.get('DDATE') || '';
      const location = searchParams.get('DIVN') || searchParams.get('LOCATION_CODE') || '';
      setIsEditMode(true);
      setLoading(true);
      labService.getMassecuite({
        type,
        SLNO: slno,
        FACTORY: factory,
        DDATE: date,
        DIVN: location,
        LOCATION_CODE: location
      }).
      then((d) => {
        if (d && d.length > 0) {
          const row = d[0];
          setForm((prev) => ({
            ...prev,
            ...row,
            DDATE: isAType ? toDisplayDate(row?.DDATE) : toIsoDateInput(row?.DDATE),
            LOCATION_CODE: row?.LOCATION_CODE ?? location ?? ''
          }));
        }
      }).
      catch(() => toast.error("Failed to load record")).
      finally(() => setLoading(false));
    }
  }, [searchParams, type, isAType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const newForm = { ...prev, [name]: value };
      if (name === 'ANAL_BX' || name === 'ANAL_POL') {
        const brix = parseFloat(name === 'ANAL_BX' ? value : prev.ANAL_BX) || 0;
        const pol = parseFloat(name === 'ANAL_POL' ? value : prev.ANAL_POL) || 0;
        newForm.ANAL_PY = brix > 0 ? (pol / brix * 100).toFixed(2) : '0';
      }
      return newForm;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode) {
        await labService.updateMassecuite(type, form.SLNO, form);
        toast.success('Record updated');
      } else {
        await labService.saveMassecuite(type, form);
        toast.success('Record saved');
      }
      navigate(`/Lab/${type}MassecuiteView`);
    } catch (error) {
      toast.error(error.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  const headerStyle = "bg-[#008080] text-white py-[12px] px-[20px] text-[18px] font-medium rounded-[8px 8px 0 0] mb-[1px]";









  const cardStyle = "p-[30px] border border-[#e0e0e0] rounded-[0 0 8px 8px] bg-white shadow-[0 2px 4px rgba(0,0,0,0.05)] mb-[20px]";








  const sectionHeaderStyle = "text-[13px] text-[#666] border-b border-b-[#ddd] pb-[10px] mb-[20px] font-medium";








  const labelStyle = "block mb-[8px] text-[13px] font-semibold text-[#333]";







  const inputStyle = "w-[100%] py-[10px] px-[12px] border border-[#ccc] rounded text-[13px] bg-white  ";










  const btnStyle = (bg = '#16a085') => ({
    padding: '12px 30px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'white',
    backgroundColor: bg,
    transition: 'background-color 0.2s'
  });

  const hasLocation = ['B', 'C', 'C1', 'R1', 'R2'].includes(type);

  if (isAType) {
    return (
      <div className="amass-page">
                <Toaster position="top-right" />
                <div className="amass-card page-card">
                    <div className="amass-title-bar">A MASSECUITE</div>
                    <div className="amass-body">
                        <form onSubmit={handleSubmit} className="amass-form-panel">
                            <div className="amass-panel-heading">A MASSECUITE</div>

                            <div className="amass-grid amass-grid-3">
                                <div className="amass-field">
                                    <label>Factory</label>
                                    <select name="FACTORY" value={form.FACTORY} onChange={handleInputChange} required>
                                        <option value="">Select Unit</option>
                                        {units.map((u, idx) =>
                    <option key={`${u.f_Code || u.F_CODE || u.id}-${idx}`} value={u.f_Code || u.F_CODE || u.id}>
                                                {u.F_Name || u.F_NAME || u.name}
                                            </option>
                    )}
                                    </select>
                                </div>
                                <div className="amass-field">
                                    <label>Date</label>
                                    <input type="text" name="DDATE" value={form.DDATE} onChange={handleInputChange} placeholder="DD/MM/YYYY" required />
                                </div>
                                <div className="amass-field">
                                    <label>Time</label>
                                    <select name="HOUR" value={String(form.HOUR || '')} onChange={handleInputChange} required>
                                        <option value="">Select Time</option>
                                        {hourOptions.map((opt) =>
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                    )}
                                    </select>
                                </div>
                            </div>

                            <div className="amass-grid amass-grid-5">
                                <div className="amass-field">
                                    <label>Strike No.</label>
                                    <input type="text" name="STRIKE_NO" value={form.STRIKE_NO} onChange={handleInputChange} />
                                </div>
                                <div className="amass-field">
                                    <label>Analysis Bx</label>
                                    <input type="number" step="0.01" name="ANAL_BX" value={form.ANAL_BX} onChange={handleInputChange} />
                                </div>
                                <div className="amass-field">
                                    <label>Analysis Pol</label>
                                    <input type="number" step="0.01" name="ANAL_POL" value={form.ANAL_POL} onChange={handleInputChange} />
                                </div>
                                <div className="amass-field">
                                    <label>Analysis Pty</label>
                                    <input type="text" name="ANAL_PY" value={form.ANAL_PY} readOnly />
                                </div>
                                <div className="amass-field">
                                    <label>Volume</label>
                                    <input type="number" step="0.01" name="QTY" value={form.QTY} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="amass-actions">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    <Save size={16} /> {loading ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
                                </button>
                                <button type="button" className="btn btn-primary" onClick={() => navigate('/Lab/AMassecuiteView')}>
                                    View
                                </button>
                                <button type="button" className="btn btn-primary" onClick={() => navigate('/Lab/AMassecuiteView')}>
                                    <LogOut size={16} /> Exit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>);

  }

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Inter', sans-serif]">
            <Toaster position="top-right" />

            <div className={headerStyle}>
                {isEditMode ? `Edit ${title}` : title}
            </div>

            <div className={cardStyle}>
                <form onSubmit={handleSubmit}>
                    <div className={sectionHeaderStyle}>{title} Details</div>

                    <div className="grid gap-[20px] mb-[30px]">
                        <div>
                            <label className={labelStyle}>Factory Unit</label>
                            <select name="FACTORY" value={form.FACTORY} onChange={handleInputChange} required className={inputStyle}>
                                <option value="">Select Unit</option>
                                {units.map((u, idx) =>
                <option key={`${u.f_Code || u.F_CODE || u.id}-${idx}`} value={u.f_Code || u.F_CODE || u.id}>
                                        {u.F_Name || u.F_NAME || u.name}
                                    </option>
                )}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Entry Date</label>
                            <input type="date" name="DDATE" value={form.DDATE} onChange={handleInputChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Sampling Time</label>
                            <input type="time" name="HOUR" value={form.HOUR} onChange={handleInputChange} required className={inputStyle} />
                        </div>
                    </div>

                    <div className="grid gap-[20px] mb-[30px]">
                        <div>
                            <label className={labelStyle}>Strike No</label>
                            <input type="text" name="STRIKE_NO" value={form.STRIKE_NO} onChange={handleInputChange} className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Pan No</label>
                            <input type="number" name="PAN_NO" value={form.PAN_NO} onChange={handleInputChange} className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Cryst No</label>
                            <input type="number" name="CRYST_NO" value={form.CRYST_NO} onChange={handleInputChange} className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Quantity (Cu.M)</label>
                            <input type="number" step="0.01" name="QTY" value={form.QTY} onChange={handleInputChange} className={inputStyle} />
                        </div>
                        {hasLocation &&
            <div className="">
                                <label className={labelStyle}>Location / Crystallizer</label>
                                <input type="text" name="LOCATION_CODE" value={form.LOCATION_CODE} onChange={handleInputChange} required className={inputStyle} />
                            </div>
            }
                    </div>

                    <div className="grid gap-[20px] mb-[40px] bg-[#f9f9f9] p-[20px] rounded-lg">
                        <div>
                            <label className={labelStyle}>Brix %</label>
                            <input type="number" step="0.01" name="ANAL_BX" value={form.ANAL_BX} onChange={handleInputChange} className={__cx(inputStyle, "text-center text-4 font-medium")} />
                        </div>
                        <div>
                            <label className={labelStyle}>Pol %</label>
                            <input type="number" step="0.01" name="ANAL_POL" value={form.ANAL_POL} onChange={handleInputChange} className={__cx(inputStyle, "text-center text-4 font-medium")} />
                        </div>
                        <div>
                            <label className={labelStyle}>Calculated Purity %</label>
                            <div className={__cx(inputStyle, "text-center text-[18px] font-bold text-[#008080] border border-[#008080] bg-white flex items-center justify-center")}>
                                {form.ANAL_PY}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-[15px]">
                        <button type="submit" disabled={loading} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            <Save size={18} /> {loading ? 'Saving...' : isEditMode ? 'Update' : 'Save Record'}
                        </button>
                        <button type="button" onClick={() => navigate(`/Lab/${type}MassecuiteView`)} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#95a5a6]">
                            <LogOut size={18} /> Exit
                        </button>
                    </div>
                </form>
            </div>
        </div>);

};

export default MassecuiteEntry;