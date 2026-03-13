import React, { useState } from 'react';
import { FaFileExcel, FaSearch, FaArrowLeft, FaPrint, FaBullseye } from 'react-icons/fa';
import '../../styles/Report.css';
import '../../styles/Report.css';

const Report_TargetActualMISReport = () => {
    const [formData, setFormData] = useState({
        factory: '',
        date: ''
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
        <div className="report-container-premium animate-in p-4 bg-transparent min-h-screen">
            <header className="report-header-premium mb-6">
                <div className="flex items-center gap-4">
                    <div className="icon-box-premium">
                        <i className="fas fa-bullseye text-xl text-emerald-500"></i>
                    </div>
                    <div>
                        <h1 className="report-title-premium text-slate-800">Target VS Actual Report</h1>
                        <p className="report-subtitle-premium">Factory Crushing Performance & Achievement Analytics</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="btn-action-premium" onClick={handlePrint}>
                        <i className="fas fa-print"></i> Print
                    </button>
                    <button className="btn-action-premium" onClick={handleExport}>
                        <i className="fas fa-file-excel"></i> Export
                    </button>
                    <button className="btn-action-premium" onClick={() => window.history.back()}>
                        <i className="fas fa-times text-red-500"></i>
                    </button>
                </div>
            </header>

            <div className="filter-card-premium mb-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="filter-group">
                        <label className="filter-label">Manufacturing Unit</label>
                        <select
                            name="factory"
                            className="filter-input"
                            value={formData.factory}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Factory</option>
                            <option value="1">Unit 1</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Target Date</label>
                        <input
                            type="date"
                            name="date"
                            className="filter-input"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="md:col-span-1">
                        <button type="submit" className="btn-search-premium btn-success w-full">
                            <i className="fas fa-search mr-2"></i> Search
                        </button>
                    </div>
                </form>
            </div>

            {/* Results Table */}
            <div className="report-main-content">
                <div className="table-wrapper-premium">
                    <table className="table-premium" id="example">
                        <thead>
                            <tr>
                                <th className="w-16">Sr. No.</th>
                                <th>Factory Name</th>
                                <th className="text-right">Target Crushing</th>
                                <th className="text-right">Actual Crushing</th>
                                <th className="text-right">Diff</th>
                                <th className="text-center">% Achievement</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="6">
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                        <i className="fas fa-folder-open text-4xl mb-3 opacity-20"></i>
                                        <p>No data found. Please select filters and click Search.</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Report_TargetActualMISReport;
