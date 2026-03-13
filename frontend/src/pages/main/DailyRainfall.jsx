import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, dailyRainfallService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const emptyForm = {
  id: '', rD_Unit: '', rD_Day: new Date().getDate().toString(),
  rD_EDate: new Date().toISOString().split('T')[0],
  rD_PreYear_Ondate: '', rD_PreYear_Todate: '',
  rD_CurYear_Ondate: '', rD_CurYear_Todate: '',
  rD_Remark: ''
};

const Main_DailyRainfall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ ...emptyForm });
  const [plants, setPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEdit] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setPlants(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const sid = new URLSearchParams(location.search).get('id');
    if (sid) loadEdit(sid);else
    resetForm();
  }, [location.search]);

  const loadEdit = async (id) => {
    try {
      const res = await dailyRainfallService.getById(id);
      const r = res.data;
      const parts = (r.RD_EDate || '').split('/');
      const isoDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
      setForm({
        id: r.RD_ID, rD_Unit: String(r.RD_Unit),
        rD_Day: String(r.RD_Day ?? new Date().getDate()),
        rD_EDate: isoDate,
        rD_PreYear_Ondate: r.RD_PreYear_Ondate ?? '',
        rD_PreYear_Todate: r.RD_PreYear_Todate ?? '',
        rD_CurYear_Ondate: r.RD_CurYear_Ondate ?? '',
        rD_CurYear_Todate: r.RD_CurYear_Todate ?? '',
        rD_Remark: r.RD_Remark || ''
      });
      setEdit(true);
    } catch {toast.error('Failed to load record.');}
  };

  const resetForm = () => {
    setForm({ ...emptyForm, rD_EDate: new Date().toISOString().split('T')[0], rD_Day: new Date().getDate().toString() });
    setEdit(false);
  };

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.rD_Unit || !form.rD_EDate) {
      toast.error("Please fill required fields (Unit, Date)");
      return;
    }
    try {
      setIsLoading(true);
      if (editMode) {
        await dailyRainfallService.update(form.id, form);
        toast.success('Updated successfully.');
      } else {
        await dailyRainfallService.create(form);
        toast.success('Saved successfully.');
      }
      navigate('/Main/DailyRainfallview');
    } catch (err) {
      toast.error('Error saving data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg")}>
                <div className={__cx("page-card-header", "text-left text-[15px]")}>
                    {editMode ? 'Edit Daily Rainfall' : 'Daily Rainfall Entry'}
                </div>

                <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
                    <div className={__cx("section-panel", "border-0 p-[0] bg-[transparent] mb-[25px]")}>
                        <div className="text-[13px] text-[#666] mb-[15px] border-b border-b-[#ddd] pb-[5px]">General Info</div>
                        <div className="form-grid-3">
                            <div className="form-group">
                                <label>Factory Unit</label>
                                <select className="form-control" name="rD_Unit" value={form.rD_Unit} onChange={onChange} disabled={editMode}>
                                    <option value="">Select Unit</option>
                                    {plants.map((p, idx) => <option key={`${p.F_Code || p.id}-${idx}`} value={p.F_Code || p.id}>{p.F_Name || p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Rainfall Date</label>
                                <input type="date" className="form-control" name="rD_EDate" value={form.rD_EDate} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Day of Month</label>
                                <input type="text" className="form-control" name="rD_Day" value={form.rD_Day} readOnly />
                            </div>
                        </div>
                    </div>

                    <div className={__cx("form-grid-2", "mb-[25px] gap-[40px]")}>
                        <div className={__cx("section-panel", "border border-[#ddd] rounded p-[20px] bg-white")}>
                            <div className="text-[#d9534f] text-[13px] font-bold mb-[20px] border-b border-b-[#eee] pb-[5px]">Previous Year</div>
                            <div className="form-grid-2">
                                <div className="form-group"><label>On-Date (mm)</label><input type="number" step="0.01" name="rD_PreYear_Ondate" value={form.rD_PreYear_Ondate} onChange={onChange} className="form-control" /></div>
                                <div className="form-group"><label>To-Date (mm)</label><input type="number" step="0.01" name="rD_PreYear_Todate" value={form.rD_PreYear_Todate} onChange={onChange} className="form-control" /></div>
                            </div>
                        </div>
                        <div className={__cx("section-panel", "border border-[#ddd] rounded p-[20px] bg-white")}>
                            <div className="text-[#008080] text-[13px] font-bold mb-[20px] border-b border-b-[#eee] pb-[5px]">Current Year</div>
                            <div className="form-grid-2">
                                <div className="form-group"><label>On-Date (mm)</label><input type="number" step="0.01" name="rD_CurYear_Ondate" value={form.rD_CurYear_Ondate} onChange={onChange} className="form-control" /></div>
                                <div className="form-group"><label>To-Date (mm)</label><input type="number" step="0.01" name="rD_CurYear_Todate" value={form.rD_CurYear_Todate} onChange={onChange} className="form-control" /></div>
                            </div>
                        </div>
                    </div>

                    <div className={__cx("form-group", "mb-[30px]")}>
                        <label>Remarks</label>
                        <textarea name="rD_Remark" className={__cx("form-control", "h-[80px] ")} value={form.rD_Remark} onChange={onChange} />
                    </div>

                    <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
                        <button className="btn btn-primary" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : editMode ? 'Update' : 'Save'}
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/Main/DailyRainfallview')}>View</button>
                        <button className="btn btn-primary" onClick={() => navigate(-1)}>Exit</button>
                    </div>
                </div>
            </div>
        </div>);

};

export default Main_DailyRainfall;