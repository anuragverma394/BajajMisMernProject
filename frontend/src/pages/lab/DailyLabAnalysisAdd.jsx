import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { labService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';

const __cx = (...vals) => vals.filter(Boolean).join(" ");

const DailyLabAnalysisAdd = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const initialFormState = {
    factory: '',
    DDATE: new Date().toISOString().split('T')[0],
    TIME1: '',
    Shift1: '',
    MILL_NO: '1',
    PJ_BX: '0', PJ_POL: '0', PJ_PY: '0',
    MJ_BX: '0', MJ_POL: '0', MJ_PY: '0',
    LMJ_BX: '0', LMJ_POL: '0', LMJ_PY: '0',
    FPJU_BX: '0', FPJU_POL: '0', FPJU_PY: '0',
    FPJT_BX: '0', FPJT_POL: '0', FPJT_PY: '0',
    CJ_BX: '0', CJ_POL: '0', CJ_PY: '0',
    US_BX: '0', US_POL: '0', US_PY: '0',
    UST_BX: '0', UST_POL: '0', UST_PY: '0',
    SS_BX: '0', SS_POL: '0', SS_PY: '0',
    B_POL: '0', B_MOIS: '0', PC: '0'
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => {});

    const ddate = searchParams.get('DDATE');
    const millNo = searchParams.get('MILL_NO');
    const factoryId = searchParams.get('FACTORY');
    const time1 = searchParams.get('TIME1');

    if (ddate && millNo && factoryId && time1) {
      setIsEditMode(true);
      setLoading(true);
      labService.getDailyAnalysis({ DDATE: ddate, MILL_NO: millNo, FACTORY: factoryId, TIME1: time1 }).
      then((data) => { if (data && data.length > 0) setForm(data[0]); }).
      catch(() => toast.error("Failed to load record")).
      finally(() => setLoading(false));
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name.includes('_BX') || name.includes('_POL')) {
        const prefix = name.split('_')[0];
        const bx = parseFloat(name.includes('_BX') ? value : prev[`${prefix}_BX`]) || 0;
        const pol = parseFloat(name.includes('_POL') ? value : prev[`${prefix}_POL`]) || 0;
        next[`${prefix}_PY`] = bx > 0 ? (pol / bx * 100).toFixed(2) : '0';
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode) {
        await labService.updateDailyAnalysis(form.id, form);
        toast.success('Updated successfully');
      } else {
        await labService.saveDailyAnalysis(form);
        toast.success('Saved successfully');
      }
      navigate('/Lab/DailyLabAnalysisView');
    } catch (error) {
      toast.error('Error saving analysis');
    } finally {
      setLoading(false);
    }
  };

  const METRICS = [
    { label: 'Primary Juice', prefix: 'PJ' },
    { label: 'Mixed Juice', prefix: 'MJ' },
    { label: 'Last Mill Juice', prefix: 'LMJ' },
    { label: 'Filtered Juice (U)', prefix: 'FPJU' },
    { label: 'Filtered Juice (T)', prefix: 'FPJT' },
    { label: 'Clear Juice', prefix: 'CJ' },
    { label: 'Unsulph. Syrup', prefix: 'US' },
    { label: 'Unsulph. Syrup (T)', prefix: 'UST' },
    { label: 'Sulph. Syrup', prefix: 'SS' }
  ];

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
      <Toaster position="top-right" />

      <div className={__cx("page-card", "rounded-lg")}>
        <div className={__cx("page-card-header", "text-center text-[15px]")}>
          {isEditMode ? 'Edit Daily Lab Analysis' : 'Daily Lab Analysis Entry'}
        </div>

        <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
          <form onSubmit={handleSubmit}>
            
            <div className={__cx("section-panel", "border border-[#ddd] p-[15px] rounded mb-[20px] bg-white")}>
              <div className="text-[#d9534f] text-[13px] font-bold mb-[15px] border-b border-b-[#eee] pb-[5px]">
                General Info & Process Params
              </div>
              <div className="form-grid-4">
                <div className="form-group">
                  <label>Factory Unit</label>
                  <select name="factory" value={form.factory} onChange={handleInputChange} required className="form-control">
                    <option value="">Select Unit</option>
                    {units.map((u, idx) =>
                      <option key={`${u.f_Code || u.F_CODE || u.id}-${idx}`} value={u.f_Code || u.F_CODE || u.id}>
                        {u.F_Name || u.F_NAME || u.name}
                      </option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Entry Date</label>
                  <input type="date" name="DDATE" value={form.DDATE} onChange={handleInputChange} required className="form-control" />
                </div>
                <div className="form-group">
                  <label>Entry Time</label>
                  <input type="time" name="TIME1" value={form.TIME1} onChange={handleInputChange} required className="form-control" />
                </div>
                <div className="form-group">
                  <label>Shift</label>
                  <select name="Shift1" value={form.Shift1} onChange={handleInputChange} className="form-control">
                    <option value="">Select Shift</option>
                    <option value="A">Shift A</option>
                    <option value="B">Shift B</option>
                    <option value="C">Shift C</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mill No</label>
                  <select name="MILL_NO" value={form.MILL_NO} onChange={handleInputChange} className="form-control">
                    <option value="1">Mill 01</option>
                    <option value="2">Mill 02</option>
                    <option value="3">Mill 03</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={__cx("section-panel", "border border-[#ddd] p-[15px] rounded mb-[20px] bg-white")}>
              <div className="text-[#d9534f] text-[13px] font-bold mb-[15px] border-b border-b-[#eee] pb-[5px]">
                Juice & Syrup Analysis
              </div>
              <div className="form-grid-4 mb-[15px] bg-[#f9f9f9] py-[10px] px-[15px] rounded font-bold text-[13px]">
                <div>Metric Source</div>
                <div className="text-center">Brix %</div>
                <div className="text-center">Pol %</div>
                <div className="text-center">Purity %</div>
              </div>

              {METRICS.map((m) =>
                <div key={m.prefix} className="form-grid-4 mb-[12px] items-center">
                  <div className="text-[13px] font-medium text-[#555]">{m.label}</div>
                  <input type="number" step="0.01" name={`${m.prefix}_BX`} value={form[`${m.prefix}_BX`]} onChange={handleInputChange} className="form-control text-center" />
                  <input type="number" step="0.01" name={`${m.prefix}_POL`} value={form[`${m.prefix}_POL`]} onChange={handleInputChange} className="form-control text-center" />
                  <div className="form-control text-center bg-[#f0fdf4] border-[#bbf7d0] text-[#166534] font-bold">
                    {form[`${m.prefix}_PY`]}
                  </div>
                </div>
              )}
            </div>

            <div className={__cx("section-panel", "border border-[#ddd] p-[15px] rounded mb-[20px] bg-white")}>
              <div className="text-[#d9534f] text-[13px] font-bold mb-[15px] border-b border-b-[#eee] pb-[5px]">
                Other Metrics
              </div>
              <div className="form-grid-4">
                <div className="form-group">
                  <label>Bagasse Pol %</label>
                  <input type="number" step="0.01" name="B_POL" value={form.B_POL} onChange={handleInputChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label>Bagasse Moist %</label>
                  <input type="number" step="0.01" name="B_MOIS" value={form.B_MOIS} onChange={handleInputChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label>Preparatory Index (PC)</label>
                  <input type="number" step="0.01" name="PC" value={form.PC} onChange={handleInputChange} className="form-control" />
                </div>
              </div>
            </div>

            <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => navigate('/Lab/DailyLabAnalysisView')}>
                View
              </button>
              <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>
                Exit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DailyLabAnalysisAdd;