type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface Logger {
	info: (message: string, ...args: unknown[]) => void;
	warn: (message: string, ...args: unknown[]) => void;
	error: (message: string, ...args: unknown[]) => void;
	debug: (message: string, ...args: unknown[]) => void;
}

interface LoggerOptions {
  setPrefix: boolean
}

const LOGGER_PREFIX = '[JWT-Smith] ';

let currentLogger: Logger = console;

let logSettings: LoggerOptions = {
	setPrefix: true,
};

/**
 * Sets a custom logger. The provided logger should have 'info', 'warn', 'error', and 'debug' methods.
 */
export const setLogger = (logger: Logger, options?: LoggerOptions): void => {
	currentLogger = logger;

	logSettings = {
		...logSettings,
		...(options || {}),
	};
};

/**
 * Gets the current logger. Defaults to `console` if no custom logger is set.
 */
export const getLogger = (): Logger => {
	return currentLogger;
};

/**
 * Format log messages. This function formats a given log message based on the logSettings configuration.
 */
export const logFormat = (message: string): string => {
  return `${logSettings.setPrefix ? LOGGER_PREFIX : ''}${message}`;
}

/**
 * Logs a message at a specified level using the current logger.
 */
export const log = (level: LogLevel, message: string, ...args: unknown[]): void => {
	const logger = getLogger();

	if (logger[level]) {
		logger[level](logFormat(message), ...args);
	} else {
		console.error(logFormat(`Invalid log level: ${level}`));
	}
};
