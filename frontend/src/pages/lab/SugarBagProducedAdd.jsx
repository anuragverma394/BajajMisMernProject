import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { labService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");const Lab_SugarBagProducedAdd = () => {const navigate = useNavigate();const [searchParams] = useSearchParams();const [factories, setFactories] = useState([]);const [loading, setLoading] = useState(false);const [activeTab, setActiveTab] = useState('tanks'); // 'tanks', 'large', 'medium', 'small'
  const [productionData, setProductionData] = useState([]);
  const [form, setForm] = useState({
    FACTORY: '',
    H_DATE: '',
    TIME: '06AM-07AM',
    SHIFT: '-Please Select-',
    MILL_NO: '1',
    COL2: '0', ADD_WATER: '0', DRAIN_POL1: '0', DRAIN_POL2: '0', DRAIN_POL3: '0', DRAIN_POL4: '0',
    SPRAY_WATER_POL: '0', SPRAY_WATER_POL2: '0', EXHST_PRS_DEVCI: '0', LIVE_ST_PRS: '0', BACK_PRS_DEVCI: '0', BACK_PRS_DEVCII: '0',
    L_31: '0', L_31CLR: '0', L_31RET: '0', L_30: '0', L_30CLR: '0', L_30RET: '0', L_29: '0', L_29CLR: '0', L_29RET: '0', LBAG_TEMP: '0',
    M_31: '0', M_31CLR: '0', M_31RET: '0', M_30: '0', M_30CLR: '0', M_30RET: '0', M_29: '0', M_29CLR: '0', M_29RET: '0',
    S_31: '0', S_31CLR: '0', S_31RET: '0', S_30: '0', S_30CLR: '0', S_30RET: '0', S_29: '0', S_29CLR: '0', S_29RET: '0', SS_31: '0'
  });

  useEffect(() => {
    masterService.getUnits().then((d) => setFactories(Array.isArray(d) ? d : [])).catch(() => {});

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const formattedDate = `${dd}/${mm}/${yyyy}`;
    setForm((prev) => ({ ...prev, H_DATE: formattedDate }));

    loadTableData('0', formattedDate);
  }, []);

  const loadTableData = async (factory, date) => {
    try {
      const res = await labService.getSugarBagProducedView(factory, date);
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setProductionData(data);
    } catch {
      setProductionData([]);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.FACTORY) {
      toast.error("Please select a factory.");
      return;
    }
    setLoading(true);
    try {
      await labService.saveDailyAnalysis(form);
      toast.success('Saved successfully!');
      loadTableData(form.FACTORY, form.H_DATE);
    } catch (error) {
      toast.error('Error saving records');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const fields = [
    'L_31', 'L_30', 'L_29',
    'M_31', 'M_30', 'M_29',
    'S_31', 'S_30', 'S_29', 'SS_31'];

    return fields.reduce((sum, f) => sum + (parseFloat(form[f]) || 0), 0);
  };

  const TabContent = () => {
    switch (activeTab) {
      case 'tanks':
        return (
          <div className="form-grid-4">
                        <div className="form-group"><label>Juice Flow</label><input type="number" name="COL2" className="form-control" value={form.COL2} onChange={handleInput} /></div>
                        <div className="form-group"><label>Added Water</label><input type="number" name="ADD_WATER" className="form-control" value={form.ADD_WATER} onChange={handleInput} /></div>
                        <div className="form-group"><label>Mill House</label><input type="number" name="DRAIN_POL1" className="form-control" value={form.DRAIN_POL1} onChange={handleInput} /></div>
                        <div className="form-group"><label>Boiling House</label><input type="number" name="DRAIN_POL2" className="form-control" value={form.DRAIN_POL2} onChange={handleInput} /></div>
                        <div className="form-group"><label>Centrifugal</label><input type="number" name="DRAIN_POL3" className="form-control" value={form.DRAIN_POL3} onChange={handleInput} /></div>
                        <div className="form-group"><label>Miscellaneous</label><input type="number" name="DRAIN_POL4" className="form-control" value={form.DRAIN_POL4} onChange={handleInput} /></div>
                        <div className="form-group"><label>S.P. Inlet Pol</label><input type="number" name="SPRAY_WATER_POL" className="form-control" value={form.SPRAY_WATER_POL} onChange={handleInput} /></div>
                        <div className="form-group"><label>S.P. Outlet Pol</label><input type="number" name="SPRAY_WATER_POL2" className="form-control" value={form.SPRAY_WATER_POL2} onChange={handleInput} /></div>
                    </div>);

      case 'large':
        return (
          <div className="form-grid-4">
                        <div className="form-group"><label>L-31 Qty</label><input type="number" name="L_31" className="form-control" value={form.L_31} onChange={handleInput} /></div>
                        <div className="form-group"><label>L-31 CLR</label><input type="number" name="L_31CLR" className="form-control" value={form.L_31CLR} onChange={handleInput} /></div>
                        <div className="form-group"><label>L-31 RET</label><input type="number" name="L_31RET" className="form-control" value={form.L_31RET} onChange={handleInput} /></div>
                        <div className="form-group"><label>L-30 Qty</label><input type="number" name="L_30" className="form-control" value={form.L_30} onChange={handleInput} /></div>
                        <div className="form-group"><label>L-30 CLR</label><input type="number" name="L_30CLR" className="form-control" value={form.L_30CLR} onChange={handleInput} /></div>
                        <div className="form-group"><label>L-30 RET</label><input type="number" name="L_30RET" className="form-control" value={form.L_30RET} onChange={handleInput} /></div>
                        <div className="form-group"><label>L-29 Qty</label><input type="number" name="L_29" className="form-control" value={form.L_29} onChange={handleInput} /></div>
                        <div className="form-group"><label>L-29 CLR</label><input type="number" name="L_29CLR" className="form-control" value={form.L_29CLR} onChange={handleInput} /></div>
                        <div className="form-group"><label>L-29 RET</label><input type="number" name="L_29RET" className="form-control" value={form.L_29RET} onChange={handleInput} /></div>
                        <div className="form-group"><label>Bag Temp</label><input type="number" name="LBAG_TEMP" className="form-control" value={form.LBAG_TEMP} onChange={handleInput} /></div>
                    </div>);

      case 'medium':
        return (
          <div className="form-grid-4">
                        <div className="form-group"><label>M-31 Qty</label><input type="number" name="M_31" className="form-control" value={form.M_31} onChange={handleInput} /></div>
                        <div className="form-group"><label>M-31 CLR</label><input type="number" name="M_31CLR" className="form-control" value={form.M_31CLR} onChange={handleInput} /></div>
                        <div className="form-group"><label>M-31 RET</label><input type="number" name="M_31RET" className="form-control" value={form.M_31RET} onChange={handleInput} /></div>
                        <div className="form-group"><label>M-30 Qty</label><input type="number" name="M_30" className="form-control" value={form.M_30} onChange={handleInput} /></div>
                        <div className="form-group"><label>M-30 CLR</label><input type="number" name="M_30CLR" className="form-control" value={form.M_30CLR} onChange={handleInput} /></div>
                        <div className="form-group"><label>M-30 RET</label><input type="number" name="M_30RET" className="form-control" value={form.M_30RET} onChange={handleInput} /></div>
                        <div className="form-group"><label>M-29 Qty</label><input type="number" name="M_29" className="form-control" value={form.M_29} onChange={handleInput} /></div>
                        <div className="form-group"><label>M-29 CLR</label><input type="number" name="M_29CLR" className="form-control" value={form.M_29CLR} onChange={handleInput} /></div>
                        <div className="form-group"><label>M-29 RET</label><input type="number" name="M_29RET" className="form-control" value={form.M_29RET} onChange={handleInput} /></div>
                    </div>);

      case 'small':
        return (
          <div className="form-grid-4">
                        <div className="form-group"><label>S-31 Qty</label><input type="number" name="S_31" className="form-control" value={form.S_31} onChange={handleInput} /></div>
                        <div className="form-group"><label>S-31 CLR</label><input type="number" name="S_31CLR" className="form-control" value={form.S_31CLR} onChange={handleInput} /></div>
                        <div className="form-group"><label>S-31 RET</label><input type="number" name="S_31RET" className="form-control" value={form.S_31RET} onChange={handleInput} /></div>
                        <div className="form-group"><label>S-30 Qty</label><input type="number" name="S_30" className="form-control" value={form.S_30} onChange={handleInput} /></div>
                        <div className="form-group"><label>S-30 CLR</label><input type="number" name="S_30CLR" className="form-control" value={form.S_30CLR} onChange={handleInput} /></div>
                        <div className="form-group"><label>S-30 RET</label><input type="number" name="S_30RET" className="form-control" value={form.S_30RET} onChange={handleInput} /></div>
                        <div className="form-group"><label>S-29 Qty</label><input type="number" name="S_29" className="form-control" value={form.S_29} onChange={handleInput} /></div>
                        <div className="form-group"><label>S-29 CLR</label><input type="number" name="S_29CLR" className="form-control" value={form.S_29CLR} onChange={handleInput} /></div>
                        <div className="form-group"><label>S-29 RET</label><input type="number" name="S_29RET" className="form-control" value={form.S_29RET} onChange={handleInput} /></div>
                        <div className="form-group"><label>SS-31 Qty</label><input type="number" name="SS_31" className="form-control" value={form.SS_31} onChange={handleInput} /></div>
                    </div>);

      default:
        return null;
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg")}>
                <div className={__cx("page-card-header", "text-left text-[15px]")}>
                    Hourly Lab & Sugar Bag Produced
                </div>

                <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
                    <div className={__cx("section-panel", "border-0 p-[0] bg-[transparent] mb-[20px]")}>
                        <div className="text-[13px] text-[#666] mb-[10px] border-b border-b-[#ddd] pb-[5px]">Hourly Lab Entry</div>
                        <div className="form-grid-5">
                            <div className="form-group">
                                <label>Factory</label>
                                <select className="form-control" name="FACTORY" value={form.FACTORY} onChange={handleInput}>
                                    <option value="">Select Factory</option>
                                    {factories.map((f, idx) => <option key={`${f.F_Code || f.id}-${idx}`} value={f.F_Code || f.id}>{f.F_Name || f.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="text" className="form-control" name="H_DATE" value={form.H_DATE} onChange={handleInput} />
                            </div>
                            <div className="form-group">
                                <label>Time</label>
                                <select className="form-control" name="TIME" value={form.TIME} onChange={handleInput}>
                                    {["06AM-07AM", "07AM-08AM", "08AM-09AM", "09AM-10AM", "10AM-11AM", "11AM-12PM", "12PM-01PM", "01PM-02PM", "02PM-03PM", "03PM-04PM", "04PM-05PM", "05PM-06PM", "06PM-07PM", "07PM-08PM", "08PM-09PM", "09PM-10PM", "10PM-11PM", "11PM-12AM", "12AM-01AM", "01AM-02AM", "02AM-03AM", "03AM-04AM", "04AM-05AM", "05AM-06AM"].map((t, idx) => <option key={`${t}-${idx}`} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Shift</label>
                                <select className="form-control" name="SHIFT" value={form.SHIFT} onChange={handleInput}>
                                    <option value="-Please Select-">-Please Select-</option>
                                    <option value="A">Shift A</option>
                                    <option value="B">Shift B</option>
                                    <option value="C">Shift C</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Mill No</label>
                                <select className="form-control" name="MILL_NO" value={form.MILL_NO} onChange={handleInput}>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-[15px] mb-[20px]">
                        {['tanks', 'large', 'medium', 'small'].map((t, idx) =>
            <button
              key={t}
              className={activeTab === t ? "btn btn-primary bg-[#008080] border-[#004d40]" : "btn btn-primary bg-[#16a085] border-[#16a085]"}
              onClick={() => setActiveTab(t)}>
              
                                {t === 'tanks' ? 'Juice Tanks Entry' : `Sugar Bag Produced ${t.charAt(0).toUpperCase() + t.slice(1)} Entry`}
                            </button>
            )}
                    </div>

                    <div className={__cx("section-panel", "border border-[#ddd] p-[15px] rounded bg-white mb-[20px]")}>
                        <div className="text-[#d9534f] text-[12px] font-bold mb-[15px] border-b border-b-[#eee] pb-[5px]">
                            {activeTab === 'tanks' ? 'Juice Tanks Entry' : `Sugar Bag Produced ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Entry`}
                        </div>
                        <TabContent />
                    </div>

                    <div className="flex justify-between items-center">
                        <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
                            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>Save</button>
                            <button className="btn btn-primary" onClick={() => navigate('/Lab/SugarBagProducedView')}>View</button>
                            <button className="btn btn-primary" onClick={() => navigate(-1)}>Exit</button>
                        </div>
                        <div className="flex items-center gap-[10px]">
                            <span className="font-bold text-[13px]">Total :</span>
                            <div className={__cx("form-control", "w-[80px] text-center bg-white flex items-center justify-center")}>
                                {calculateTotal()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={__cx("page-card", "mt-[20px] rounded-lg")}>
                <div className={__cx("page-card-body", "bg-[#f5f5e8] p-[15px]")}>
                    <div className="text-[13px] text-[#666] mb-[15px] border-b border-b-[#ddd] pb-[5px]">Hourly View</div>
                    <div className={__cx("table-wrapper", "max-h-[40vh] overflow-y-auto overflow-x-auto")}>
                        <table className={__cx("data-table", "text-[11px]")}>
                            <thead>
                                <tr>
                                    <th className="min-w-[80px]">TIME</th>
                                    <th className="min-w-[100px]">TIME_IN_HOURS</th>
                                    <th>SHIFT</th>
                                    <th>DATE</th>
                                    <th>MILLNO</th>
                                    <th>Juice Flow</th>
                                    <th>Added Water</th>
                                    <th>Mill house</th>
                                    <th>Boiling House</th>
                                    <th>Centrifugal House</th>
                                    <th>Miscellaneous</th>
                                    <th>Spray Pond Inlet Pol</th>
                                    <th>Spray Pond Outlet Pol</th>
                                    <th>Spray Pond Inlet PH</th>
                                    <th>Spray Pond Outlet PH</th>
                                    <th>Spray Pond Inlet Temp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productionData.length === 0 ?
                <tr><td colSpan="16" className="text-center">No records found.</td></tr> :

                productionData.map((row, idx) =>
                <tr key={idx}>
                                            <td>{row.TIME}</td>
                                            <td>{row.TIME_IN_HOURS}</td>
                                            <td>{row.SHIFT}</td>
                                            <td>{row.DATE}</td>
                                            <td>{row.MILLNO}</td>
                                            <td>{row.COL2}</td>
                                            <td>{row.ADD_WATER}</td>
                                            <td colSpan="9"></td>
                                        </tr>
                )
                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>);

};

export default Lab_SugarBagProducedAdd;