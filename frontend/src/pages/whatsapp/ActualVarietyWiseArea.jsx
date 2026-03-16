import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { whatsappService, masterService } from '../../microservices/api.service';
import '../../styles/WhatsApp.css';
import '../../styles/ActualVarietyWiseArea.css';
import { openPrintWindow } from '../../utils/print';

const WhatsApp_ActualVarietyWiseArea = () => {
    const navigate = useNavigate();
    const [units, setUnits] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState('');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [caneAreaType, setCaneAreaType] = useState('1');
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadUnits = async () => {
            try {
                const response = await masterService.getUnits();
                const unitsData = response.data || response;
                setUnits(Array.isArray(unitsData) ? unitsData : []);
            } catch (error) {
                toast.error("Failed to fetch factories");
            }
        };
        loadUnits();
    }, []);

    const handleSearch = async () => {
        if (!selectedUnit) {
            toast.error("Please select a factory");
            return;
        }
        setIsLoading(true);
        setReportData(null);
        try {
            const data = await whatsappService.getVarietyArea({ unit: selectedUnit, date: reportDate, type: caneAreaType });
            setReportData(data);
            toast.success("Variety data loaded");
        } catch (error) {
            toast.error("Failed to load variety data");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('report-table-section');
        openPrintWindow({
            title: `Actual Variety Wise Area - ${reportDate}`,
            subtitle: caneAreaType === '1' ? 'As Per First Survey' : 'As Per Caneup Portal',
            contentHtml: printContent ? printContent.outerHTML : ""
        });
    };

    const handleExcelExport = () => {
        toast.success("Exporting to Excel...");
    };

    return (
        <div className="whatsapp-container-main">
            <Toaster position="top-right" />
            <div className="whatsapp-page-wrapper">
                <div className="whatsapp-card-ui">
                    <div className="whatsapp-card-ui-header">
                        <h2 className="whatsapp-card-ui-title">Actual Variety Wise Area And Supply</h2>
                    </div>
                    <div className="whatsapp-card-ui-content">
                        <div className="whatsapp-form-layout">
                            <div className="whatsapp-input-group">
                                <label>Type of cane Area</label>
                                <select
                                    className="whatsapp-select-field"
                                    value={caneAreaType}
                                    onChange={(e) => setCaneAreaType(e.target.value)}
                                >
                                    <option value="1">As Per First Survey</option>
                                    <option value="2">As Per Caneup Portal</option>
                                </select>
                            </div>
                            <div className="whatsapp-input-group">
                                <label>Factory</label>
                                <select
                                    className="whatsapp-select-field"
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                >
                                    <option value="">--Select Factory--</option>
                                    {units.map((unit, idx) => (
                                        <option key={`${unit.id ?? 'unit'}-${idx}`} value={unit.id}>
                                            {unit.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="whatsapp-input-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    className="whatsapp-date-field"
                                    value={reportDate}
                                    onChange={(e) => setReportDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="whatsapp-action-buttons">
                            <button className="whatsapp-btn-search" onClick={handleSearch} disabled={isLoading}>
                                <i className="fas fa-search"></i> {isLoading ? 'Searching...' : 'Search'}
                            </button>
                            <button className="whatsapp-btn-print" onClick={handlePrint} disabled={!reportData}>
                                <i className="fas fa-print"></i> Print
                            </button>
                            <button className="whatsapp-btn-excel" onClick={handleExcelExport} disabled={!reportData}>
                                <i className="fas fa-file-excel"></i> Excel
                            </button>
                            <button className="whatsapp-btn-exit" onClick={() => navigate('/WhatsApp/WhatsAppDashboard')}>
                                <i className="fas fa-sign-out-alt"></i> Exit
                            </button>
                        </div>
                    </div>
                </div>

                {isLoading && (
                    <div className="whatsapp-loading-container">
                        <div className="whatsapp-spinner"></div>
                        <p className="whatsapp-loading-text">Analyzing variety statistics...</p>
                    </div>
                )}

                {reportData && (
                    <div id="report-table-section" className="whatsapp-report-section">
                        <div className="whatsapp-table-scroll-area">
                            <table className="whatsapp-custom-table">
                                <thead>
                                    <tr>
                                        <th rowSpan="2" className="th-side">S.No</th>
                                        <th rowSpan="2" className="th-side">Variety Code</th>
                                        <th rowSpan="2" className="th-side">Variety Name</th>
                                        <th colSpan="7" className="th-cane-area">Cane Area</th>
                                        <th colSpan="2" className="th-cane-purchase">Cane Purchase</th>
                                    </tr>
                                    <tr>
                                        <th className="th-cane-area">Ratoon</th>
                                        <th className="th-cane-area">Plant</th>
                                        <th className="th-cane-area">Autumn</th>
                                        <th className="th-cane-area">Total</th>
                                        <th className="th-cane-area">%age</th>
                                        <th className="th-cane-area">Est. Prod</th>
                                        <th className="th-cane-area">%age</th>
                                        <th className="th-cane-purchase">Total Purchase</th>
                                        <th className="th-cane-purchase">%age</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((item, index) => {
                                        const isTotalRow = item.VarietyCode.includes('Total');
                                        return (
                                            <tr key={index} className={isTotalRow ? "row-total" : "row-data"}>
                                                <td>{item.SN}</td>
                                                <td>{item.VarietyCode}</td>
                                                <td>{item.VarietyName}</td>
                                                <td>{item.CRatoon}</td>
                                                <td>{item.CPlant}</td>
                                                <td>{item.CAutumn}</td>
                                                <td>{item.CTotal}</td>
                                                <td>{item.APerc}%</td>
                                                <td>{item.SYeild}</td>
                                                <td>{item.YeildPerc}%</td>
                                                <td>{item.TotPurchse}</td>
                                                <td>{item.PurchasePerc}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsApp_ActualVarietyWiseArea;




