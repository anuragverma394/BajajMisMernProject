import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Save, RefreshCcw, Trash2, List, LogOut, Factory, Calendar, Activity, Database, AlertCircle } from 'lucide-react';const __cx = (...vals) => vals.filter(Boolean).join(" ");const Main_distilleryReportEntry = () => {const navigate = useNavigate();const location = useLocation(); // Form State
  const [unitCode, setUnitCode] = useState('');const [reportDate, setReportDate] = useState(''); // Restart Status
  const [restartStatus, setRestartStatus] = useState('0');
  const [restartDate, setRestartDate] = useState('');

  // RS Production
  const [rsOnDate, setRsOnDate] = useState('');
  const [rsToDate, setRsToDate] = useState('');
  const [prodType, setProdType] = useState('');

  // AA/ENA Production
  const [aaOnDate, setAaOnDate] = useState('');
  const [aaToDate, setAaToDate] = useState('');
  const [aaProdType, setAaProdType] = useState('');

  // Metrics
  const [recOnDate, setRecOnDate] = useState('');
  const [recToDate, setRecToDate] = useState('');
  const [capOnDate, setCapOnDate] = useState('');
  const [capToDate, setCapToDate] = useState('');

  // Text Areas
  const [stoppage, setStoppage] = useState('');
  const [remark, setRemark] = useState('');

  // UI Control
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const editId = queryParams.get('id');

    if (editId) {
      setIsEditMode(true);
      setUnitCode('1');
      setReportDate('2023-11-20');
      setRsOnDate('120');
      setRsToDate('4500');
      setProdType('B-Heavy');
      setAaOnDate('80');
      setAaToDate('3200');
      setAaProdType('B-Heavy');
      setRecOnDate('10.5');
      setRecToDate('10.2');
      setCapOnDate('95.5');
      setCapToDate('92.0');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setReportDate(today);
    }
  }, [location.search]);

  const handleProdTypeChange = (val) => {
    setProdType(val);
    setAaProdType(val);
  };

  const sumOnDate = (parseFloat(rsOnDate || 0) + parseFloat(aaOnDate || 0)).toFixed(2);
  const sumToDate = (parseFloat(rsToDate || 0) + parseFloat(aaToDate || 0)).toFixed(2);

  const handleSaveOrUpdate = (e) => {
    e.preventDefault();
    if (!unitCode || !reportDate) {
      toast.error("Security protocol: Manufacturing unit and operational date are required.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (isEditMode) toast.success("Ledger entry synchronized successfully.");else
      toast.success("Production data published to industrial records.");
      navigate('/Main/distilleryReportEntryView');
    }, 800);
  };

  const headerStyle = "bg-[#008080] text-white py-[12px] px-[20px] text-[18px] font-medium rounded-[8px 8px 0 0] mb-[1px]";









  const cardStyle = "p-[30px] border border-[#e0e0e0] rounded-[0 0 8px 8px] bg-white shadow-[0 2px 4px rgba(0,0,0,0.05)] mb-[20px]";








  const sectionTitleStyle = "text-[12px] text-[#008080] font-bold uppercase tracking-[1px] border-b border-b-[#eee] pb-[8px] mb-[20px] flex items-center gap-[8px]";













  const labelStyle = "block mb-[8px] text-[13px] font-semibold text-[#333]";







  const inputStyle = "w-[100%] py-[10px] px-[12px] border border-[#ccc] rounded text-[13px] bg-white  ";










  const btnStyle = (bg = '#16a085') => ({
    padding: '12px 30px',
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

  const subCardStyle = "bg-[#fcfcfc] p-[20px] rounded-lg border border-[#eee] mb-[20px]";







  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Inter', sans-serif]">
            <Toaster position="top-right" />

            <div className={headerStyle}>
                {isEditMode ? 'Modify' : 'Log'} Distillery Industrial Production Data
            </div>

            <div className={cardStyle}>
                <form onSubmit={handleSaveOrUpdate}>
                    <div className={sectionTitleStyle}>
                        <Factory size={16} /> Core Production Parameters
                    </div>

                    <div className="grid gap-[30px] mb-[35px]">
                        <div>
                            <label className={labelStyle}>Manufacturing Unit <span className="text-[#e74c3c]">*</span></label>
                            <select value={unitCode} onChange={(e) => setUnitCode(e.target.value)} required disabled={isEditMode} className={inputStyle}>
                                <option value="">-- Select Unit --</option>
                                <option value="1">Unit 1 Distillery</option>
                                <option value="2">Unit 2 Distillery</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Operational Target Date <span className="text-[#e74c3c]">*</span></label>
                            <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} required className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Unit Restart Status</label>
                            <select value={restartStatus} onChange={(e) => setRestartStatus(e.target.value)} className={inputStyle}>
                                <option value="0">-- Select Status --</option>
                                <option value="1">Operation Continuous</option>
                                <option value="2">Cold Startup Initiated</option>
                            </select>
                        </div>
                        {restartStatus === '2' &&
            <div>
                                <label className={__cx(labelStyle, "text-[#008080]")}>Restart Schedule Date</label>
                                <input type="date" value={restartDate} onChange={(e) => setRestartDate(e.target.value)} className={__cx(inputStyle, "border border-[#008080] bg-[#f0f9f9]")} />
                            </div>
            }
                    </div>

                    <div className="grid gap-[30px] mb-[10px]">
                        <div className={subCardStyle}>
                            <div className={sectionTitleStyle}>RS Production (A+B Grade)</div>
                            <div className="grid gap-[15px]">
                                <div>
                                    <label className={__cx(labelStyle, "text-[13px]")}>OnDate (Lac BL)</label>
                                    <input type="number" step="0.01" value={rsOnDate} onChange={(e) => setRsOnDate(e.target.value)} placeholder="0.00" className={inputStyle} />
                                </div>
                                <div>
                                    <label className={__cx(labelStyle, "text-[13px]")}>ToDate (Lac BL)</label>
                                    <input type="number" step="0.01" value={rsToDate} onChange={(e) => setRsToDate(e.target.value)} placeholder="0.00" className={inputStyle} />
                                </div>
                                <div>
                                    <label className={__cx(labelStyle, "text-[13px]")}>Feed Type</label>
                                    <select value={prodType} onChange={(e) => handleProdTypeChange(e.target.value)} className={inputStyle}>
                                        <option value="">-- Choose --</option>
                                        <option value="B-Heavy">B-Heavy</option>
                                        <option value="C-Heavy">C-Heavy</option>
                                        <option value="Juice">Direct Juice</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className={subCardStyle}>
                            <div className={sectionTitleStyle}>AA/ENA Production</div>
                            <div className="grid gap-[15px]">
                                <div>
                                    <label className={__cx(labelStyle, "text-[13px]")}>OnDate (Lac BL)</label>
                                    <input type="number" step="0.01" value={aaOnDate} onChange={(e) => setAaOnDate(e.target.value)} placeholder="0.00" className={inputStyle} />
                                </div>
                                <div>
                                    <label className={__cx(labelStyle, "text-[13px]")}>ToDate (Lac BL)</label>
                                    <input type="number" step="0.01" value={aaToDate} onChange={(e) => setAaToDate(e.target.value)} placeholder="0.00" className={inputStyle} />
                                </div>
                                <div>
                                    <label className={__cx(labelStyle, "text-[13px]")}>Feed Type (Linked)</label>
                                    <select disabled value={aaProdType} className={__cx(inputStyle, "bg-[#f0f0f0] text-[#888]")}>
                                        <option value="">-- Linked --</option>
                                        <option value="B-Heavy">B-Heavy</option>
                                        <option value="C-Heavy">C-Heavy</option>
                                        <option value="Juice">Direct Juice</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-[30px] mb-[35px]">
                        <div className="bg-[#f0f9f9] p-[20px] rounded-lg border border-[#16a085]">
                            <div className={__cx(sectionTitleStyle, "text-[#16a085] ")}>Integrated Production Matrix</div>
                            <div className="grid gap-[20px]">
                                <div>
                                    <label className={__cx(labelStyle, "text-[13px] text-[#16a085]")}>Total OnDate Sum</label>
                                    <input disabled type="text" value={sumOnDate} className={__cx(inputStyle, "font-bold text-[#16a085] border border-[#16a085]")} />
                                </div>
                                <div>
                                    <label className={__cx(labelStyle, "text-[13px] text-[#16a085]")}>Total ToDate Sum</label>
                                    <input disabled type="text" value={sumToDate} className={__cx(inputStyle, "font-bold text-[#16a085] border border-[#16a085]")} />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-[20px]">
                            <div className={__cx(subCardStyle, "mb-[0px]")}>
                                <div className={sectionTitleStyle}>Recovery (BL/Qtls)</div>
                                <div className="grid gap-[10px]">
                                    <input type="number" step="0.01" value={recOnDate} onChange={(e) => setRecOnDate(e.target.value)} placeholder="OD Recovery" className={inputStyle} />
                                    <input type="number" step="0.01" value={recToDate} onChange={(e) => setRecToDate(e.target.value)} placeholder="TD Recovery" className={inputStyle} />
                                </div>
                            </div>
                            <div className={__cx(subCardStyle, "mb-[0px]")}>
                                <div className={sectionTitleStyle}>Capacity %</div>
                                <div className="grid gap-[10px]">
                                    <input type="number" step="0.01" value={capOnDate} onChange={(e) => setCapOnDate(e.target.value)} placeholder="OD Capacity" className={inputStyle} />
                                    <input type="number" step="0.01" value={capToDate} onChange={(e) => setCapToDate(e.target.value)} placeholder="TD Capacity" className={inputStyle} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-[30px] mb-[40px]">
                        <div>
                            <label className={labelStyle}>Operational Stoppage Analysis</label>
                            <textarea value={stoppage} onChange={(e) => setStoppage(e.target.value)} placeholder="Enter technical downtime details..." className={__cx(inputStyle, "min-h-[100px] ")} />
                        </div>
                        <div>
                            <label className={labelStyle}>Audit Remarks</label>
                            <textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Enter administrative observations..." className={__cx(inputStyle, "min-h-[100px] ")} />
                        </div>
                    </div>

                    <div className="border-t border-t-[#eee] pt-[30px] flex gap-[12px]">
                        <button type="submit" disabled={isLoading} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            {isLoading ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
                            {isEditMode ? 'Sync Ledger' : 'Commit Production'}
                        </button>
                        {isEditMode &&
            <button type="button" onClick={() => toast.success("Record purged from ledger.")} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#e74c3c]">
                                <Trash2 size={18} /> Purge Record
                            </button>
            }
                        <button type="button" onClick={() => navigate('/Main/distilleryReportEntryView')} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#008080]">
                            <List size={18} /> Review Submissions
                        </button>
                        <button type="button" onClick={() => window.history.back()} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#95a5a6]">
                            <LogOut size={18} /> Disconnect
                        </button>
                    </div>
                </form>
            </div>
        </div>);

};

export default Main_distilleryReportEntry;