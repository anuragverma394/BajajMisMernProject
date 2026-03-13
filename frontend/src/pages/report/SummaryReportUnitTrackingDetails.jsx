import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaMapMarkerAlt, FaUserClock } from 'react-icons/fa';
import '../../styles/Report.css';
import '../../styles/SummaryReportUnitTrackingDetails.css';

const Report_SummaryReportUnitTrackingDetails = () => {
    const [trackingData, setTrackingData] = useState([]);

    useEffect(() => {
        // Mock data or fetch from API
        const mockData = [
            {
                srno: 1,
                Name: 'John Doe',
                Mobile: '9876543210',
                MinTime: '09:00 AM',
                MaxTime: '06:00 PM',
                ActiveHours: '9.0',
                Distance: '25 km',
                LastReceivedLocation: 'Location A'
            }
        ];
        setTrackingData(mockData);
    }, []);

    return (
        <div className="report-container animate-in fade-in duration-500">
            <div className="report-card">
                <div className="report-card-header">
                    <h2 className="report-card-title">
                        <FaUserClock className="text-blue-500" />
                        Summary Report Tracking Details
                    </h2>
                    <button className="report-btn report-btn-secondary" onClick={() => window.history.back()}>
                        <FaArrowLeft /> Back
                    </button>
                </div>

                <div className="report-card-content">
                    <div className="report-table-container">
                        <table className="report-table sticky-header">
                            <thead>
                                <tr>
                                    <th>Sr No</th>
                                    <th>Employee Name</th>
                                    <th>Mobile No</th>
                                    <th>Start Time</th>
                                    <th>End Time</th>
                                    <th>Active Hours</th>
                                    <th>Distance Covered</th>
                                    <th>Last Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trackingData.length > 0 ? (
                                    trackingData.map((item, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{item.Name}</td>
                                            <td>{item.Mobile}</td>
                                            <td>{item.MinTime}</td>
                                            <td>{item.MaxTime}</td>
                                            <td>{item.ActiveHours}</td>
                                            <td>{item.Distance}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <FaMapMarkerAlt className="text-red-500" />
                                                    {item.LastReceivedLocation}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-8 text-slate-400">
                                            No tracking data available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Report_SummaryReportUnitTrackingDetails;
