import React, { useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Database, Calendar, Edit3, LogOut, Search } from 'lucide-react';const __cx = (...vals) => vals.filter(Boolean).join(" ");const Account_ManageTblControl = () => {const navigate = useNavigate();const [isLoading, setIsLoading] = useState(false);const [searchTerm, setSearchTerm] = useState('');const [tableData, setTableData] = useState([{ Code: 'T1', Name: 'Cane', Date: '30/01/2026' }, { Code: 'T2', Name: 'Cane_Dev', Date: '30/01/2026' },
  { Code: 'T3', Name: 'Modul', Date: '30/01/2018' },
  { Code: 'T4', Name: 'ModulGroup', Date: '30/01/2018' },
  { Code: 'T5', Name: 'FARMER', Date: '30/01/2026' },
  { Code: 'T6', Name: 'VW_ADV_ADVICE', Date: '30/01/2018' },
  { Code: 'T7', Name: 'VW_G_Cane_In', Date: '30/01/2018' },
  { Code: 'T8', Name: 'vw_ADV_advice', Date: '30/01/2018' },
  { Code: 'T9', Name: 'nn_avg_bay_wt', Date: '30/01/2018' },
  { Code: 'T10', Name: 'nn_avg_bay_wt_old', Date: '30/01/2018' },
  { Code: 'T11', Name: 'nm_Sugar_Proc_wt', Date: '30/01/2018' }]
  );

  const handleModifyDate = async (code) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(`Valid date threshold updated for table ${code}`);
    } catch {
      toast.error('Failed to sync database constraints.');
    } finally {
      setIsLoading(false);
    }
  };

  const headerStyle = "bg-[#008080] text-white py-[12px] px-[20px] text-[18px] font-medium rounded-[8px 8px 0 0] mb-[1px]";









  const cardStyle = "p-[25px] border border-[#e0e0e0] rounded-[0 0 8px 8px] bg-white shadow-[0 2px 4px rgba(0,0,0,0.05)] mb-[20px]";








  const inputStyle = "py-[8px] px-[12px] border border-[#ccc] rounded text-[13px] ";







  const btnStyle = (bg = '#16a085') => ({
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'white',
    backgroundColor: bg,
    transition: 'all 0.2s'
  });

  const filteredData = tableData.filter((item) =>
  item.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Inter', sans-serif]">
            <Toaster position="top-right" />

            <div className={headerStyle}>
                Manage Schema Table Access Controls
            </div>

            <div className={cardStyle}>
                <div className="flex justify-between mb-[20px]">
                    <div className="relative w-[300px]">
                        <input
              type="text"
              placeholder="Search schema tables..."

              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className={__cx(inputStyle, "w-[100%] pl-[35px]")} />
            
                        <Search size={16} className="absolute left-[10px] top-[50%] text-[#999]" />
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#008080]">
                        <LogOut size={16} /> Exit System
                    </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-[#eee]">
                    <table className="w-[100%]">
                        <thead>
                            <tr className="bg-[#008080] text-white">
                                <th className="p-[15px] text-left text-[13px] w-[60px]">#</th>
                                <th className="p-[15px] text-left text-[13px]">
                                    <div className="flex items-center gap-[8px]">
                                        <Database size={16} /> Schema Table Identity
                                    </div>
                                </th>
                                <th className="p-[15px] text-left text-[13px] w-[220px]">
                                    <div className="flex items-center gap-[8px]">
                                        <Calendar size={16} /> Validity Lock Date
                                    </div>
                                </th>
                                <th className="p-[15px] text-center text-[13px] w-[150px]">Sync Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, index) =>
              <tr key={`${item.Code ?? 'row'}-${index}`} className={index % 2 === 0 ? "bg-white border-b border-b-[#eee]" : "bg-[#fcfcfc] border-b border-b-[#eee]"}>
                                    <td className="py-[12px] px-[15px] text-[13px] text-[#666]">{index + 1}</td>
                                    <td className="py-[12px] px-[15px] text-[13px] font-bold text-[#008080]">
                                        {item.Name}
                                    </td>
                                    <td className="py-[12px] px-[15px]">
                                        <div className="flex items-center gap-[10px]">
                                            <input
                      type="text"
                      defaultValue={item.Date} className={__cx(
                        inputStyle, "w-[120px] bg-[#f9f9f9]")} />
                    
                                        </div>
                                    </td>
                                    <td className="py-[12px] px-[15px] text-center">
                                        <button

                    onClick={() => handleModifyDate(item.Code)}
                    disabled={isLoading} className="px-4 py-2 rounded text-[12px] font-semibold cursor-pointer border-0 inline-flex items-center gap-[6px] text-white bg-[#16a085]">
                    
                                            <Edit3 size={14} /> MODIFY DATE
                                        </button>
                                    </td>
                                </tr>
              )}
                        </tbody>
                    </table>
                </div>

                {filteredData.length === 0 &&
        <div className="text-center p-[40px] text-[#999] text-[13px]">
                        No tables identified matching your search criteria.
                    </div>
        }
            </div>
        </div>);

};

export default Account_ManageTblControl;