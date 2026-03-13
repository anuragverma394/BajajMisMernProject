import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, dailyCaneEntryService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const emptyForm = {
  id: '', cn_Unit: '', cn_Date: '',
  cn_Crush_OnDate: '', cn_Crush_ToDate: '',
  cn_Rec_ThisYear1: '', cn_Rec_ThisYear2: '',
  cn_Rec_ThisProdtype: 'All', cn_Rec_Estimate: '0',
  cn_MolCatPurity_OnDate: '', cn_MolCatPurity_ToDate: '',
  cn_Loss_OnDate: '', cn_Loss_ToDate: '',
  cn_SugBagQtl_OnDate: '', cn_SugBagQtl_ToDate: '',
  cn_CnBalGateQtl: '', cn_CnBalCentreQtl: '',
  cn_Rainfall: '',
  cn_Cap_OnDate: '', cn_Cap_ToDate: '',
  cn_Stoppage_OnDate: '', cn_Remark: '',
  quantity: ''
};

const Main_SugarWhatsAppReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ ...emptyForm });
  const [factories, setFactories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setFactories(Array.isArray(d) ? d : [])).catch(() => {});

    const sid = new URLSearchParams(location.search).get('sid');
    if (sid) {
      setEditMode(true);
      loadData(sid);
    } else {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      setForm((prev) => ({ ...prev, cn_Date: `${dd}-${mm}-${yyyy}` }));
    }
  }, [location.search]);

  const loadData = async (sid) => {
    try {
      const res = await dailyCaneEntryService.getById(sid);
      if (res) {
        setForm((prev) => ({ ...prev, ...res }));
      }
    } catch (error) {
      toast.error("Error loading data.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.cn_Unit) {
      toast.error("Please select a unit.");
      return;
    }
    setIsLoading(true);
    try {
      if (editMode) {
        await dailyCaneEntryService.update(form.id, form);
        toast.success("Record updated successfully.");
      } else {
        await dailyCaneEntryService.create(form);
        toast.success("Record saved successfully.");
      }
      navigate('/Main/SugarWhatsAppReportView');
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error saving data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg")}>
                <div className={__cx("page-card-header", "text-center text-[15px]")}>
                    Daily Cane Entry
                </div>

                <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>

                    {/* First Row: Units, Date, Crushing Qtl */}
                    <div className="grid gap-[20px] mb-[20px]">
                        <div className="form-group">
                            <label>Units</label>
                            <select className="form-control" name="cn_Unit" value={form.cn_Unit} onChange={handleInputChange}>
                                <option value="">Select Unit</option>
                                {factories.map((f, idx) =>
                <option key={`${f.F_Code || f.id}-${idx}`} value={f.F_Code || f.id}>{f.F_Name || f.name}</option>
                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input type="text" className="form-control" name="cn_Date" value={form.cn_Date} onChange={handleInputChange} placeholder="dd-mm-yyyy" />
                        </div>
                        <div className={__cx("section-panel", "border border-[#ddd] p-[10px] rounded bg-white")}>
                            <div className="text-[#d9534f] text-[12px] font-bold mb-[5px]">Crushing Qtl</div>
                            <div className="flex gap-[10px]">
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">Ondate</label>
                                    <input type="text" className="form-control" name="cn_Crush_OnDate" value={form.cn_Crush_OnDate} onChange={handleInputChange} placeholder="Enter onDate" />
                                </div>
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">Todate</label>
                                    <input type="text" className="form-control" name="cn_Crush_ToDate" value={form.cn_Crush_ToDate} onChange={handleInputChange} placeholder="Enter toDate" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Second Row: Recovery % Cane, Molasses Category - Purity */}
                    <div className="grid gap-[20px] mb-[20px]">
                        <div className={__cx("section-panel", "border border-[#ddd] p-[10px] rounded bg-white")}>
                            <div className="text-[#d9534f] text-[12px] font-bold mb-[5px]">Recovery % Cane</div>
                            <div className="flex gap-[10px]">
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">This Year (OnDate)</label>
                                    <input type="text" className="form-control" name="cn_Rec_ThisYear1" value={form.cn_Rec_ThisYear1} onChange={handleInputChange} />
                                </div>
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">This Year (ToDate)</label>
                                    <input type="text" className="form-control" name="cn_Rec_ThisYear2" value={form.cn_Rec_ThisYear2} onChange={handleInputChange} />
                                </div>
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">Prod Type</label>
                                    <select className="form-control" name="cn_Rec_ThisProdtype" value={form.cn_Rec_ThisProdtype} onChange={handleInputChange}>
                                        <option value="All">All</option>
                                        <option value="Sugar">Sugar</option>
                                        <option value="Molasses">Molasses</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className={__cx("section-panel", "border border-[#ddd] p-[10px] rounded bg-white")}>
                            <div className="text-[#d9534f] text-[12px] font-bold mb-[5px]">Molasses Category - Purity</div>
                            <div className="flex gap-[10px]">
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">This Year (OnDate)</label>
                                    <input type="text" className="form-control" name="cn_MolCatPurity_OnDate" value={form.cn_MolCatPurity_OnDate} onChange={handleInputChange} />
                                </div>
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">This Year (ToDate)</label>
                                    <input type="text" className="form-control" name="cn_MolCatPurity_ToDate" value={form.cn_MolCatPurity_ToDate} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Third Row: Losses % Cane, Sugar Bagging Qtl */}
                    <div className="grid gap-[20px] mb-[20px]">
                        <div className={__cx("section-panel", "border border-[#ddd] p-[10px] rounded bg-white")}>
                            <div className="text-[#d9534f] text-[12px] font-bold mb-[5px]">Losses % Cane</div>
                            <div className="flex gap-[10px]">
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">Ondate</label>
                                    <input type="text" className="form-control" name="cn_Loss_OnDate" value={form.cn_Loss_OnDate} onChange={handleInputChange} />
                                </div>
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">Todate</label>
                                    <input type="text" className="form-control" name="cn_Loss_ToDate" value={form.cn_Loss_ToDate} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>
                        <div className={__cx("section-panel", "border border-[#ddd] p-[10px] rounded bg-white")}>
                            <div className="text-[#d9534f] text-[12px] font-bold mb-[5px]">Sugar Bagging Qtl</div>
                            <div className="flex gap-[10px]">
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">Ondate</label>
                                    <input type="text" className="form-control" name="cn_SugBagQtl_OnDate" value={form.cn_SugBagQtl_OnDate} onChange={handleInputChange} placeholder="Enter onData" />
                                </div>
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">Todate</label>
                                    <input type="text" className="form-control" name="cn_SugBagQtl_ToDate" value={form.cn_SugBagQtl_ToDate} onChange={handleInputChange} placeholder="Enter onData" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fourth Row: Cane Balance, Rainfall, Capacity Utilisation */}
                    <div className="grid gap-[20px] mb-[20px]">
                        <div className="form-group">
                            <label>Cane Balance at gate Qtls</label>
                            <input type="text" className="form-control" name="cn_CnBalGateQtl" value={form.cn_CnBalGateQtl} onChange={handleInputChange} placeholder="Enter Cane Balance at gate Qtls" />
                        </div>
                        <div className="form-group">
                            <label>Cane Balance at Centre Qtls</label>
                            <input type="text" className="form-control" name="cn_CnBalCentreQtl" value={form.cn_CnBalCentreQtl} onChange={handleInputChange} placeholder="Enter Cane Balance at gate Qtls" />
                        </div>
                        <div className="form-group">
                            <label>Rainfall (Inches)</label>
                            <input type="text" className="form-control" name="cn_Rainfall" value={form.cn_Rainfall} onChange={handleInputChange} placeholder="Inches" />
                        </div>
                        <div className={__cx("section-panel", "border border-[#ddd] py-[5px] px-[10px] rounded bg-white")}>
                            <div className="text-[#d9534f] text-[12px] font-bold mb-[5px]">Capacity Utilisation (%)</div>
                            <div className="flex gap-[10px]">
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">Ondate</label>
                                    <input type="text" className="form-control" name="cn_Cap_OnDate" value={form.cn_Cap_OnDate} onChange={handleInputChange} placeholder="Enter onDate" />
                                </div>
                                <div className={__cx("form-group", "")}>
                                    <label className="text-[11px]">Todate</label>
                                    <input type="text" className="form-control" name="cn_Cap_ToDate" value={form.cn_Cap_ToDate} onChange={handleInputChange} placeholder="Enter toDate" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fifth Row: Stoppages, Remark */}
                    <div className="grid gap-[20px] mb-[10px]">
                        <div className="form-group">
                            <label>Ondata Stoppages</label>
                            <textarea className={__cx("form-control", "h-[80px]")} name="cn_Stoppage_OnDate" value={form.cn_Stoppage_OnDate} onChange={handleInputChange}></textarea>
                        </div>
                        <div className="form-group">
                            <label>Remark</label>
                            <textarea className={__cx("form-control", "h-[80px]")} name="cn_Remark" value={form.cn_Remark} onChange={handleInputChange}></textarea>
                        </div>
                    </div>

                    {/* Sixth Row: Quantity */}
                    <div className="w-[50%] mb-[20px]">
                        <div className={__cx("section-panel", "border border-[#ddd] p-[10px] rounded bg-white")}>
                            <div className="text-[#d9534f] text-[12px] font-bold mb-[5px]">Quantity</div>
                            <div className="form-group">
                                <label className="text-[11px]">Quantity</label>
                                <input type="text" className="form-control" name="quantity" value={form.quantity} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0] justify-start")}>
                        <button className="btn btn-primary" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/Main/SugarWhatsAppReportView')}>
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

export default Main_SugarWhatsAppReport;