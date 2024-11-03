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

const LOGGER_PREFIX = '[JWT-Smith]';

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
 * Logs a message at a specified level using the current logger.
 */
export const log = (level: LogLevel, message: string, ...args: unknown[]): void => {
	const logger = getLogger();

	const logMessage = `${logSettings.setPrefix ? LOGGER_PREFIX : ''}${message}`;

	if (logger[level]) {
		logger[level](logMessage, ...args);
	} else {
		console.error(`${LOGGER_PREFIX}Invalid log level: ${level}`);
	}
};
