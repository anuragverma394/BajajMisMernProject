import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService } from '../../microservices/api.service';
import '../../styles/base.css';const ExceptionReportMaster = () => {const navigate = useNavigate();const [activeTab, setActiveTab] = useState('Consolidated'); // Consolidated, ReasonWise, Audit
  const [units, setUnits] = useState([]);const [filters, setFilters] = useState({ F_code: '', FromDate: '27/02/2026', ToDate: '27/02/2026'
    });

  useEffect(() => {
    masterService.getUnits().then((d) => {
      const data = Array.isArray(d) ? d : d.data || [];
      setUnits(data);
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const exceptionalReports = [
  { id: 1, name: "CONSECUTIVE GROSS WEIGHT DIFFRENCE-RECEIPT", value: "0-Kg" },
  { id: 2, name: "CENTRE TRUCK TARE WEIGHT DIFFERENCE", value: "0-Kg" },
  { id: 3, name: "TARE TIME AND NEXT TOKEN TIME DIFFERENCE OF SAME CENTRE TRUCK", value: "0-Minutes" },
  { id: 4, name: "MIN TIME GAP BETWEEN GROSS TARE TIME-PURCHASE", value: "0-Minutes" },
  { id: 5, name: "MAX TIME GAP BETWEEN GROSS TARE TIME-PURCHASE", value: "0-Minutes" },
  { id: 6, name: "MIN TIME GAP BETWEEN GROSS TARE TIME- RECEIPT", value: "0-Minutes" },
  { id: 7, name: "MAX TIME GAP BETWEEN GROSS TARE TIME- RECEIPT", value: "0-Minutes" },
  { id: 8, name: "MAX TIME GAP BETWEEN TOKEN GROSS TIME-PURCHASE", value: "0-Minutes" },
  { id: 9, name: "MIN TIME GAP BETWEEN TOKEN GROSS TIME-PURCHASE", value: "0-Minutes" },
  { id: 10, name: "MAX TIME GAP BETWEEN TOKEN GROSS TIME-RECEIPT", value: "0-Minutes" },
  { id: 11, name: "MIN TIME GAP BETWEEN TOKEN GROSS TIME-RECEIPT", value: "0-Minutes" },
  { id: 12, name: "MINIMUM TARE FOR PURCHASE", value: "0-De-Activated" },
  { id: 13, name: "MAXIMUM TARE FOR PURCHASE", value: "0-De-Activated" },
  { id: 14, name: "MAXIMUM GROSS FOR PURCHASE", value: "0-De-Activated" },
  { id: 15, name: "MINIMUM GROSS FOR PURCHASE", value: "0-De-Activated" },
  { id: 16, name: "MAXIMUM GROSS FOR -RECEIPT", value: "0-De-Activated" },
  { id: 17, name: "MINIMUM GROSS FOR -RECEIPT", value: "0-De-Activated" },
  { id: 18, name: "MINIMUM TARE FOR -RECEIPT", value: "0-De-Activated" },
  { id: 19, name: "MAXIMUM TARE FOR -RECEIPT", value: "0-De-Activated" },
  { id: 21, name: "CONSECUTIVE GROSS WEIGHT DIFFRENCE-PURCHASE", value: "0-Kg" },
  { id: 51, name: "UNSERIAL TOKEN TO GROSS -PURCHASE", value: "0-De-Activated" },
  { id: 52, name: "UNSERIAL TOKEN TO GROSS -RECEIPT", value: "0-De-Activated" }];


  const auditReports = [
  { id: 101, name: "Variety Change Lower To Higher" },
  { id: 102, name: "Token Issued No Gross Weightment Take Place-Purchase upto Day-1" },
  { id: 103, name: "Gross Weightment Done No Tare Weightment Take Place-Purchase upto Day-1" },
  { id: 104, name: "Token Issued No Gross Weightment Take Place-Receipt upto Day-1" },
  { id: 105, name: "Gross Weightment Done No Tare Weightment Take Place-Receipt upto Day-1" },
  { id: 106, name: "More Then One Weightment Of Grower in a Single Day at Millgate" }];


  const getHeaderTitle = () => {
    if (activeTab === 'Consolidated') return 'Exception Consolidated Format';
    if (activeTab === 'ReasonWise') return 'Exception Reason Wise Report';
    if (activeTab === 'Audit') return 'Add Audit Report';
    return 'Exception Report Master';
  };

  const headerStyle = "bg-[#008080] text-white py-[10px] px-[20px] text-4 font-medium rounded-[8px 8px 0 0] mb-[20px]";









  const tabBtn = (target) => ({
    padding: '8px 20px',
    border: '1px solid #ddd',
    borderBottom: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    backgroundColor: activeTab === target ? '#6495ED' : '#fff',
    color: activeTab === target ? '#white' : '#666',
    transition: 'all 0.2s',
    marginRight: '10px'
  });

  const cardStyle = "p-[25px] border border-[#e2e8f0] rounded-lg bg-white shadow-[0 1px 3px rgba(0,0,0,0.05)] mb-[25px]";








  const labelStyle = "block text-[13px] font-semibold text-[#333] mb-[8px]";







  const inputStyle = "w-[100%] py-[8px] px-[12px] border border-[#cbd5e1] rounded text-[13px] bg-white ";









  const btnDownload = {
    backgroundColor: '#16a085',
    color: 'white',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '20px'
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Segoe UI', Tahoma, Geneva, Verdana, sans-serif]">
            <Toaster position="top-right" />

            <div className={headerStyle}>
                {getHeaderTitle()}
            </div>

            <div className="flex border-b border-b-[#ddd] pl-[20px] mb-[1px]">
                <button

          onClick={() => setActiveTab('Consolidated')} className={activeTab === "Consolidated" ? "py-[8px] px-[20px] border border-[#ddd] border-b-0 rounded-t cursor-pointer text-[13px] font-medium bg-[#6495ED] text-white mr-[10px]" : "py-[8px] px-[20px] border border-[#ddd] border-b-0 rounded-t cursor-pointer text-[13px] font-medium bg-white text-[#666] mr-[10px]"}>
          
                    Exception Consolidated Format
                </button>
                <button

          onClick={() => setActiveTab('ReasonWise')} className={activeTab === "ReasonWise" ? "py-[8px] px-[20px] border border-[#ddd] border-b-0 rounded-t cursor-pointer text-[13px] font-medium bg-[#6495ED] text-white mr-[10px]" : "py-[8px] px-[20px] border border-[#ddd] border-b-0 rounded-t cursor-pointer text-[13px] font-medium bg-white text-[#666] mr-[10px]"}>
          
                    Exception Reason Wise Report
                </button>
                <button

          onClick={() => setActiveTab('Audit')} className={activeTab === "Audit" ? "py-[8px] px-[20px] border border-[#ddd] border-b-0 rounded-t cursor-pointer text-[13px] font-medium bg-[#6495ED] text-white mr-[10px]" : "py-[8px] px-[20px] border border-[#ddd] border-b-0 rounded-t cursor-pointer text-[13px] font-medium bg-white text-[#666] mr-[10px]"}>
          
                    Audit Report
                </button>
            </div>

            <div className={cardStyle}>
                <div className="flex gap-[30px] mb-[20px]">
                    <div className="w-[250px]">
                        <label className={labelStyle}>Factory</label>
                        <select
              name="F_code"
              value={filters.F_code}
              onChange={handleChange} className={inputStyle}>

              
                            <option value="">--Select Factory--</option>
                            {units.map((unit, idx) =>
              <option key={`${unit.F_Code || unit.id}-${idx}`} value={unit.F_Code || unit.id}>{unit.F_Name || unit.name}</option>
              )}
                        </select>
                    </div>

                    <div className="w-[250px]">
                        <label className={labelStyle}>Date From</label>
                        <input
              type="text"
              name="FromDate"
              value={filters.FromDate}
              onChange={handleChange} className={inputStyle} />

            
                    </div>

                    <div className="w-[250px]">
                        <label className={labelStyle}>Date To</label>
                        <input
              type="text"
              name="ToDate"
              value={filters.ToDate}
              onChange={handleChange} className={inputStyle} />

            
                    </div>
                </div>

                <button onClick={() => toast.success("Downloading report...")} className="bg-[#16a085] text-white py-[8px] px-[16px] text-[13px] font-medium border-0 rounded cursor-pointer flex items-center gap-[8px] mt-[20px]">
                    <i className="fas fa-file-excel"></i> Report Download
                </button>

                {(activeTab === 'ReasonWise' || activeTab === 'Audit') &&
        <div className="mt-[30px] border border-[#ddd] rounded max-h-[400px] overflow-y-auto">
                        <table className="w-[100%] text-[13px]">
                            <thead className="sticky top-[0px] bg-[#2d3436] text-white z-[10]">
                                <tr>
                                    <th className="p-[12px] border border-[#444] text-left w-[100px]">Rep Code</th>
                                    <th className="p-[12px] border border-[#444] text-left">
                                        {activeTab === 'ReasonWise' ? 'Exceptional Report Name' : 'Audit Report Name'}
                                    </th>
                                    {activeTab === 'ReasonWise' &&
                <th className="p-[12px] border border-[#444] text-left">Control Param Value(Std.)</th>
                }
                                    <th className="p-[12px] border border-[#444] text-center w-[60px]">
                                        <div className="flex items-center justify-center gap-[4px]">
                                            <input type="checkbox" /> All
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeTab === 'ReasonWise' ? exceptionalReports : auditReports).map((item, idx) =>
              <tr key={idx} className="border-b border-b-[#eee]">
                                        <td className="p-[12px]">{item.id}</td>
                                        <td className="p-[12px] text-[#16a085] font-medium uppercase">
                                            {item.name}
                                        </td>
                                        {activeTab === 'ReasonWise' &&
                <td className="p-[12px]">{item.value}</td>
                }
                                        <td className="p-[12px] text-center">
                                            <input type="checkbox" />
                                        </td>
                                    </tr>
              )}
                            </tbody>
                        </table>
                    </div>
        }
            </div>

            <footer className="mt-[20px] text-left text-[11px] text-[#999]">
                2021 © Bajaj Hindusthan Sugar Ltd. All Rights Reserved. Designed & Developed By Vibrant IT Solutions Pvt. Ltd.
            </footer>
        </div>);

};

export default ExceptionReportMaster;