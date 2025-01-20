import { Logger } from './custom.d';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LoggerOptions {
	setPrefix: boolean;
}

const LOGGER_PREFIX = '[JWT-Smith] ';

let currentLogger: Logger = console;

let logSettings: LoggerOptions = {
	setPrefix: true,
};

/**
 * Sets the logger to be used by the library.
 * The logger should implement the Logger interface.
 * The logger should have the following methods:
 * - info
 * - warn
 * - error
 * - debug
 *
 * @param {Logger} logger
 * @param {LoggerOptions} [options]
 */
export const setLogger = (logger: Logger, options?: LoggerOptions): void => {
	currentLogger = logger;

	logSettings = {
		...logSettings,
		...(options || {}),
	};
};

/**
 * Returns the current logger.
 * The logger can be the default console logger or a custom logger.
 * The logger should implement the Logger interface.
 *
 * @return {*}  {Logger}
 */
export const getLogger = (): Logger => {
	return currentLogger;
};

/**
 * Formats a log message.
 * If the setPrefix option is true, the message is prefixed with the LOGGER_PREFIX.
 *
 * @param {string} message
 * @return {*}  {string}
 */
export const logFormat = (message: string): string => {
	return `${logSettings.setPrefix ? LOGGER_PREFIX : ''}${message}`;
};

/**
 * Logs a message with the given log level.
 * The message is formatted using the logFormat function.
 *
 * @param {LogLevel} level
 * @param {string} message
 * @param {...unknown[]} args
 */
export const log = (level: LogLevel, message: string, ...args: unknown[]): void => {
	const logger = getLogger();

	if (logger[level]) {
		logger[level](logFormat(message), ...args);
	} else {
		console.error(logFormat(`Invalid log level: ${level}`));
	}
};
