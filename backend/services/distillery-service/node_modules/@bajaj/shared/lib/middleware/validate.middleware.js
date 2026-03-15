/**
 * Unified Validation Middleware
 * Uses Zod for schema validation across all microservices
 */

const { z } = require('zod');
const { getLogger } = require('../utils/logger');

const logger = getLogger('validate-middleware');

/**
 * Create validation middleware
 * Usage: router.post('/path', validate(schema), controller)
 */
function validate(schema, options = {}) {
  return async (req, res, next) => {
    try {
      const dataToValidate = options.source === 'query' ? req.query :
                             options.source === 'params' ? req.params :
                             options.source === 'headers' ? req.headers :
                             req.body;

      // Validate using schema
      const validated = await schema.parseAsync(dataToValidate);

      // Attach validated data to request based on source
      if (options.source === 'query') {
        req.query = validated;
      } else if (options.source === 'params') {
        req.params = validated;
      } else if (options.source === 'headers') {
        req.headers = validated;
      } else {
        req.body = validated;
      }

      logger.debug('Validation passed', { path: req.path, source: options.source || 'body' });
      return next();

    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.errors.reduce((acc, error) => {
          const path = error.path.join('.');
          acc[path] = error.message;
          return acc;
        }, {});

        logger.warn('Validation failed', { 
          path: req.path, 
          errors,
          source: options.source || 'body'
        });

        return res.status(422).json({
          success: false,
          message: 'Validation failed',
          errorCode: 'VALIDATION_ERROR',
          details: errors,
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
      }

      logger.error('Validation error', err);
      return res.status(500).json({
        success: false,
        message: 'Validation error',
        errorCode: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };
}

/**
 * Common validation schemas
 */
const commonSchemas = {
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(10),
    skip: z.coerce.number().int().nonnegative().optional()
  }).transform(data => ({
    page: data.page,
    pageSize: data.pageSize,
    skip: data.skip || (data.page - 1) * data.pageSize
  })),

  dateRange: z.object({
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
    dateFrom: z.string().date().optional(),
    dateTo: z.string().date().optional()
  }),

  id: z.object({
    id: z.coerce.number().positive().or(z.string().min(1))
  }),

  email: z.string().email('Invalid email address'),

  password: z.string().min(8, 'Password must be at least 8 characters'),

  phoneNumber: z.string().regex(/^[0-9]{10,12}$/, 'Invalid phone number'),

  uuid: z.string().uuid('Invalid UUID'),

  seasonAndFactory: z.object({
    season: z.string().optional().default(process.env.DEFAULT_SEASON || '2526'),
    factoryId: z.coerce.number().optional(),
    factId: z.coerce.number().optional()
  })
};

/**
 * Helper to combine schemas
 */
function combineSchemas(...schemas) {
  return z.object({}).merge(...schemas);
}

module.exports = {
  validate,
  commonSchemas,
  combineSchemas,
  z // Export Zod for custom schemas
};
