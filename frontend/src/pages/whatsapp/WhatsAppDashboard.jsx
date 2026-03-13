import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const modules = [
{
  title: 'SAP Data Upload',
  desc: 'Upload and process laboratory analytics from SAP Excel exports.',
  icon: 'fa-file-excel',
  path: '/WhatsApp/UploadLabReport',
  tag: 'Integration'
},
{
  title: 'Distillery Report',
  desc: 'Daily distillery metrics, yield data, and stoppage logs.',
  icon: 'fa-industry',
  path: '/WhatsApp/DistilleryWhatsAppReport',
  tag: 'Production'
},
{
  title: 'Variety Wise Area',
  desc: 'Multi-factory analysis of cane variety area and supply.',
  icon: 'fa-seedling',
  path: '/WhatsApp/ActualVarietyWiseArea',
  tag: 'Analytics'
},
{
  title: 'Sugar WhatsApp Report',
  desc: 'Daily cane crushing and sugar extraction data entry.',
  icon: 'fa-leaf',
  path: '/WhatsApp/SugarWhatsAppReportView',
  tag: 'Data Entry'
},
{
  title: 'Executive Report',
  desc: 'Cross-factory consolidated performance summary.',
  icon: 'fa-paper-plane',
  path: '/WhatsApp/SugarWhatsAppReportNew',
  tag: 'Reporting'
}];


const WhatsAppDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
      <div className={__cx("page-card", "rounded-lg border-0 shadow-[0 4px 12px rgba(0,0,0,0.1)]")}>
        <div className={__cx("page-card-header", "text-left text-[15px] py-[12px] px-[20px]")}>
          WhatsApp Communications Dashboard
        </div>

        <div className={__cx("page-card-body", "p-[30px] bg-[#f5f5e8]")}>
          <div className="grid gap-[20px]">
            {modules.map((mod, idx) =>
            <div
              key={idx}
              className={__cx("section-panel", "p-[20px] cursor-pointer  flex  gap-[10px]")}








              onClick={() => navigate(mod.path)}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              
                <div className="flex justify-between items-center">
                  <div className="w-[40px] h-[40px] bg-[#008080] rounded-lg flex items-center justify-center text-white">
                    <i className={`fas ${mod.icon}`}></i>
                  </div>
                  <span className="text-2.5 bg-[#e2efda] text-[#333] py-[2px] px-[8px] rounded-[10px] font-bold">{mod.tag}</span>
                </div>
                <h3 className="text-4 font-bold m-[10px 0 5px 0] text-[#008080]">{mod.title}</h3>
                <p className="text-[12px] text-[#666] leading-[1.4]">{mod.desc}</p>
                <div className="mt-[auto] text-right text-[12px] text-[#008080] font-bold">
                  Explore →
                </div>
              </div>
            )}
          </div>

          <div className={__cx("form-actions", "border-t-0 mt-[30px] pt-[0] justify-start")}>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Home</button>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>Exit</button>
          </div>
        </div>
      </div>
    </div>);

};

export default WhatsAppDashboard;