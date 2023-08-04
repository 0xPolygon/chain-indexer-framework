import winston from "winston";

export interface LoggerConfig {
    sentry?: {
        dsn?: string,
        level?: string, 
        environment?: string
    }
    datadog?: {
        service_name?: string,
        api_key?: string
    }
    console?: {
        level?: string
    }
    winston?: winston.LoggerOptions;
}
