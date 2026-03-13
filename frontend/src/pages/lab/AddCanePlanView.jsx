import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { labService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const columns = [
{ key: 'F_Short', label: 'Unit' },
{ key: 'CP_Syrup', label: 'Syrup' },
{ key: 'CP_BHY', label: 'B HY' },
{ key: 'CP_FM', label: 'F.M' },
{ key: 'CP_Total', label: 'Total' },
{ key: 'CP_PolPTarget', label: 'Pol% Target' },
{ key: 'CP_RecPTarget', label: 'Recovery% Target' },
{ key: 'CP_BHPTarget', label: 'BH% Target' },
{ key: 'CP_CHPTarget', label: 'CH%' },
{ key: 'CP_LossMolBHYPTarget', label: 'LM BHY% Target' },
{ key: 'CP_LossMolCHYPTarget', label: 'LM CHY% Target' },
{ key: 'CP_LossMolBHYCHYPTarget', label: 'LM BHY+CHY % Target' },
{ key: 'CP_SteamPTarget', label: 'Steam % Target' },
{ key: 'CCP_BagassPTarget', label: 'Bagasses% Target' },
{ key: 'CP_Alcohol_Syrup', label: 'Alcohol_Syrup' },
{ key: 'CP_Alcohol_BH', label: 'Alcohol_BH' },
{ key: 'CP_Alcohol_CH', label: 'Alcohol_CH' },
{ key: 'CP_PlantCapacity', label: 'Plant Capacity' },
{ key: 'CP_PPTarget', label: 'Power Produced (KWH)' },
{ key: 'CP_PETarget', label: 'Power Export (KWH)' }];


const Lab_AddCanePlanView = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const data = await labService.getCanePlan({ CP_Unit: selectedUnit === 'All' ? '0' : selectedUnit });
      const processedData = Array.isArray(data) ? data : [];
      setReportData(processedData);
      if (processedData.length === 0) toast.error("No records found.");else
      toast.success("Data loaded successfully.");
    } catch (error) {
      toast.error("Error fetching data.");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg")}>
                <div className={__cx("page-card-header", "text-center text-[15px]")}>
                    Target Cane Plan View
                </div>

                <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
                    <div className={__cx("form-grid-4", "mb-[20px]")}>
                        <div className="form-group">
                            <label>Units</label>
                            <select className="form-control" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                                <option value="All">All</option>
                                {units.map((unit, idx) =>
                <option key={`${unit.f_Code || unit.F_CODE || unit.id}-${idx}`} value={unit.f_Code || unit.F_CODE || unit.id}>
                                        {unit.F_Name || unit.F_NAME || unit.name}
                                    </option>
                )}
                            </select>
                        </div>
                    </div>

                    <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
                        <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? 'Searching...' : 'Search'}
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/Lab/AddCanePlan')}>
                            Add New
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate(-1)}>
                            Exit
                        </button>
                    </div>
                </div>
            </div>

            <div className={__cx("page-card", "mt-[10px]")}>
                <div className={__cx("table-wrapper", "max-h-[65vh] overflow-y-auto overflow-x-auto")}>
                    <table className={__cx("data-table", "min-w-[2400px]")}>
                        <thead>
                            <tr>
                                {columns.map((col) =>
                <th key={col.key}>{col.label}</th>
                )}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ?
              reportData.map((item, idx) =>
              <tr key={`${item.CPID || 'row'}-${idx}`}>
                                        {columns.map((col) => {
                  if (col.key === 'F_Short') {
                    return (
                      <td key={`${idx}-${col.key}`}>
                                                        <button
                          type="button"
                          onClick={() => navigate(`/Lab/AddCanePlan?sid=${item.CPID}`)} className="bg-[transparent] border-0 text-[#0b74de] cursor-pointer p-[0px]">

                          
                                                            {item.F_Short || item.CP_Unit || ''}
                                                        </button>
                                                    </td>);

                  }
                  return <td key={`${idx}-${col.key}`}>{item[col.key] ?? '0'}</td>;
                })}
                                    </tr>
              ) :

              <tr>
                                    <td colSpan={columns.length} className="text-center font-bold">
                                        No Record Available
                                    </td>
                                </tr>
              }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);

};

export default Lab_AddCanePlanView;