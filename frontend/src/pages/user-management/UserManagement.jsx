import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/UserManagement_1.css';
import '../../styles/UserManagement_1.css';

const UserManagement_Home = () => {
    const navigate = useNavigate();

    const menuItems = [
        { name: 'Add User', path: '/UserManagement/AddUserViewRight', icon: 'fa-user-plus', desc: 'Create and manage system user accounts' },
        { name: 'Define Roles', path: '/UserManagement/AddRollView', icon: 'fa-user-tag', desc: 'Manage permissions via role-based access' },
        { name: 'Assign Rights', path: '/UserManagement/AddUserView', icon: 'fa-user-shield', desc: 'Assign specific roles and units to users' },
        { name: 'Lab Permissions', path: '/UserManagement/LabModulePermision', icon: 'fa-vials', desc: 'Manage lab-specific notification flags' },
        { name: 'Group Modes', path: '/UserManagement/AddModeGroupView', icon: 'fa-truck-moving', desc: 'Configure transportation mode groupings' },
    ];

    return (
        <div className="user-management-container animate-in fade-in duration-500">
            <div className="page-content">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Management Control Panel</h1>
                    <p className="text-slate-500 mt-2">Manage users, roles, permissions and module-specific access rights.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                            onClick={() => navigate(item.path)}
                        >
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <i className={`fas ${item.icon} text-xl`}></i>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{item.name}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                            <div className="mt-4 flex items-center text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                Launch Module <i className="fas fa-chevron-right ml-2 text-xs"></i>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-slate-100 rounded-xl border border-slate-200 text-center">
                    <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserManagement_Home;

