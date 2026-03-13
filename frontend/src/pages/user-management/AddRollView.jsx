import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { userManagementService } from '../../microservices/api.service';const UserManagement_AddRollView = () => {const navigate = useNavigate(); // Search state
  const [rollCode, setRollCode] = useState('');const [rollName, setRollName] = useState('');const [results, setResults] = useState([]);const [isSearching, setIsSearching] = useState(false);
  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const params = { rollCode, rollName };
      const data = await userManagementService.getRoles(params);
      const formatted = (Array.isArray(data) ? data : []).map((r) => ({
        R_Code: r.R_Code?.toString() || r.id?.toString() || '',
        R_Name: r.R_Name || r.role_name || '',
        Modualname: r.Modualname || r.page_name || '',
        RADD: r.RADD || 'No',
        RUPDATE: r.RUPDATE || 'No',
        RDELETE: r.RDELETE || 'No',
        RVIEW: r.RVIEW || 'No',
        REXPORT: r.REXPORT || 'No',
        RPRINT: r.RPRINT || 'No',
        RSEARCH: r.RSEARCH || 'No',
        RNotification: r.RNotification || 'No'
      }));
      setResults(formatted);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to fetch roles");
    } finally {
      setIsSearching(false);
    }
  };

  const handleEdit = (code) => {
    navigate(`/UserManagement/AddRoll?code=${code}`);
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
          Roll View
        </div>

        <div className="p-[20px] bg-[#fafafa]">
          <div className="grid gap-[30px] mb-[20px] max-w-[800px]">
            <div>
              <label className="block mb-[8px] text-[13px] text-[#111]">Roll Code</label>
              <input
                type="text"

                value={rollCode}
                onChange={(e) => setRollCode(e.target.value)}
                placeholder="Enter Roll Code" className="w-[100%] py-[8px] px-[12px] text-[13px] border border-[#e2e8f0] rounded text-[#333] bg-white" />
              
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

          <div className="flex gap-[8px]">
            <button onClick={handleSearch} disabled={isSearching} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            <button onClick={() => navigate('/UserManagement/AddRoll')} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
              Add New
            </button>
            <button onClick={() => navigate('/dashboard')} className="bg-[#1F9E8A] text-white border-0 py-[8px] px-[16px] rounded text-[13px] cursor-pointer">
              Exit
            </button>
          </div>
        </div>
      </div>

      {results.length > 0 &&
      <div className="overflow-x-auto rounded-lg border border-[#eee]">
          <table className="w-[100%]">
            <thead>
              <tr className="bg-[#008080] text-white">
                <th className="p-[12px] text-left text-[13px]">Roll Code</th>
                <th className="p-[12px] text-left text-[13px]">Roll Name</th>
                <th className="p-[12px] text-left text-[13px]">Page Name</th>
                <th className="p-[12px] text-center text-[13px]">Add</th>
                <th className="p-[12px] text-center text-[13px]">Update</th>
                <th className="p-[12px] text-center text-[13px]">Delete</th>
                <th className="p-[12px] text-center text-[13px]">View</th>
                <th className="p-[12px] text-center text-[13px]">Export</th>
                <th className="p-[12px] text-center text-[13px]">Print</th>
                <th className="p-[12px] text-center text-[13px]">Search</th>
                <th className="p-[12px] text-center text-[13px]">Notification</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, idx) =>
            <tr key={item.R_Code} className={idx % 2 === 0 ? "bg-white border-b border-b-[#eee]" : "bg-[#fcfcfc] border-b border-b-[#eee]"}>
                  <td onClick={() => handleEdit(item.R_Code)} className="p-[12px] text-[13px] font-bold text-[#008080] cursor-pointer">{item.R_Code}</td>
                  <td onClick={() => handleEdit(item.R_Code)} className="p-[12px] text-[13px] cursor-pointer">{item.R_Name}</td>
                  <td className="p-[12px] text-[13px]">{item.Modualname}</td>
                  <td className="p-[12px] text-center text-[13px]">{item.RADD}</td>
                  <td className="p-[12px] text-center text-[13px]">{item.RUPDATE}</td>
                  <td className="p-[12px] text-center text-[13px]">{item.RDELETE}</td>
                  <td className="p-[12px] text-center text-[13px]">{item.RVIEW}</td>
                  <td className="p-[12px] text-center text-[13px]">{item.REXPORT}</td>
                  <td className="p-[12px] text-center text-[13px]">{item.RPRINT}</td>
                  <td className="p-[12px] text-center text-[13px]">{item.RSEARCH}</td>
                  <td className="p-[12px] text-center text-[13px]">{item.RNotification}</td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      }

      {!isSearching && results.length === 0 &&
      <div className="text-center p-[40px] text-[#666] text-4 border-[1px dashed #eee] rounded-lg">
          No roles found. Refine your search or click Search to refresh.
        </div>
      }

      {isSearching &&
      <div className="text-center p-[40px] text-[#008080] text-4">
          Loading system roles...
        </div>
      }
    </div>);

};

export default UserManagement_AddRollView;