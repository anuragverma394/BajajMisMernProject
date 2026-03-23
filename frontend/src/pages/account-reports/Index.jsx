import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Index.css';

const AccountReportsHome = () => {
    const reports = [
        { name: 'Cane Qty & Sugar Capacity', path: '/AccountReports/CaneQtyandSugarCapacity', icon: 'fa-cubes' },
        { name: 'Capacity Utilisation', path: '/AccountReports/Capasityutilisation', icon: 'fa-chart-pie' },
        { name: 'Capacity Utilisation (Period)', path: '/AccountReports/CapasityutilisationFromdate', icon: 'fa-chart-area' },
        { name: 'Sugar Report', path: '/AccountReports/SugarReport', icon: 'fa-file-invoice' },
        { name: 'Transfer and Received Unit', path: '/AccountReports/TransferandRecievedUnit', icon: 'fa-exchange-alt' },
        { name: 'Cogen Report', path: '/AccountReports/CogenReport', icon: 'fa-bolt' },
        { name: 'Distillery boiler report', path: '/AccountReports/DISTILLERYReport', icon: 'fa-fire' },
        { name: 'Centre/Variety Group Wise Cane Purchase', path: '/Report/CentreCode', icon: 'fa-leaf' },
        { name: 'Variety Wise Cane Purchase Amt', path: '/AccountReports/VarietyWiseCanePurchaseAmt', icon: 'fa-rupee-sign' },
        { name: 'Loan Summary Report', path: '/AccountReports/LoanSummaryReport', icon: 'fa-money-check-alt' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-8 animate-in fade-in duration-500">
            <div className="page-content">

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <i className="fas fa-folder-open text-blue-600"></i> Account Reports Dashboard
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Select an account report to view dynamic statements, tables, and financial data grids.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report, idx) => (
                        <Link
                            key={idx}
                            to={report.path}
                            className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 flex items-start gap-4"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex justify-center items-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-slate-700 transition-colors">
                                <i className={`fas ${report.icon} text-xl`}></i>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                                    {report.name}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                                    View Report <i className="fas fa-arrow-right text-xs"></i>
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AccountReportsHome;
