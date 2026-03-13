import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { UserSearch, Shield, Save, List, LogOut, Trash2 } from 'lucide-react';
import { userManagementService } from '../../microservices/api.service';const __cx = (...vals) => vals.filter(Boolean).join(" ");const UserManagement_AddUserRight = () => {const navigate = useNavigate();const location = useLocation(); // Form state
  const [userId, setUserId] = useState('');const [userName, setUserName] = useState('');const [useRollList, setUseRollList] = useState(false);
  const [useAllPages, setUseAllPages] = useState(false);
  const [internalId, setInternalId] = useState('');

  const [units, setUnits] = useState([]);
  const [rolls, setRolls] = useState([]);
  const [rollDetails, setRollDetails] = useState([]);
  const [allPages, setAllPages] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('ID');
    const factid = queryParams.get('factid');
    if (id) {
      setIsEditMode(true);
      setInternalId(id);
      fetchInitialData(id, factid);
    }
  }, [location.search]);

  const fetchInitialData = async (id, factid) => {
    try {
      setLoading(true);
      const userData = await userManagementService.getUserByCode(id);
      if (userData) {
        setUserId(userData.Userid || id);
        setUserName(userData.username);
        setUnits(userData.otherlist || []);
      }

      if (factid) {
        const rollsRes = await userManagementService.getRollData({ ID: id, factid });
        setRolls(rollsRes || []);
        const selectedRolls = rollsRes.filter((r) => r.datavalue).map((r) => r.R_Code);
        if (selectedRolls.length > 0) {
          setUseRollList(true);
          fetchRollDetails(selectedRolls);
        }
      }
    } catch (error) {
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleUserIdBlur = async () => {
    if (!userId || isEditMode) return;
    try {
      setLoading(true);
      const data = await userManagementService.getUserByCode(userId);
      if (data.username === "0") {
        toast.error("User not found!");
        setUserName('');
        setUnits([]);
      } else {
        setUserName(data.username);
        setUnits(data.otherlist || []);
        toast.success("User verified");
      }
    } catch (error) {
      toast.error("Error fetching user");
    } finally {
      setLoading(false);
    }
  };

  const fetchRollDetails = async (rcodes) => {
    try {
      const data = await userManagementService.getRollDetails(rcodes);
      setRollDetails(data || []);
    } catch (error) {
      toast.error("Failed to load roll details");
    }
  };

  const handleRollToggle = async (code) => {
    const updatedRolls = rolls.map((r) => r.R_Code === code ? { ...r, isSelected: !r.isSelected } : r);
    setRolls(updatedRolls);
    const selectedCodes = updatedRolls.filter((r) => r.isSelected || r.datavalue).map((r) => r.R_Code);
    if (selectedCodes.length > 0) {
      fetchRollDetails(selectedCodes);
    } else {
      setRollDetails([]);
    }
  };

  const handleAllPagesToggle = async (checked) => {
    setUseAllPages(checked);
    if (checked) {
      try {
        const data = await userManagementService.getRollModules({ ID: internalId || '', r_code: userId });
        setAllPages(data || []);
      } catch (error) {
        toast.error("Failed to load modules");
      }
    } else {
      setAllPages([]);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error("User Code is required");
      return;
    }

    const payload = {
      Command: isEditMode ? 'Update' : 'Save',
      Usercode: userId,
      rollcode: rolls.filter((r) => r.isSelected || r.datavalue).map((r) => r.R_Code),
      unitS: units.filter((u) => u.isSelected || u.f_Code !== '').map((u, idx) => ({ f_Code: u.f_Code })),
      AllArry: allPages
    };

    try {
      setLoading(true);
      await userManagementService.saveUserRights(payload);
      toast.success(`User rights ${isEditMode ? 'updated' : 'assigned'} successfully!`);
      navigate('/UserManagement/AddUserViewRight');
    } catch (error) {
      toast.error("Failed to save user rights");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Do you want to delete the record?")) {
      try {
        setLoading(true);
        await userManagementService.deleteUserRights(internalId, userId);
        toast.success("Record Deleted Successfully!");
        navigate('/UserManagement/AddUserViewRight');
      } catch (error) {
        toast.error("Delete failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const headerStyle = "bg-[#008080] text-white py-[12px] px-[20px] text-[18px] font-medium rounded-[8px 8px 0 0] mb-[1px]";









  const cardStyle = "p-[30px] border border-[#e0e0e0] rounded-[0 0 8px 8px] bg-white shadow-[0 2px 4px rgba(0,0,0,0.05)] mb-[20px]";








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

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Inter', sans-serif]">
            <Toaster position="top-right" />

            <div className={headerStyle}>
                Assign User Permissions & Activity Rights
            </div>

            <div className={cardStyle}>
                <div className="grid gap-[40px]">

                    {/* LEFT PANEL: IDENTIFICATION & UNITS */}
                    <div className="pr-[40px]">
                        <div className="mb-[30px]">
                            <div className="text-[13px] text-[#666] border-b border-b-[#ddd] pb-[10px] mb-[20px] font-medium">
                                User Identification
                            </div>
                            <div className="mb-[20px]">
                                <label className={labelStyle}>User Code (ID)</label>
                                <div className="relative">
                                    <input
                    type="text"

                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    onBlur={handleUserIdBlur}
                    disabled={isEditMode}
                    placeholder="Enter system ID" className={__cx(inputStyle, "pl-[40px]")} />
                  
                                    <UserSearch size={18} className="absolute left-[12px] top-[50%] text-[#008080]" />
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>System Verified Name</label>
                                <input
                  type="text"

                  value={userName}
                  readOnly
                  placeholder="Verified name will appear here" className={__cx(inputStyle, "bg-[#f9f9f9] font-bold text-[#008080]")} />
                
                            </div>
                        </div>

                        <div className="mb-[30px]">
                            <div className="text-[13px] text-[#666] border-b border-b-[#ddd] pb-[10px] mb-[20px] font-medium">
                                Authorized Departments/Units
                            </div>
                            <div className="max-h-[200px] overflow-y-auto border border-[#eee] rounded p-[10px]">
                                {units.map((u, idx) =>
                <div key={`${u.f_Code ?? 'unit'}-${idx}`} className="flex items-center gap-[12px] py-[8px] px-[0] border-b border-b-[#f5f5f5]">
                                        <input
                    type="checkbox"
                    checked={u.isSelected || u.f_Code !== ''}
                    onChange={() => {
                      setUnits(units.map((unit) => unit.f_Code === u.f_Code ? { ...unit, isSelected: !unit.isSelected } : unit));
                    }} />
                  
                                        <span className="text-[13px] text-[#333]">{u.F_Name}</span>
                                    </div>
                )}
                                {units.length === 0 && <div className="text-center text-[#999] text-[12px] p-[20px]">No units available</div>}
                            </div>
                        </div>

                        <div className="flex gap-[10px]">
                            <button onClick={handleSave} disabled={loading || !userName} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                                <Save size={18} /> {loading ? 'Processing...' : isEditMode ? 'Update Rights' : 'Save Assignment'}
                            </button>
                            {isEditMode &&
              <button onClick={handleDelete} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#e74c3c]">
                                    <Trash2 size={18} /> Revoke All Access
                                </button>
              }
                            <button onClick={() => navigate('/UserManagement/AddUserViewRight')} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#008080]">
                                <List size={18} /> Back to View
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANEL: ROLES & PERMISSIONS */}
                    <div>
                        <div className="flex justify-between items-center mb-[20px]">
                            <div className="text-[13px] text-[#666] border-b border-b-[#ddd] pb-[10px] font-medium">
                                Permissions Configuration
                            </div>
                            <div className="flex gap-[20px] pl-[20px]">
                                <label className="text-[13px] flex items-center gap-[6px] cursor-pointer font-bold text-[#008080]">
                                    <input type="checkbox" checked={useRollList} onChange={(e) => setUseRollList(e.target.checked)} /> Use Roll List
                                </label>
                                <label className="text-[13px] flex items-center gap-[6px] cursor-pointer font-bold text-[#16a085]">
                                    <input type="checkbox" checked={useAllPages} onChange={(e) => handleAllPagesToggle(e.target.checked)} /> Manual Override
                                </label>
                            </div>
                        </div>

                        {useRollList &&
            <div className="mb-[30px]">
                                <div className="text-[11px] font-bold text-[#999] mb-[12px] uppercase tracking-[1px]">Available Roles</div>
                                <div className="flex gap-[10px]">
                                    {rolls.map((r, idx) =>
                <button
                  key={r.R_Code}
                  onClick={() => handleRollToggle(r.R_Code)} className={r.isSelected || r.datavalue ? "py-[6px] px-[16px] rounded-[20px] text-[12px] font-bold cursor-pointer border border-[#008080] bg-[#008080] text-white" : "py-[6px] px-[16px] rounded-[20px] text-[12px] font-bold cursor-pointer border border-[#008080] bg-white text-[#008080]"}>
                  
                                            {r.R_Name}
                                        </button>
                )}
                                </div>
                            </div>
            }

                        <div className="overflow-x-auto rounded-lg border border-[#eee]">
                            <table className="w-[100%]">
                                <thead>
                                    <tr className="bg-[#008080] text-white">
                                        <th className="py-[12px] px-[15px] text-left text-[13px]">Module Namespace</th>
                                        <th className="py-[12px] px-[10px] text-center text-[11px]">ADD</th>
                                        <th className="py-[12px] px-[10px] text-center text-[11px]">UPD</th>
                                        <th className="py-[12px] px-[10px] text-center text-[11px]">DEL</th>
                                        <th className="py-[12px] px-[10px] text-center text-[11px]">VIEW</th>
                                        <th className="py-[12px] px-[10px] text-center text-[11px]">EXP</th>
                                        <th className="py-[12px] px-[10px] text-center text-[11px]">PRN</th>
                                        <th className="py-[12px] px-[10px] text-center text-[11px]">SCH</th>
                                        <th className="py-[12px] px-[10px] text-center text-[11px]">NOT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Roll Inherited Permissions */}
                                    {useRollList && rollDetails.map((d, i) =>
                  <tr key={`roll-${i}`} className="bg-[#f8fbfb] border-b border-b-[#eee] opacity-[0.8]">
                                            <td className="py-[10px] px-[15px] text-[13px] text-[#666]">
                                                <span className="text-[9px] bg-[#e0f2f1] text-[#008080] py-[2px] px-[6px] rounded mr-[8px] font-bold">{d.R_Name}</span>
                                                {d.Modualname}
                                            </td>
                                            {['RADD', 'RUPDATE', 'RDELETE', 'RVIEW', 'REXPORT', 'RPRINT', 'RSEARCH', 'RNotification'].map((field, idx) =>
                    <td key={field} className={d[field] ? "text-center text-[#16a085] font-bold text-[14px]" : "text-center text-[#ccc] font-bold text-[14px]"}>
                                                    {d[field] ? '●' : '○'}
                                                </td>
                    )}
                                        </tr>
                  )}

                                    {/* Custom Override Permissions */}
                                    {useAllPages && allPages.map((p, i) =>
                  <tr key={`page-${i}`} className="border-b border-b-[#eee] bg-white">
                                            <td className="py-[10px] px-[15px] text-[13px] text-[#333] font-semibold">{p.Modualname}</td>
                                            {['RADD', 'RUPDATE', 'RDELETE', 'RVIEW', 'REXPORT', 'RPRINT', 'RSEARCH', 'RNotification'].map((field, idx) =>
                    <td key={field} className="text-center">
                                                    <input
                        type="checkbox"
                        checked={p[field] == '1'}
                        onChange={(e) => {
                          const updated = [...allPages];
                          updated[i][field] = e.target.checked ? '1' : '0';
                          setAllPages(updated);
                        }} />
                      
                                                </td>
                    )}
                                        </tr>
                  )}

                                    {(!useRollList || rollDetails.length === 0) && (!useAllPages || allPages.length === 0) &&
                  <tr>
                                            <td colSpan="9" className="p-[40px] text-center text-[#999] text-[13px]">
                                                <Shield size={32} className="block m-[0 auto 10px] text-[#eee]" />
                                                Select rolls or enable overrides to configure permissions
                                            </td>
                                        </tr>
                  }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>);

};

export default UserManagement_AddUserRight;