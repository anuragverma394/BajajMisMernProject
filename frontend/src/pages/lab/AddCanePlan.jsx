import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, addCanePlanService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const PLAN_FIELDS = [
{ key: 'cP_Syrup', label: 'Syrup Allocation (B/H)', group: 'Raw Material Distribution (Qtls)' },
{ key: 'cP_BHY', label: 'B/H Cycle Allocation', group: 'Raw Material Distribution (Qtls)' },
{ key: 'cP_FM', label: 'Fari + Mukhani Distribution', group: 'Raw Material Distribution (Qtls)' },
{ key: 'cP_Total', label: 'Consolidated Allocation', group: 'Raw Material Distribution (Qtls)' },
{ key: 'cP_PlantCapacity', label: 'Primary Plant Capacity (TCD)', group: 'Industrial Infrastructure Capacity' },
{ key: 'plant_Capacity_2', label: 'Secondary Plant Capacity (TCD)', group: 'Industrial Infrastructure Capacity' },
{ key: 'cP_PolPTarget', label: 'POL % Critical Target', group: 'Operational Efficiency Benchmarks %' },
{ key: 'cP_RecPTarget', label: 'Recovery % Efficiency', group: 'Operational Efficiency Benchmarks %' },
{ key: 'cP_BHPTarget', label: 'B/H Molasses Target', group: 'Operational Efficiency Benchmarks %' },
{ key: 'cP_CHPTarget', label: 'C/H Molasses Target', group: 'Operational Efficiency Benchmarks %' },
{ key: 'cP_LossMolBHYPTarget', label: 'Loss B/H Factor %', group: 'Operational Efficiency Benchmarks %' },
{ key: 'cP_LossMolCHYPTarget', label: 'Loss C/H Factor %', group: 'Operational Efficiency Benchmarks %' },
{ key: 'cP_LossMolBHYCHYPTarget', label: 'Consolidated Loss Factor %', group: 'Operational Efficiency Benchmarks %' },
{ key: 'cP_SteamPTarget', label: 'Steam Consumption %', group: 'Operational Efficiency Benchmarks %' },
{ key: 'cCP_BagassPTarget', label: 'Bagasse Generation %', group: 'Operational Efficiency Benchmarks %' },
{ key: 'cP_Alcohol_Syrup', label: 'Alcohol Yield (Syrup)', group: 'Distillery Productivity Metrics' },
{ key: 'cP_Alcohol_BH', label: 'Alcohol Yield (B/H)', group: 'Distillery Productivity Metrics' },
{ key: 'cP_Alcohol_CH', label: 'Alcohol Yield (C/H)', group: 'Distillery Productivity Metrics' },
{ key: 'cP_PPTarget', label: 'Generation Target (MW)', group: 'Power Grid Stabilization' },
{ key: 'cP_PETarget', label: 'Export Target (MW)', group: 'Power Grid Stabilization' }];


const emptyForm = () => {
  const f = { id: '', cP_Unit: '', season: '' };
  PLAN_FIELDS.forEach((p) => {f[p.key] = '';});
  return f;
};

const Lab_AddCanePlan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(emptyForm());
  const [plants, setPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEdit] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setPlants(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const sid = new URLSearchParams(location.search).get('sid');
    if (sid) loadEdit(sid);else
    {
      const f = emptyForm();
      addCanePlanService.getSeason().then((r) => {
        if (r.data?.Se_Year) f.season = r.data.Se_Year;
        setForm(f);
      }).catch(() => setForm(f));
      setEdit(false);
    }
  }, [location.search]);

  const loadEdit = async (sid) => {
    try {
      const res = await addCanePlanService.getById(sid);
      const r = res.data;
      const f = emptyForm();
      f.id = r.CPID;
      f.cP_Unit = String(r.CP_Unit);
      f.season = r.Se_Year || '';
      PLAN_FIELDS.forEach((p) => {f[p.key] = r[p.key.replace(/^c/, 'C').replace(/^p/, 'P')] ?? r[p.key] ?? '';});
      setForm(f);
      setEdit(true);
    } catch {
      toast.error('Failed to retrieve record.');
    }
  };

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.cP_Unit) {toast.error('Unit selection required.');return;}
    try {
      setIsLoading(true);
      if (editMode) {
        await addCanePlanService.update(form.id, form);
        toast.success('Record updated successfully.');
        navigate('/Lab/AddCanePlanView');
      } else {
        await addCanePlanService.create(form);
        toast.success('Record saved successfully.');
      }
      setForm(emptyForm());
      setEdit(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      setIsLoading(true);
      await addCanePlanService.deleteRecord(form.id);
      toast.success('Record deleted.');
      navigate('/Lab/AddCanePlanView');
    } catch {
      toast.error('Error deleting record.');
    } finally {
      setIsLoading(false);
    }
  };

  const groups = {};
  PLAN_FIELDS.forEach((f) => {
    if (!groups[f.group]) groups[f.group] = [];
    groups[f.group].push(f);
  });

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg")}>
                <div className={__cx("page-card-header", "text-center text-[15px]")}>
                    {editMode ? 'Edit Target Cane Plan' : 'Add Target Cane Plan'}
                </div>

                <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
                    <div className={__cx("form-grid-4", "mb-[20px]")}>
                        <div className="form-group">
                            <label>Unit</label>
                            <select className="form-control" name="cP_Unit" value={form.cP_Unit} onChange={onChange} disabled={editMode}>
                                <option value="">Select Unit</option>
                                {plants.map((p, idx) => <option key={`${p.F_Code || p.id}-${idx}`} value={p.F_Code || p.id}>{p.F_Name || p.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Season</label>
                            <input type="text" className={__cx("form-control", "bg-[#eee]")} value={form.season} readOnly />
                        </div>
                    </div>

                    {Object.entries(groups).map(([groupName, fields]) =>
          <div key={groupName} className={__cx("section-panel", "border border-[#ddd] p-[15px] rounded mb-[20px] bg-white")}>
                            <div className="text-[#d9534f] text-[13px] font-bold mb-[15px] border-b border-b-[#eee] pb-[5px]">
                                {groupName}
                            </div>
                            <div className="form-grid-4">
                                {fields.map((field, idx) =>
              <div key={field.key} className="form-group">
                                        <label>{field.label}</label>
                                        <input
                  type="number"
                  className="form-control"
                  name={field.key}
                  value={form[field.key]}
                  onChange={onChange}
                  placeholder="0.00" />
                
                                    </div>
              )}
                            </div>
                        </div>
          )}

                    <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
                        <button className="btn btn-primary" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        {editMode &&
            <button className={__cx("btn btn-primary", "bg-[#d9534f]")} onClick={handleDelete} disabled={isLoading}>
                                Delete
                            </button>
            }
                        <button className="btn btn-primary" onClick={() => navigate('/Lab/AddCanePlanView')}>
                            View
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate(-1)}>
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        </div>);

};

export default Lab_AddCanePlan;