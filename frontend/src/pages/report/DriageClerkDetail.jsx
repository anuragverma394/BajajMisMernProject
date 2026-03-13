import React, { useState } from 'react';
import { FaFileExcel, FaSearch, FaArrowLeft, FaPrint, FaUser } from 'react-icons/fa';
import '../../styles/Report.css';
import '../../styles/DriageClerkDetail.css';

const Report_DriageClerkDetail = () => {
    const [formData, setFormData] = useState({
        factory: '',
        clerkCode: '',
        clerkName: ''
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
                        <FaUser className="text-blue-500" />
                        DRIAGE CLERK DETAIL
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
                            >
                                <option value="">Select Factory</option>
                                <option value="1">Unit 1</option>
                            </select>
                        </div>

                        <div className="report-form-group">
                            <label htmlFor="clerkCode">Clerk Code</label>
                            <input
                                type="text"
                                id="clerkCode"
                                name="clerkCode"
                                className="report-form-control"
                                value={formData.clerkCode}
                                onChange={handleChange}
                                placeholder="Code"
                            />
                        </div>

                        <div className="report-form-group">
                            <label htmlFor="clerkName">Clerk Name</label>
                            <input
                                type="text"
                                id="clerkName"
                                name="clerkName"
                                className="report-form-control"
                                value={formData.clerkName}
                                onChange={handleChange}
                                placeholder="Name"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button type="submit" className="report-btn report-btn-success">
                                <FaSearch /> Search
                            </button>
                            <button type="button" className="report-btn report-btn-primary" onClick={handleExport} title="Export to Excel">
                                <FaFileExcel />
                            </button>
                            <button type="button" className="report-btn report-btn-secondary" onClick={handlePrint} title="Print">
                                <FaPrint />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Results Table */}
            <div className="report-card">
                <div className="report-card-header">
                    <h3 className="report-card-title">Driage Clerk Detail List</h3>
                </div>
                <div className="report-card-content">
                    <div className="report-table-container">
                        <table className="report-table" id="example">
                            <thead>
                                <tr>
                                    <th>SLNO</th>
                                    <th>Code</th>
                                    <th>Centre</th>
                                    <th>From</th>
                                    <th>Till</th>
                                    <th>Opening Qty</th>
                                    <th>Purchase Qty</th>
                                    <th>Receipt Qty</th>
                                    <th>Closing Balance</th>
                                    <th>Total Receipt</th>
                                    <th>Dries Qty</th>
                                    <th>ToDate Dries Qty</th>
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

export default Report_DriageClerkDetail;
