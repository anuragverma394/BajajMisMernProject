/**
 * api.service.js - Barrel Export File
 *
 * Centralized export of all microservices and HTTP client.
 * NO DUPLICATION - all logic is in individual service files and http.client.js
 *
 * This file re-exports:
 * - HTTP client and utilities from http.client.js
 * - All individual services (user-management, auth, report, etc.)
 */

// ──────────────────────────────────────────────────────────────────────────────
// HTTP Client + Utilities (from centralized http.client.js)
// ──────────────────────────────────────────────────────────────────────────────
export {
  apiClient,
  isDev,
  unwrap,
  toLegacyDateRange,
  massecuiteRouteMap,
  normalizeMassecuiteType,
  debugDuplicateRecords,
  debugDuplicateIdsInPayload,
  normalizeUnitsList,
  buildDashboardPayload,
  postDashboard
} from './http.client';

// ──────────────────────────────────────────────────────────────────────────────
// Individual Service Exports
// ──────────────────────────────────────────────────────────────────────────────

// Authentication & Account
export { authService } from './auth.service';

// User Management (roles, permissions, rights)
export { userManagementService } from './user-management.service';

// Master Data (units, seasons, stoppages, modes, centers)
export { masterService } from './master.service';

// Reports & Analytics
export { reportService } from './report.service';
export { reportNewService } from './report-new.service';

// Tracking & GPS
export { trackingService } from './tracking.service';

// Surveys
export { surveyService } from './survey.service';

// Lab Management
export { labService } from './lab.service';

// Dashboard & Home
export { dashboardService } from './dashboard.service';

// WhatsApp & Additional Services (various CRUD operations)
export {
  whatsappService,
  accountReportsService,
  distilleryService,
  transferUnitService,
  dailyCaneEntryService,
  dailyRainfallService,
  distilleryEntryService,
  addBudgetService,
  addCanePlanService,
  monthlyEntryReportService,
  labModulePermissionService
} from './additional-services';

// ──────────────────────────────────────────────────────────────────────────────
// Default Export (API Client for backward compatibility)
// ──────────────────────────────────────────────────────────────────────────────
import { apiClient } from './http.client';
export default apiClient;
