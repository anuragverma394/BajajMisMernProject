import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { userManagementService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';

const __cx = (...vals) => vals.filter(Boolean).join(" ");

const UserManagement_AddUser = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    ID: '',
    UTID: '',
    userid: '',
    SAPCode: '',
    Password: '',
    Name: '',
    Mobile: '',
    EmailID: '',
    DOB: '',
    Gender: '1',
    Type: 'Other',
    Status: '1',
    TimeFrom: '0600',
    TimeTo: '1800',
    GPS_Notification: false
  });

  const [units, setUnits] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {

    const loadInitialData = async () => {

      try {

        const [unitsRes, seasonsRes, typesData] = await Promise.all([
          masterService.getUnits(),
          masterService.getSeasons(),
          userManagementService.getUserTypes()
        ]);

        const unitsData = (Array.isArray(unitsRes) ? unitsRes : [])
          .map((u) => {
            const code = String(u.F_Code ?? u.f_Code ?? u.id ?? '').trim();
            const name = String(u.F_Name ?? u.f_Name ?? u.name ?? '').trim();
            return {
              code,
              name: name || code,
              isSelected: false
            };
          })
          .filter((u) => u.code);

        const seasonRows = Array.isArray(seasonsRes) ? seasonsRes : [];
        const seasonMap = new Map();
        seasonRows.forEach((s) => {
          const rawDate = String(
            s.seasonStartDate || s.S_SEASONSTARTDATE || s.startDate || s.StartDate || ''
          ).trim();
          const yearMatch = rawDate.match(/(\d{4})$/) || rawDate.match(/^(\d{4})/);
          const year = yearMatch ? Number(yearMatch[1]) : null;
          if (!year || !Number.isFinite(year)) return;
          const nextYear = year + 1;
          const code = `${String(year).slice(-2)}${String(nextYear).slice(-2)}`;
          const label = `${year}-${nextYear}`;
          if (!seasonMap.has(code)) {
            seasonMap.set(code, { id: code, name: label, isSelected: false });
          }
        });

        const seasonsData = Array.from(seasonMap.values());

        setUnits(unitsData);
        setSeasons(seasonsData);
        setUserTypes(Array.isArray(typesData) ? typesData : []);

        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('id');
        const userid = queryParams.get('userid');

        if (id || userid) {
          setIsEditMode(true);
          setChangePassword(false);
          setConfirmPassword('');
          loadUserData(id, userid, unitsData, seasonsData);
        }

      } catch (error) {

        console.error("Data load error:", error);
        toast.error("Failed to load initial data");

      }

    };

    loadInitialData();

  }, [location.search]);


  const loadUserData = async (id, userId, currentUnits, currentSeasons) => {

    try {

      let user;
      const idValue = String(id || '').trim();
      const userIdValue = String(userId || id || '').trim();
      const isNumericId = idValue !== '' && /^[0-9]+$/.test(idValue);

      const res = await userManagementService.getUsers(
        isNumericId ? { id: idValue } : { userId: userIdValue }
      );
      user = Array.isArray(res) ? res[0] : res;

      const hasValidPayload = user && (user.ID || user.Id || user.id || user.Userid || user.UserID);
      if (!hasValidPayload && userIdValue) {
        try {
          user = await userManagementService.getUserByCode(userIdValue);
        } catch (error) {
          user = null;
        }
      }

      if (!user) return;

        setFormData({
          ID: user.ID || user.Id || user.id || '',
          UTID: String(user.UTID || user.UserTypeId || user.UserTypeID || ''),
          userid: user.Userid || user.UserID || user.userid || '',
          SAPCode: user.SAPCode || '',
          Password: '', // do not expose password
          Name: user.Name || user.UserName || '',
          Mobile: user.Mobile || user.MobileNo || '',
          EmailID: user.EmailID || user.Email || '',
        DOB: user.DOB ? String(user.DOB).split('T')[0] : '',
        Gender: String(user.Gender || '1'),
        Type: String(user.Type || 'Other'),
        Status: String(user.Status || '1'),
        TimeFrom: user.TimeFrom || '0600',
        TimeTo: user.TimeTo || '1800',
        GPS_Notification: !!user.GPS_Notification
      });

      const rawUnits = user.assignedUnits || user.factories || user.Factories || user.units || [];
      if (rawUnits && rawUnits.length) {
        const unitSet = new Set(rawUnits.map(String));

        setUnits(
          currentUnits.map((u) => ({
            ...u,
            isSelected: unitSet.has(String(u.code))
          }))
        );

      }

      const rawSeasons = user.assignedSeasons || user.seasons || user.Seasons || [];
      if (rawSeasons && rawSeasons.length) {
        const seasonSet = new Set(rawSeasons.map(String));

        setSeasons(
          currentSeasons.map((s) => ({
            ...s,
            isSelected: seasonSet.has(String(s.id))
          }))
        );

      }

    } catch (error) {

      console.error(error);
      toast.error("Failed to load user data");

    }

  };


  const handleInputChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

  };


  const handleUnitToggle = (code) => {

    setUnits((prev) =>
      prev.map((u) =>
        u.code === code ? { ...u, isSelected: !u.isSelected } : u
      )
    );

  };


  const handleSeasonToggle = (id) => {

    setSeasons((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, isSelected: !s.isSelected } : s
      )
    );

  };


  const handleSave = async (e) => {

    e.preventDefault();

    const trimmedUserId = String(formData.userid || '').trim();
    const trimmedName = String(formData.Name || '').trim();
    const utidValue = Number(formData.UTID);

    if (!trimmedUserId || !trimmedName) {
      toast.error('User ID and Full Name are required');
      return;
    }

    if (!Number.isFinite(utidValue) || utidValue <= 0) {
      toast.error('User Type is required');
      return;
    }

      if (!isEditMode && !String(formData.Password || '').trim()) {
        toast.error('Password is required for new user');
        return;
      }
      if (isEditMode && changePassword && !String(formData.Password || '').trim()) {
        toast.error('Password is required to change it');
        return;
      }
      if ((!isEditMode || changePassword) && String(formData.Password || '') !== String(confirmPassword || '')) {
        toast.error('Password and Confirm Password must match');
        return;
      }

    setIsLoading(true);

    try {

      const { userid, ...rest } = formData;
      const payload = {
        ...rest,
        Userid: trimmedUserId,
        UTID: utidValue,
        units: units.filter((u) => u.isSelected).map((u) => u.code),
        seasons: seasons.filter((s) => s.isSelected).map((s) => s.id)
      };

      if (isEditMode) {

        await userManagementService.createUser(payload);
        toast.success('User updated successfully!');

      } else {

        await userManagementService.createUser(payload);
        toast.success('User registered successfully!');

      }

      navigate('/UserManagement/AddUserViewRight');

    } catch (error) {

      console.error(error);
      const message = error?.response?.data?.message || 'Error saving user data';
      toast.error(message);

    } finally {

      setIsLoading(false);

    }

  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg border-0 shadow-[0 4px 12px rgba(0,0,0,0.1)]")}>
                <div className={__cx("page-card-header", "text-center text-4 py-[12px] px-[20px] bg-[#008080]")}>
                    Add User
                </div>

                <div className={__cx("page-card-body", "p-[20px]")}>
                    <form onSubmit={handleSave}>
                        <div className={__cx("form-grid-4", "mb-[15px]")}>
                            <div className="form-group">
                                <label className="font-bold">User Type</label>
                                <select name="UTID" className="form-control" value={formData.UTID} onChange={handleInputChange}>
                                    <option value="">--Please Select--</option>
                                    {userTypes.map((t, idx) => {
                                      const value = t.id ?? t.UTID ?? t.TypeId ?? t.TypeID ?? '';
                                      const label = t.name || t.Type || t.TypeName || t.UserType || t.UTName || `Type ${value}`;
                                      return (
                                        <option key={`${value}-${idx}`} value={value}>
                                          {label}
                                        </option>
                                      );
                                    })}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="font-bold">User ID</label>
                                <input type="text" name="userid" className="form-control" value={formData.userid} onChange={handleInputChange} disabled={isEditMode} />
                            </div>
                            <div className="form-group">
                                <label className="font-bold">SAP Code</label>
                                <input type="text" name="SAPCode" className="form-control" value={formData.SAPCode} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label className="font-bold">Password</label>
                                <input
                                    type="password"
                                    name="Password"
                                    className="form-control"
                                    value={formData.Password}
                                    onChange={handleInputChange}
                                    disabled={isEditMode && !changePassword}
                                    placeholder={isEditMode && !changePassword ? 'Use Change Password to update' : ''}
                                />
                                {isEditMode && (
                                  <label className="text-[13px] flex items-center gap-[8px] mt-[6px] cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={changePassword}
                                      onChange={(e) => {
                                        setChangePassword(e.target.checked);
                                        if (!e.target.checked) {
                                          setFormData((prev) => ({ ...prev, Password: '' }));
                                          setConfirmPassword('');
                                        }
                                      }}
                                    />
                                    Change Password
                                  </label>
                                )}
                            </div>
                        </div>

                        <div className={__cx("form-grid-4", "mb-[15px]")}>
                            <div className="form-group">
                                <label className="font-bold">Full Name</label>
                                <input type="text" name="Name" className="form-control" value={formData.Name} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label className="font-bold">Confirm Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isEditMode && !changePassword}
                                    placeholder={isEditMode && !changePassword ? 'Use Change Password to update' : ''}
                                />
                            </div>
                            <div className="form-group">
                                <label className="font-bold">Mobile</label>
                                <input type="text" name="Mobile" className="form-control" value={formData.Mobile} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label className="font-bold">Email ID</label>
                                <input type="email" name="EmailID" className="form-control" value={formData.EmailID} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label className="font-bold">DOB</label>
                                <input type="text" name="DOB" className="form-control" value={formData.DOB} onChange={handleInputChange} placeholder="Ex. dd/mm/yyyy" />
                            </div>
                        </div>

                        <div className={__cx("form-grid-4", "mb-[15px]")}>
                            <div className="form-group">
                                <label className="font-bold">Gender</label>
                                <div className="flex gap-[20px] py-[8px] px-[0]">
                                    <label className="text-[13px] flex items-center gap-[5px] cursor-pointer">
                                        <input type="radio" name="Gender" value="1" checked={formData.Gender === '1'} onChange={handleInputChange} /> male
                                    </label>
                                    <label className="text-[13px] flex items-center gap-[5px] cursor-pointer">
                                        <input type="radio" name="Gender" value="0" checked={formData.Gender === '0'} onChange={handleInputChange} /> Female
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="font-bold">Type</label>
                                <select name="Type" className="form-control" value={formData.Type} onChange={handleInputChange}>
                                    <option value="Other">Other</option>
                                    <option value="Cane">Cane</option>
                                    <option value="Plant">Plant</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="font-bold">Status</label>
                                <select name="Status" className="form-control" value={formData.Status} onChange={handleInputChange}>
                                    <option value="0">Deactive</option>
                                    <option value="1">Active</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="font-bold">Time Start</label>
                                <input type="text" name="TimeFrom" className="form-control" value={formData.TimeFrom} onChange={handleInputChange} placeholder="HHmm 600" />
                            </div>
                        </div>

                        <div className={__cx("form-grid-4", "mb-[30px]")}>
                            <div className="form-group">
                                <label className="font-bold">Time End</label>
                                <input type="text" name="TimeTo" className="form-control" value={formData.TimeTo} onChange={handleInputChange} placeholder="HHmm 1800" />
                            </div>
                            <div className={__cx("form-group", "flex items-end pb-[10px]")}>
                                <label className="text-[13px] flex items-center gap-[10px] cursor-pointer">
                                    <input type="checkbox" name="GPS_Notification" checked={formData.GPS_Notification} onChange={handleInputChange} />
                                    Capture GPS Location?
                                </label>
                            </div>
                            <div className="form-group">
                                <label className="font-bold">Unit</label>
                                <div className="border border-[#ccc] rounded p-[10px] h-[120px] overflow-y-auto bg-white">
                                    {units.map((u, idx) =>
                  <div key={u.code} className="flex items-center gap-[8px] mb-[5px]">
                                            <input type="checkbox" checked={u.isSelected} onChange={() => handleUnitToggle(u.code)} />
                                            <span className="text-[13px]">{u.name}</span>
                                        </div>
                  )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="font-bold">Season</label>
                                <div className="border border-[#ccc] rounded p-[10px] h-[120px] overflow-y-auto bg-white">
                                    {seasons.map((s, idx) =>
                  <div key={s.id} className="flex items-center gap-[8px] mb-[5px]">
                                            <input type="checkbox" checked={s.isSelected} onChange={() => handleSeasonToggle(s.id)} />
                                            <span className="text-[13px]">{s.name}</span>
                                        </div>
                  )}
                                </div>
                            </div>
                        </div>

                        <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0] justify-start gap-[10px]")}>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" className="btn btn-primary" onClick={() => navigate('/UserManagement/AddUserViewRight')}>
                                View
                            </button>
                            <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>
                                Exit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>);

};

export default UserManagement_AddUser;
