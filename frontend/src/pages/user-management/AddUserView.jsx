import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { masterService, userManagementService } from '../../microservices/api.service';
import '../../styles/UserManagement.css';

const UserManagement_AddUserView = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [unitCode, setUnitCode] = useState('All');
  const [userId, setUserId] = useState('');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const unitOptions = useMemo(
    () => [{ value: 'All', label: 'All' }, ...units.map((u) => ({
      value: String(u.f_Code ?? u.F_Code ?? ''),
      label: String(u.F_Name || u.f_Name || u.name || '')
    }))],
    [units]
  );

  useEffect(() => {
    const loadUnits = async () => {
      try {
        setIsLoading(true);
        const data = await masterService.getUnits();
        setUnits(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('AddUserView: failed to load units', error);
        toast.error('Failed to load units');
        setUnits([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadUnits();
  }, []);

  useEffect(() => {
    const loadUsersByUnit = async () => {
      try {
        if (!unitCode || unitCode === 'All') {
          setUsers([]);
          setUserId('');
          return;
        }
        const list = await userManagementService.getUsersByFactory(unitCode);
        const normalized = Array.isArray(list) ? list : [];
        setUsers(normalized);
        if (userId && !normalized.some((u) => String(u.Userid || '') === String(userId))) {
          setUserId('');
        }
      } catch (error) {
        console.error('AddUserView: failed to load users by unit', error);
        toast.error('Failed to load users');
        setUsers([]);
      }
    };
    loadUsersByUnit();
  }, [unitCode, userId]);

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const data = await userManagementService.getUserRightsView({
        Commmand: 'Search',
        fcode: unitCode === 'All' ? '0' : unitCode,
        userid: userId || ''
      });
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      if (!list.length) {
        toast.error('No records found');
      }
    } catch (error) {
      console.error('AddUserView: search failed', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch user roll view');
      setRows([]);
    } finally {
      setIsSearching(false);
    }
  };


  return (
    <div className="p-[20px] bg-white min-h-[calc(100vh-120px)]">
      <Toaster position="top-right" />

      <div className="border border-[#d7dde8] rounded-[12px] overflow-hidden bg-white">
        <div className="bg-[#169f8e] text-white py-[10px] px-[20px] text-[34px] font-semibold text-center">
          User Roll View
        </div>

        <div className="p-[24px] bg-[#f6f4f2]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[22px] max-w-[820px]">
            <div>
              <label className="block mb-[8px] text-[14px] text-[#111] font-semibold">Units</label>
              <select
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                disabled={isLoading}
                className="w-full h-[44px] px-[14px] text-[15px] border border-[#cfd5e3] rounded-[6px] bg-white"
              >
                {unitOptions.map((opt, idx) => (
                  <option key={`${opt.value || 'all'}-${idx}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-[8px] text-[14px] text-[#111] font-semibold">User Name</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full h-[44px] px-[14px] text-[15px] border border-[#cfd5e3] rounded-[6px] bg-white"
              >
                <option value=""> </option>
                {users.map((u, idx) => (
                  <option key={`${u.Userid || 'u'}-${idx}`} value={u.Userid}>
                    {u.Name || u.Userid}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-[6px] mt-[14px]">
            <button
              onClick={handleSearch}
              disabled={isSearching || isLoading}
              className="h-[46px] px-[16px] min-w-[86px] rounded-[8px] bg-[#169f8e] text-white text-[13px] font-medium border border-[#c2d5ff] cursor-pointer"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={() => navigate('/UserManagement/AddUserRight')}
              className="h-[46px] px-[16px] min-w-[100px] rounded-[8px] bg-[#169f8e] text-white text-[13px] font-medium border border-transparent cursor-pointer"
            >
              Add New
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="h-[46px] px-[16px] min-w-[76px] rounded-[8px] bg-[#169f8e] text-white text-[13px] font-medium border border-transparent cursor-pointer"
            >
              Exit
            </button>
          </div>

          <div className="mt-[18px] overflow-auto border border-[#a9c7a3] rounded-[4px]">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="bg-[#d8e6d2]">
                  <th className="text-left text-[#222] text-[13px] p-[12px] border border-[#a9c7a3] font-semibold">Factory Name</th>
                  <th className="text-left text-[#222] text-[13px] p-[12px] border border-[#a9c7a3] font-semibold">User ID</th>
                  <th className="text-left text-[#222] text-[13px] p-[12px] border border-[#a9c7a3] font-semibold">User Name</th>
                  <th className="text-left text-[#222] text-[13px] p-[12px] border border-[#a9c7a3] font-semibold">Roll Name</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((item, idx) => (
                  <tr key={`${item.Userid || 'u'}-${item.factid || 'f'}-${idx}`} className="bg-[#f5f2f2]">
                    <td className="text-[13px] text-[#4d68ff] p-[12px] border border-[#a9c7a3]">{item.F_Name || '-'}</td>
                    <td className="text-[13px] text-[#4d68ff] p-[12px] border border-[#a9c7a3]">{item.Userid || '-'}</td>
                    <td className="text-[13px] text-[#4d68ff] p-[12px] border border-[#a9c7a3]">{item.Name || '-'}</td>
                    <td className="text-[13px] text-[#4d68ff] p-[12px] border border-[#a9c7a3]">{item.R_Name || '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-[18px] text-center text-[13px] text-[#6b7280] border border-[#a9c7a3] bg-[#fdfdfd]">
                      {isSearching ? 'Loading records...' : 'No records found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement_AddUserView;
