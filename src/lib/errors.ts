/**
 * @file /src/lib/errors.ts
 * @description Holds custom error definitions
 */

/**
 * Base AppError class which extends the standard TypeScript error class
 */
export class AppError extends Error {
    constructor(message: string) {
        super(message);
        // Set the prototype explicitly to allow for `instanceof` checks.
        Object.setPrototypeOf(this, new.target.prototype);

        // Maintains proper stack trace for where our error was thrown (only available on V8).
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
        this.name = this.constructor.name;
    }
}

/**
 * Represents a generic internal server error (e.g., couldn't connect to database).
 * Corresponds to HTTP 500.
 */
export class InternalServerError extends AppError {
    constructor(message: string = "Internal server error") {
        super(message);
    }
}

/**
 * Represents a "Not Found" error (e.g., entity not found in the database).
 * Corresponds to HTTP 404.
 */
export class NotFoundError extends AppError {
    constructor(entityName: string) {
        super(`${entityName} not found.`);
    }
}

/**
 * Represents a validation error (e.g., invalid input from a user).
 * Corresponds to HTTP 400.
 */
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Represents a conflict error (e.g., trying to create an entity that already exists).
 * Corresponds to HTTP 409.
 */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Represents an authentication or authorization error.
 * Corresponds to HTTP 401 (Unauthorized) or 403 (Forbidden).
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = "You are not authorized to perform this action.") {
        super(message);
    }
}

/**
 * Raised in case of an error arises encountered when authenticating
 */
export class AuthenticationError extends AppError {
    constructor(message: string) {
        super(message);
    }
}