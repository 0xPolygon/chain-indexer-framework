import winston, { Logger as WinstonLogger } from "winston";
import { LoggerConfig } from "../interfaces/logger_config.js";
import SentryImport from "winston-transport-sentry-node";
const Sentry = SentryImport.default;

let logger: WinstonLogger | null = null;

/**
 * LoggerClass that maintains a singleton, and has straightforward methods to log any application events.
 * 
 * @author - Vibhu Rajeev, Keshav Gupta - Polygon Technology
 */
export class Logger {
    /**
     * @static
     * Create method must first be called before using the logger. It creates a singleton, which will then 
     * be referred to throughout the application. 
     * 
     * @param {LoggerConfig} config - Logger configuration to overwrite winston configs and define sentry + datadog endpoints.
     */
    static create(config: LoggerConfig) {
        if (!logger) {
            logger = winston.createLogger(Object.assign({
                format: winston.format.combine(
                    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
                    winston.format.colorize({
                        all: true,
                        colors: {
                            error: "red",
                            warn: "yellow",
                            info: "green",
                            debug: "white",
                        }
                    }),
                    winston.format.printf(
                        (info: any) => `${info.timestamp} ${info.level}: ${info.message}`,
                    ),
                ),
                transports: [
                    new winston.transports.Console({
                        level: config.console?.level || "info"
                    }),
                    new Sentry(
                        {  
                            sentry: {
                                dsn: config.sentry?.dsn,
                                environment: config.sentry?.environment || "development"
                            },
                            level: config.sentry?.level || "error",
                        }
                    ),
                    new winston.transports.Http(
                        {
                            host: "http-intake.logs.datadoghq.com",
                            path: "/api/v2/logs?dd-api-key=" + config.datadog?.api_key + "&ddsource=nodejs&service=" + config.datadog?.service_name,
                            ssl: true
                        }
                    ),
                ]
            },
                config.winston
            ));
        }
    }

    /**
     * @static
     * Method to log for level - "info", this should not be called if it has been custom levels are 
     * set which does not include "info"
     * 
     * @param {string|object} message - String or object to log.
     */
    static info(message: string | object): void {
        if (typeof message === "string") {
            logger?.info(message);
        } else {
            logger?.info(JSON.stringify(message));
        }
    }

    /**
     * @static
     * Method to log for level - "debug", this should not be called if it has been custom levels are 
     * set which does not include "debug"
     * 
     * @param {string|object} message - String or object to log.
     */
    static debug(message: string | object): void {
        if (typeof message === "string") {
            logger?.debug(message);
        } else {
            logger?.debug(JSON.stringify(message));
        }
    }

    /**
     * @static
     * Method to log for level - "error", this should not be called if it has been custom levels are 
     * set which does not include "error"
     * 
     * @param {string|object} error - String or object to log.
     */
    static error(error: string | object): void {
        if (typeof error === "string") {
            logger?.error(error);
        } else {
            logger?.error(
                `${(error as Error).message ? `${(error as Error).message} : ` : ""}${JSON.stringify(error)}`
            );
        }
    }

    /**
     * @static
     * Method to log for level - "warn", this should not be called if it has been custom levels are 
     * set which does not include "warn"
     * 
     * @param {string|object} message - String or object to log.
     */
    static warn(message: string | object): void {
        if (typeof message === "string") {
            logger?.warn(message);
        } else {
            logger?.warn(JSON.stringify(message));
        }
    }

    /**
     * @static
     * Method to log for any level, which should be used to log all custom levels that may be added.
     * 
     * @param {string|object} message - String or object to log.
     */
    static log(level: string, message: string | object): void {
        if (typeof message === "string") {
            logger?.log(level, message);
        } else {
            logger?.log(level, JSON.stringify(message));
        }
    }
}
