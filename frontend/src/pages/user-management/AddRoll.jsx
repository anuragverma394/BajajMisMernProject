import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { userManagementService } from '../../microservices/api.service';

const UserManagement_AddRoll = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [rollCode, setRollCode] = useState('');
  const [rollName, setRollName] = useState('');
  const [modules, setModules] = useState([]);
  const [checkAll, setCheckAll] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');

    const toNumberFlag = (value) => (String(value || '0') === '1' ? 1 : 0);
    const mapModule = (m) => ({
      MID: Number(m.MID),
      Modualname: m.Modualname || m.ModualName || '',
      RADD: toNumberFlag(m.RADD),
      RUPDATE: toNumberFlag(m.RUPDATE),
      RDELETE: toNumberFlag(m.RDELETE),
      RVIEW: toNumberFlag(m.RVIEW),
      REXPORT: toNumberFlag(m.REXPORT),
      RPRINT: toNumberFlag(m.RPRINT),
      RSEARCH: toNumberFlag(m.RSEARCH),
      RNotification: toNumberFlag(m.RNotification),
      isRowSelected: [
        'RADD',
        'RUPDATE',
        'RDELETE',
        'RVIEW',
        'REXPORT',
        'RPRINT',
        'RSEARCH',
        'RNotification'
      ].some((key) => String(m[key] || '0') === '1')
    });

    const loadRole = async () => {
      try {
        if (code) {
          setIsEditMode(true);
          setRollCode(code);
          const role = await userManagementService.getRoleByCode(code);
          if (role?.R_Name) setRollName(role.R_Name);
        } else {
          setIsEditMode(false);
          setRollCode('');
          setRollName('');
        }

        const permissions = await userManagementService.getRolePermissions(code || '');
        const list = Array.isArray(permissions) ? permissions.map(mapModule) : [];
        setModules(list);
        setCheckAll(list.length > 0 && list.every((m) => m.isRowSelected));
      } catch (error) {
        console.error('AddRoll: failed to load role data', error);
        toast.error('Failed to load role data');
        setModules([]);
      }
    };

    loadRole();
  }, [location.search]);

  const handleCheckAll = (e) => {
    const checked = e.target.checked;
    setCheckAll(checked);
    setModules((prevModules) => prevModules.map((m, idx) => ({
      ...m,
      RADD: checked ? 1 : 0,
      RUPDATE: checked ? 1 : 0,
      RDELETE: checked ? 1 : 0,
      RVIEW: checked ? 1 : 0,
      REXPORT: checked ? 1 : 0,
      RPRINT: checked ? 1 : 0,
      RSEARCH: checked ? 1 : 0,
      RNotification: checked ? 1 : 0,
      isRowSelected: checked
    })));
  };

  const handleRowCheckbox = (mid, checked) => {
    setModules((prevModules) => {
      const next = prevModules.map((m) => {
        if (m.MID === mid) {
          return {
            ...m,
            RADD: checked ? 1 : 0,
            RUPDATE: checked ? 1 : 0,
            RDELETE: checked ? 1 : 0,
            RVIEW: checked ? 1 : 0,
            REXPORT: checked ? 1 : 0,
            RPRINT: checked ? 1 : 0,
            RSEARCH: checked ? 1 : 0,
            RNotification: checked ? 1 : 0,
            isRowSelected: checked
          };
        }
        return m;
      });
      setCheckAll(next.length > 0 && next.every((m) => m.isRowSelected));
      return next;
    });
  };

  const handleActionCheckbox = (mid, field, checked) => {
    setModules((prevModules) => {
      const next = prevModules.map((m) => {
        if (m.MID === mid) {
          const updated = { ...m, [field]: checked ? 1 : 0 };
          const isSelected = [
            'RADD',
            'RUPDATE',
            'RDELETE',
            'RVIEW',
            'REXPORT',
            'RPRINT',
            'RSEARCH',
            'RNotification'
          ].some((key) => Number(updated[key] || 0) === 1);
          return { ...updated, isRowSelected: isSelected };
        }
        return m;
      });
      setCheckAll(next.length > 0 && next.every((m) => m.isRowSelected));
      return next;
    });
  };

  const handleSave = async () => {
    if (!rollCode || !rollName) {
      toast.error("Please fill in Roll Code and Roll Name");
      return;
    }

    try {
      const payloadRows = (modules || []).map((m) => ({
        MID: String(m.MID || ''),
        RADD: String(m.RADD ? 1 : 0),
        RUPDATE: String(m.RUPDATE ? 1 : 0),
        RDELETE: String(m.RDELETE ? 1 : 0),
        RVIEW: String(m.RVIEW ? 1 : 0),
        REXPORT: String(m.REXPORT ? 1 : 0),
        RPRINT: String(m.RPRINT ? 1 : 0),
        RSEARCH: String(m.RSEARCH ? 1 : 0),
        RNotification: String(m.RNotification ? 1 : 0)
      }));

      const payload = {
        Command: isEditMode ? 'btupdate' : 'btninsert',
        R_Code: rollCode,
        R_Name: rollName,
        TableDataGuest: JSON.stringify(payloadRows)
      };

      await toast.promise(
        userManagementService.saveRole(payload),
        {
          loading: 'Processing Role Data...',
          success: `Role ${isEditMode ? 'updated' : 'created'} successfully!`,
          error: 'System error occurred'
        }
      );
      navigate('/UserManagement/AddRollView');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save role');
    }
  };

  const headerStyle = "bg-[#008080] text-white py-[12px] px-[20px] text-[18px] font-medium rounded-[8px 8px 0 0] mb-[1px]";









  const cardStyle = "p-[30px] border border-[#e0e0e0] rounded-[0 0 8px 8px] bg-white shadow-[0 2px 4px rgba(0,0,0,0.05)] mb-[20px]";








  const sectionHeaderStyle = "text-[13px] text-[#666] border-b border-b-[#ddd] pb-[10px] mb-[25px] font-medium";








  const labelStyle = "block mb-[8px] text-[13px] font-semibold text-[#333]";







  const inputStyle = "w-[100%] py-[10px] px-[12px] border border-[#ccc] rounded text-[13px] bg-white  ";










  const btnStyle = (bg = '#16a085') => ({
    padding: '10px 24px',
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
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white mb-[20px]">
                <div className="bg-[#1F9E8A] text-white py-[10px] px-[20px] text-[15px] font-medium text-center">
                    Add User Right
                </div>

                <div className="p-[20px] bg-[#fafafa]">
                    <div className="grid gap-[30px] mb-[15px] max-w-[800px]">
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111]">Roll Code</label>
                            <input
                type="text"

                value={rollCode}
                onChange={(e) => setRollCode(e.target.value)}
                placeholder="Enter Roll Code"
                disabled={isEditMode} className="w-[100%] py-[8px] px-[12px] text-[13px] border border-[#e2e8f0] rounded text-[#333] bg-white" />
              
                        </div>
                        <div>
                            <label className="block mb-[8px] text-[13px] text-[#111]">Roll Name</label>
                            <input
                type="text"

                value={rollName}
                onChange={(e) => setRollName(e.target.value)}
                placeholder="Enter Roll Name" className="w-[100%] py-[8px] px-[12px] text-[13px] border border-[#e2e8f0] rounded text-[#333] bg-white" />
              
                        </div>
                    </div>

                    <div className="flex gap-[8px] mb-[30px]">
                        <button onClick={handleSave} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Save
                        </button>
                        <button onClick={() => navigate('/UserManagement/AddRollView')} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            View
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
                            Exit
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded border border-[#e0e0e0] bg-white">
                        <table className="w-[100%]">
                            <thead className="bg-[#eef6f0]">
                                <tr>
                                    <th className="py-[12px] px-[15px] text-left border-b border-b-[#e0e0e0]">
                                        <label className="flex items-center gap-[8px] cursor-pointer text-[13px] text-[#0d9488] font-semibold">
                                            <input type="checkbox" checked={checkAll} onChange={handleCheckAll} /> All
                                        </label>
                                    </th>
                                    <th className="py-[12px] px-[15px] left-[15px] text-left border-b border-b-[#e0e0e0] text-[13px] text-[#0d9488] font-medium">Modual Name</th>
                                    {['Add', 'Update', 'Delete', 'View', 'Export', 'Print', 'Search', 'Notification'].map((h, idx) =>
                  <th key={h} className="py-[12px] px-[15px] text-left border-b border-b-[#e0e0e0] text-[13px] font-medium text-[#0d9488]">{h}</th>
                  )}
                                </tr>
                            </thead>
                            <tbody>
                                {modules.map((m, idx) =>
                <tr key={m.MID} className="border-b border-b-[#e0e0e0] bg-white">
                                        <td className="py-[10px] px-[15px]">
                                            <input type="checkbox" checked={m.isRowSelected || false} onChange={(e) => handleRowCheckbox(m.MID, e.target.checked)} />
                                        </td>
                                        <td className="py-[10px] px-[15px] text-[13px] text-[#333]">{m.Modualname}</td>
                                        {['RADD', 'RUPDATE', 'RDELETE', 'RVIEW', 'REXPORT', 'RPRINT', 'RSEARCH', 'RNotification'].map((field, idx) =>
                  <td key={field} className="py-[10px] px-[15px] text-left">
                                                <input type="checkbox" checked={m[field] === 1} onChange={(e) => handleActionCheckbox(m.MID, field, e.target.checked)} />
                                            </td>
                  )}
                                    </tr>
                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>);

};

export default UserManagement_AddRoll;
