import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const Main_AddSeason = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [unitCode, setUnitCode] = useState('');
  const [seasonStartDate, setSeasonStartDate] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftHours, setShiftHours] = useState('');
  const [changeTime, setChangeTime] = useState('');
  const [gateCode, setGateCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => {});

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    setSeasonStartDate(`${dd}-${mm}-${yyyy} 00:00:00`);

    const queryParams = new URLSearchParams(location.search);
    const editId = queryParams.get('id');
    if (editId) {
      setIsEditMode(true);
      setUnitCode('1');
      setSeasonStartDate('28-02-2026 00:00:00');
      setShiftStartTime('06:00');
      setShiftHours('8');
      setChangeTime('14:00');
      setGateCode('101');
    }
  }, [location.search]);

  const timeOptions = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    timeOptions.push(`${hour}:00`);
    timeOptions.push(`${hour}:30`);
  }

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Season Saved Successfully!');
      navigate('/Main/AddSeasonView');
    }, 800);
  };

  return (
    <div className={__cx("dn-container", "p-[15px]")}>
            <Toaster position="top-right" />

            <div className="dn-card">
                <div className="bg-[#1F9E8A] text-white py-[10px] px-[16px] text-4 font-bold text-center">
                    Add Season
                </div>

                <div className="dn-card-body">
                    <div className="dn-row dn-row-4">
                        <div className="dn-form-group">
                            <label className="text-[#333]">Units</label>
                            <div className="dn-form-line">
                                <select value={unitCode} onChange={(e) => setUnitCode(e.target.value)}>
                                    <option value="">All</option>
                                    {units.map((unit, idx) =>
                  <option key={`${unit.f_Code || unit.id}-${idx}`} value={unit.f_Code || unit.id}>
                                            {unit.F_Name || unit.name}
                                        </option>
                  )}
                                </select>
                            </div>
                        </div>
                        <div className="dn-form-group">
                            <label className="text-[#333]">Start Season</label>
                            <div className="dn-form-line">
                                <input
                  type="text"
                  value={seasonStartDate}
                  onChange={(e) => setSeasonStartDate(e.target.value)} />
                
                            </div>
                        </div>
                        <div className="dn-form-group">
                            <label className="text-[#333]">Shift Start Time</label>
                            <div className="dn-form-line">
                                <select value={shiftStartTime} onChange={(e) => setShiftStartTime(e.target.value)}>
                                    <option value="">--Select--</option>
                                    {timeOptions.map((t, idx) => <option key={`${t}-${idx}`} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="dn-form-group">
                            <label className="text-[#333]">Shift Hours</label>
                            <div className="dn-form-line">
                                <input
                  type="text"
                  value={shiftHours}
                  onChange={(e) => setShiftHours(e.target.value)} />
                
                            </div>
                        </div>
                    </div>

                    <div className={__cx("dn-row dn-row-4", "mt-[10px]")}>
                        <div className="dn-form-group">
                            <label className="text-[#333]">Change Time</label>
                            <div className="dn-form-line">
                                <select value={changeTime} onChange={(e) => setChangeTime(e.target.value)}>
                                    <option value="">--Select--</option>
                                    {timeOptions.map((t, idx) => <option key={`${t}-${idx}`} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="dn-form-group">
                            <label className="text-[#333]">Gate Code</label>
                            <div className="dn-form-line">
                                <input
                  type="text"
                  value={gateCode}
                  onChange={(e) => setGateCode(e.target.value)} />
                
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-[8px] mt-[20px]">
                        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isLoading}>
                            Save
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => navigate('/Main/AddSeasonView')}>
                            View
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        </div>);

};

export default Main_AddSeason;