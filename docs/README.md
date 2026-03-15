/**
 * Shared Utilities Documentation
 * 
 * This shared folder contains reusable code for all microservices
 * to eliminate duplication and standardize implementations.
 * 
 * ## Structure
 * 
 * ### config/
 * - `constants.js` - Centralized configuration constants
 * - `database.js` - SQL Server connection and pool management
 * 
 * ### core/
 * - `db/mssql.js` - Low-level database operations
 * - `db/query-executor.js` - High-level query interface
 * - `http/response.js` - Standardized HTTP responses
 * - `http/errors.js` - Custom error classes
 * 
 * ### middleware/
 * - `error.middleware.js` - Global error handling
 * - `validate.middleware.js` - Request validation
 * 
 * ## Usage in Services
 * 
 * ### 1. Replace config/sqlserver.js
 * ```javascript
 * // OLD - in each service
 * const { getPool } = require('../../config/sqlserver');
 * 
 * // NEW - shared
 * const { getPool } = require('../../shared/config/database');
 * ```
 * 
 * ### 2. Replace middleware/error.middleware.js
 * ```javascript
 * // OLD - in each service
 * const { errorHandler } = require('./middleware/error.middleware');
 * 
 * // NEW - shared
 * const { errorHandler } = require('../../shared/middleware/error.middleware');
 * ```
 * 
 * ### 3. Use shared constants
 * ```javascript
 * const CONFIG = require('../../shared/config/constants');
 * 
 * // Access: CONFIG.DATABASE, CONFIG.API, CONFIG.ERROR_CODES, etc.
 * ```
 * 
 * ### 4. Use response helpers
 * ```javascript
 * const { attachResponseHelpers } = require('../../shared/core/http/response');
 * 
 * app.use(attachResponseHelpers);
 * // Now: res.apiSuccess(message, data, status)
 * //      res.apiError(message, error, status)
 * ```
 * 
 * ### 5. Use error class
 * ```javascript
 * const { badRequest, notFound } = require('../../shared/core/http/errors');
 * 
 * throw badRequest('Invalid input');
 * throw notFound('Resource not found');
 * ```
 * 
 * ## Configuration (Environment Variables)
 * 
 * All services now use the same configuration:
 * 
 * ```env
 * # Database
 * DB_SERVER=localhost
 * DB_INSTANCE=SQLEXPRESS
 * DB_NAME=BajajMis
 * DB_USER=sa
 * DB_PASSWORD=your_password
 * DB_USE_WINDOWS_AUTH=false
 * SQL_REQUEST_TIMEOUT_MS=300000
 * SQL_CONNECTION_TIMEOUT_MS=30000
 * DEFAULT_SEASON=2526
 *
 * # Season-specific connections (optional)
 * SQL_CONN_2526=Server=...;Database=...;
 * SQL_CONN_2425=Server=...;Database=...;
 * 
 * # Application
 * LOG_LEVEL=info
 * NODE_ENV=development
 * ```
 * 
 * ## Migration Checklist
 * 
 * For each service, follow these steps:
 * 
 * 1. [ ] Replace imports of `config/sqlserver.js` with shared version
 * 2. [ ] Replace imports of `middleware/error.middleware.js` with shared version
 * 3. [ ] Replace custom response building with `attachResponseHelpers`
 * 4. [ ] Remove duplicated error classes, use shared versions
 * 5. [ ] Remove duplicated constants, use CONFIG from shared
 * 6. [ ] Test the service
 * 7. [ ] Remove old local files (keep shared versions only)
 * 
 * ## Benefits
 * 
 * ✅ Eliminates code duplication
 * ✅ Centralized configuration management
 * ✅ Consistent error handling
 * ✅ Easier maintenance and updates
 * ✅ Single source of truth for utilities
 * ✅ Easier to add new services
 */

module.exports = {
  documentationPath: __dirname
};
