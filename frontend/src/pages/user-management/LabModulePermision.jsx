import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, labModulePermissionService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const UserManagement_LabModulePermision = () => {
  const navigate = useNavigate();
  const [factId, setFactId] = useState('All');
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => {});
    fetchUsers('All');
  }, []);

  const fetchUsers = async (factory) => {
    setIsLoading(true);
    try {
      const res = await labModulePermissionService.getUsers(factory === 'All' ? '' : factory);
      const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setUsers(data.map((u, idx) => ({
        id: u.Id || u.id || u.UFID,
        userId: u.UserId || u.userId || u.UserID,
        Name: u.Name || u.name,
        enabled: !!(u.LNFlag || u.Enabled || u.enabled)
      })));
    } catch (error) {
      toast.error("Failed to fetch personnel data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFactoryChange = (val) => {
    setFactId(val);
    fetchUsers(val);
  };

  const handlePermissionToggle = (id) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, enabled: !u.enabled } : u));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = users.
      filter((u) => Number(u.id) > 0).
      map((u) => ({
        UFID: Number(u.id),
        LNFlag: u.enabled ? 1 : 0
      }));
      await labModulePermissionService.savePermissions(payload);
      toast.success("Security access configuration synchronized successfully.");
    } catch (error) {
      toast.error("Synchronization sequence failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={__cx("page-container", "p-[20px] bg-[#f8fafc] min-h-[100vh]")}>
      <Toaster position="top-right" />

      <div className={__cx("page-card", "bg-white rounded-xl overflow-hidden shadow-[0 4px 20px rgba(0,0,0,0.08)] border border-[#e2e8f0]")}>
        {/* Teal Header Bar */}
        <div className={__cx("page-card-header", "bg-[#008080] text-white py-[15px] px-[25px] text-[18px] font-semibold flex items-center gap-[12px]")}>








          
          <div className="w-[3px] h-[20px] bg-white rounded"></div>
          Employee Notification View
        </div>

        <div className={__cx("page-card-body", "p-[25px]")}>
          {/* Filter Section */}
          <div className={__cx("filter-row", "flex  gap-[15px] mb-[30px] p-[20px] bg-[#f1f5f9] rounded-lg")}>







            
            <div className="flex gap-[8px]">
              <label className="text-[13px] font-bold text-[#475569]">Units</label>
              <select
                className={__cx("form-control", "w-[300px] h-[40px] rounded-md border border-[#cbd5e1] py-[0] px-[12px]")}
                value={factId}
                onChange={(e) => handleFactoryChange(e.target.value)}>







                
                <option value="All">All Units</option>
                {units.map((u, idx) =>
                <option key={`${u.F_Code || u.f_Code || u.id}-${idx}`} value={u.F_Code || u.f_Code || u.id}>
                    {u.F_Name || u.name}
                  </option>
                )}
              </select>
            </div>

            <div className="flex gap-[10px]">
              <button className={__cx("btn btn-primary", "bg-[#008080] border-0 py-[8px] px-[24px] rounded font-semibold")} onClick={() => fetchUsers(factId)}>
                Search
              </button>
              <button className={__cx("btn btn-success", "bg-[#10b981] border-0 py-[8px] px-[24px] rounded font-semibold")} onClick={handleSave} disabled={isLoading || users.length === 0}>
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </button>
              <button className={__cx("btn btn-danger", "bg-[#ef4444] border-0 py-[8px] px-[24px] rounded font-semibold")} onClick={() => navigate(-1)}>
                Exit
              </button>
            </div>
          </div>

          {/* Table Section */}
          <div className={__cx("table-wrapper", "shadow-[0 2px 10px rgba(0,0,0,0.05)] rounded-lg overflow-hidden border border-[#e2e8f0]")}>




            
            <table className={__cx("data-table", "w-[100%] ")}>
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="p-[15px] text-[#475569] border-b border-b-[#008080] text-center w-[80px]">SN</th>
                  <th className="p-[15px] text-[#475569] border-b border-b-[#008080] text-left">User Id</th>
                  <th className="p-[15px] text-[#475569] border-b border-b-[#008080] text-left">User Name</th>
                  <th className="p-[15px] text-[#475569] border-b border-b-[#008080] text-center">Lab Notification</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ?
                <tr><td colSpan="4" className="text-center p-[40px] text-[#64748b]">
                    <div className={__cx("spinner", "border-[3px] border-[#f3f3f3] border-t border-t-[#008080] rounded-[50%] w-[30px] h-[30px]  m-[0 auto 10px]")}></div>
                    Identifying industrial personnel...
                  </td></tr> :
                users.length > 0 ?
                users.map((u, idx) =>
                <tr key={`${u.id ?? 'user'}-${idx}`} className="border-b border-b-[#f1f5f9]">
                      <td className="text-center p-[12px]">{idx + 1}</td>
                      <td className="text-left p-[12px] font-semibold text-[#0f172a]">{u.userId}</td>
                      <td className="text-left p-[12px] text-[#334155]">{u.Name}</td>
                      <td className="text-center p-[12px]">
                        <div className="flex justify-center">
                          <input
                        type="checkbox"
                        checked={u.enabled}
                        onChange={() => handlePermissionToggle(u.id)} className="w-[20px] h-[20px] cursor-pointer" />

                      
                        </div>
                      </td>
                    </tr>
                ) :

                <tr><td colSpan="4" className="text-center p-[40px] text-[#94a3b8]">No personnel mapped to this manufacturing sector.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .data-table tbody tr:hover {
          background-color: #f1f5f9;
        }
      `}</style>
    </div>);

};

export default UserManagement_LabModulePermision;