import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import '../../styles/Layout.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const logo = "/assets/images/Bajaj_Logo.png";

export default function Layout() {
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [userName, setUserName] = useState("Admin");
  const [season, setSeason] = useState("2526");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [printTitle, setPrintTitle] = useState("Bajaj Sugar");
  const navigate = useNavigate();
  const location = useLocation();

  // Get current date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const ampm = now.getHours() >= 12 ? "PM" : "AM";
      setCurrentDate(`${day}/${month}/${year}`);
      setCurrentTime(`${hours}:${minutes}:${seconds} ${ampm}`);
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle click outside the user menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      const userMenu = document.querySelector(".dn-user-menu-wrapper");
      if (userMenu && !userMenu.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const pickTitle = () => {
      const heading = document.querySelector("h1, h2, .page-title, .report-title");
      const text = heading?.textContent?.trim();
      if (text) return text;
      const docTitle = document.title?.trim();
      if (docTitle) return docTitle;
      return "Bajaj Sugar";
    };
    const timer = setTimeout(() => setPrintTitle(pickTitle()), 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    navigate("/login");
  };

  const handleChangePassword = () => {
    navigate("/Account/ChangePassword");
  };

  const handleLockScreen = () => {
    console.log("Lock Screen clicked");
  };

  return (
    <div className="dn-container">
            <div className="print-header print-only">
                <img src={logo} alt="Bajaj Sugar" className="print-logo" />
                <div className="print-header-text">
                    <div className="print-brand">Bajaj Sugar</div>
                    <div className="print-title">{printTitle}</div>
                </div>
            </div>
            {/* HEADER */}
            <header className={__cx("dn-header", "py-[5px] px-[20px] bg-white border-b border-b-[#e0e0e0]")}>
                <div className={__cx("dn-logo-wrapper", "")} onClick={() => navigate("/dashboard")}>
                    <img src={logo} alt="Bajaj Sugar" className={__cx("dn-logo-img", "h-[60px]")} />
                </div>

                <div className="text-center text-[18px] text-white">
                    Crushing Season: 2526
                </div>

                <div className={__cx("dn-user-section", "")}>
                    <div className="dn-user-menu-wrapper">
                        <button className={__cx("dn-user-btn", "flex items-center gap-[8px]")} onClick={() => setShowUserMenu(!showUserMenu)}>
                            <div className={__cx("dn-user-avatar", "w-[30px] h-[30px] bg-[#a0a0b0] rounded-[50%] text-white text-[7px] flex justify-center items-center")}>160 x 160</div>
                            <div className={__cx("dn-user-details", "text-left")}>
                                <span className={__cx("dn-welcome", "text-[12px] font-semibold text-[#333] block")}>Welcome Admin</span>
                                <span className={__cx("dn-time", "text-[12px] font-bold text-[#d32f2f]")}>{currentDate} - {currentTime}</span>
                            </div>
                            <span className={__cx("dn-arrow", "text-[12px] text-[#666] ml-[5px]")}>▼</span>
                        </button>

                        {showUserMenu &&
            <div className="dn-dropdown-content dn-user-dropdown-content">
                                <button className="user-menu-item" onClick={handleLockScreen}>
                                    🔒 Lock Screen
                                </button>
                                <button className="user-menu-item" onClick={handleChangePassword}>
                                    🔑 Change Password
                                </button>
                                <button className="user-menu-item logout" onClick={handleLogout}>
                                    🚪 Logout
                                </button>
                            </div>
            }
                    </div>
                </div>
            </header>

            {/* NAVIGATION MENU */}
            <nav className={__cx("dn-nav-bar", "bg-[#1F9E8A] min-h-[40px]")}>
                <div className="dn-nav-item">
                    <button className="dn-nav-link">
                        User Management <span className="caret-icon">▼</span>
                    </button>
                    <div className="dn-dropdown-content">
                        <Link to="/UserManagement/AddUserViewRight">Add/View User</Link>
                        <Link to="/UserManagement/AddRollView">Add/View Role</Link>
                        <Link to="/UserManagement/AddUserView">Add/View User Role Assign</Link>
                        <Link to="/Account/ManageTblControl">Manage Table Controls</Link>
                    </div>
                </div>

                <div className="dn-nav-item">
                    <button className="dn-nav-link">
                        Master <span className="caret-icon">▼</span>
                    </button>
                    <div className="dn-dropdown-content">
                        <Link to="/Main/AddSeasonView">Add/View Season</Link>
                        <Link to="/Main/AddModeGroupView">Group Mode Update</Link>
                        <Link to="/Main/AddStopageView">Add/View Stopage</Link>
                        <Link to="/AccountReports/TransferandRecievedUnit">Transfer & Received Unit</Link>
                    </div>
                </div>

                <div className="dn-nav-item">
                    <button className="dn-nav-link">
                        WhatsApp <span className="caret-icon">▼</span>
                    </button>
                    <div className="dn-dropdown-content">
                        <Link to="/WhatsApp/UploadLabReport">Import Excel Data</Link>
                        <Link to="/Main/SugarWhatsAppReportView">Daily Lab Data Entry</Link>
                        <Link to="/WhatsApp/DistilleryEntryView">Daily Distillery Data Entry</Link>
                        <Link to="/Main/SugarWhatsAppReportsData">Sugar WhatsApp Report</Link>
                        <Link to="/WhatsApp/SugarWhatsAppReportNew">Sugar WhatsApp New Report</Link>
                        <Link to="/WhatsApp/DistilleryReportEntryView">Distillery WhatsApp Report</Link>
                        <Link to="/WhatsApp/DistilleryWhatsAppReport">Distillery WhatsApp New Report</Link>
                    </div>
                </div>

                <div className="dn-nav-item">
                    <button className="dn-nav-link">
                        Lab <span className="caret-icon">▼</span>
                    </button>
                    <div className="dn-dropdown-content">
                        <Link to="/Lab/SugarBagProducedView">Add/View Lab Hour Data Entry</Link>
                        <Link to="/Lab/DailyLabAnalysisEntry">Daily Analysis Entry</Link>
                        <Link to="/Lab/DailyLabAnalysisView">Daily Lab Data Entry</Link>
                        <Link to="/Lab/AddCanePlanView">Add/View Target Cane Plan</Link>
                        <Link to="/Lab/TaregetvsActualMIS">Add/View Daily Target VS Actual</Link>
                        <Link to="/Lab/AddBudgetview">Add/View Distillery Budget</Link>
                        <Link to="/Main/DailyRainfallview">Add/View Daily Rainfall</Link>
                        <Link to="/Main/MonthlyEntryReportView">Add/View Monthly Entry</Link>
                        <Link to="/UserManagement/LabModulePermision">Employee Notification</Link>
                    </div>
                </div>

                <div className="dn-nav-item">
                    <button className="dn-nav-link">
                        Tracking <span className="caret-icon">▼</span>
                    </button>
                    <div className="dn-dropdown-content">
                        <Link to="/Tracking/TargetEntry">Target Entry</Link>
                        <Link to="/Tracking/LiveLocationRpt">Live Location</Link>
                        <Link to="/Report/SummaryReportUnitWise">Tracking Executive Report</Link>
                        <Link to="/Tracking/TargetRpt">Target Report</Link>
                        <Link to="/Tracking/TrackingReport">Target Tracking Report</Link>
                        <Link to="/Tracking/GrowerMeetingReport">Grower Meeting Report</Link>
                    </div>
                </div>

                <div className="dn-nav-item">
                    <button className="dn-nav-link">
                        Report <span className="caret-icon">▼</span>
                    </button>
                    <div className="dn-dropdown-content">
                        <Link to="/Report/CrushingReport">Hourly Crushing Report</Link>
                        <Link to="/Report/Analysisdata">Analysis Data As On Report</Link>
                        <Link to="/Report/CentrePurchase">Centre Purchase Report</Link>
                        <Link to="/Report/TruckDispatchWeighed">Truck Dispatch Weighed Report</Link>
                        <Link to="/Report/IndentFailSummary">Indent Fail Summary Report</Link>
                        <Link to="/Report/TargetActualMISReport">Target VS Actual Report</Link>
                        <Link to="/Report/TargetActualMISPeriodReport">Target VS Actual Report (Periodical)</Link>
                        <Link to="/Report/DriageSummary">Driage Center Summary Report</Link>
                        <Link to="/Report/DriageClerkSummary">Driage Clerk Summary Report</Link>
                        <Link to="/Report/DriageCentreClerkDetail">Driage Centre And Clerk Summary Report</Link>
                        <Link to="/Report/DriageClerkCentreDetail">Driage Clerk And Centre Summary Report</Link>
                        <Link to="/Report/BudgetVSActual">Distillery Budget Vs Actual Report</Link>
                    </div>
                </div>

                <div className="dn-nav-item">
                    <button className="dn-nav-link">
                        New Report <span className="caret-icon">▼</span>
                    </button>
                    <div className="dn-dropdown-content">
                        <Link to="/Report/HourlyCaneArrival">Hourly Cane Arrival</Link>
                        <Link to="/ReportNew/HourlyCaneArrivalWieght">Hourly CaneArrival Weight</Link>
                        <Link to="/ReportNew/IndentPurchaseReportNew">Indent Purchase Report New</Link>
                        <Link to="/ReportNew/CenterBlanceReport">Center Blance Report</Link>
                        <Link to="/ReportNew/CentrePurchaseTruckReportNew">Centre Purchase Truck Report New</Link>
                        <Link to="/Report/IndentFaillDetails">Indent Fail Availability Summary Report</Link>
                        <Link to="/ReportNew/CanePurchaseReport">Centre Wise Cane Purchase Report</Link>
                        <Link to="/NewReport/ExceptionReportMaster">Weightment Exceptional Report</Link>
                    </div>
                </div>

                <div className="dn-nav-item">
                    <button className="dn-nav-link">
                        Survey Report <span className="caret-icon">▼</span>
                    </button>
                    <div className="dn-dropdown-content">
                        <NavLink to="/SurveyReport/DailyTeamWiseSurveyProgressReport" className={({ isActive }) => isActive ? "active-menu" : ""}>Daily Survey Progress Report</NavLink>
                        <NavLink to="/SurveyReport/DailyTeamWiseHourlySurveyProgressReport" className={({ isActive }) => isActive ? "active-menu" : ""}>Daily Hourly Survey Progress Report</NavLink>
                        <NavLink to="/SurveyReport/FinalVillageFirstSurveyReport" className={({ isActive }) => isActive ? "active-menu" : ""}>Final Village First Survey Report</NavLink>
                        <NavLink to="/SurveyReport/FinalVillageFirstSurveySummeryReport" className={({ isActive }) => isActive ? "active-menu" : ""}>Final Village First Survey Summery Report</NavLink>
                        <NavLink to="/SurveyReport/SurveyUnitWiseSurveyStatus" className={({ isActive }) => isActive ? "active-menu" : ""}>Unit Wise Survey Status Report</NavLink>
                        <NavLink to="/SurveyReport/SurveyUnitWiseSurveyAreaSummary" className={({ isActive }) => isActive ? "active-menu" : ""}>Unit Wise Survey Area Summary Report</NavLink>
                        <NavLink to="/SurveyReport/SurveyActualVarietywise" className={({ isActive }) => isActive ? "active-menu" : ""}>Survey Actual Variety Wise Report</NavLink>
                        <NavLink to="/WhatsApp/ActualVarietyWiseArea" className={({ isActive }) => isActive ? "active-menu" : ""}>Actual Variety Wise Area And Supply</NavLink>
                        <NavLink to="/Report/EffectedCaneAreaReport" className={({ isActive }) => isActive ? "active-menu" : ""}>Effected Cane Area Report</NavLink>
                        <NavLink to="/SurveyReport/PlotWiseDetails" className={({ isActive }) => isActive ? "active-menu" : ""}>Plot Wise Details</NavLink>
                        <NavLink to="/SurveyReport/categoryWiseSummary" className={({ isActive }) => isActive ? "active-menu" : ""}>Category Wise Summary</NavLink>
                        <NavLink to="/SurveyReport/CaneVierityVillageGrower" className={({ isActive }) => isActive ? "active-menu" : ""}>Cane Variety Village Grower Report</NavLink>
                        <NavLink to="/SurveyReport/WeeklySubmissionofAutumnPlantingIndent" className={({ isActive }) => isActive ? "active-menu" : ""}>Weekly Submission of Planting</NavLink>
                        <NavLink to="/SurveyReport/WeeklySubmissionofIndents" className={({ isActive }) => isActive ? "active-menu" : ""}>Weekly Submission of Indents</NavLink>
                        <NavLink to="/Report/SurveyPLot" className={({ isActive }) => isActive ? "active-menu" : ""}>Survey Checking Report</NavLink>
                    </div>
                </div>

                <div className="dn-nav-item">
                    <button className="dn-nav-link">
                        Accounts Report <span className="caret-icon">▼</span>
                    </button>
                    <div className="dn-dropdown-content">
                        <Link to="/AccountReports/VarietyWiseCanePurchase">Variety Wise Cane Purchase</Link>
                        <Link to="/AccountReports/VarietyWiseCanePurchaseAmt">Variety Wise Cane Purchase Amount</Link>
                        <Link to="/AccountReports/Capasityutilisation">Capasity Utilisation</Link>
                        <Link to="/AccountReports/CaneQtyandSugarCapacity">Cane Purchase Movement</Link>
                        <Link to="/AccountReports/CapasityutilisationFromdate">Capacity Utilisation Periodical</Link>
                        <Link to="/AccountReports/DISTILLERYReport">Distillery Report</Link>
                        <Link to="/ReportNew/SampleOfTransporter">Transporter / Loader Bill</Link>
                        <Link to="/ReportNew/ApiStatusReport">Api Status Report</Link>
                        <Link to="/AccountReports/VarietyWiseCanePurchase">Centre/VarGroup Wise Cane Purchase</Link>
                        <Link to="/AccountReports/LoanSummaryReport">Loan Summary Report</Link>
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <main className="dn-main">
                <Outlet />
            </main>
        </div>);

}
