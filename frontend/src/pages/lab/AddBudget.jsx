import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Save, Eye, LogOut, Loader2 } from 'lucide-react';
import { masterService, addBudgetService } from '../../microservices/api.service';
import '../../styles/base.css';const emptyForm = { id: '', wB_Factory: '', wB_FromDate: '', wB_ToDate: '', wB_BudgetAmount: ''
};

const Lab_AddBudget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ ...emptyForm });
  const [plants, setPlants] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [editMode, setEdit] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setPlants(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wbId = params.get('WB_Id');
    const fCode = params.get('f_Code');
    if (wbId && fCode) loadEdit(wbId, fCode);else
    resetForm();
  }, [location.search]);

  const loadEdit = async (wbId, fCode) => {
    try {
      setLoading(true);
      const res = await addBudgetService.getById(wbId, { factoryCode: fCode });
      const r = res.data;
      const fromParts = (r.WB_FromDate || '').split('/');
      const toParts = (r.WB_ToDate || '').split('/');
      setForm({
        id: r.WB_ID,
        wB_Factory: String(r.WB_Factory),
        wB_FromDate: fromParts.length === 3 ? `${fromParts[2]}-${fromParts[1]}-${fromParts[0]}` : '',
        wB_ToDate: toParts.length === 3 ? `${toParts[2]}-${toParts[1]}-${toParts[0]}` : '',
        wB_BudgetAmount: r.WB_BudgetAmount ?? ''
      });
      setEdit(true);
    } catch {
      toast.error('Failed to load budget record.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEdit(false);
  };

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.wB_Factory || !form.wB_FromDate || !form.wB_ToDate || !form.wB_BudgetAmount) {
      toast.error("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      if (editMode) {
        await addBudgetService.update(form.id, form);
        toast.success('Budget updated successfully.');
      } else {
        await addBudgetService.create(form);
        toast.success('Budget added successfully.');
      }
      navigate('/Lab/AddBudgetview');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save budget.');
    } finally {
      setLoading(false);
    }
  };

  const headerStyle = "bg-[#008080] text-white py-[12px] px-[20px] text-[18px] font-medium rounded-[8px 8px 0 0] mb-[1px] text-center";










  const cardStyle = "p-[30px] border border-[#e0e0e0] rounded-[0 0 8px 8px] bg-white shadow-[0 2px 4px rgba(0,0,0,0.05)] mb-[20px]";








  const groupStyle = "mb-[20px]";

  const labelStyle = "block mb-[8px] text-[13px] font-semibold text-[#333]";







  const inputStyle = "w-[100%] py-[10px] px-[12px] border border-[#ccc] rounded text-[13px] bg-white  ";










  const btnStyle = (bg = '#16a085') => ({
    padding: '10px 24px',
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

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Inter', sans-serif]">
      <Toaster position="top-right" />

      <div className={headerStyle}>
        {editMode ? 'Edit Weekly Budget' : 'Add Weekly Budget'}
      </div>

      <div className={cardStyle}>
        <div className="max-w-[600px] my-[0] mx-[auto]">
          <div className={groupStyle}>
            <label className={labelStyle}>Units</label>
            <select

              name="wB_Factory"
              value={form.wB_Factory}
              onChange={onChange}
              disabled={editMode} className={inputStyle}>
              
              <option value="">-- Sector Mapping --</option>
              {plants.map((p, idx) => <option key={`${p.F_Code || p.id}-${idx}`} value={p.F_Code || p.id}>{p.F_Name || p.name}</option>)}
            </select>
          </div>

          <div className="grid gap-[20px] mb-[20px]">
            <div>
              <label className={labelStyle}>Start Date</label>
              <input
                type="date"

                name="wB_FromDate"
                value={form.wB_FromDate}
                onChange={onChange} className={inputStyle} />
              
            </div>
            <div>
              <label className={labelStyle}>End Date</label>
              <input
                type="date"

                name="wB_ToDate"
                value={form.wB_ToDate}
                onChange={onChange} className={inputStyle} />
              
            </div>
          </div>

          <div className={groupStyle}>
            <label className={labelStyle}>Budget Amount (₹)</label>
            <input
              type="number"
              step="0.01"

              name="wB_BudgetAmount"
              value={form.wB_BudgetAmount}
              onChange={onChange}
              placeholder="0.00" className={inputStyle} />
            
          </div>

          <div className="flex gap-[10px] mt-[30px]">
            <button onClick={handleSave} disabled={isLoading} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save
            </button>
            <button onClick={() => navigate('/Lab/AddBudgetview')} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
              <Eye size={18} /> View
            </button>
            <button onClick={() => navigate('/Lab/LabDashboard')} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
              <LogOut size={18} /> Exit
            </button>
          </div>
        </div>
      </div>

      <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
    </div>);

};

export default Lab_AddBudget;