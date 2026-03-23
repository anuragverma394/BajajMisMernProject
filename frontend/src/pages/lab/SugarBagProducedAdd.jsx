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
    COL2: '0', ADD_WATER: '0', ADD_TANK: '0', DRAIN_POL1: '0', DRAIN_POL2: '0', DRAIN_POL3: '0', DRAIN_POL4: '0', DRAIN_POL5: '0',
    SPRAY_WATER_POL: '0', SPRAY_WATER_POL2: '0', EXHST_PRS_DEVCI: '0', LIVE_ST_PRS: '0', BACK_PRS_DEVCI: '0', BACK_PRS_DEVCII: '0',
    L_31: '0', L_31CLR: '0', L_31RET: '0', L_30: '0', L_30CLR: '0', L_30RET: '0', L_29: '0', L_29CLR: '0', L_29RET: '0', LBAG_TEMP: '0',
    M_31: '0', M_31CLR: '0', M_31RET: '0', M31BAG_TEMP: '0', M_30: '0', M_30CLR: '0', M_30RET: '0', M30BAG_TEMP: '0', M_29: '0', M_29CLR: '0', M_29RET: '0', M29BAG_TEMP: '0',
    S_31: '0', S_31CLR: '0', S_31RET: '0', S_30: '0', S_30CLR: '0', S_30RET: '0', S_29: '0', S_29CLR: '0', S_29RET: '0', SS_31: '0',
    SBAG_TEMP: '0', BISS: '0', BISSCLR: '0', BISSRET: '0',
    COL4: '0'
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

  useEffect(() => {
    const TIME = searchParams.get('TIME');
    const H_DATE = searchParams.get('H_DATE');
    const FACTORY = searchParams.get('FACTORY');
    const MILL_NO = searchParams.get('MILL_NO');
    if (!TIME || !H_DATE || !FACTORY || !MILL_NO) return;

    const loadForEdit = async () => {
      try {
        const res = await labService.getSugarBagProducedView(FACTORY, H_DATE);
        const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const row = data.find((r) => String(r.TIME) === String(TIME) && String(r.MILL_NO || r.MILLNO) === String(MILL_NO));
        if (!row) return;
        setForm((prev) => ({
          ...prev,
          FACTORY: String(FACTORY),
          H_DATE: H_DATE,
          TIME: row.TIME ?? prev.TIME,
          SHIFT: row.SHIFT ?? prev.SHIFT,
          MILL_NO: String(row.MILL_NO || row.MILLNO || prev.MILL_NO),
          COL2: row.COL2 ?? '0',
          ADD_WATER: row.ADD_WATER ?? '0',
          ADD_TANK: row.ADD_TANK ?? '0',
          DRAIN_POL1: row.DRAIN_POL1 ?? '0',
          DRAIN_POL2: row.DRAIN_POL2 ?? '0',
          DRAIN_POL3: row.DRAIN_POL3 ?? '0',
          DRAIN_POL4: row.DRAIN_POL4 ?? '0',
          DRAIN_POL5: row.DRAIN_POL5 ?? '0',
          SPRAY_WATER_POL: row.SPRAY_WATER_POL ?? '0',
          SPRAY_WATER_POL2: row.SPRAY_WATER_POL2 ?? '0',
          EXHST_PRS_DEVCI: row.EXHST_PRS_DEVCI ?? '0',
          LIVE_ST_PRS: row.LIVE_ST_PRS ?? '0',
          BACK_PRS_DEVCI: row.BACK_PRS_DEVCI ?? '0',
          BACK_PRS_DEVCII: row.BACK_PRS_DEVCII ?? '0',
          L_31: row.L_31 ?? '0',
          L_31CLR: row.L_31CLR ?? '0',
          L_31RET: row.L_31RET ?? '0',
          L_30: row.L_30 ?? '0',
          L_30CLR: row.L_30CLR ?? '0',
          L_30RET: row.L_30RET ?? '0',
          L_29: row.L_29 ?? '0',
          L_29CLR: row.L_29CLR ?? '0',
          L_29RET: row.L_29RET ?? '0',
          LBAG_TEMP: row.LBAG_TEMP ?? '0',
          M_31: row.M_31 ?? '0',
          M_31CLR: row.M_31CLR ?? '0',
          M_31RET: row.M_31RET ?? '0',
          M31BAG_TEMP: row.M31BAG_TEMP ?? '0',
          M_30: row.M_30 ?? '0',
          M_30CLR: row.M_30CLR ?? '0',
          M_30RET: row.M_30RET ?? '0',
          M30BAG_TEMP: row.M30BAG_TEMP ?? '0',
          M_29: row.M_29 ?? '0',
          M_29CLR: row.M_29CLR ?? '0',
          M_29RET: row.M_29RET ?? '0',
          M29BAG_TEMP: row.M29BAG_TEMP ?? '0',
          S_31: row.S_31 ?? '0',
          S_31CLR: row.S_31CLR ?? '0',
          S_31RET: row.S_31RET ?? '0',
          S_30: row.S_30 ?? '0',
          S_30CLR: row.S_30CLR ?? '0',
          S_30RET: row.S_30RET ?? '0',
          S_29: row.S_29 ?? '0',
          S_29CLR: row.S_29CLR ?? '0',
          S_29RET: row.S_29RET ?? '0',
          SS_31: row.SS_31 ?? '0',
          SBAG_TEMP: row.SBAG_TEMP ?? '0',
          BISS: row.BISS ?? '0',
          BISSCLR: row.BISSCLR ?? '0',
          BISSRET: row.BISSRET ?? '0',
          COL4: row.COL4 ?? '0'
        }));
      } catch {
        // ignore
      }
    };

    loadForEdit();
  }, [searchParams]);

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
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Juice Flow</label><input type="number" name="COL2" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.COL2} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Add Tank</label><input type="number" name="ADD_TANK" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.ADD_TANK} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Added Water</label><input type="number" name="ADD_WATER" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.ADD_WATER} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Mill House</label><input type="number" name="DRAIN_POL1" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.DRAIN_POL1} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Boiling House</label><input type="number" name="DRAIN_POL2" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.DRAIN_POL2} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Centrifugal</label><input type="number" name="DRAIN_POL3" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.DRAIN_POL3} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Miscellaneous</label><input type="number" name="DRAIN_POL4" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.DRAIN_POL4} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Drain Pol 5</label><input type="number" name="DRAIN_POL5" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.DRAIN_POL5} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">S.P. Inlet Pol</label><input type="number" name="SPRAY_WATER_POL" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.SPRAY_WATER_POL} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">S.P. Outlet Pol</label><input type="number" name="SPRAY_WATER_POL2" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.SPRAY_WATER_POL2} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Spray Pond Inlet PH</label><input type="number" name="EXHST_PRS_DEVCI" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.EXHST_PRS_DEVCI} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Spray Pond Outlet PH</label><input type="number" name="LIVE_ST_PRS" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.LIVE_ST_PRS} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Spray Pond Inlet Temp</label><input type="number" name="BACK_PRS_DEVCI" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.BACK_PRS_DEVCI} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Spray Pond Outlet Temp</label><input type="number" name="BACK_PRS_DEVCII" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.BACK_PRS_DEVCII} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">COL4</label><input type="number" name="COL4" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.COL4} onChange={handleInput} /></div>
                    </div>);

      case 'large':
        return (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">L-31 Qty</label><input type="number" name="L_31" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.L_31} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">L-31 CLR</label><input type="number" name="L_31CLR" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.L_31CLR} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">L-31 RET</label><input type="number" name="L_31RET" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.L_31RET} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">L-30 Qty</label><input type="number" name="L_30" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.L_30} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">L-30 CLR</label><input type="number" name="L_30CLR" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.L_30CLR} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">L-30 RET</label><input type="number" name="L_30RET" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.L_30RET} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">L-29 Qty</label><input type="number" name="L_29" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.L_29} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">L-29 CLR</label><input type="number" name="L_29CLR" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.L_29CLR} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">L-29 RET</label><input type="number" name="L_29RET" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.L_29RET} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Bag Temp</label><input type="number" name="LBAG_TEMP" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.LBAG_TEMP} onChange={handleInput} /></div>
                    </div>);

      case 'medium':
        return (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">M-31 Qty</label><input type="number" name="M_31" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.M_31} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">M-31 CLR</label><input type="number" name="M_31CLR" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.M_31CLR} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">M-31 RET</label><input type="number" name="M_31RET" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.M_31RET} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">M-31 Bag Temp</label><input type="number" name="M31BAG_TEMP" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.M31BAG_TEMP} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">M-30 Qty</label><input type="number" name="M_30" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.M_30} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">M-30 CLR</label><input type="number" name="M_30CLR" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.M_30CLR} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">M-30 RET</label><input type="number" name="M_30RET" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.M_30RET} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">M-30 Bag Temp</label><input type="number" name="M30BAG_TEMP" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.M30BAG_TEMP} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">M-29 Qty</label><input type="number" name="M_29" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.M_29} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">M-29 CLR</label><input type="number" name="M_29CLR" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.M_29CLR} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">M-29 RET</label><input type="number" name="M_29RET" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.M_29RET} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">M-29 Bag Temp</label><input type="number" name="M29BAG_TEMP" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.M29BAG_TEMP} onChange={handleInput} /></div>
                    </div>);

      case 'small':
        return (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">S-31 Qty</label><input type="number" name="S_31" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.S_31} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">S-31 CLR</label><input type="number" name="S_31CLR" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.S_31CLR} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">S-31 RET</label><input type="number" name="S_31RET" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.S_31RET} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">S-30 Qty</label><input type="number" name="S_30" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.S_30} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">S-30 CLR</label><input type="number" name="S_30CLR" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.S_30CLR} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">S-30 RET</label><input type="number" name="S_30RET" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.S_30RET} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">S-29 Qty</label><input type="number" name="S_29" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.S_29} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">S-29 CLR</label><input type="number" name="S_29CLR" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.S_29CLR} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">S-29 RET</label><input type="number" name="S_29RET" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.S_29RET} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">SS-31 Qty</label><input type="number" name="SS_31" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.SS_31} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">S. Bag Temp</label><input type="number" name="SBAG_TEMP" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.SBAG_TEMP} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">BISS</label><input type="number" name="BISS" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.BISS} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">BISS CLR</label><input type="number" name="BISSCLR" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.BISSCLR} onChange={handleInput} /></div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">BISS RET</label><input type="number" name="BISSRET" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.BISSRET} onChange={handleInput} /></div>
                    </div>);

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white px-5 py-5 font-['Poppins',Arial,sans-serif]">
            <Toaster position="top-right" />

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
                <div className="rounded-t-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                    Hourly Lab & Sugar Bag Produced
                </div>

                <div className="space-y-4 p-4">
                    <div className="text-xs font-semibold text-slate-600">Hourly Lab Entry</div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">Factory</label>
                            <select className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" name="FACTORY" value={form.FACTORY} onChange={handleInput}>
                                <option value="">Select Factory</option>
                                {factories.map((f, idx) => <option key={`${f.F_Code || f.id}-${idx}`} value={f.F_Code || f.id}>{f.F_Name || f.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">Date</label>
                            <input type="text" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" name="H_DATE" value={form.H_DATE} onChange={handleInput} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">Time</label>
                            <select className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" name="TIME" value={form.TIME} onChange={handleInput}>
                                {["06AM-07AM", "07AM-08AM", "08AM-09AM", "09AM-10AM", "10AM-11AM", "11AM-12PM", "12PM-01PM", "01PM-02PM", "02PM-03PM", "03PM-04PM", "04PM-05PM", "05PM-06PM", "06PM-07PM", "07PM-08PM", "08PM-09PM", "09PM-10PM", "10PM-11PM", "11PM-12AM", "12AM-01AM", "01AM-02AM", "02AM-03AM", "03AM-04AM", "04AM-05AM", "05AM-06AM"].map((t, idx) => <option key={`${t}-${idx}`} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">Shift</label>
                            <select className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" name="SHIFT" value={form.SHIFT} onChange={handleInput}>
                                <option value="-Please Select-">-Please Select-</option>
                                <option value="A">Shift A</option>
                                <option value="B">Shift B</option>
                                <option value="C">Shift C</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">Mill No</label>
                            <select className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" name="MILL_NO" value={form.MILL_NO} onChange={handleInput}>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {['tanks', 'large', 'medium', 'small'].map((t, idx) =>
            <button
              key={t}
              className={activeTab === t ? "rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" : "rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"}
              onClick={() => setActiveTab(t)}>
              
                                {t === 'tanks' ? 'Juice Tanks Entry' : `Sugar Bag Produced ${t.charAt(0).toUpperCase() + t.slice(1)} Entry`}
                            </button>
            )}
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="mb-3 border-b border-slate-200 pb-2 text-xs font-bold text-rose-600">
                            {activeTab === 'tanks' ? 'Juice Tanks Entry' : `Sugar Bag Produced ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Entry`}
                        </div>
                        <TabContent />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2">
                            <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60" onClick={handleSave} disabled={loading}>Save</button>
                            <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700" onClick={() => navigate('/Lab/SugarBagProducedView')}>View</button>
                            <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700" onClick={() => navigate(-1)}>Exit</button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-700">Total :</span>
                            <div className="flex h-9 w-20 items-center justify-center rounded-md border border-slate-300 bg-white text-sm font-semibold">
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
