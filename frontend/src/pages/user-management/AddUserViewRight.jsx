import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { masterService, userManagementService } from '../../microservices/api.service';
import '../../styles/UserManagement.css';

const UserManagement_AddUserViewRight = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [unit, setUnit] = useState('All');
  const [userType, setUserType] = useState('');
  const [userId, setUserId] = useState('');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const userTypeNameMap = useMemo(() => {
    const map = new Map();
    userTypes.forEach((t) => {
      const key = String(t.id ?? t.UTID ?? t.TypeId ?? t.TypeID ?? '').trim();
      const label = t.name || t.Type || t.TypeName || t.UserType || t.UTName || '';
      if (key) map.set(key, label);
    });
    return map;
  }, [userTypes]);

  const normalizeStatus = (raw) => {
    const value = String(raw ?? '').trim().toLowerCase();
    if (value === '1' || value === 'active' || value === 'true') return 'Active';
    if (value === '0' || value === 'inactive' || value === 'false') return 'Inactive';
    return raw ? String(raw) : '-';
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [unitsRes, typesRes] = await Promise.all([
        masterService.getUnits(),
        userManagementService.getUserTypes()
      ]);
      setFactories(Array.isArray(unitsRes) ? unitsRes : []);
      setUserTypes(Array.isArray(typesRes) ? typesRes : []);
    } catch (error) {
      console.error('AddUserViewRight: failed initial load', error);
      toast.error('Failed to load filters');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const data = await userManagementService.getUsers({
        unit: unit === 'All' ? '' : unit,
        userType,
        userId
      });
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      if (!list.length) toast.error('No records found');
    } catch (error) {
      console.error('AddUserViewRight: search failed', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch users');
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
          User Right View
        </div>

        <div className="p-[24px] bg-[#f6f4f2]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[22px]">
            <div>
              <label className="block mb-[8px] text-[14px] text-[#111] font-semibold">Units</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={isLoading}
                className="w-full h-[44px] px-[14px] text-[15px] border border-[#cfd5e3] rounded-[6px] bg-white"
              >
                <option value="All">All</option>
                {factories.map((f, idx) => (
                  <option key={`${f.F_Code || f.f_Code || f.id || 'f'}-${idx}`} value={f.F_Code || f.f_Code || f.id}>
                    {f.F_Name || f.f_Name || f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-[8px] text-[14px] text-[#111] font-semibold">User Type</label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full h-[44px] px-[14px] text-[15px] border border-[#cfd5e3] rounded-[6px] bg-white"
              >
                <option value="">--Please Select--</option>
                {userTypes.map((t, idx) => {
                  const value = t.id ?? t.UTID ?? t.TypeId ?? t.TypeID ?? t.UTName;
                  const label = t.name || t.Type || t.TypeName || t.UserType || t.UTName || `Type ${value}`;
                  return (
                    <option key={`${value}-${idx}`} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block mb-[8px] text-[14px] text-[#111] font-semibold">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter Roll Code"
                className="w-full h-[44px] px-[14px] text-[15px] border border-[#cfd5e3] rounded-[6px] bg-white"
              />
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
              onClick={() => navigate('/UserManagement/AddUser')}
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

          <div className="mt-[24px] flex items-center gap-[10px]">
            <input type="checkbox" className="h-[22px] w-[22px] accent-[#d7b9ba]" readOnly />
            <input
              type="text"
              value="User Belongs To Other Unit"
              readOnly
              className="h-[44px] px-[16px] w-[420px] text-[13px] text-[#687086] border border-[#cfd5e3] rounded-[6px] bg-[#f8f8fb]"
            />
          </div>

          <div className="mt-[18px] overflow-auto border border-[#a9c7a3] rounded-[4px]">
            <table className="w-full min-w-[1150px] border-collapse">
              <thead>
                <tr className="bg-[#d8e6d2]">
                  <th className="text-left text-[#2177f5] text-[13px] p-[12px] border border-[#a9c7a3] font-semibold">Unit</th>
                  <th className="text-left text-[#2177f5] text-[13px] p-[12px] border border-[#a9c7a3] font-semibold">User Type</th>
                  <th className="text-left text-[#2177f5] text-[13px] p-[12px] border border-[#a9c7a3] font-semibold">User Code</th>
                  <th className="text-left text-[#2177f5] text-[13px] p-[12px] border border-[#a9c7a3] font-semibold">User Name</th>
                  <th className="text-left text-[#2177f5] text-[13px] p-[12px] border border-[#a9c7a3] font-semibold">Status</th>
                  <th className="text-left text-[#2177f5] text-[13px] p-[12px] border border-[#a9c7a3] font-semibold">mobile OTP</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((item, idx) => {
                  const utId = String(item.UTID ?? item.userType ?? item.UserType ?? '').trim();
                  const handleEditUser = () => {
                    const id = item.ID || item.Id || item.id || '';
                    const userid = item.Userid || item.UserId || item.userid || '';
                    if (id) {
                      navigate(`/UserManagement/AddUser?id=${encodeURIComponent(id)}`);
                      return;
                    }
                    if (userid) {
                      navigate(`/UserManagement/AddUser?userid=${encodeURIComponent(userid)}`);
                    }
                  };
                  return (
                    <tr key={`${item.ID || item.Userid || 'u'}-${idx}`} className="bg-[#ecd6d8]">
                      <td className="text-[13px] text-[#4d68ff] p-[12px] border border-[#a9c7a3]">{item.F_Name || item.Unit || '-'}</td>
                      <td className="text-[13px] text-[#4d68ff] p-[12px] border border-[#a9c7a3]">{item.UserTypeName || userTypeNameMap.get(utId) || `Type ${utId || '-'}`}</td>
                      <td className="text-[13px] text-[#4d68ff] p-[12px] border border-[#a9c7a3]">{item.Userid || item.UserId || '-'}</td>
                      <td
                        onClick={handleEditUser}
                        className="text-[13px] text-[#4d68ff] p-[12px] border border-[#a9c7a3] cursor-pointer hover:bg-[#d4c4c6] hover:font-semibold transition-all duration-200"
                      >
                        {item.Name || item.UserName || '-'}
                      </td>
                      <td className="text-[13px] text-[#4d68ff] p-[12px] border border-[#a9c7a3]">{normalizeStatus(item.Status)}</td>
                      <td className="text-[13px] text-[#111] p-[12px] border border-[#a9c7a3]">{item.mobileOTP || item.MobileOTP || item.OTP || item.Otp || '-'}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="p-[18px] text-center text-[13px] text-[#6b7280] border border-[#a9c7a3] bg-[#fdfdfd]">
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

export default UserManagement_AddUserViewRight;
