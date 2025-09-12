/**
 * Interface for paginated response
 */
export interface PaginatedData<T> {
    data: T[];
    hasNext: boolean;
    hasPrev: boolean;
    shownEntryCount: number;
}

export interface FindByIdentifierOptions {
    includeDeleted?: boolean;
}