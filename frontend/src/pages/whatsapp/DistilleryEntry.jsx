import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, dailyCaneEntryService, whatsappService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");const DistilleryEntry = () => {const navigate = useNavigate();const [searchParams] = useSearchParams();const editId = searchParams.get('id');const [units, setUnits] = useState([]);const [prodTypes, setProdTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    Dist_Unit: '',
    Dist_Date: '',
    Dist_RSStatus: '',
    Dist_RSDate: '',
    Dist_Remark_Top: '',
    Dist_RSProd_OnDate: '',
    Dist_RSProd_ToDate: '',
    Dist_RSProd_ProdType: '',
    Dist_AAProd_OnDate: '',
    Dist_AAProd_ToDate: '',
    Dist_AAProd_ProdType: '',
    RR_AAProd_onTotal: '',
    RR_AAProd_ToTotal: '',
    Dist_Rec_OnDate: '',
    Dist_Rec_ToDate: '',
    Dist_Cap_OnDate: '',
    Dist_Cap_ToDate: '',
    Dist_Stoppage: '',
    Dist_Remark: ''
  });

  useEffect(() => {
    fetchInitialData();
    // Set default date
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    setFormData((prev) => ({ ...prev, Dist_Date: `${dd}-${mm}-${yyyy}` }));
  }, [editId]);

  const fetchInitialData = async () => {
    try {
      const [unitsData, typesData] = await Promise.all([
      masterService.getDistilleryUnits(),
      dailyCaneEntryService.getProdTypes()]
      );
      setUnits(unitsData || []);
      setProdTypes(typesData?.data || []);
    } catch (error) {
      console.error("Error fetching initial data", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'Dist_RSProd_OnDate' || name === 'Dist_AAProd_OnDate') {
        updated.RR_AAProd_onTotal = (parseFloat(updated.Dist_RSProd_OnDate || 0) + parseFloat(updated.Dist_AAProd_OnDate || 0)).toFixed(2);
      }
      if (name === 'Dist_RSProd_ToDate' || name === 'Dist_AAProd_ToDate') {
        updated.RR_AAProd_ToTotal = (parseFloat(updated.Dist_RSProd_ToDate || 0) + parseFloat(updated.Dist_AAProd_ToDate || 0)).toFixed(2);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.Dist_Unit) {toast.error("Please select a unit");return;}
    setLoading(true);
    try {
      const response = await whatsappService.saveDistilleryEntry(formData);
      if (response) {
        toast.success(editId ? "Entry updated!" : "Entry saved!");
        if (!editId) navigate('/WhatsApp/DistilleryEntryView');
      }
    } catch (error) {
      toast.error("Failed to save entry.");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const sectionStyle = "bg-[#f9f9f0] border border-[#e0e0d0] rounded py-[12px] px-[16px] mb-[16px]";







  const sectionTitleStyle = "text-[13px] font-semibold text-[#c0392b] mb-[12px]";






  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg")}>
                <div className={__cx("page-card-header", "text-center text-[15px]")}>
                    Distillery Report Entry
                </div>

                <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
                    {/* Row 1: Units, Date, Unit Restart Status */}
                    <div className={__cx("form-grid-4", "mb-[12px]")}>
                        <div className="form-group">
                            <label>Units</label>
                            <select className="form-control" name="Dist_Unit" value={formData.Dist_Unit} onChange={handleInputChange}>
                                <option value="">All</option>
                                {units.map((u, idx) =>
                <option key={`${u.f_Code || u.id}-${idx}`} value={u.f_Code || u.id}>{u.F_Name || u.name}</option>
                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input type="text" className="form-control" name="Dist_Date" value={formData.Dist_Date} onChange={handleInputChange} placeholder="DD-MM-YYYY" />
                        </div>
                        <div className={__cx("form-group", "")}>
                            <label>Unit Restart Status</label>
                            <select className="form-control" name="Dist_RSStatus" value={formData.Dist_RSStatus} onChange={handleInputChange}>
                                <option value="">Please Select</option>
                                <option value="1">No</option>
                                <option value="2">Yes</option>
                            </select>
                        </div>
                    </div>

                    {/* Remark */}
                    <div className={__cx("form-group", "mb-[16px]")}>
                        <label>Remark</label>
                        <input type="text" className="form-control" name="Dist_Remark_Top" value={formData.Dist_Remark_Top} onChange={handleInputChange} />
                    </div>

                    {/* RS Production & AA/NA Production - side by side */}
                    <div className="grid gap-[16px] mb-[16px]">
                        {/* RS Production */}
                        <div className={sectionStyle}>
                            <div className={sectionTitleStyle}>RS Production(A+B Grade) (In Lac BL)</div>
                            <div className="form-grid-3">
                                <div className="form-group">
                                    <label>OnDate</label>
                                    <input type="text" className="form-control" name="Dist_RSProd_OnDate" value={formData.Dist_RSProd_OnDate} onChange={handleInputChange} placeholder="Enter onDate" />
                                </div>
                                <div className="form-group">
                                    <label>ToDate</label>
                                    <input type="text" className="form-control" name="Dist_RSProd_ToDate" value={formData.Dist_RSProd_ToDate} onChange={handleInputChange} placeholder="Enter toDate" />
                                </div>
                                <div className="form-group">
                                    <label>Prod Type</label>
                                    <select className="form-control" name="Dist_RSProd_ProdType" value={formData.Dist_RSProd_ProdType} onChange={handleInputChange}>
                                        <option value="">Please Select</option>
                                        {prodTypes.map((t, idx) => <option key={`${t.ID || t.id}-${idx}`} value={t.ID || t.id}>{t.Prodty_Name || t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* AA/NA Production */}
                        <div className={sectionStyle}>
                            <div className={sectionTitleStyle}>AA/NA Production(In Lac BL)</div>
                            <div className="form-grid-3">
                                <div className="form-group">
                                    <label>OnDate</label>
                                    <input type="text" className="form-control" name="Dist_AAProd_OnDate" value={formData.Dist_AAProd_OnDate} onChange={handleInputChange} placeholder="Enter toDate" />
                                </div>
                                <div className="form-group">
                                    <label>ToDate</label>
                                    <input type="text" className="form-control" name="Dist_AAProd_ToDate" value={formData.Dist_AAProd_ToDate} onChange={handleInputChange} placeholder="Enter toDate" />
                                </div>
                                <div className="form-group">
                                    <label>Prod Type</label>
                                    <select className="form-control" name="Dist_AAProd_ProdType" value={formData.Dist_AAProd_ProdType} onChange={handleInputChange}>
                                        <option value="">Please Select</option>
                                        {prodTypes.map((t, idx) => <option key={`${t.ID || t.id}-${idx}`} value={t.ID || t.id}>{t.Prodty_Name || t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Production & Recovery - side by side */}
                    <div className="grid gap-[16px] mb-[16px]">
                        {/* Total Production */}
                        <div className={sectionStyle}>
                            <div className={sectionTitleStyle}>Total Production (RS+AA+NA) (In Lac BL)</div>
                            <div className="grid gap-[16px]">
                                <div className="form-group">
                                    <label>Ondate</label>
                                    <input type="text" className="form-control" name="RR_AAProd_onTotal" value={formData.RR_AAProd_onTotal} onChange={handleInputChange} placeholder="Enter onDate" />
                                </div>
                                <div className="form-group">
                                    <label>Todate</label>
                                    <input type="text" className="form-control" name="RR_AAProd_ToTotal" value={formData.RR_AAProd_ToTotal} onChange={handleInputChange} placeholder="Enter onDate" />
                                </div>
                            </div>
                        </div>

                        {/* Recovery */}
                        <div className={sectionStyle}>
                            <div className={sectionTitleStyle}>Recovery (BL /Qtls)</div>
                            <div className="grid gap-[16px]">
                                <div className="form-group">
                                    <label>Ondate</label>
                                    <input type="text" className="form-control" name="Dist_Rec_OnDate" value={formData.Dist_Rec_OnDate} onChange={handleInputChange} placeholder="Enter toDate" />
                                </div>
                                <div className="form-group">
                                    <label>Todate</label>
                                    <input type="text" className="form-control" name="Dist_Rec_ToDate" value={formData.Dist_Rec_ToDate} onChange={handleInputChange} placeholder="Enter toDate" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Capacity Utilisation */}
                    <div className={__cx(sectionStyle, "max-w-[50%]")}>
                        <div className={sectionTitleStyle}>Capacity Utilisation(%)</div>
                        <div className="grid gap-[16px]">
                            <div className="form-group">
                                <label>Ondate</label>
                                <input type="text" className="form-control" name="Dist_Cap_OnDate" value={formData.Dist_Cap_OnDate} onChange={handleInputChange} placeholder="Enter toDate" />
                            </div>
                            <div className="form-group">
                                <label>Todate</label>
                                <input type="text" className="form-control" name="Dist_Cap_ToDate" value={formData.Dist_Cap_ToDate} onChange={handleInputChange} placeholder="Enter toDate" />
                            </div>
                        </div>
                    </div>

                    {/* Stoppage Reason & Remark - side by side */}
                    <div className="grid gap-[16px] mb-[16px]">
                        <div className="form-group">
                            <label className="font-bold">Stoppage Reason</label>
                            <textarea className={__cx("form-control", "")} name="Dist_Stoppage" value={formData.Dist_Stoppage} onChange={handleInputChange} rows="3" placeholder="stoppage Reason"></textarea>
                        </div>
                        <div className="form-group">
                            <label className="font-bold">Remark</label>
                            <textarea className={__cx("form-control", "")} name="Dist_Remark" value={formData.Dist_Remark} onChange={handleInputChange} rows="3" placeholder="Remark"></textarea>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/WhatsApp/DistilleryEntryView')}>
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

export default DistilleryEntry;
