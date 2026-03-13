import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Save, List, LogOut, ChevronRight, Factory, Truck, Box, ShieldCheck, Activity } from 'lucide-react';
import { masterService } from '../../microservices/api.service';

const Main_AddModeGroup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [unitCode, setUnitCode] = useState('');
  const [modeCode, setModeCode] = useState('');
  const [groupMode, setGroupMode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [mockModes, setMockModes] = useState([]);
  const [factories, setFactories] = useState([]);

  function handleUnitChange(value) {
    setUnitCode(value);
    if (value) {
      setMockModes([
      { code: 'Cart', name: 'Unmechanized Cart' },
      { code: 'Trolly Small', name: 'Intermediate Trolley' },
      { code: 'Trolly Large', name: 'Bulk Logistics Trolley' },
      { code: 'Truck', name: 'Heavy Industrial Truck' }]
      );
    } else {
      setMockModes([]);
    }
  }

  useEffect(() => {
    masterService.getUnits().then((d) => setFactories(Array.isArray(d) ? d : [])).catch(() => {});

    const queryParams = new URLSearchParams(location.search);
    const editId = queryParams.get('id');
    if (editId) {
      setIsEditMode(true);
      setUnitCode('1');
      setGroupMode('2');
      handleUnitChange('1');
      setTimeout(() => setModeCode('Trolly Small'), 100);
    }
  }, [location.search]);

  const handleSaveOrUpdate = (e) => {
    if (e) e.preventDefault();
    if (!unitCode || !modeCode || !groupMode) {
      toast.error('Industrial alert: Mandatory parameter omission detected. Protocol requires all marked fields.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success(isEditMode ? 'Logistical mapping updated in central vault.' : 'New logistical mode group sequence registered.');
      navigate('/Main/AddModeGroupView');
    }, 800);
  };

  const headerStyle = "bg-[#008080] text-white py-[12px] px-[20px] text-[18px] font-medium rounded-[8px 8px 0 0] mb-[1px]";









  const cardStyle = "p-[30px] border border-[#e0e0e0] rounded-[0 0 8px 8px] bg-white shadow-[0 2px 4px rgba(0,0,0,0.05)] mb-[20px]";








  const sectionHeaderStyle = "text-[13px] text-[#666] border-b border-b-[#ddd] pb-[10px] mb-[25px] font-medium flex items-center gap-[8px]";











  const labelStyle = "block mb-[8px] text-[13px] font-semibold text-[#444]";







  const inputStyle = "w-[100%] py-[10px] px-[12px] border border-[#ccc] rounded text-[13px] bg-white  ";










  const btnStyle = (bg = '#16a085') => ({
    padding: '12px 28px',
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
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  });

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
                <div className="bg-[#1F9E8A] text-white py-[10px] px-[20px] text-[15px] font-medium text-center">
                    Add Group Mode
                </div>

                <div className="p-[20px] bg-[#fafafa]">
                    <div className="grid gap-[30px] mb-[25px] max-w-[1000px]">

                        <div className="grid gap-[30px] mb-[40px]">
                            <div>
                                <label className="block mb-[8px] text-[13px] text-[#111]">Units</label>
                                <select

                  value={unitCode}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  disabled={isEditMode} className="w-[100%] py-[8px] px-[12px] text-[13px] border border-[#e2e8f0] rounded text-[#333] bg-white">
                  
                                    <option value="">All</option>
                                    {factories.map((f, idx) =>
                  <option key={`${f.f_Code || f.id}-${idx}`} value={f.f_Code || f.id}>{f.F_Name || f.name}</option>
                  )}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-[8px] text-[13px] text-[#111]">Mode</label>
                                <select

                  value={modeCode}
                  onChange={(e) => setModeCode(e.target.value)}
                  disabled={!unitCode || isEditMode} className="w-[100%] py-[8px] px-[12px] text-[13px] border border-[#e2e8f0] rounded text-[#333] bg-white">
                  
                                    <option value="">All</option>
                                    {mockModes.map((mode, idx) =>
                  <option key={`${mode.code}-${idx}`} value={mode.code}>{mode.name}</option>
                  )}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-[8px] text-[13px] text-[#111]">Group Mode</label>
                                <select

                  value={groupMode}
                  onChange={(e) => setGroupMode(e.target.value)} className="w-[100%] py-[8px] px-[12px] text-[13px] border border-[#e2e8f0] rounded text-[#333] bg-white">
                  
                                    <option value="">--Select--</option>
                                    <option value="1">Unmechanized Transport Group</option>
                                    <option value="2">Intermediate Trolley Matrix</option>
                                    <option value="3">Bulk Logistic Sequence</option>
                                    <option value="4">Heavy Industrial Fleet</option>
                                </select>
                            </div>
                        </div>

                    </div>

                    <div className="flex gap-[8px]">
                        <button onClick={handleSaveOrUpdate} disabled={isLoading} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => navigate('/Main/AddModeGroupView')} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
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

export default Main_AddModeGroup;