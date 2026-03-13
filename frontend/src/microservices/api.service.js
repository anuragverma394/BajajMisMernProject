/**
 * api.service.js — Barrel re-export
 *
 * This file re-exports every service from its own dedicated module.
 * All existing component imports continue to work without any changes:
 *
 *   import { reportService, masterService } from '../../microservices/api.service';  ✅
 *
 * To import directly from a specific service (optional, for new files):
 *
 *   import { reportService } from '../../microservices/report.service';  ✅
 */

// ── Shared HTTP client (Axios instance + helpers) ─────────────────────────
export { default as apiClient } from './http.client';

// ── Exports: one per domain service file ─────────────────────────────────
export { authService } from './auth.service';
export { masterService } from './master.service';
export { reportService } from './report.service';
export { reportNewService } from './report-new.service';
export { trackingService } from './tracking.service';
export { surveyService } from './survey.service';
export { dashboardService } from './dashboard.service';
export { labService } from './lab.service';
export { userManagementService } from './user-management.service';

// ── CRUD & domain services (grouped in crud.service.js) ──────────────────
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
} from './crud.service';

// Re-export the default (Axios instance) from http.client so that
// `import apiClient from '../../microservices/api.service'` still works.
export { default } from './http.client';
