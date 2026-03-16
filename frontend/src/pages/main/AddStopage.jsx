import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService } from '../../microservices/api.service';
import '../../styles/base.css';

const Main_AddStopage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Form State
  const [unitCode, setUnitCode] = useState('');
  const [operationMode, setOperationMode] = useState('1');
  const [remark, setRemark] = useState('');
  const [factories, setFactories] = useState([]);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const resolveOperationMode = (data) => {
    const pim = Number(data?.STP_PIM ?? 0);
    const pio = Number(data?.STP_PIOR ?? data?.STP_PIO ?? 0);
    if (pim > 0) return '2';
    if (pio > 0) return '1';
    return '1';
  };

  useEffect(() => {
    masterService.getUnits().then((d) => setFactories(Array.isArray(d) ? d : [])).catch(() => {});

    const queryParams = new URLSearchParams(location.search);
    const editId = queryParams.get('id') || queryParams.get('sid');

    if (!editId) {
      setIsEditMode(false);
      return;
    }

    setIsEditMode(true);
    masterService.getStopageById(editId)
      .then((data) => {
        if (data && (data.STP_Unit || data.STPID)) {
          setUnitCode(String(data.STP_Unit || ''));
          setOperationMode(resolveOperationMode(data));
          setRemark(String(data.STP_Remark || '').trim());
        }
      })
      .catch(() => {});
  }, [location.search]);

  const handleSaveOrUpdate = async (e) => {
    if (e) e.preventDefault();

    if (!unitCode) {
      toast.error("Industrial alert: Manufacturing unit identity mapping required.");
      return;
    }

    setIsLoading(true);
    try {
      const isMaintenance = operationMode === '2';
      const payload = {
        id: isEditMode ? 'btupdate' : 'btninsert',
        STP_Unit: unitCode,
        STP_PIO: isMaintenance ? '0' : '1',
        STP_PIM: isMaintenance ? '1' : '0',
        STP_Remark: remark || ''
      };
      await masterService.saveStopage(payload);
      toast.success(isEditMode ? 'Record updated.' : 'Saved successfully.');
      navigate('/Main/AddStopageView');
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to save stoppage.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
                <div className="bg-[#1F9E8A] text-white py-[10px] px-[20px] text-[15px] font-medium text-center">
                    Add Stopage
                </div>

                <div className="p-[20px] bg-[#fafafa]">
                    <div className="grid gap-[30px] mb-[25px] max-w-[1000px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111]">Units</label>
                            <select

                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                disabled={isEditMode} className="w-[100%] py-[8px] px-[12px] text-[13px] border border-[#e2e8f0] rounded text-[#333] bg-white">
                
                                <option value="">All</option>
                                {factories.map((f, idx) =>
                <option key={`${f.f_Code || f.id}-${idx}`} value={f.f_Code || f.id}>{f.F_Name || f.name}</option>
                )}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111]">Operation mode</label>
                            <div className="flex gap-[8px] mt-[6px]">
                                <label className="text-[13px] flex items-center gap-[8px] text-[#333] cursor-pointer">
                                    <input type="radio" name="opMode" value="1" checked={operationMode === '1'} onChange={() => setOperationMode('1')} className="" />
                                    Plant in Operation
                                </label>
                                <label className="text-[13px] flex items-center gap-[8px] text-[#333] cursor-pointer">
                                    <input type="radio" name="opMode" value="2" checked={operationMode === '2'} onChange={() => setOperationMode('2')} className="" />
                                    Plant in Maintenance
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111]">Remark</label>
                            <textarea

                value={remark}
                onChange={(e) => setRemark(e.target.value)} className="w-[100%] min-h-[80px] py-[8px] px-[12px] rounded border border-[#cbd5e1] text-[13px]" />
              
                        </div>
                    </div>

                    <div className="flex gap-[8px]">
                        <button onClick={handleSaveOrUpdate} disabled={isLoading} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            {isLoading ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
                        </button>
                        <button onClick={() => navigate('/Main/AddStopageView')} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            View
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        </div>);

};

export default Main_AddStopage;
