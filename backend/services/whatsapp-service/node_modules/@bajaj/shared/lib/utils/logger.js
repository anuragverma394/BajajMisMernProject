/**
 * Unified Logger Utility
 * Provides consistent logging across all microservices
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const COLORS = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  RESET: '\x1b[0m'
};

class Logger {
  constructor(serviceName = 'service', logLevel = 'INFO') {
    this.serviceName = serviceName;
    this.logLevel = LOG_LEVELS[logLevel] || LOG_LEVELS.INFO;
  }

  formatMessage(level, message, meta) {
    const timestamp = new Date().toISOString();
    const color = COLORS[level];
    const resetColor = COLORS.RESET;
    
    let metaStr = '';
    if (meta && Object.keys(meta).length > 0) {
      metaStr = ` | ${JSON.stringify(meta)}`;
    }

    return `${color}[${timestamp}] [${this.serviceName}] [${level}]${resetColor} ${message}${metaStr}`;
  }

  log(level, message, meta = {}) {
    if (LOG_LEVELS[level] < this.logLevel) {
      return;
    }

    const formatted = this.formatMessage(level, message, meta);

    if (level === 'ERROR') {
      console.error(formatted);
    } else if (level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      ...(error && {
        errorMessage: error.message,
        errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
    this.log('ERROR', message, errorMeta);
  }
}

// Singleton instance
let instance = null;

function getLogger(serviceName = 'service', logLevel = 'INFO') {
  if (!instance) {
    instance = new Logger(serviceName, logLevel);
  }
  return instance;
}

function setLogLevel(logLevel) {
  if (instance) {
    instance.logLevel = LOG_LEVELS[logLevel] || LOG_LEVELS.INFO;
  }
}

module.exports = {
  getLogger,
  setLogLevel,
  Logger,
  LOG_LEVELS
};
