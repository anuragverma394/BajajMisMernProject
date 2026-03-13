import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Beaker, FileText, Target, BarChart, Database, Droplets, Zap, Wind, Waves } from 'lucide-react';

const sections = [
{
  title: 'Daily Lab Analysis',
  icon: <Beaker size={20} />,
  items: [
  { name: 'Entry Control', icon: <Database size={18} />, path: '/Lab/DailyLabAnalysisEntry', desc: 'Process and manage daily laboratory entries' },
  { name: 'View Reports', icon: <FileText size={18} />, path: '/Lab/DailyLabAnalysisView', desc: 'Search and analyze historical lab performance' }]

},
{
  title: 'Production & Process Monitoring',
  icon: <Zap size={20} />,
  items: [
  { name: 'Sugar Bag Produced', icon: <FileText size={18} />, path: '/Lab/SugarBagProducedView', desc: 'Track hourly sugar bag production metrics' },
  { name: 'Molasses Analysis', icon: <Droplets size={18} />, path: '/Lab/MolassesAnalysisView', desc: 'Monitor molasses quality and analytical data' },
  { name: 'B/C Magma', icon: <Waves size={18} />, path: '/Lab/BcMagmaView', desc: 'Magma purity and brix monitoring' }]

},
{
  title: 'Massecuite Tracking',
  icon: <Waves size={20} />,
  items: [
  { name: 'A-Massecuite', icon: <Droplets size={18} />, path: '/Lab/AMassecuiteView', desc: 'A-grade massecuite tracking' },
  { name: 'A1-Massecuite', icon: <Database size={18} />, path: '/Lab/A1MassecuiteView', desc: 'A1-grade massecuite monitoring' },
  { name: 'B-Massecuite', icon: <Droplets size={18} />, path: '/Lab/BMassecuiteView', desc: 'B-grade massecuite tracking' },
  { name: 'C-Massecuite', icon: <Droplets size={18} />, path: '/Lab/CMassecuiteView', desc: 'C-grade massecuite tracking' },
  { name: 'C1-Massecuite', icon: <Database size={18} />, path: '/Lab/C1MassecuiteView', desc: 'C1-grade massecuite tracking' }]

},
{
  title: 'Planning & Targets',
  icon: <Target size={20} />,
  items: [
  { name: 'Add Cane Plan', icon: <Target size={18} />, path: '/Lab/AddCanePlan', desc: 'Season-wise cane planning and targets' },
  { name: 'View Cane Plan', icon: <FileText size={18} />, path: '/Lab/AddCanePlanView', desc: 'View submitted cane plan entries' },
  { name: 'Target vs MIS', icon: <BarChart size={18} />, path: '/Lab/TargetActualMISView', desc: 'Target vs Actual performance MIS' }]

},
{
  title: 'Budget & Financials',
  icon: <BarChart size={20} />,
  items: [
  { name: 'Add Budget', icon: <Database size={18} />, path: '/Lab/AddBudget', desc: 'Manage weekly budget allocations' },
  { name: 'Budget Analysis', icon: <BarChart size={18} />, path: '/Lab/AddBudgetview', desc: 'Analyze budget vs expenditure' }]

},
{
  title: 'Report Management',
  icon: <FileText size={20} />,
  items: [
  { name: 'Monthly Entry', icon: <Wind size={18} />, path: '/Main/MonthlyEntryReport', desc: 'Create monthly production reports' },
  { name: 'View Monthly', icon: <FileText size={18} />, path: '/Main/MonthlyEntryReportView', desc: 'Manage historical monthly reports' }]

}];


const LabDashboard = () => {
  const navigate = useNavigate();

  const headerStyle = "bg-[#008080] text-white py-[30px] px-[40px] rounded-xl mb-[40px] flex justify-between items-center shadow-[0 4px 20px rgba(0, 128, 128, 0.2)]";











  const sectionHeaderStyle = "flex items-center gap-[10px] text-[18px] font-semibold text-[#008080] mb-[20px] mt-[20px] pb-[8px] border-b border-b-[#e0f2f2]";












  const cardStyle = "bg-white border border-[#e0e0e0] rounded-[10px] p-[20px] cursor-pointer  flex  gap-[12px] relative overflow-hidden";













  const iconBoxStyle = "w-[40px] h-[40px] rounded-lg bg-[#e0f2f1] text-[#008080] flex items-center justify-center";










  return (
    <div className="p-[30px] bg-[#fcfcfc] min-h-[100vh] font-['Inter', sans-serif]">

      <div className={headerStyle}>
        <div>
          <h1 className="m-[0px] text-7 font-bold">Lab Information System</h1>
          <p className="m-[8px 0 0] text-[15px] text-[#e0f2f2]">Performance Analysis, Planning & Quality Control Dashboard</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')} className="py-[12px] px-[24px] bg-white text-[#008080] border-0 rounded-md font-semibold flex items-center gap-[8px] cursor-pointer shadow-[0 2px 10px rgba(0,0,0,0.1)]">













          
          <Home size={18} /> Main Dashboard
        </button>
      </div>

      {sections.map((section, idx) =>
      <div key={idx} className="mb-[50px]">
          <div className={sectionHeaderStyle}>
            {section.icon}
            {section.title}
          </div>

          <div className="grid gap-[25px]">
            {section.items.map((item, iIdx) =>
          <div
            key={iIdx}

            onClick={() => navigate(item.path)}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#008080';
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,128,128,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e0e0e0';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }} className={cardStyle}>
            
                <div className="flex items-center gap-[15px]">
                  <div className={iconBoxStyle}>
                    {item.icon}
                  </div>
                  <h3 className="m-[0px] text-4 font-semibold text-[#333]">{item.name}</h3>
                </div>
                <p className="m-[0px] text-[13px] text-[#666] leading-[1.5]">{item.desc}</p>
                <div className="mt-[5px] text-[12px] font-bold text-[#16a085] flex items-center gap-[5px]">
                  OPEN MODULE →
                </div>
              </div>
          )}
          </div>
        </div>
      )}
    </div>);

};

export default LabDashboard;