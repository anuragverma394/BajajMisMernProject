import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportService, masterService } from '../microservices/api.service';
import '../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const CenterPurchasesReport = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{"id":"1", "type":"1"}');

  const [units, setUnits] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!reportDate) {
      toast.error('Please enter a date.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await reportService.getCenterPurchases({
        userType: user.type || '1',
        userId: user.id || '1',
        factory: unitCode || '0',
        date: reportDate
      });
      if (result.API_STATUS === "OK") {
        setData(result.Data || []);
        if ((result.Data || []).length > 0) toast.success('Data loaded successfully!');else
        toast.error('No data found for selected parameters.');
      } else {
        toast.error(result.Data || "Failed to load data");
      }
    } catch (err) {
      toast.error('Connection error while fetching data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast.error("No data to export!");
      return;
    }
    toast.error("Export to Excel functionality requires external library mapping.");
  };

  const handlePrint = () => {
    if (data.length === 0) {
      toast.error("No data to print!");
      return;
    }
    const printContent = tableRef.current.outerHTML;
    const printWindow = window.open('', '_blank', 'width=1000,height=1000');
    printWindow.document.write(`
            <html>
                <head>
                    <title>Center Purchases Report</title>
                    <style>
                        body { font-family: sans-serif; }
                        h2, h4 { text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                        th, td { border: 1px solid black; padding: 4px; text-align: left; }
                        th { background-color: #dff0d8; text-align: center; }
                        .text-right { text-align: right; }
                    </style>
                </head>
                <body>
                    <h2>Bajaj Group</h2>
                    <h4>Center Purchases Report</h4>
                    <p>Date: ${reportDate || 'N/A'}</p>
                    ${printContent}
                </body>
            </html>
        `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            {/* Card with teal header */}
            <div className={__cx("page-card", "rounded-lg")}>
                <div className={__cx("page-card-header", "text-center text-[15px]")}>
                    Center Purchases Report
                </div>

                <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
                    {/* Form Row: Units, Date */}
                    <div className={__cx("form-row", "gap-[30px] items-start mb-[20px]")}>
                        <div className={__cx("form-group", "")}>
                            <label>Units</label>
                            <select
                className="form-control"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}>
                
                                <option value="">All</option>
                                {units.map((unit, idx) =>
                <option key={`${unit.f_Code || unit.F_CODE || unit.id}-${idx}`} value={unit.f_Code || unit.F_CODE || unit.id}>
                                        {unit.F_Name || unit.F_NAME || unit.name}
                                    </option>
                )}
                            </select>
                        </div>

                        <div className={__cx("form-group", "")}>
                            <label>Date</label>
                            <input
                type="text"
                className="form-control"
                placeholder="DD/MM/YYYY"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)} />
              
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
                        <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? 'Searching...' : 'Search'}
                        </button>
                        <button className="btn btn-primary" onClick={handleExport}>
                            Excel
                        </button>
                        <button className="btn btn-primary" onClick={handlePrint}>
                            Print
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate(-1)}>
                            Exit
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Table Data */}
            {data.length > 0 &&
      <div className={__cx("page-card", "mt-[10px]")}>
                    <div className={__cx("table-wrapper", "max-h-[65vh] overflow-y-auto")}>
                        <table ref={tableRef} className="data-table">
                            <thead>
                                <tr>
                                    <th>SN</th>
                                    <th>Center</th>
                                    <th className="min-w-[150px]">Name</th>
                                    <th>1st WMT</th>
                                    <th>Last WMT</th>
                                    <th className="text-right">Purchys</th>
                                    <th className="text-right">Pur Qty</th>
                                    <th className="text-right">Vehcles</th>
                                    <th>1st Disp.</th>
                                    <th>Last Disp.</th>
                                    <th className="text-right">Recv</th>
                                    <th className="text-right">Bal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, idx) =>
              <tr key={`${row.SN ?? row.m_Centre ?? 'row'}-${row.C_Name ?? ''}-${idx}`}>
                                        <td>{row.SN}</td>
                                        <td>{row.m_Centre}</td>
                                        <td>{row.C_Name}</td>
                                        <td>{row['1stwmtTime']}</td>
                                        <td>{row.LastWmtTime}</td>
                                        <td className="text-right">{row.PurchyNos}</td>
                                        <td className="text-right">{row.PurQty}</td>
                                        <td className="text-right">{row.VehDispatchNos}</td>
                                        <td>{row['1stdisptchAt']}</td>
                                        <td>{row.LastDisptchAt}</td>
                                        <td className="text-right">{row.Recieved}</td>
                                        <td className="text-right">{row.Balance}</td>
                                    </tr>
              )}
                            </tbody>
                        </table>
                    </div>
                </div>
      }
        </div>);

};

export default CenterPurchasesReport;
