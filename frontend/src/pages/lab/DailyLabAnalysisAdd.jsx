import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Save, LogOut } from 'lucide-react';
import { labService, masterService } from '../../microservices/api.service';const __cx = (...vals) => vals.filter(Boolean).join(" ");const DailyLabAnalysisAdd = () => {const navigate = useNavigate();const [searchParams] = useSearchParams();const [units, setUnits] = useState([]);const [loading, setLoading] = useState(false);const [isEditMode, setIsEditMode] = useState(false);
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
      then((data) => {if (data && data.length > 0) setForm(data[0]);}).
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

  const headerStyle = "bg-[#008080] text-white py-[12px] px-[20px] text-[18px] font-medium rounded-[8px 8px 0 0] mb-[1px]";









  const cardStyle = "p-[30px] border border-[#e0e0e0] rounded-[0 0 8px 8px] bg-white shadow-[0 2px 4px rgba(0,0,0,0.05)] mb-[20px]";








  const sectionHeaderStyle = "text-[13px] text-[#666] border-b border-b-[#ddd] pb-[10px] mb-[30px] font-medium";








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

  const METRICS = [
  { label: 'Primary Juice', prefix: 'PJ' },
  { label: 'Mixed Juice', prefix: 'MJ' },
  { label: 'Last Mill Juice', prefix: 'LMJ' },
  { label: 'Filtered Juice (U)', prefix: 'FPJU' },
  { label: 'Filtered Juice (T)', prefix: 'FPJT' },
  { label: 'Clear Juice', prefix: 'CJ' },
  { label: 'Unsulph. Syrup', prefix: 'US' },
  { label: 'Unsulph. Syrup (T)', prefix: 'UST' },
  { label: 'Sulph. Syrup', prefix: 'SS' }];


  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Inter', sans-serif]">
      <Toaster position="top-right" />

      <div className={headerStyle}>
        Daily Lab Analysis Entry
      </div>

      <div className={cardStyle}>
        <form onSubmit={handleSubmit}>
          <div className={sectionHeaderStyle}>General Info & Process Params</div>
          <div className="grid gap-[20px] mb-[40px]">
            <div>
              <label className={labelStyle}>Factory Unit</label>
              <select name="factory" value={form.factory} onChange={handleInputChange} required className={inputStyle}>
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
              <label className={labelStyle}>Entry Time</label>
              <input type="time" name="TIME1" value={form.TIME1} onChange={handleInputChange} required className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Shift</label>
              <select name="Shift1" value={form.Shift1} onChange={handleInputChange} className={inputStyle}>
                <option value="">Select Shift</option>
                <option value="A">Shift A</option>
                <option value="B">Shift B</option>
                <option value="C">Shift C</option>
              </select>
            </div>
            <div>
              <label className={labelStyle}>Mill No</label>
              <select name="MILL_NO" value={form.MILL_NO} onChange={handleInputChange} className={inputStyle}>
                <option value="1">Mill 01</option>
                <option value="2">Mill 02</option>
                <option value="3">Mill 03</option>
              </select>
            </div>
          </div>

          <div className={__cx(sectionHeaderStyle, "text-[#008080] ")}>Juice & Syrup Analysis</div>
          <div className="mb-[15px] bg-[#f9f9f9] py-[10px] px-[15px] rounded font-bold text-[13px] grid gap-[15px]">
            <div>Metric Source</div>
            <div className="text-center">Brix %</div>
            <div className="text-center">Pol %</div>
            <div className="text-center">Purity %</div>
          </div>

          {METRICS.map((m, idx) =>
          <div key={m.prefix} className="grid gap-[15px] mb-[12px] items-center">
              <div className="text-[13px] font-medium text-[#555]">{m.label}</div>
              <input type="number" step="0.01" name={`${m.prefix}_BX`} value={form[`${m.prefix}_BX`]} onChange={handleInputChange} className={__cx(inputStyle, "text-center")} />
              <input type="number" step="0.01" name={`${m.prefix}_POL`} value={form[`${m.prefix}_POL`]} onChange={handleInputChange} className={__cx(inputStyle, "text-center")} />
              <div className={__cx(inputStyle, "text-center bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] font-bold")}>
                {form[`${m.prefix}_PY`]}
              </div>
            </div>
          )}

          <div className={__cx(sectionHeaderStyle, "mt-[30px]")}>Other Metrics</div>
          <div className="grid gap-[20px] mb-[40px]">
            <div>
              <label className={labelStyle}>Bagasse Pol %</label>
              <input type="number" step="0.01" name="B_POL" value={form.B_POL} onChange={handleInputChange} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Bagasse Moist %</label>
              <input type="number" step="0.01" name="B_MOIS" value={form.B_MOIS} onChange={handleInputChange} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Preparatory Index (PC)</label>
              <input type="number" step="0.01" name="PC" value={form.PC} onChange={handleInputChange} className={inputStyle} />
            </div>
          </div>

          <div className="flex gap-[15px] border-t border-t-[#eee] pt-[30px]">
            <button type="submit" disabled={loading} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
              <Save size={18} /> {loading ? 'Saving...' : isEditMode ? 'Update Analysis' : 'Save Analysis'}
            </button>
            <button type="button" onClick={() => navigate('/Lab/DailyLabAnalysisView')} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#95a5a6]">
              <LogOut size={18} /> Exit
            </button>
          </div>
        </form>
      </div>
    </div>);

};

export default DailyLabAnalysisAdd;