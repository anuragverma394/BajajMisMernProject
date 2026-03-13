import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './components/ProtectedRoute';


// Lab Pages

// Report Pages

// ReportNew Pages

// Tracking Pages

// Distillery Pages

// NewReport Pages

// WhatsApp Pages

// SurveyReport Pages

// Other Pages
import './styles/App.css';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ChangePassword = lazy(() => import('./pages/account/ChangePassword'));
const ManageTblControl = lazy(() => import('./pages/account/ManageTblControl'));
const CogenReport = lazy(() => import('./pages/account-reports/CogenReport'));
const DISTILLERYReport = lazy(() => import('./pages/account-reports/DISTILLERYReport'));
const DistilleryReportA = lazy(() => import('./pages/account-reports/DistilleryReportA'));
const CaneQtyandSugarCapacity = lazy(() => import('./pages/account-reports/CaneQtyandSugarCapacity'));
const Capasityutilisation = lazy(() => import('./pages/account-reports/Capasityutilisation'));
const CapasityutilisationFromdate = lazy(() => import('./pages/account-reports/CapasityutilisationFromdate'));
const SugarReport = lazy(() => import('./pages/account-reports/SugarReport'));
const TransferandRecievedUnit = lazy(() => import('./pages/account-reports/TransferandRecievedUnit'));
const VarietyWiseCanePurchase = lazy(() => import('./pages/account-reports/VarietyWiseCanePurchase'));
const VarietyWiseCanePurchaseAmt = lazy(() => import('./pages/account-reports/VarietyWiseCanePurchaseAmt'));
const LoanSummaryReport = lazy(() => import('./pages/account-reports/LoanSummaryReport'));
const AccountReportsHome = lazy(() => import('./pages/account-reports/Index'));
const Master_AddModeGroup = lazy(() => import('./pages/main/AddModeGroup'));
const Master_AddModeGroupView = lazy(() => import('./pages/main/AddModeGroupView'));
const Master_AddSeason = lazy(() => import('./pages/main/AddSeason'));
const Master_AddSeasonView = lazy(() => import('./pages/main/AddSeasonView'));
const Master_AddStopage = lazy(() => import('./pages/main/AddStopage'));
const Master_AddStopageView = lazy(() => import('./pages/main/AddStopageView'));
const Master_DailyRainfall = lazy(() => import('./pages/main/DailyRainfall'));
const Master_DailyRainfallView = lazy(() => import('./pages/main/DailyRainfallview'));
const Master_MonthlyEntryReport = lazy(() => import('./pages/main/MonthlyEntryReport'));
const Master_MonthlyEntryReportView = lazy(() => import('./pages/main/MonthlyEntryReportView'));
const Master_TargetEntry = lazy(() => import('./pages/main/TargetEntry'));
const Master_distilleryReportEntry = lazy(() => import('./pages/main/distilleryReportEntry'));
const Master_distilleryReportEntryView = lazy(() => import('./pages/main/distilleryReportEntryView'));
const WhatsApp_SugarWhatsAppReport = lazy(() => import('./pages/whatsapp/SugarWhatsAppReport'));
const WhatsApp_DailyCaneEntry = lazy(() => import('./pages/whatsapp/DailyCaneEntry'));
const WhatsApp_SugarWhatsAppReportNew = lazy(() => import('./pages/whatsapp/SugarWhatsAppReportNew'));
const WhatsApp_SugarWhatsAppReportView = lazy(() => import('./pages/whatsapp/SugarWhatsAppReportView'));
const MasterHome = lazy(() => import('./pages/main/Index'));
const UserManagement_AddModeGroupView = lazy(() => import('./pages/user-management/AddModeGroupView'));
const UserManagement_AddModeGroup = lazy(() => import('./pages/user-management/AddModeGroup'));
const UserManagement_AddRoll = lazy(() => import('./pages/user-management/AddRoll'));
const UserManagement_AddRollView = lazy(() => import('./pages/user-management/AddRollView'));
const UserManagement_AddUser = lazy(() => import('./pages/user-management/AddUser'));
const UserManagement_AddUserRight = lazy(() => import('./pages/user-management/AddUserRight'));
const UserManagement_AddUserView = lazy(() => import('./pages/user-management/AddUserView'));
const UserManagement_AddUserViewRight = lazy(() => import('./pages/user-management/AddUserViewRight'));
const UserManagement_LabModulePermision = lazy(() => import('./pages/user-management/LabModulePermision'));
const UserManagement_Home = lazy(() => import('./pages/user-management/UserManagement'));
const Lab_A1Massecuite = lazy(() => import('./pages/lab/A1Massecuite'));
const Lab_A1MassecuiteView = lazy(() => import('./pages/lab/A1MassecuiteView'));
const Lab_AMassecuite = lazy(() => import('./pages/lab/AMassecuite'));
const Lab_AMassecuiteView = lazy(() => import('./pages/lab/AMassecuiteView'));
const Lab_AddBudget = lazy(() => import('./pages/lab/AddBudget'));
const Lab_AddBudgetview = lazy(() => import('./pages/lab/AddBudgetview'));
const Lab_AddCanePlan = lazy(() => import('./pages/lab/AddCanePlan'));
const Lab_AddCanePlanView = lazy(() => import('./pages/lab/AddCanePlanView'));
const Lab_BMassecuite = lazy(() => import('./pages/lab/BMassecuite'));
const Lab_BMassecuiteView = lazy(() => import('./pages/lab/BMassecuiteView'));
const Lab_BcMagma = lazy(() => import('./pages/lab/BcMagma'));
const Lab_BcMagmaView = lazy(() => import('./pages/lab/BcMagmaView'));
const Lab_C1Massecuite = lazy(() => import('./pages/lab/C1Massecuite'));
const Lab_C1MassecuiteView = lazy(() => import('./pages/lab/C1MassecuiteView'));
const Lab_CMassecuite = lazy(() => import('./pages/lab/CMassecuite'));
const Lab_CMassecuiteView = lazy(() => import('./pages/lab/CMassecuiteView'));
const Lab_DailyLabAnalysisAdd = lazy(() => import('./pages/lab/DailyLabAnalysisAdd'));
const Lab_DailyLabAnalysisEntry = lazy(() => import('./pages/lab/DailyLabAnalysisEntry'));
const Lab_DailyLabAnalysisView = lazy(() => import('./pages/lab/DailyLabAnalysisView'));
const Lab_LabDashboard = lazy(() => import('./pages/lab/LabDashboard'));
const Lab_MolassesAnalysis = lazy(() => import('./pages/lab/MolassesAnalysis'));
const Lab_MolassesAnalysisView = lazy(() => import('./pages/lab/MolassesAnalysisView'));
const Lab_MonthlyEntryReportView = lazy(() => import('./pages/lab/MonthlyEntryReportView'));
const Lab_R1 = lazy(() => import('./pages/lab/R1'));
const Lab_R1View = lazy(() => import('./pages/lab/R1View'));
const Lab_R2 = lazy(() => import('./pages/lab/R2'));
const Lab_R2View = lazy(() => import('./pages/lab/R2View'));
const Lab_SugarBagProducedAdd = lazy(() => import('./pages/lab/SugarBagProducedAdd'));
const Lab_SugarBagProducedView = lazy(() => import('./pages/lab/SugarBagProducedView'));
const Lab_TaregetvsActualMIS = lazy(() => import('./pages/lab/TaregetvsActualMIS'));
const Lab_TargetActualMISView = lazy(() => import('./pages/lab/TargetActualMISView'));
const Report_Analysisdata = lazy(() => import('./pages/report/Analysisdata'));
const Report_BudgetVSActual = lazy(() => import('./pages/report/BudgetVSActual'));
const Report_CentreCode = lazy(() => import('./pages/report/CentreCode'));
const Report_CentrePurchase = lazy(() => import('./pages/report/CentrePurchase'));
const Report_CheckingDetailsOnMap = lazy(() => import('./pages/report/CheckingDetailsOnMap'));
const Report_Checking_logPlots = lazy(() => import('./pages/report/Checking_logPlots'));
const Report_CrushingReport = lazy(() => import('./pages/report/CrushingReport'));
const Report_DiseaseDetails = lazy(() => import('./pages/report/DiseaseDetails'));
const Report_DiseaseDetailsOnMap = lazy(() => import('./pages/report/DiseaseDetailsOnMap'));
const Report_DriageCentreClerkDetail = lazy(() => import('./pages/report/DriageCentreClerkDetail'));
const Report_DriageCentreDetail = lazy(() => import('./pages/report/DriageCentreDetail'));
const Report_DriageClerkCentreDetail = lazy(() => import('./pages/report/DriageClerkCentreDetail'));
const Report_DriageClerkDetail = lazy(() => import('./pages/report/DriageClerkDetail'));
const Report_DriageClerkSummary = lazy(() => import('./pages/report/DriageClerkSummary'));
const Report_DriageDetail = lazy(() => import('./pages/report/DriageDetail'));
const Report_DriageSummary = lazy(() => import('./pages/report/DriageSummary'));
const Report_EffectedCaneAreaReport = lazy(() => import('./pages/report/EffectedCaneAreaReport'));
const Report_HourlyCaneArrival = lazy(() => import('./pages/report/HourlyCaneArrival'));
const Report_IndentFailSummary = lazy(() => import('./pages/report/IndentFailSummary'));
const Report_IndentFailSummaryNew = lazy(() => import('./pages/report/IndentFailSummaryNew'));
const Report_IndentFaillDetails = lazy(() => import('./pages/report/IndentFaillDetails'));
const Report_SummaryReportUnitTrackingDetails = lazy(() => import('./pages/report/SummaryReportUnitTrackingDetails'));
const Report_SummaryReportUnitWise = lazy(() => import('./pages/report/SummaryReportUnitWise'));
const Report_SurveyPLot = lazy(() => import('./pages/report/SurveyPLot'));
const Report_SurveyPLotDetails = lazy(() => import('./pages/report/SurveyPLotDetails'));
const Report_TargetActualMISPeriodReport = lazy(() => import('./pages/report/TargetActualMISPeriodReport'));
const Report_TargetActualMISReport = lazy(() => import('./pages/report/TargetActualMISReport'));
const Report_TruckDispatchWeighed = lazy(() => import('./pages/report/TruckDispatchWeighed'));
const ReportNew_ApiStatusReport = lazy(() => import('./pages/report-new/ApiStatusReport'));
const ReportNew_CanePurchaseReport = lazy(() => import('./pages/report-new/CanePurchaseReport'));
const ReportNew_CenterBlanceReport = lazy(() => import('./pages/report-new/CenterBlanceReport'));
const ReportNew_CenterIndentPurchaseReport = lazy(() => import('./pages/report-new/CenterIndentPurchaseReport'));
const ReportNew_CentrePurchaseTruckReportNew = lazy(() => import('./pages/report-new/CentrePurchaseTruckReportNew'));
const ReportNew_HourlyCaneArrivalWieght = lazy(() => import('./pages/report-new/HourlyCaneArrivalWieght'));
const ReportNew_IndentPurchaseReportNew = lazy(() => import('./pages/report-new/IndentPurchaseReportNew'));
const ReportNew_SampleOfTransporter = lazy(() => import('./pages/report-new/SampleOfTransporter'));
const ReportNew_ZoneCentreWiseTruckdetails = lazy(() => import('./pages/report-new/ZoneCentreWiseTruckdetails'));
const Tracking_GrowerMeetingReport = lazy(() => import('./pages/tracking/GrowerMeetingReport'));
const Tracking_LiveLocationRpt = lazy(() => import('./pages/tracking/LiveLocationRpt'));
const Tracking_TargetEntry = lazy(() => import('./pages/tracking/TargetEntry'));
const Tracking_TargetRpt = lazy(() => import('./pages/tracking/TargetRpt'));
const Tracking_Test = lazy(() => import('./pages/tracking/Test'));
const Tracking_TrackingDashboard = lazy(() => import('./pages/tracking/TrackingDashboard'));
const Tracking_TrackingMapLive = lazy(() => import('./pages/tracking/TrackingMapLive'));
const Tracking_TrackingReport = lazy(() => import('./pages/tracking/TrackingReport'));
const Tracking_ViewMapLive = lazy(() => import('./pages/tracking/ViewMapLive'));
const Distillery_BHeavyEthanolReport = lazy(() => import('./pages/distillery/BHeavyEthanolReport'));
const Distillery_CHeavyEthanolReport = lazy(() => import('./pages/distillery/CHeavyEthanolReport'));
const Distillery_DistilleryDashboard = lazy(() => import('./pages/distillery/DistilleryDashboard'));
const Distillery_SyrupEthanolReport = lazy(() => import('./pages/distillery/SyrupEthanolReport'));
const NewReport_AuditReportMaster = lazy(() => import('./pages/new-report/AuditReportMaster'));
const NewReport_CONSECUTIVEGROSSWEIGHT = lazy(() => import('./pages/new-report/CONSECUTIVEGROSSWEIGHT'));
const NewReport_ExceptionReportMaster = lazy(() => import('./pages/new-report/ExceptionReportMaster'));
const NewReport_TargetActualMISReport = lazy(() => import('./pages/new-report/TargetActualMISReport'));
const NewReport_TargetActualMisSapNew = lazy(() => import('./pages/new-report/TargetActualMisSapNew'));
const NewReport_TargetVsActualMisPeriodcallyNewSap = lazy(() => import('./pages/new-report/TargetVsActualMisPeriodcallyNewSap'));
const WhatsApp_ActualVarietyWiseArea = lazy(() => import('./pages/whatsapp/ActualVarietyWiseArea'));
const WhatsApp_UploadLabReport = lazy(() => import('./pages/whatsapp/UploadLabReport'));
const WhatsApp_WhatsAppDashboard = lazy(() => import('./pages/whatsapp/WhatsAppDashboard'));
const WhatsApp_DistilleryWhatsAppReport = lazy(() => import('./pages/whatsapp/distilleryReportEntryViewNew'));
const WhatsApp_DistilleryEntry = lazy(() => import('./pages/whatsapp/DistilleryEntry'));
const WhatsApp_DistilleryEntryView = lazy(() => import('./pages/whatsapp/DistilleryEntryView'));
const SurveyReport_CaneVierityVillageGrower = lazy(() => import('./pages/survey-report/CaneVierityVillageGrower'));
const SurveyReport_DailyTeamWiseHourlySurveyProgressReport = lazy(() => import('./pages/survey-report/DailyTeamWiseHourlySurveyProgressReport'));
const SurveyReport_DailyTeamWiseSurveyProgressReport = lazy(() => import('./pages/survey-report/DailyTeamWiseSurveyProgressReport'));
const SurveyReport_FactoryWiseCaneAreaReport = lazy(() => import('./pages/survey-report/FactoryWiseCaneAreaReport'));
const SurveyReport_FinalVillageFirstSurveyReport = lazy(() => import('./pages/survey-report/FinalVillageFirstSurveyReport'));
const SurveyReport_FinalVillageFirstSurveySummeryReport = lazy(() => import('./pages/survey-report/FinalVillageFirstSurveySummeryReport'));
const SurveyReport_PlotWiseDetails = lazy(() => import('./pages/survey-report/PlotWiseDetails'));
const SurveyReport_SurveyActualVarietywise = lazy(() => import('./pages/survey-report/SurveyActualVarietywise'));
const SurveyReport_SurveyUnitWiseSurveyAreaSummary = lazy(() => import('./pages/survey-report/SurveyUnitWiseSurveyAreaSummary'));
const SurveyReport_SurveyUnitWiseSurveyStatus = lazy(() => import('./pages/survey-report/SurveyUnitWiseSurveyStatus'));
const SurveyReport_WeeklySubmissionofAutumnPlantingIndent = lazy(() => import('./pages/survey-report/WeeklySubmissionofAutumnPlantingIndent'));
const SurveyReport_WeeklySubmissionofIndents = lazy(() => import('./pages/survey-report/WeeklySubmissionofIndents'));
const SurveyReport_categoryWiseSummary = lazy(() => import('./pages/survey-report/categoryWiseSummary'));
const CenterPurchasesReport = lazy(() => import('./pages/CenterPurchasesReport'));
const Survey_SurveyDashboard = lazy(() => import('./pages/survey/SurveyDashboard'));
const Reports_AccountReports = lazy(() => import('./pages/account-reports/AccountReports'));
const Layout = lazy(() => import('./pages/layout/Layout'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="[padding:16px]">Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/Account/Login" element={<Navigate to="/login" replace />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/Account/ChangePassword" element={<ChangePassword />} />
            <Route path="/Account/ManageTblControl" element={<ManageTblControl />} />
            {/* AccountReports Routes */}
            <Route path="/AccountReports" element={<AccountReportsHome />} />
            <Route path="/AccountReports/CaneQtyandSugarCapacity" element={<CaneQtyandSugarCapacity />} />
            <Route path="/AccountReports/Capasityutilisation" element={<Capasityutilisation />} />
            <Route path="/AccountReports/CapasityutilisationFromdate" element={<CapasityutilisationFromdate />} />
            <Route path="/AccountReports/CogenReport" element={<CogenReport />} />
            <Route path="/AccountReports/DISTILLERYReport" element={<DISTILLERYReport />} />
            <Route path="/AccountReports/LoanSummaryReport" element={<LoanSummaryReport />} />
            <Route path="/AccountReports/SugarReport" element={<SugarReport />} />
            <Route path="/AccountReports/TransferandRecievedUnit" element={<TransferandRecievedUnit />} />
            <Route path="/AccountReports/VarietyWiseCanePurchase" element={<VarietyWiseCanePurchase />} />
            <Route path="/AccountReports/VarietyWiseCanePurchaseAmt" element={<VarietyWiseCanePurchaseAmt />} />

            {/* Main Routes */}
            <Route path="/Main" element={<MasterHome />} />
            <Route path="/Main/AddModeGroup" element={<Master_AddModeGroup />} />
            <Route path="/Main/AddModeGroupView" element={<Master_AddModeGroupView />} />
            <Route path="/Main/AddSeason" element={<Master_AddSeason />} />
            <Route path="/Main/AddSeasonView" element={<Master_AddSeasonView />} />
            <Route path="/Main/AddStopage" element={<Master_AddStopage />} />
            <Route path="/Main/AddStopageView" element={<Master_AddStopageView />} />
            <Route path="/Main/DailyRainfall" element={<Master_DailyRainfall />} />
            <Route path="/Main/DailyRainfallview" element={<Master_DailyRainfallView />} />
            <Route path="/Main/distilleryReportEntry" element={<Master_distilleryReportEntry />} />
            <Route path="/Main/distilleryReportEntryView" element={<Master_distilleryReportEntryView />} />
            <Route path="/Main/MonthlyEntryReport" element={<Master_MonthlyEntryReport />} />
            <Route path="/Main/MonthlyEntryReportView" element={<Master_MonthlyEntryReportView />} />
            <Route path="/Main/TargetEntry" element={<Master_TargetEntry />} />
            <Route path="/Main/SugarWhatsAppReportView" element={<WhatsApp_DailyCaneEntry />} />
            <Route path="/Main/SugarWhatsAppReport" element={<WhatsApp_SugarWhatsAppReport />} />
            <Route path="/Main/SugarWhatsAppReportsData" element={<WhatsApp_SugarWhatsAppReportView />} />

            <Route path="/UserManagement" element={<UserManagement_Home />} />
            <Route path="/UserManagement/AddModeGroup" element={<UserManagement_AddModeGroup />} />
            <Route path="/UserManagement/AddModeGroupView" element={<UserManagement_AddModeGroupView />} />
            <Route path="/UserManagement/AddRoll" element={<UserManagement_AddRoll />} />
            <Route path="/UserManagement/AddRollView" element={<UserManagement_AddRollView />} />
            <Route path="/UserManagement/AddUser" element={<UserManagement_AddUser />} />
            <Route path="/UserManagement/AddUserRight" element={<UserManagement_AddUserRight />} />
            <Route path="/UserManagement/AddUserView" element={<UserManagement_AddUserViewRight />} />
            <Route path="/UserManagement/AddUserViewRight" element={<UserManagement_AddUserView />} />
            <Route path="/UserManagement/LabModulePermision" element={<UserManagement_LabModulePermision />} />

            {/* Lab Routes */}
            <Route path="/Lab/A1Massecuite" element={<Lab_A1Massecuite />} />
            <Route path="/Lab/A1MassecuiteView" element={<Lab_A1MassecuiteView />} />
            <Route path="/Lab/AMassecuite" element={<Lab_AMassecuite />} />
            <Route path="/Lab/AMassecuiteView" element={<Lab_AMassecuiteView />} />
            <Route path="/Lab/AddBudget" element={<Lab_AddBudget />} />
            <Route path="/Lab/AddBudgetview" element={<Lab_AddBudgetview />} />
            <Route path="/Lab/AddCanePlan" element={<Lab_AddCanePlan />} />
            <Route path="/Lab/AddCanePlanView" element={<Lab_AddCanePlanView />} />
            <Route path="/Lab/BMassecuite" element={<Lab_BMassecuite />} />
            <Route path="/Lab/BMassecuiteView" element={<Lab_BMassecuiteView />} />
            <Route path="/Lab/BcMagma" element={<Lab_BcMagma />} />
            <Route path="/Lab/BcMagmaView" element={<Lab_BcMagmaView />} />
            <Route path="/Lab/C1Massecuite" element={<Lab_C1Massecuite />} />
            <Route path="/Lab/C1MassecuiteView" element={<Lab_C1MassecuiteView />} />
            <Route path="/Lab/CMassecuite" element={<Lab_CMassecuite />} />
            <Route path="/Lab/CMassecuiteView" element={<Lab_CMassecuiteView />} />
            <Route path="/Lab/DailyLabAnalysisAdd" element={<Lab_DailyLabAnalysisAdd />} />
            <Route path="/Lab/DailyLabAnalysisEntry" element={<Lab_DailyLabAnalysisEntry />} />
            <Route path="/Lab/DailyLabAnalysisView" element={<Lab_DailyLabAnalysisView />} />
            <Route path="/Lab/LabDashboard" element={<Lab_LabDashboard />} />
            <Route path="/Lab/MolassesAnalysis" element={<Lab_MolassesAnalysis />} />
            <Route path="/Lab/MolassesAnalysisView" element={<Lab_MolassesAnalysisView />} />
            <Route path="/Lab/MonthlyEntryReportView" element={<Lab_MonthlyEntryReportView />} />
            <Route path="/Lab/R1" element={<Lab_R1 />} />
            <Route path="/Lab/R1View" element={<Lab_R1View />} />
            <Route path="/Lab/R2" element={<Lab_R2 />} />
            <Route path="/Lab/R2View" element={<Lab_R2View />} />
            <Route path="/Lab/SugarBagProducedAdd" element={<Lab_SugarBagProducedAdd />} />
            <Route path="/Lab/SugarBagProducedView" element={<Lab_SugarBagProducedView />} />
            <Route path="/Lab/TaregetvsActualMIS" element={<Lab_TaregetvsActualMIS />} />
            <Route path="/Lab/TargetActualMISView" element={<Lab_TargetActualMISView />} />

            {/* Reports Routes */}
            {/* Report Routes */}
            <Route path="/Report/Analysisdata" element={<Report_Analysisdata />} />
            <Route path="/Report/BudgetVSActual" element={<Report_BudgetVSActual />} />
            <Route path="/Report/CentreCode" element={<Report_CentreCode />} />
            <Route path="/Report/CentrePurchase" element={<Report_CentrePurchase />} />
            <Route path="/Report/CheckingDetailsOnMap" element={<Report_CheckingDetailsOnMap />} />
            <Route path="/Report/Checking_logPlots" element={<Report_Checking_logPlots />} />
            <Route path="/Report/CrushingReport" element={<Report_CrushingReport />} />
            <Route path="/Report/DiseaseDetails" element={<Report_DiseaseDetails />} />
            <Route path="/Report/DiseaseDetailsOnMap" element={<Report_DiseaseDetailsOnMap />} />
            <Route path="/Report/DriageCentreClerkDetail" element={<Report_DriageCentreClerkDetail />} />
            <Route path="/Report/DriageCentreDetail" element={<Report_DriageCentreDetail />} />
            <Route path="/Report/DriageClerkCentreDetail" element={<Report_DriageClerkCentreDetail />} />
            <Route path="/Report/DriageClerkDetail" element={<Report_DriageClerkDetail />} />
            <Route path="/Report/DriageClerkSummary" element={<Report_DriageClerkSummary />} />
            <Route path="/Report/DriageDetail" element={<Report_DriageDetail />} />
            <Route path="/Report/DriageSummary" element={<Report_DriageSummary />} />
            <Route path="/Report/EffectedCaneAreaReport" element={<Report_EffectedCaneAreaReport />} />
            <Route path="/Report/HourlyCaneArrival" element={<Report_HourlyCaneArrival />} />
            <Route path="/Report/IndentFaillDetails" element={<Report_IndentFaillDetails />} />
            <Route path="/Report/IndentFailSummary" element={<Report_IndentFailSummary />} />
            <Route path="/Report/IndentFailSummaryNew" element={<Report_IndentFailSummaryNew />} />
            <Route path="/Report/SummaryReportUnitTrackingDetails" element={<Report_SummaryReportUnitTrackingDetails />} />
            <Route path="/Report/SummaryReportUnitWise" element={<Report_SummaryReportUnitWise />} />
            <Route path="/Report/SurveyPLot" element={<Report_SurveyPLot />} />
            <Route path="/Report/SurveyPLotDetails" element={<Report_SurveyPLotDetails />} />
            <Route path="/Report/TargetActualMISPeriodReport" element={<Report_TargetActualMISPeriodReport />} />
            <Route path="/Report/TargetActualMISReport" element={<Report_TargetActualMISReport />} />
            <Route path="/Report/TruckDispatchWeighed" element={<Report_TruckDispatchWeighed />} />

            {/* ReportNew Routes */}
            <Route path="/ReportNew/ApiStatusReport" element={<ReportNew_ApiStatusReport />} />
            <Route path="/ReportNew/CanePurchaseReport" element={<ReportNew_CanePurchaseReport />} />
            <Route path="/ReportNew/CenterBlanceReport" element={<ReportNew_CenterBlanceReport />} />
            <Route path="/ReportNew/CenterIndentPurchaseReport" element={<ReportNew_CenterIndentPurchaseReport />} />
            <Route path="/ReportNew/CentrePurchaseTruckReportNew" element={<ReportNew_CentrePurchaseTruckReportNew />} />
            <Route path="/ReportNew/HourlyCaneArrivalWieght" element={<ReportNew_HourlyCaneArrivalWieght />} />
            <Route path="/ReportNew/IndentPurchaseReportNew" element={<ReportNew_IndentPurchaseReportNew />} />
            <Route path="/ReportNew/SampleOfTransporter" element={<ReportNew_SampleOfTransporter />} />
            <Route path="/ReportNew/ZoneCentreWiseTruckdetails" element={<ReportNew_ZoneCentreWiseTruckdetails />} />

            {/* NewReport Routes */}
            <Route path="/NewReport/AuditReportMaster" element={<NewReport_AuditReportMaster />} />
            <Route path="/NewReport/CONSECUTIVEGROSSWEIGHT" element={<NewReport_CONSECUTIVEGROSSWEIGHT />} />
            <Route path="/NewReport/ExceptionReportMaster" element={<NewReport_ExceptionReportMaster />} />
            <Route path="/NewReport/TargetActualMisSapNew" element={<NewReport_TargetActualMisSapNew />} />
            <Route path="/NewReport/TargetVsActualMisPeriodcallyNewSap" element={<NewReport_TargetVsActualMisPeriodcallyNewSap />} />

            {/* Tracking Routes */}
            <Route path="/Tracking/GrowerMeetingReport" element={<Tracking_GrowerMeetingReport />} />
            <Route path="/Tracking/LiveLocationRpt" element={<Tracking_LiveLocationRpt />} />
            <Route path="/Tracking/TargetEntry" element={<Tracking_TargetEntry />} />
            <Route path="/Tracking/TargetRpt" element={<Tracking_TargetRpt />} />
            <Route path="/Tracking/Test" element={<Tracking_Test />} />
            <Route path="/Tracking/TrackingDashboard" element={<Tracking_TrackingDashboard />} />
            <Route path="/Tracking/TrackingMapLive" element={<Tracking_TrackingMapLive />} />
            <Route path="/Tracking/TrackingReport" element={<Tracking_TrackingReport />} />
            <Route path="/Tracking/ViewMapLive" element={<Tracking_ViewMapLive />} />

            {/* Distillery Routes */}
            <Route path="/Distillery/BHeavyEthanolReport" element={<Distillery_BHeavyEthanolReport />} />
            <Route path="/Distillery/CHeavyEthanolReport" element={<Distillery_CHeavyEthanolReport />} />
            <Route path="/Distillery/DistilleryDashboard" element={<Distillery_DistilleryDashboard />} />
            <Route path="/Distillery/SyrupEthanolReport" element={<Distillery_SyrupEthanolReport />} />

            {/* WhatsApp Routes */}
            <Route path="/WhatsApp/ActualVarietyWiseArea" element={<WhatsApp_ActualVarietyWiseArea />} />
            <Route path="/WhatsApp/SugarWhatsAppReport" element={<WhatsApp_DailyCaneEntry />} />
            <Route path="/WhatsApp/SugarWhatsAppReportEntry" element={<WhatsApp_SugarWhatsAppReport />} />
            <Route path="/WhatsApp/SugarWhatsAppReportNew" element={<WhatsApp_SugarWhatsAppReportNew />} />
            <Route path="/WhatsApp/SugarWhatsAppReportView" element={<WhatsApp_SugarWhatsAppReportView />} />
            <Route path="/WhatsApp/SugarWhatsAppReportData" element={<WhatsApp_SugarWhatsAppReportView />} />
            <Route path="/WhatsApp/UploadLabReport" element={<WhatsApp_UploadLabReport />} />
            <Route path="/WhatsApp/WhatsAppDashboard" element={<WhatsApp_WhatsAppDashboard />} />
            <Route path="/WhatsApp/DistilleryEntry" element={<WhatsApp_DistilleryEntry />} />
            <Route path="/WhatsApp/DistilleryEntryView" element={<WhatsApp_DistilleryEntryView />} />
            <Route path="/WhatsApp/DistilleryReportEntryView" element={<WhatsApp_DistilleryWhatsAppReport />} />
            <Route path="/WhatsApp/DistilleryWhatsAppReport" element={<WhatsApp_DistilleryWhatsAppReport />} />

            {/* SurveyReport Routes */}
            <Route path="/SurveyReport/CaneVierityVillageGrower" element={<SurveyReport_CaneVierityVillageGrower />} />
            <Route path="/SurveyReport/categoryWiseSummary" element={<SurveyReport_categoryWiseSummary />} />
            <Route path="/SurveyReport/DailyTeamWiseHourlySurveyProgressReport" element={<SurveyReport_DailyTeamWiseHourlySurveyProgressReport />} />
            <Route path="/SurveyReport/DailyTeamWiseSurveyProgressReport" element={<SurveyReport_DailyTeamWiseSurveyProgressReport />} />
            <Route path="/SurveyReport/FactoryWiseCaneAreaReport" element={<SurveyReport_FactoryWiseCaneAreaReport />} />
            <Route path="/SurveyReport/FinalVillageFirstSurveyReport" element={<SurveyReport_FinalVillageFirstSurveyReport />} />
            <Route path="/SurveyReport/FinalVillageFirstSurveySummeryReport" element={<SurveyReport_FinalVillageFirstSurveySummeryReport />} />
            <Route path="/SurveyReport/PlotWiseDetails" element={<SurveyReport_PlotWiseDetails />} />
            <Route path="/SurveyReport/SurveyActualVarietywise" element={<SurveyReport_SurveyActualVarietywise />} />
            <Route path="/SurveyReport/SurveyUnitWiseSurveyAreaSummary" element={<SurveyReport_SurveyUnitWiseSurveyAreaSummary />} />
            <Route path="/SurveyReport/SurveyUnitWiseSurveyStatus" element={<SurveyReport_SurveyUnitWiseSurveyStatus />} />
            <Route path="/SurveyReport/WeeklySubmissionofAutumnPlantingIndent" element={<SurveyReport_WeeklySubmissionofAutumnPlantingIndent />} />
            <Route path="/SurveyReport/WeeklySubmissionofIndents" element={<SurveyReport_WeeklySubmissionofIndents />} />

            <Route path="/CenterPurchasesReport" element={<CenterPurchasesReport />} />
            <Route path="/Survey/SurveyDashboard" element={<Survey_SurveyDashboard />} />

            {/* Catch-all route for any undefined paths */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </Router>);

}

export default App;
