import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, monthlyEntryReportService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const Main_MonthlyEntryReport = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState([]);

  const fallbackParams = [
  { id: 1, name: 'Crop Day', current: '', previous: '' },
  { id: 2, name: 'Cane Crushed, Qtls', current: '', previous: '' },
  { id: 3, name: 'Avg Crush per Crop Day, Qtls', current: '', previous: '' },
  { id: 4, name: 'Recovery % Cane', current: '', previous: '' },
  { id: 5, name: 'Total Sugar Production, Qtls', current: '', previous: '' },
  { id: 6, name: 'Total Losses % Cane', current: '', previous: '' },
  { id: 7, name: 'Steam Consumption % Cane', current: '', previous: '' },
  { id: 8, name: 'Bagasse Saving % Cane', current: '', previous: '' },
  { id: 9, name: 'Total Lime % Cane(Process & Spray only)', current: '', previous: '' },
  { id: 10, name: 'Sulphur % Cane', current: '', previous: '' },
  { id: 11, name: 'Lubricants/ Grease, Kgs./ 100 Qtls, Cane', current: '', previous: '' },
  { id: 12, name: 'Mill lubricants grease, Kgs./ 100 Qtls, Cane', current: '', previous: '' },
  { id: 13, name: 'Caustic Soda (Eng.+ Prodn.),Kgs/100 Q cane', current: '', previous: '' },
  { id: 14, name: 'Phosphoric Acid, Kgs./100 Q Cane', current: '', previous: '' },
  { id: 15, name: 'Substitute for Phosphoric Acid, Kgs./100 Q Cane', current: '', previous: '' },
  { id: 16, name: 'Viscosity Reducer, Kgs./100 Q Cane', current: '', previous: '' },
  { id: 17, name: 'Flocculent( used for Jc. Clarification only), Kgs./100 Q Cane', current: '', previous: '' },
  { id: 18, name: 'Mill Sanitation Chemical, Kgs./100 Q Cane(only at mills)', current: '', previous: '' },
  { id: 19, name: 'Hydrochloric Acid , Kgs./100 Q Cane', current: '', previous: '' },
  { id: 20, name: 'Power Exported to Grid (KWH) - only for cogen units', current: '', previous: '' }];


  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => {});

    monthlyEntryReportService.getParameters().then((res) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      if (list.length > 0) {
        setParams(list.map((p, idx) => ({
          id: p.Id || p.id,
          name: p.Pm_Name || p.name || '',
          current: '',
          previous: ''
        })));
      } else {
        setParams(fallbackParams);
      }
    }).catch(() => {
      setParams(fallbackParams);
    });

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    setReportDate(`${dd}/${mm}/${yyyy}`);
  }, []);

  const onCellChange = (id, field, val) => {
    setParams((prev) => prev.map((r) => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleSave = async () => {
    if (!unitCode || unitCode === 'All') {
      toast.error('Please Select Manufacturing Unit.');
      return;
    }
    setIsLoading(true);
    try {
      await monthlyEntryReportService.create({
        unit: unitCode,
        date: reportDate,
        entries: params.filter((p) => p.current || p.previous)
      });
      toast.success('Performance distribution successfully synchronized.');
      navigate('/Main/MonthlyEntryReportView');
    } catch (err) {
      toast.error('Data synchronization sequence aborted.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
      <Toaster position="top-right" />

      <div className={__cx("page-card", "rounded-lg")}>
        <div className={__cx("page-card-header", "text-left text-[15px]")}>
          Monthly Entry Report
        </div>

        <div className={__cx("page-card-body", "bg-white p-[20px]")}>
          <div className={__cx("form-grid-4", "mb-[20px]")}>
            <div className="form-group">
              <label>Manufacturing Unit</label>
              <select className="form-control" value={unitCode} onChange={(e) => setUnitCode(e.target.value)}>
                <option value="">-- Sector Asset Mapping --</option>
                {units.map((u, idx) =>
                <option key={`${u.F_Code || u.f_Code || u.id}-${idx}`} value={u.F_Code || u.f_Code || u.id}>
                    {u.F_Name || u.name}
                  </option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="text" className="form-control" value={reportDate} onChange={(e) => setReportDate(e.target.value)} placeholder="Ex. dd/mm/yyyy" />
            </div>
          </div>

          <div className={__cx("table-wrapper", "max-h-[60vh] overflow-y-auto mb-[20px] border border-[#ddd] rounded")}>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-[60px]">ID</th>
                  <th className="text-left">Parameter</th>
                  <th>Current</th>
                  <th>Previous</th>
                </tr>
              </thead>
              <tbody>
                {params.map((row, idx) =>
                <tr key={`${row.id ?? 'param'}-${idx}`}>
                    <td className="text-center">{row.id}</td>
                    <td className="text-left pl-[15px] font-medium">{row.name}</td>
                    <td className="py-[4px] px-[10px]">
                      <input
                      type="number"
                      className={__cx("form-control", "text-right border border-[#ccc] rounded-[2px] py-[4px] px-[8px]")}

                      value={row.current}
                      onChange={(e) => onCellChange(row.id, 'current', e.target.value)} />
                    
                    </td>
                    <td className="py-[4px] px-[10px]">
                      <input
                      type="number"
                      className={__cx("form-control", "text-right border border-[#ccc] rounded-[2px] py-[4px] px-[8px]")}

                      value={row.previous}
                      onChange={(e) => onCellChange(row.id, 'previous', e.target.value)} />
                    
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0] justify-start")}>
            <button className="btn btn-primary" onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Synchronizing...' : 'Save Performance Data'}
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/Main/MonthlyEntryReportView')}>
              View
            </button>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              Exit Session
            </button>
          </div>
        </div>
      </div>
    </div>);

};

export default Main_MonthlyEntryReport;