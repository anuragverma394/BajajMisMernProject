import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { labService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const tableColumns = [
{ key: 'TIME', label: 'TIME' },
{ key: 'TIME_IN_HOURS', label: 'TIME_IN_HOURS' },
{ key: 'SHIFT', label: 'SHIFT' },
{ key: 'DATE', label: 'DATE' },
{ key: 'MILLNO', label: 'MILLNO' },
{ key: 'COL2', label: 'Juice Flow' },
{ key: 'ADD_WATER', label: 'Added Water' },
{ key: 'DRAIN_POL1', label: 'Mill house' },
{ key: 'DRAIN_POL2', label: 'Boiling House' },
{ key: 'DRAIN_POL3', label: 'Centrifugal House' },
{ key: 'DRAIN_POL4', label: 'Miscellaneous' },
{ key: 'SPRAY_WATER_POL', label: 'Spray Pond Inlet Pol' },
{ key: 'SPRAY_WATER_POL2', label: 'Spray Pond Outlet Pol' },
{ key: 'EXHST_PRS_DEVCI', label: 'Spray Pond Inlet PH' },
{ key: 'LIVE_ST_PRS', label: 'Spray Pond Outlet PH' },
{ key: 'BACK_PRS_DEVCI', label: 'Spray Pond Inlet Temp' },
{ key: 'BACK_PRS_DEVCII', label: 'Spray Pond Outlet Temp' },
{ key: 'L_31', label: 'L31' },
{ key: 'L_31CLR', label: 'L31 CLR' },
{ key: 'L_31RET', label: 'L31 RET' },
{ key: 'L_30', label: 'L30' },
{ key: 'L_30CLR', label: 'L30 CLR' },
{ key: 'L_30RET', label: 'L30 RET' },
{ key: 'L_29', label: 'L29' },
{ key: 'L_29CLR', label: 'L29 CLR' },
{ key: 'L_29RET', label: 'L29 RET' },
{ key: 'LBAG_TEMP', label: 'LBAG.TEMP' },
{ key: 'M_31', label: 'M31' },
{ key: 'M_31CLR', label: 'M31 CLR' },
{ key: 'M_31RET', label: 'M31 RET' },
{ key: 'M31BAG_TEMP', label: 'M31BAG TEMP' },
{ key: 'M_30', label: 'M30' },
{ key: 'M_30CLR', label: 'M30 CLR' },
{ key: 'M_30RET', label: 'M30 RET' },
{ key: 'M30BAG_TEMP', label: 'M30BAG TEMP' },
{ key: 'M_29', label: 'M29' },
{ key: 'M_29CLR', label: 'M29 CLR' },
{ key: 'M_29RET', label: 'M29 RET' },
{ key: 'M29BAG_TEMP', label: 'M29BAG TEMP' },
{ key: 'S_31', label: 'S31' },
{ key: 'S_31CLR', label: 'S31 CLR' },
{ key: 'S_31RET', label: 'S31 RET' },
{ key: 'S_30', label: 'S30' },
{ key: 'S_30CLR', label: 'S30 CLR' },
{ key: 'S_30RET', label: 'S30 RET' },
{ key: 'S_29', label: 'S29' },
{ key: 'S_29CLR', label: 'S29 CLR' },
{ key: 'S_29RET', label: 'S29 RET' },
{ key: 'SS_31', label: 'SS31' },
{ key: 'SS_31CLR', label: 'SS31 CLR' },
{ key: 'SS_31RET', label: 'SS31 RET' },
{ key: 'SBAG_TEMP', label: 'S.BAGTEMP' },
{ key: 'BISS', label: 'BISS' },
{ key: 'BISSCLR', label: 'BISSCLR' },
{ key: 'BISSRET', label: 'BISSRET' }];


const Lab_SugarBagProducedView = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState('All');
  const [reportDate, setReportDate] = useState('');
  const [productionData, setProductionData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setFactories(Array.isArray(d) ? d : [])).catch(() => {});
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    setReportDate(`${dd}/${mm}/${yyyy}`);
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await labService.getSugarBagProducedView(selectedFactory === 'All' ? '0' : selectedFactory, reportDate);
      const data = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
      setProductionData(data);
      if (data.length === 0) toast.error('No records found.');else
      toast.success('Data loaded successfully.');
    } catch (error) {
      toast.error('Error fetching data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg")}>
                <div className={__cx("page-card-header", "text-center text-[15px]")}>
                    Sugar Bag Produced View
                </div>

                <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
                    <div className={__cx("form-grid-4", "mb-[20px]")}>
                        <div className="form-group">
                            <label>Factory</label>
                            <select className="form-control" value={selectedFactory} onChange={(e) => setSelectedFactory(e.target.value)}>
                                <option value="All">All</option>
                                {factories.map((f, idx) =>
                <option key={`${f.F_Code || f.f_Code || f.id}-${idx}`} value={f.F_Code || f.f_Code || f.id}>
                                        {f.F_Name || f.F_NAME || f.name}
                                    </option>
                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input type="text" className="form-control" value={reportDate} onChange={(e) => setReportDate(e.target.value)} placeholder="DD/MM/YYYY" />
                        </div>
                    </div>

                    <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
                        <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? 'Searching...' : 'Search'}
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/Lab/SugarBagProducedAdd')}>
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
                    <table className={__cx("data-table", "min-w-[3200px]")}>
                        <thead>
                            <tr>
                                {tableColumns.map((col) =>
                <th key={col.key}>{col.label}</th>
                )}
                            </tr>
                        </thead>
                        <tbody>
                            {productionData.length > 0 ?
              productionData.map((row, idx) =>
              <tr key={idx}>
                                        {tableColumns.map((col) =>
                <td key={`${idx}-${col.key}`}>{row[col.key] ?? '0'}</td>
                )}
                                    </tr>
              ) :

              <tr>
                                    <td colSpan={tableColumns.length} className="text-center font-bold">
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

export default Lab_SugarBagProducedView;