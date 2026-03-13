import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const WhatsApp_UploadLabReport = () => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const extension = file.name.split('.').pop().toLowerCase();
      if (extension !== 'xls' && extension !== 'xlsx') {
        toast.error("Please upload a valid XLS/XLSX file.");
        e.target.value = null;
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleExport = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select an Excel file.");
      return;
    }
    setIsExporting(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Processing Excel file...',
        success: 'File uploaded successfully.',
        error: 'Upload failed.'
      }
    ).then(() => {
      setIsExporting(false);
    }).catch(() => {
      setIsExporting(false);
    });
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg")}>
                <div className={__cx("page-card-header", "text-center text-[15px]")}>
                    Sap Excel Upload
                </div>

                <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
                    {/* From Date + File input in a row */}
                    <div className={__cx("form-row", "gap-[30px] items-end mb-[20px]")}>
                        <div className={__cx("form-group", " min-w-[200px]")}>
                            <label>From Date</label>
                            <input
                type="text"
                className="form-control"
                placeholder="Ex. dd/mm/yyyy"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)} />
              
                        </div>

                        <div className={__cx("form-group", "")}>
                            <div className="flex items-center gap-[8px]">
                                <label
                  htmlFor="sap-file-input" className="border border-[#b5b5b5] rounded py-[6px] px-[12px] bg-white text-[#111] text-4 cursor-pointer m-[0px]">










                  
                                    Choose File
                                </label>
                                <span className="text-4 text-[#111]">
                                    {selectedFile ? selectedFile.name : 'No file chosen'}
                                </span>
                                <input
                  id="sap-file-input"
                  type="file"
                  onChange={handleFileChange}
                  accept=".xls,.xlsx" className="" />

                
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
                        <button className="btn btn-primary" onClick={handleExport} disabled={isExporting}>
                            {isExporting ? 'Exporting...' : 'Export'}
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate(-1)}>
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        </div>);

};

export default WhatsApp_UploadLabReport;