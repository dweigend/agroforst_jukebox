/**
 * ====================================================================
 * CENTRALIZED LOGGING SYSTEM - Production-Ready with Environment Control
 * ====================================================================
 * 
 * Solves console noise problem with intelligent filtering and levels
 * 
 * Features:
 * - Environment-aware logging (DEV vs production)
 * - Log levels with automatic filtering
 * - Manager-specific prefixes and context
 * - Performance timing utilities
 * - Selective debug output control
 * - Clean production builds with essential errors only
 */

// Log Levels - ordered by severity
export enum LogLevel {
  ERROR = 0,   // Always shown - critical errors only
  WARN = 1,    // Important warnings - shown in production
  INFO = 2,    // General information - development only
  DEBUG = 3    // Detailed debug info - explicit debug mode only
}

// Logger Configuration
interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  isDevelopment: boolean;
  debugMode: boolean;
  enableTiming: boolean;
}

// Performance Timer for debugging
interface PerformanceTimer {
  start: number;
  label: string;
}

export class Logger {
  private config: LoggerConfig;
  private timers = new Map<string, PerformanceTimer>();
  
  // Silent operations that shouldn't be logged even in debug mode
  private static readonly SILENT_OPERATIONS = new Set([
    'audio:progress',
    'audio:time-update',
    'ui:mouse-move',
    'camera:frame-update',
    'animation:frame'
  ]);

  constructor(prefix: string = 'App', debugMode: boolean = false) {
    this.config = {
      level: this.getDefaultLogLevel(),
      prefix,
      isDevelopment: import.meta.env?.DEV ?? false,
      debugMode,
      enableTiming: import.meta.env?.DEV ?? false
    };
  }

  // ====================================================================
  // MAIN LOGGING METHODS - Replace all console.* calls with these
  // ====================================================================

  /**
   * Critical errors - always logged in production and development
   */
  error(message: string, error?: Error | unknown, context?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formattedMessage = this.formatMessage('❌ ERROR', message);
      if (error) {
        console.error(formattedMessage, error, context);
      } else {
        console.error(formattedMessage, context);
      }
    }
  }

  /**
   * Important warnings - logged in production and development  
   */
  warn(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('⚠️ WARN', message), context);
    }
  }

  /**
   * General information - development only
   */
  info(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('ℹ️ INFO', message), context);
    }
  }

  /**
   * Detailed debug information - explicit debug mode only
   */
  debug(message: string, context?: any, operation?: string): void {
    // Skip if operation is in silent list
    if (operation && Logger.SILENT_OPERATIONS.has(operation)) {
      return;
    }
    
    if (this.shouldLog(LogLevel.DEBUG) && this.config.debugMode) {
      console.log(this.formatMessage('🔍 DEBUG', message), context);
    }
  }

  // ====================================================================
  // SPECIALIZED LOGGING METHODS
  // ====================================================================

  /**
   * State transitions - clean format for state machines
   */
  stateChange(fromState: string, toState: string, reason?: string): void {
    if (this.config.debugMode) {
      const message = `State: ${fromState} → ${toState}${reason ? ` (${reason})` : ''}`;
      this.debug(message, undefined, 'state-transition');
    }
  }

  /**
   * Event emissions - controlled debug output
   */
  eventEmit(eventName: string, data?: any): void {
    if (this.config.debugMode && !Logger.SILENT_OPERATIONS.has(eventName)) {
      this.debug(`Event: ${eventName}`, data, 'event-emission');
    }
  }

  /**
   * Asset loading progress - minimal logging
   */
  assetLoad(assetName: string, success: boolean, error?: Error): void {
    if (success) {
      this.debug(`Asset loaded: ${assetName}`, undefined, 'asset-loading');
    } else {
      this.error(`Asset failed: ${assetName}`, error);
    }
  }

  /**
   * Performance timing utilities
   */
  startTimer(label: string): void {
    if (this.config.enableTiming) {
      this.timers.set(label, {
        start: performance.now(),
        label
      });
    }
  }

  endTimer(label: string): number {
    if (!this.config.enableTiming) return 0;
    
    const timer = this.timers.get(label);
    if (timer) {
      const duration = performance.now() - timer.start;
      this.debug(`Timer: ${label} completed in ${duration.toFixed(2)}ms`, undefined, 'performance');
      this.timers.delete(label);
      return duration;
    }
    return 0;
  }

  // ====================================================================
  // DEVELOPMENT HELPERS
  // ====================================================================

  /**
   * Development commands - only available in dev environment
   */
  devCommand(commandName: string, description: string): void {
    if (this.config.isDevelopment) {
      console.log(`🎮 Dev command: ${commandName} - ${description}`);
    }
  }

  /**
   * Success confirmations - minimal, clean output
   */
  success(message: string, context?: any): void {
    if (this.config.isDevelopment) {
      console.log(this.formatMessage('✅ SUCCESS', message), context);
    }
  }

  // ====================================================================
  // CONFIGURATION & CONTROL
  // ====================================================================

  /**
   * Enable/disable debug mode at runtime
   */
  setDebugMode(enabled: boolean): void {
    this.config.debugMode = enabled;
    if (this.config.isDevelopment) {
      console.log(`[${this.config.prefix}] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }
  }

  /**
   * Change log level at runtime
   */
  setLogLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Create child logger with specific prefix
   */
  child(childPrefix: string): Logger {
    const childLogger = new Logger(
      `${this.config.prefix}:${childPrefix}`, 
      this.config.debugMode
    );
    childLogger.setLogLevel(this.config.level);
    return childLogger;
  }

  // ====================================================================
  // PRIVATE IMPLEMENTATION
  // ====================================================================

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private formatMessage(levelLabel: string, message: string): string {
    const timestamp = this.config.isDevelopment ? 
      new Date().toLocaleTimeString() : '';
    const prefix = `[${this.config.prefix}]`;
    
    if (this.config.isDevelopment && timestamp) {
      return `${timestamp} ${prefix} ${levelLabel} ${message}`;
    } else {
      return `${prefix} ${levelLabel} ${message}`;
    }
  }

  private getDefaultLogLevel(): LogLevel {
    if (import.meta.env?.DEV) {
      // Development: Show INFO level by default, DEBUG only when explicitly enabled
      return LogLevel.INFO;
    } else {
      // Production: Only WARN and ERROR
      return LogLevel.WARN; 
    }
  }

  // ====================================================================
  // STATIC FACTORY METHODS - Easy manager integration
  // ====================================================================

  /**
   * Create logger for a manager - standard naming convention
   */
  static forManager(managerName: string): Logger {
    return new Logger(managerName);
  }

  /**
   * Create logger for a service - standard naming convention
   */
  static forService(serviceName: string): Logger {
    return new Logger(`${serviceName}Service`);
  }

  /**
   * Create logger with debug mode enabled
   */
  static withDebug(prefix: string): Logger {
    return new Logger(prefix, true);
  }
}

// ====================================================================
// GLOBAL LOGGER INSTANCES - Import these in your managers
// ====================================================================

// Main app logger
export const appLogger = new Logger('App');

// Common manager loggers - ready to use
export const sceneLogger = Logger.forManager('Scene');
export const rfidLogger = Logger.forManager('RFID');
export const audioLogger = Logger.forManager('Audio');
export const moodLogger = Logger.forManager('Mood');
export const assetLogger = Logger.forManager('Asset');
export const uiLogger = Logger.forManager('UI');
export const stateLogger = Logger.forManager('AppState');

// Service loggers
export const rfidServiceLogger = Logger.forService('RFID');
export const musicServiceLogger = Logger.forService('Music');

// ====================================================================
// DEVELOPMENT SETUP - Global debug controls
// ====================================================================

if (import.meta.env?.DEV && typeof window !== 'undefined') {
  // Global logger controls for development
  (window as any).loggers = {
    setGlobalDebug: (enabled: boolean) => {
      [appLogger, sceneLogger, rfidLogger, audioLogger, moodLogger, 
       assetLogger, uiLogger, stateLogger].forEach(logger => {
        logger.setDebugMode(enabled);
      });
    },
    setGlobalLevel: (level: LogLevel) => {
      [appLogger, sceneLogger, rfidLogger, audioLogger, moodLogger, 
       assetLogger, uiLogger, stateLogger].forEach(logger => {
        logger.setLogLevel(level);
      });
    },
    LogLevel // Export enum for console use
  };
  
  console.log('🔧 Logger controls: window.loggers.setGlobalDebug(true/false)');
}