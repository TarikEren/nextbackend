import pino from 'pino';

// Configure the logger
const logger = pino({
    level: process.env.LOG_LEVEL || 'info', // Default to 'info'
    transport: process.env.NODE_ENV !== 'production'
        ? {
            // Use pino-pretty for human-readable logs in development
            target: 'pino-pretty',
            options: {
                colorize: true,
            },
        }
        : undefined, // In production, log as JSON to stdout
});

export default logger;