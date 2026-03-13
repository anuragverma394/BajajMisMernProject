import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';

const Account_ChangePassword = () => {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Please enter all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            // Simulated API Call
            // const response = await api.post('/Account/ChangePassword', { currentPassword, newPassword });
            await new Promise(resolve => setTimeout(resolve, 800));
            toast.success('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error('Failed to change password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
            <Toaster position="top-right" />
            <div className="page-content">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-6 py-8">
                        <h2 className="text-3xl font-extrabold text-white text-center tracking-tight">
                            Password Change
                        </h2>
                        <p className="mt-2 text-teal-100 text-center text-sm">
                            Ensure your account is using a long, random password to stay secure.
                        </p>
                    </div>

                    <div className="px-6 py-8 sm:p-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i className="fas fa-lock text-slate-400"></i>
                                    </div>
                                    <input
                                        type="password"
                                        className="pl-10 block w-full rounded-xl border-slate-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500 focus:ring-opacity-50 py-3 bg-slate-50 transition-colors"
                                        placeholder="Enter Current Password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i className="fas fa-key text-slate-400"></i>
                                    </div>
                                    <input
                                        type="password"
                                        className="pl-10 block w-full rounded-xl border-slate-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500 focus:ring-opacity-50 py-3 bg-slate-50 transition-colors"
                                        placeholder="Enter New Password"
                                        maxLength="15"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i className="fas fa-check-circle text-slate-400"></i>
                                    </div>
                                    <input
                                        type="password"
                                        className="pl-10 block w-full rounded-xl border-slate-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500 focus:ring-opacity-50 py-3 bg-slate-50 transition-colors"
                                        placeholder="Confirm New Password"
                                        maxLength="15"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Updating...
                                        </div>
                                    ) : (
                                        "Change Password"
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="px-6 bg-white text-slate-600 font-bold py-3 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
                                >
                                    Exit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account_ChangePassword;
