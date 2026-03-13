import React from 'react';
import '../../styles/Error.css';

const Shared_Error = () => {
    return (
        <div className="animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Error - Shared</h1>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-400 mt-6">
                <p>This page route represents the legacy Shared/Error.cshtml view.</p>
                <p>Migrate HTML and CSS classes from .NET here.</p>
            </div>
        </div>
    );
};

export default Shared_Error;
