import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { userManagementService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

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
    Type: '0',
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

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [unitsRes, seasonsRes, typesData] = await Promise.all([
        masterService.getUnits(),
        masterService.getSeasons(),
        userManagementService.getUserTypes()]
        );

        const unitsData = (Array.isArray(unitsRes) ? unitsRes : []).map((u, idx) => ({
          code: u.F_Code || u.f_Code || u.id,
          name: u.F_Name || u.name,
          isSelected: false
        }));

        const seasonsData = (Array.isArray(seasonsRes) ? seasonsRes : []).map((s, idx) => ({
          id: s.sid || s.id,
          name: s.season || s.name || s.Season,
          isSelected: false
        }));

        setUnits(unitsData);
        setSeasons(seasonsData);
        setUserTypes(Array.isArray(typesData) ? typesData : []);

        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('id');
        if (id) {
          setIsEditMode(true);
          loadUserData(id, unitsData, seasonsData);
        }
      } catch (error) {
        console.error("Data load error:", error);
      }
    };
    loadInitialData();
  }, [location.search]);

  const loadUserData = async (id, currentUnits, currentSeasons) => {
    try {
      const res = await userManagementService.getUsers({ id });
      const user = Array.isArray(res) ? res[0] : res;
      if (user) {
        setFormData({
          ID: user.ID,
          UTID: String(user.UTID || ''),
          userid: user.userid || '',
          SAPCode: user.SAPCode || '',
          Password: user.Password || '',
          Name: user.Name || '',
          Mobile: user.Mobile || '',
          EmailID: user.EmailID || '',
          DOB: user.DOB ? user.DOB.split('T')[0] : '',
          Gender: String(user.Gender || '1'),
          Type: String(user.Type || '0'),
          Status: String(user.Status || '1'),
          TimeFrom: user.TimeFrom || '0600',
          TimeTo: user.TimeTo || '1800',
          GPS_Notification: !!user.GPS_Notification
        });

        // Map assigned units and seasons if provided by API (hypothetical structure)
        if (user.assignedUnits) {
          setUnits(currentUnits.map((u, idx) => ({
            ...u,
            isSelected: user.assignedUnits.includes(String(u.code))
          })));
        }
        if (user.assignedSeasons) {
          setSeasons(currentSeasons.map((s, idx) => ({
            ...s,
            isSelected: user.assignedSeasons.includes(String(s.id))
          })));
        }
      }
    } catch (error) {
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
    prev.map((u, idx) => u.code === code ? { ...u, isSelected: !u.isSelected } : u)
    );
  };

  const handleSeasonToggle = (id) => {
    setSeasons((prev) =>
    prev.map((s, idx) => s.id === id ? { ...s, isSelected: !s.isSelected } : s)
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.userid || !formData.Name) {
      toast.error('User ID and Full Name are required');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        units: units.filter((u) => u.isSelected).map((u) => u.code),
        seasons: seasons.filter((s) => s.isSelected).map((s) => s.id)
      };

      if (isEditMode) {
        // Hypothetical update call
        await userManagementService.createUser(payload);
        toast.success('User updated successfully!');
      } else {
        await userManagementService.createUser(payload);
        toast.success('User registered successfully!');
      }
      navigate('/UserManagement/AddUserView');
    } catch (error) {
      toast.error('Error saving user data');
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
                                    {userTypes.map((t, idx) =>
                  <option key={`${t.id || t.UTID || t.UTName}-${idx}`} value={t.id || t.UTID || t.UTName}>
                                            {t.name || t.Type || t.TypeName || t.UserType || t.UTName}
                                        </option>
                  )}
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
                                <input type="password" name="Password" className="form-control" value={formData.Password} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className={__cx("form-grid-4", "mb-[15px]")}>
                            <div className="form-group">
                                <label className="font-bold">Full Name</label>
                                <input type="text" name="Name" className="form-control" value={formData.Name} onChange={handleInputChange} />
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
                            <button type="button" className="btn btn-primary" onClick={() => navigate('/UserManagement/AddUserView')}>
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