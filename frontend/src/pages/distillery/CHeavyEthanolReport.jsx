import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { distilleryService, masterService } from '../../microservices/api.service';
import '../../styles/DistilleryReports.css';
import { openPrintWindow } from '../../utils/print';

const DISTILLERY_CHeavyEthanolReport = () => {
    const navigate = useNavigate();
    const [factories, setFactories] = useState([]);
    const [selectedFactory, setSelectedFactory] = useState('');
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadFactories = async () => {
            try {
                const response = await masterService.getUnits();
                setFactories(response.data || response);
            } catch (error) {
                toast.error("Failed to load factory units");
            }
        };
        loadFactories();
    }, []);

    const handleSearch = async () => {
        if (!selectedFactory) {
            toast.error("Please select a factory unit");
            return;
        }
        setIsLoading(true);
        try {
            const params = { factory: selectedFactory, from: fromDate, to: toDate };
            const data = await distilleryService.getCHeavyReport(params);
            setReportData(data);
            toast.success("C Heavy report synchronized");
        } catch (error) {
            toast.error("Failed to fetch distillery data");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('report-table-section');
        openPrintWindow({
            title: "C Heavy Ethanol Report",
            subtitle: `Period: ${fromDate} to ${toDate}`,
            contentHtml: printContent ? printContent.outerHTML : ""
        });
    };

    const handleExport = () => {
        const table = document.getElementById('dist-report-table');
        if (!table) return;

        let html = table.outerHTML;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `C_Heavy_Ethanol_Report_${selectedFactory}.xls`;
        a.click();
        toast.success("Exporting to Excel...");
    };

    return (
        <div className="dist-report-root animate-in fade-in duration-500">
            <Toaster position="top-right" />
            <div className="dist-report-container">
                <div className="dist-card">
                    <header className="dist-card-header dist-card-header-cheavy">
                        <h2 className="dist-card-title">
                            <i className="fas fa-flask-vial"></i>
                            C Heavy Ethanol Monthly Report
                        </h2>
                        <div className="dist-header-actions">
                            <button className="btn-dist-outline" onClick={() => navigate('/Distillery/DistilleryDashboard')}>
                                <i className="fas fa-arrow-left"></i> Menu
                            </button>
                        </div>
                    </header>

                    <div className="dist-filter-box">
                        <div className="dist-filter-grid">
                            <div className="dist-form-group">
                                <label>Target Unit</label>
                                <select className="dist-form-control" value={selectedFactory} onChange={e => setSelectedFactory(e.target.value)}>
                                    <option value="">--Select Factory--</option>
                                    {factories.map((f, idx) => <option key={`${f.id ?? 'factory'}-${idx}`} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            <div className="dist-form-group">
                                <label>From Month</label>
                                <input type="date" className="dist-form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                            </div>
                            <div className="dist-form-group">
                                <label>To Month</label>
                                <input type="date" className="dist-form-control" value={toDate} onChange={e => setToDate(e.target.value)} />
                            </div>
                            <div className="dist-action-buttons">
                                <button className="btn-dist-primary btn-dist-primary-cheavy" onClick={handleSearch} disabled={isLoading}>
                                    <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-search'}`}></i>
                                    {isLoading ? 'Syncing...' : 'Fetch Report'}
                                </button>
                                <button className="btn-dist-outline" onClick={handlePrint} disabled={!reportData}>
                                    <i className="fas fa-print"></i>
                                </button>
                                <button className="btn-dist-outline" onClick={handleExport} disabled={!reportData}>
                                    <i className="fas fa-file-excel"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="dist-loading">
                            <div className="dist-spinner dist-spinner-cheavy"></div>
                            <p>Assembling distillery metrics...</p>
                        </div>
                    ) : reportData && reportData.length > 0 ? (
                        <div id="report-table-section" className="dist-table-container">
                            <table id="dist-report-table" className="dist-premium-table">
                                <thead>
                                    <tr>
                                        <th className="sticky-col">Particulars</th>
                                        <th className="sticky-col-2">U/M</th>
                                        {reportData[0].MonthlyValues.map((v, i) => (
                                            <th key={i}>{v.MonthName}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, idx) => (
                                        <tr key={idx} className={row.IsBold ? 'bold-row' : ''}>
                                            <td className="sticky-col particular-cell">{row.Particular}</td>
                                            <td className="sticky-col-2 um-cell">{row.UM}</td>
                                            {row.MonthlyValues.map((v, i) => (
                                                <td key={i} className="text-right">
                                                    {row.IsDate ? v.Value : Number(v.Value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="dist-empty">
                            <i className="fas fa-chart-line"></i>
                            <p>Select parameters and fetch to see the report data.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DISTILLERY_CHeavyEthanolReport;



