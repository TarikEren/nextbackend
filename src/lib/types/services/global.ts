/**
 * Contains types, interfaces and enums that are used in more than one service files
 */

export interface ActingUser {
    id: string;
    isAdmin: boolean;
}

/**
 * Enum for all protected actions that only the admin have permissions for
 * Mainly used for logging
 */
export enum ProtectedActions {
    Create = "create",
    Update = "update",
    Delete = "delete",
    Restore = "restore",
    FetchAllUsers = "fetch all users"
}
