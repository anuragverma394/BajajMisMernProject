import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaFileExcel, FaSearch, FaArrowLeft, FaPrint, FaExclamationCircle } from 'react-icons/fa';
import '../../styles/Report.css';
import '../../styles/IndentFaillDetails.css';

const Report_IndentFaillDetails = () => {
    const location = useLocation();
    const [formData, setFormData] = useState({
        factory: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const dateParam = queryParams.get('Date');
        const factParam = queryParams.get('FACT');
        if (dateParam || factParam) {
            setFormData({
                date: dateParam || new Date().toISOString().split('T')[0],
                factory: factParam || ''
            });
        }
    }, [location]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Search with:', formData);
        // API call logic will go here
    };

    const handleExport = () => {
        console.log('Exporting to Excel...');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="report-container animate-in fade-in duration-500">
            <div className="report-card">
                <div className="report-card-header">
                    <h2 className="report-card-title">
                        <FaExclamationCircle className="text-red-500" />
                        INDENT FAILURE DETAIL
                    </h2>
                    <button className="report-btn report-btn-secondary" onClick={() => window.history.back()}>
                        <FaArrowLeft /> Back
                    </button>
                </div>

                <div className="report-card-content">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="report-form-group">
                            <label htmlFor="factory">Factory</label>
                            <select
                                id="factory"
                                name="factory"
                                className="report-form-control"
                                value={formData.factory}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Factory</option>
                                <option value="1">Unit 1</option>
                            </select>
                        </div>

                        <div className="report-form-group">
                            <label htmlFor="date">Date</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                className="report-form-control"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="md:col-span-2 flex gap-4">
                            <button type="submit" className="report-btn report-btn-success">
                                <FaSearch /> Search
                            </button>
                            <button type="button" className="report-btn report-btn-primary" onClick={handleExport}>
                                <FaFileExcel /> Excel
                            </button>
                            <button type="button" className="report-btn report-btn-secondary" onClick={handlePrint}>
                                <FaPrint /> Print
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Results Table */}
            <div className="report-card">
                <div className="report-card-content">
                    <div className="report-table-container">
                        <table className="report-table sticky-header" id="example">
                            <thead>
                                <tr>
                                    <th rowSpan="2">Center</th>
                                    <th rowSpan="2">Center Name</th>
                                    <th colSpan="5" className="text-center bg-blue-50">Early</th>
                                    <th colSpan="5" className="text-center bg-green-50">Other Than Early</th>
                                    <th colSpan="5" className="text-center bg-purple-50">Total</th>
                                    <th colSpan="3" className="text-center bg-orange-50">Balance Indent</th>
                                </tr>
                                <tr>
                                    {/* Early */}
                                    <th className="bg-blue-50">Indent Qty</th>
                                    <th className="bg-blue-50">Ind Wt Qty</th>
                                    <th className="bg-blue-50">Act Wt Qty</th>
                                    <th className="bg-blue-50">Fail % (Pur)</th>
                                    <th className="bg-blue-50">Fail % (Act)</th>
                                    {/* Other Than Early */}
                                    <th className="bg-green-50">Indent Qty</th>
                                    <th className="bg-green-50">Ind Wt Qty</th>
                                    <th className="bg-green-50">Act Wt Qty</th>
                                    <th className="bg-green-50">Fail % (Pur)</th>
                                    <th className="bg-green-50">Fail % (Act)</th>
                                    {/* Total */}
                                    <th className="bg-purple-50">Indent Qty</th>
                                    <th className="bg-purple-50">Ind Wt Qty</th>
                                    <th className="bg-purple-50">Act Wt Qty</th>
                                    <th className="bg-purple-50">Fail % (Pur)</th>
                                    <th className="bg-purple-50">Fail % (Act)</th>
                                    {/* Balance */}
                                    <th className="bg-orange-50">Today Bal</th>
                                    <th className="bg-orange-50">Pipeline (2d)</th>
                                    <th className="bg-orange-50">Total Bal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="20" className="text-center py-8 text-slate-400">
                                        No data found. Please select filters and click Search.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Report_IndentFaillDetails;
