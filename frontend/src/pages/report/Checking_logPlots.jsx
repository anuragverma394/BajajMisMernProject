import React, { useState } from 'react';
import { FaFileExcel, FaSearch, FaArrowLeft, FaMapMarkedAlt } from 'react-icons/fa';
import '../../styles/Report.css';
import '../../styles/Checking_logPlots.css';

const Report_Checking_logPlots = () => {
    const [formData, setFormData] = useState({
        fCode: '',
        userCode: '',
        plotType: '',
        flag: '',
        toDate: ''
    });

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

    return (
        <div className="report-container animate-in fade-in duration-500">
            <div className="report-card">
                <div className="report-card-header">
                    <h2 className="report-card-title">
                        <FaSearch className="text-blue-500" />
                        Checking log Plots Report
                    </h2>
                    <button className="report-btn report-btn-secondary" onClick={() => window.history.back()}>
                        <FaArrowLeft /> Back
                    </button>
                </div>

                <div className="report-card-content">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="report-form-group">
                            <label htmlFor="fCode">Unit</label>
                            <select
                                id="fCode"
                                name="fCode"
                                className="report-form-control"
                                value={formData.fCode}
                                onChange={handleChange}
                            >
                                <option value="">Select Unit</option>
                                <option value="1234">Unit 1</option>
                            </select>
                        </div>

                        <div className="report-form-group">
                            <label htmlFor="userCode">User Code</label>
                            <input
                                type="text"
                                id="userCode"
                                name="userCode"
                                className="report-form-control"
                                value={formData.userCode}
                                onChange={handleChange}
                                placeholder="User Code"
                            />
                        </div>

                        <div className="report-form-group">
                            <label htmlFor="plotType">Plot Type</label>
                            <input
                                type="text"
                                id="plotType"
                                name="plotType"
                                className="report-form-control"
                                value={formData.plotType}
                                onChange={handleChange}
                                placeholder="Plot Type"
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
                            />
                        </div>

                        <div className="md:col-span-4 flex gap-4">
                            <button type="submit" className="report-btn report-btn-success">
                                <FaSearch /> Search
                            </button>
                            <button type="button" className="report-btn report-btn-primary" onClick={handleExport}>
                                <FaFileExcel /> Export To Excel
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Results Table */}
            <div className="report-card">
                <div className="report-card-content">
                    <div className="report-table-container">
                        <table className="report-table" id="example">
                            <thead>
                                <tr>
                                    <th>Sr No.</th>
                                    <th>Map</th>
                                    <th>User Code</th>
                                    <th>User Name</th>
                                    <th>Inspected Date & Time</th>
                                    <th>Inspect Location Distance (M)</th>
                                    <th>Plot Vill Code</th>
                                    <th>Plot Village Name</th>
                                    <th>Dim1</th>
                                    <th>Dim2</th>
                                    <th>Dim3</th>
                                    <th>Dim4</th>
                                    <th>Share Area</th>
                                    <th>Plot %</th>
                                    <th>Variety Surveyed</th>
                                    <th>Crop Cycle Surveyed</th>
                                    <th>Plot Exists</th>
                                    <th>Variety Inspected</th>
                                    <th>Crop Cycle Inspected</th>
                                    <th>Disease Inspected</th>
                                    <th>Remarks</th>
                                    <th>Vill Code</th>
                                    <th>Vill Name</th>
                                    <th>Grower Code</th>
                                    <th>Grower Name</th>
                                    <th>Grower Father Name</th>
                                    <th>Mobile No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="27" className="text-center py-8 text-slate-400">
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

export default Report_Checking_logPlots;
