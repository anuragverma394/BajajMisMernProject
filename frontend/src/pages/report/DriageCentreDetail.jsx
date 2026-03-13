import React, { useState } from 'react';
import { FaFileExcel, FaSearch, FaArrowLeft, FaPrint, FaMapMarkerAlt } from 'react-icons/fa';
import '../../styles/Report.css';
import '../../styles/DriageCentreDetail.css';

const Report_DriageCentreDetail = () => {
    const [formData, setFormData] = useState({
        factory: '',
        centreCode: '',
        centreName: '',
        fromDate: '',
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

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="report-container animate-in fade-in duration-500">
            <div className="report-card">
                <div className="report-card-header">
                    <h2 className="report-card-title">
                        <FaMapMarkerAlt className="text-green-500" />
                        DRIAGE CENTRE DETAIL
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
                            <label htmlFor="centreCode">Centre Code</label>
                            <input
                                type="text"
                                id="centreCode"
                                name="centreCode"
                                className="report-form-control"
                                value={formData.centreCode}
                                onChange={handleChange}
                                placeholder="Centre Code"
                            />
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

                        <div className="md:col-span-4 flex gap-2">
                            <button type="submit" className="report-btn report-btn-success">
                                <FaSearch /> Search
                            </button>
                            <button type="button" className="report-btn report-btn-primary" onClick={handleExport} title="Export to Excel">
                                <FaFileExcel /> Excel
                            </button>
                            <button type="button" className="report-btn report-btn-secondary" onClick={handlePrint} title="Print">
                                <FaPrint /> Print
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Results Table */}
            <div className="report-card">
                <div className="report-card-header">
                    <h3 className="report-card-title">Driage Centre Detail List</h3>
                </div>
                <div className="report-card-content">
                    <div className="report-table-container">
                        <table className="report-table" id="driage-centre-detail-table">
                            <thead>
                                <tr>
                                    <th>Sr. No.</th>
                                    <th>Centre Code</th>
                                    <th>Centre Name</th>
                                    <th>From Date</th>
                                    <th>Till Date</th>
                                    <th>Opening Qty</th>
                                    <th>Purchase Qty</th>
                                    <th>Receipt Qty</th>
                                    <th>Closing Balance</th>
                                    <th>Total Receipt</th>
                                    <th>Driage Qty</th>
                                    <th>To Date Driage Qty</th>
                                    <th>%Tage</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="13" className="text-center py-8 text-slate-400">
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

export default Report_DriageCentreDetail;
