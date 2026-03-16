import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, transferUnitService } from '../../microservices/api.service';const __cx = (...vals) => vals.filter(Boolean).join(" ");const TEAL = '#1f9e8a';const BORDER = '#cfd8e3';const emptyForm = { id: '', t_Factory: '', r_Factory: '', r_TDate: '',
  transferInterUnit: '0.00',
  receivedfromInterUnit: '0.00',
  lessDriage: '0.00'
};

function parseAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function normalizeDateInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const ddmmyyyy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  const ddmmyyyyDash = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyyDash) return `${ddmmyyyyDash[3]}-${ddmmyyyyDash[2]}-${ddmmyyyyDash[1]}`;
  return raw;
}

function normalizeRows(rows = []) {
  return rows.map((item) => ({
    id: item.id ?? null,
    factory: item.T_FactoryName || item.T_Factory || '-',
    receivedInterUnit: parseAmount(item.ReceivedfromInterUnit),
    transferInterUnit: parseAmount(item.TransferInterUnit),
    date: item.R_TDate || '-',
    lessDriage: parseAmount(item.LessDriage)
  }));
}

export default function AccountReports_TransferandRecievedUnit() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ ...emptyForm });
  const [units, setUnits] = useState([]);
  const [rows, setRows] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const data = await masterService.getUnits();
        setUnits(Array.isArray(data) ? data : []);
      } catch {
        setUnits([]);
      }
    };
    loadUnits();
  }, []);

  useEffect(() => {
    const rid = new URLSearchParams(location.search).get('Rid');
    if (!rid) {
      setEditMode(false);
      return;
    }

    const loadById = async () => {
      try {
        const item = await transferUnitService.getById(rid);
        if (!item) return;
        setFormData({
          id: item.id || rid,
          t_Factory: String(item.T_Factory || ''),
          r_Factory: String(item.R_Factory || item.T_Factory || ''),
          r_TDate: item.R_TDate || '',
          transferInterUnit: parseAmount(item.TransferInterUnit),
          receivedfromInterUnit: parseAmount(item.ReceivedfromInterUnit),
          lessDriage: parseAmount(item.LessDriage)
        });
        setEditMode(true);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load selected record');
      }
    };
    loadById();
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const data = await transferUnitService.getList(formData.t_Factory);
      const list = normalizeRows(Array.isArray(data) ? data : []);
      setRows(list);
      if (!list.length) toast.error('No records found.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch records');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.t_Factory) {
      toast.error('Please select Transfer Units');
      return;
    }
    if (!formData.r_TDate) {
      toast.error('Please enter Date');
      return;
    }

    const payload = {
      t_Factory: formData.t_Factory,
      r_Factory: formData.r_Factory || formData.t_Factory,
      r_TDate: normalizeDateInput(formData.r_TDate),
      transferInterUnit: formData.transferInterUnit,
      receivedfromInterUnit: formData.receivedfromInterUnit,
      lessDriage: formData.lessDriage
    };

    try {
      setIsSaving(true);
      if (editMode && formData.id) {
        await transferUnitService.update(formData.id, payload);
        toast.success('Updated successfully');
      } else {
        await transferUnitService.create(payload);
        toast.success('Saved successfully');
      }
      setFormData({ ...emptyForm });
      setEditMode(false);
      await handleSearch();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save record');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="py-[16px] px-[20px] bg-[#f3f4f6] min-h-[calc(100vh - 120px)]">
      <Toaster position="top-right" />
      <div className="border border-[#cfd8e3] rounded-xl bg-white overflow-hidden">
        <div className="bg-[#1f9e8a] text-white font-medium text-[34px] text-center py-[12px] px-[10px]">
          Transfer & Recieved Unit
        </div>

        <div className="p-[22px 24px 26px] bg-[#f7f7f7]">
          <div className="border border-[#d1d5db] rounded-md overflow-hidden bg-white mb-[16px]">
            <div className="py-[10px] px-[16px] border-b border-b-[#e5e7eb] bg-[#f3f4f6] text-[13px] text-[#111827]">
              Transfer Amount
            </div>

            <div className="p-[16px]">
              <div className="grid gap-[14px]">
                <div>
                  <label className={labelStyle}>Transfer Units</label>
                  <select
                    name="t_Factory"
                    value={formData.t_Factory}
                    onChange={handleChange} className={inputStyle}>

                    
                    <option value="">All</option>
                    {units.map((u, idx) =>
                    <option key={`${u.f_Code ?? u.id}-${idx}`} value={u.f_Code ?? u.id}>
                        {u.F_Name || u.name}
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className={labelStyle}>Date</label>
                  <input
                    name="r_TDate"
                    value={formData.r_TDate}
                    onChange={handleChange}

                    placeholder="Ex. dd/mm/yyyy" className={inputStyle} />
                  
                </div>

                <div>
                  <label className={labelStyle}>Transfer Amount</label>
                  <input
                    name="transferInterUnit"
                    value={formData.transferInterUnit}
                    onChange={handleChange}

                    placeholder="0.00" className={inputStyle} />
                  
                </div>

                <div>
                  <label className={labelStyle}>Recieved Amount</label>
                  <input
                    name="receivedfromInterUnit"
                    value={formData.receivedfromInterUnit}
                    onChange={handleChange}

                    placeholder="0.00" className={inputStyle} />
                  
                </div>

                <div>
                  <label className={labelStyle}>Less Driage</label>
                  <input
                    name="lessDriage"
                    value={formData.lessDriage}
                    onChange={handleChange}

                    placeholder="0.00" className={inputStyle} />
                  
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-[8px] mb-[16px]">
            <button onClick={handleSave} disabled={isSaving} className={buttonStyle}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={handleSearch} disabled={isSearching} className={buttonStyle}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            <button onClick={() => navigate(-1)} className={buttonStyle}>
              Exit
            </button>
          </div>

          <div className="border border-[#6ee7b7] bg-white overflow-x-auto">
            <table className="w-[100%] min-w-[960px]">
              <thead>
                <tr className="bg-[#4fd1a1]">
                  <th className={thStyle}>Factory</th>
                  <th className={thStyle}>Recieved Inter Unit</th>
                  <th className={thStyle}>Transfer Inter Unit</th>
                  <th className={thStyle}>Date</th>
                  <th className={thStyle}>Less Driage</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ?
                rows.map((row, idx) =>
                <tr key={`${row.id ?? 'row'}-${idx}`}>
                      <td className={tdStyle}>{row.factory}</td>
                      <td className={tdStyle}>{row.receivedInterUnit}</td>
                      <td className={tdStyle}>{row.transferInterUnit}</td>
                      <td className={tdStyle}>{row.date}</td>
                      <td className={tdStyle}>{row.lessDriage}</td>
                    </tr>
                ) :

                <tr>
                    <td colSpan={5} className={__cx(tdStyle, "text-center text-[#6b7280]")}>
                      {isSearching ? 'Loading...' : 'No records found.'}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);

}

const labelStyle = "block text-[13px] text-[#111827] mb-[6px] font-semibold";







const inputStyle = "w-[100%] h-[44px] border-[2px] border-[#c7d2e5] rounded-md py-[0] px-[14px] text-[13px] text-[#374151]  bg-white";











const buttonStyle = "bg-[#1f9e8a] text-white border-0 rounded-md py-[10px] px-[16px] text-[13px] cursor-pointer";

const thStyle = "text-left text-[#0b0f12] font-bold text-[13px] py-[14px] px-[14px] ";








const tdStyle = "text-[#1f2937] text-[13px] py-[12px] px-[14px] border-t border-t-[#d1fae5] ";
