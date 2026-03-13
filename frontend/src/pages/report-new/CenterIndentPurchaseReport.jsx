import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { reportNewService } from '../../microservices/api.service';
import '../../styles/Dashboard_1.css';
import '../../styles/Report.css';

const CenterIndentPurchaseReport = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [totals, setTotals] = useState(null);
    const [reportDate, setReportDate] = useState('');

    const id = searchParams.get('id');
    const DATE = searchParams.get('DATE');

    useEffect(() => {
        if (id && DATE) {
            fetchData();
        }
    }, [id, DATE]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await reportNewService.getCenterIndentPurchaseReport({ id, DATE });
            if (response.status === 'success') {
                setReportData(response.data);
                setTotals(response.totals);
                setReportDate(response.date);
            } else {
                toast.error(response.message || "Failed to fetch data");
            }
        } catch (error) {
            console.error("Error fetching report data:", error);
            toast.error("Error fetching report data");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExit = () => {
        window.history.back();
    };

    return (
        <div className="report-container p-4">
            <div className="report-header bg-white p-4 rounded-lg shadow-sm mb-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 uppercase">Center Indent Purchase Report</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-slate-700 rounded-md font-medium text-sm">Print</button>
                        <button onClick={handleExit} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-700 rounded-md font-medium text-sm">Back</button>
                    </div>
                </div>
                <div className="mt-2 text-sm font-medium text-gray-600">
                    Zone ID: {id} | Date: {DATE}
                </div>
            </div>

            <div className="report-content bg-white p-4 rounded-lg shadow-sm overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 text-xs">
                    <thead>
                        <tr className="bg-emerald-600 text-black">
                            <th colSpan="2" className="border border-black p-2 bg-emerald-500 text-left">Date : {reportDate}</th>
                            <th colSpan="6" className="border border-black p-2 bg-emerald-500">TODAY</th>
                            <th colSpan="5" className="border border-black p-2 bg-emerald-500">TOMORROW</th>
                        </tr>
                        <tr className="bg-emerald-600 text-black font-bold text-center">
                            <th className="border border-black p-2">Srno</th>
                            <th className="border border-black p-2">{id === '1' ? 'ZONE' : 'SOCIETY'}</th>
                            <th className="border border-black p-2">2</th>
                            <th className="border border-black p-2">1</th>
                            <th className="border border-black p-2">0</th>
                            <th className="border border-black p-2">Total</th>
                            <th className="border border-black p-2">PUR.</th>
                            <th className="border border-black p-2">Mat %</th>
                            <th className="border border-black p-2">2</th>
                            <th className="border border-black p-2">1</th>
                            <th className="border border-black p-2">0</th>
                            <th className="border border-black p-2">Total</th>
                            <th className="border border-black p-2">EXP PUR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.length > 0 ? (
                            reportData.map((row, index) => (
                                <tr key={index} className="hover:bg-blue-50 bg-blue-100 odd:bg-blue-50">
                                    <td className="border border-gray-400 p-1 text-right">{index + 1}</td>
                                    <td className="border border-gray-400 p-1 font-bold">{row.c_name}</td>
                                    <td className="border border-gray-400 p-1 text-right">{row.onedaysbalnace}</td>
                                    <td className="border border-gray-400 p-1 text-right">{row.twodaysdaysbalnace}</td>
                                    <td className="border border-gray-400 p-1 text-right">{row.TodayIndent}</td>
                                    <td className="border border-gray-400 p-1 text-right">{row.totalindenttoday}</td>
                                    <td className="border border-gray-400 p-1 text-right">{row.purchase}</td>
                                    <td className="border border-gray-400 p-1 text-right">{row.Mature || row.mature}</td>
                                    <td className="border border-gray-400 p-1 text-right">{row.backonedaysbalnace}</td>
                                    <td className="border border-gray-400 p-1 text-right">{row.backtwodaysdaysbalnace}</td>
                                    <td className="border border-gray-400 p-1 text-right">{row.backTodayIndent}</td>
                                    <td className="border border-gray-400 p-1 text-right">{row.backbalanceindent}</td>
                                    <td className="border border-gray-400 p-1 text-right">{row.expur}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="13" className="border border-gray-400 p-4 text-center text-gray-500">
                                    {loading ? 'Fetching data...' : 'No records found'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {totals && (
                        <tfoot>
                            <tr className="bg-pink-100 font-bold">
                                <td colSpan="2" className="border border-gray-400 p-1 text-center">TOTAL</td>
                                <td className="border border-gray-400 p-1 text-right">{totals.onedaysbalnace}</td>
                                <td className="border border-gray-400 p-1 text-right">{totals.twodaysdaysbalnace}</td>
                                <td className="border border-gray-400 p-1 text-right">{totals.TodayIndent}</td>
                                <td className="border border-gray-400 p-1 text-right">{totals.totalindenttoday}</td>
                                <td className="border border-gray-400 p-1 text-right">{totals.purchase}</td>
                                <td className="border border-gray-400 p-1 text-right">{totals.Mature}</td>
                                <td className="border border-gray-400 p-1 text-right">{totals.backonedaysbalnace}</td>
                                <td className="border border-gray-400 p-1 text-right">{totals.backtwodaysdaysbalnace}</td>
                                <td className="border border-gray-400 p-1 text-right">{totals.backTodayIndent}</td>
                                <td className="border border-gray-400 p-1 text-right">{totals.backbalanceindent}</td>
                                <td className="border border-gray-400 p-1 text-right">{totals.expur}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
};

export default CenterIndentPurchaseReport;



