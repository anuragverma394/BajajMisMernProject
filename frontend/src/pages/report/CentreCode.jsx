import React, { useState } from 'react';
import { FaFileExcel, FaSearch, FaArrowLeft } from 'react-icons/fa';
import '../../styles/Report.css';
import '../../styles/CentreCode.css';

const Report_CentreCode = () => {
    const [formData, setFormData] = useState({
        unit: '',
        fromDate: '',
        toDate: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.g.target || e.target;
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

    return (
        <div className="report-container animate-in fade-in duration-500">
            <div className="report-card">
                <div className="report-card-header">
                    <h2 className="report-card-title">
                        <FaSearch className="text-blue-500" />
                        Centre/Variety Group Wise Cane Purchase Report
                    </h2>
                    <button className="report-btn report-btn-secondary" onClick={() => window.history.back()}>
                        <FaArrowLeft /> Back
                    </button>
                </div>

                <div className="report-card-content">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="report-form-group">
                            <label htmlFor="unit">Units</label>
                            <select
                                id="unit"
                                name="unit"
                                className="report-form-control"
                                value={formData.unit}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Unit</option>
                                <option value="1">Unit 1</option>
                                <option value="2">Unit 2</option>
                            </select>
                        </div>

                        <div className="report-form-group">
                            <label htmlFor="fromDate">From Date</label>
                            <input
                                type="date"
                                id="fromDate"
                                name="fromDate"
                                className="report-form-control"
                                value={formData.fromDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="report-form-group">
                            <label htmlFor="toDate">To Date</label>
                            <input
                                type="date"
                                id="toDate"
                                name="toDate"
                                className="report-form-control"
                                value={formData.toDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="md:col-span-3 flex gap-4">
                            <button type="submit" className="report-btn report-btn-success">
                                <FaSearch /> Search
                            </button>
                            <button type="button" className="report-btn report-btn-primary" onClick={handleExport}>
                                <FaFileExcel /> Excel
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Results Table - Centre Wise */}
            <div className="report-card">
                <div className="report-card-header">
                    <h3 className="report-card-title">Centre Wise Purchase Details</h3>
                </div>
                <div className="report-card-content">
                    <div className="report-table-container">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th rowSpan="2">SI</th>
                                    <th rowSpan="2">Centre Code</th>
                                    <th rowSpan="2">Centre Name</th>
                                    <th rowSpan="2">Distance(Km.)</th>
                                    <th colSpan="3" className="text-center">Early</th>
                                    <th colSpan="3" className="text-center">General</th>
                                    <th colSpan="3" className="text-center">Rejected</th>
                                    <th colSpan="3" className="text-center">Burnt</th>
                                    <th colSpan="2" className="text-center">Total</th>
                                </tr>
                                <tr>
                                    <th>Rate</th><th>Weight</th><th>Amount</th>
                                    <th>Rate</th><th>Weight</th><th>Amount</th>
                                    <th>Rate</th><th>Weight</th><th>Amount</th>
                                    <th>Rate</th><th>Weight</th><th>Amount</th>
                                    <th>Weight</th><th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="18" className="text-center py-8 text-slate-400">
                                        No data found. Please select filters and click Search.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Results Table - Society Wise */}
            <div className="report-card">
                <div className="report-card-header">
                    <h3 className="report-card-title">Society Wise Purchase Details</h3>
                </div>
                <div className="report-card-content">
                    <div className="report-table-container">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th rowSpan="2">SI</th>
                                    <th rowSpan="2">Society Code</th>
                                    <th rowSpan="2">Society Name</th>
                                    <th rowSpan="2">Gate/Centre</th>
                                    <th colSpan="2" className="text-center">Early</th>
                                    <th colSpan="2" className="text-center">General</th>
                                    <th colSpan="2" className="text-center">Rejected</th>
                                    <th colSpan="2" className="text-center">Burnt</th>
                                    <th colSpan="2" className="text-center">Total</th>
                                </tr>
                                <tr>
                                    <th>Weight</th><th>Amount</th>
                                    <th>Weight</th><th>Amount</th>
                                    <th>Weight</th><th>Amount</th>
                                    <th>Weight</th><th>Amount</th>
                                    <th>Weight</th><th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="14" className="text-center py-8 text-slate-400">
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

export default Report_CentreCode;
