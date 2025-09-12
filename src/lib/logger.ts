import pino from 'pino';

// Create a stream object for pino-pretty
const prettyStream = require('pino-pretty')({
    colorize: true,
});

// Determine the logger configuration based on the environment
const loggerConfig = process.env.NODE_ENV !== 'production'
    ? // Development: Log human-readable output directly to the pretty stream
    pino(
        {
            level: process.env.LOG_LEVEL || 'debug', // Be more verbose in development
        },
        prettyStream
    )
    : // Production: Log as JSON to stdout for a logging service to ingest
    pino({
        level: process.env.LOG_LEVEL || 'info',
    });

const logger = loggerConfig;

export default logger;