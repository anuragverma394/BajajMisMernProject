import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Save, List, LogOut, CheckSquare, Square } from 'lucide-react';

const UserManagement_AddRoll = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [rollCode, setRollCode] = useState('');
  const [rollName, setRollName] = useState('');
  const [modules, setModules] = useState([]);
  const [checkAll, setCheckAll] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Mock modules data
  const mockModules = [
  { MID: 1, Modualname: 'Dashboard', RADD: 0, RUPDATE: 0, RDELETE: 0, RVIEW: 1, REXPORT: 0, RPRINT: 0, RSEARCH: 0, RNotification: 0 },
  { MID: 2, Modualname: 'User Management', RADD: 0, RUPDATE: 0, RDELETE: 0, RVIEW: 0, REXPORT: 0, RPRINT: 0, RSEARCH: 0, RNotification: 0 },
  { MID: 3, Modualname: 'Accounts', RADD: 0, RUPDATE: 0, RDELETE: 0, RVIEW: 0, REXPORT: 0, RPRINT: 0, RSEARCH: 0, RNotification: 0 },
  { MID: 4, Modualname: 'Reports', RADD: 0, RUPDATE: 0, RDELETE: 0, RVIEW: 1, REXPORT: 1, RPRINT: 1, RSEARCH: 1, RNotification: 0 },
  { MID: 5, Modualname: 'Main', RADD: 1, RUPDATE: 1, RDELETE: 0, RVIEW: 1, REXPORT: 0, RPRINT: 0, RSEARCH: 1, RNotification: 1 }];


  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');

    if (code) {
      setIsEditMode(true);
      setRollCode(code);
      setRollName('Administrator'); // Mock value
      setModules(mockModules.map((m, idx) => ({ ...m, RADD: 1, RUPDATE: 1, RVIEW: 1 })));
    } else {
      setModules(mockModules);
    }
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
    setModules((prevModules) => prevModules.map((m) => {
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
    }));
  };

  const handleActionCheckbox = (mid, field, checked) => {
    setModules((prevModules) => prevModules.map((m) => {
      if (m.MID === mid) {
        return { ...m, [field]: checked ? 1 : 0 };
      }
      return m;
    }));
  };

  const handleSave = () => {
    if (!rollCode || !rollName) {
      toast.error("Please fill in Roll Code and Roll Name");
      return;
    }

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Processing Role Data...',
        success: `Role ${isEditMode ? 'updated' : 'created'} successfully!`,
        error: 'System error occurred'
      }
    ).then(() => {
      navigate('/UserManagement/AddRollView');
    });
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