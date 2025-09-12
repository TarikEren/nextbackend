/**
 * Contains types, interfaces and enums that are used by more than one repositories
 */

/**
 * Interface for paginated response
 */
export interface PaginatedData<T> {
    data: T[];
    hasNext: boolean;
    hasPrev: boolean;
    shownEntryCount: number;
}

/**
 * Options for finding any data
 */
export interface FindByIdentifierOptions {
    includeDeleted?: boolean;
}