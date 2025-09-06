import z from "zod";
import { zChangePasswordSchema, zRegisterSchema, zUpdateUserSchema } from "../zodSchemas";
import { IUser } from "./models";

/**
 * Interface for user filters
 */
export interface UserFilters {
    firstName: string;
    lastName: string;
    email: string;
    sortByCreated: "newest" | "oldest";
    sortByUpdated: "newest" | "oldest";
    pageNumber: number;
    entryPerPage: 10 | 20 | 50;
}

/**
 * Interface for user query
 */
export interface UserQuery {
    firstName: RegExp | null;
    lastName: RegExp | null;
    email: RegExp | null;
}

/**
 * Interface for paginated user response
 */
export interface PaginatedUsers<T> {
    users: T[];
    hasNext: boolean;
    hasPrev: boolean;
    shownEntryCount: number;
}


// Data Transfer Object for registering a new user.
export type RegisterUserDTO = z.infer<typeof zRegisterSchema>;

// Data Transfer Object for updating a user
export type UpdateUserDTO = z.infer<typeof zUpdateUserSchema>;

// Data Transfer Object for changing a password
export type PasswordChangeDTO = z.infer<typeof zChangePasswordSchema>;

export interface ProviderUserDTO {
    email: string;
    firstName?: string;
    lastName?: string;
}

/**
 * Interface for the user repository to conform to
 */
export interface IUserRepository {
    /**
     * Finds a user by their email address.
     * @returns {IUser | null} The user object or null if not found.
     */
    findByEmail(email: string): Promise<IUser | null>;

    /**
     * Creates a new user in the database.
     * @param data - The user data to save.
     * @returns {IUser} The newly created user.
     */
    create(data: RegisterUserDTO): Promise<IUser>;

    /**
     * Deletes the user with the given id
     * @param id - ID of the user
     * @returns {IUser | null} The deleted user
     */
    delete(id: string): Promise<IUser | null>;

    /**
     * Updates the user with the provided ID
     * @param id - ID of the user to find
     * @param data - Data to update with
     * @returns {IUser | null} The updated user
     */
    update(id: string, data: Partial<IUser>): Promise<IUser | null>;

    /**
     * Finds a user with the given ID
     * @param id - ID of the user to find
     * @returns {IUser | null} The user
     */
    findById(id: string): Promise<IUser | null>;


    /**
     * Fetches all users
     * @param {UserFilters} filters - Filters for filtering
     * @returns {PaginatedUsers} All users
     * @throws {NotFoundError}
     */
    findAll(filters: UserFilters): Promise<PaginatedUsers<IUser>>;

    /**
     * Fetches a user with their password (Used for password changing; verifying whether their old password is the same as the provided one )
     * @param {string} id - ID of the user to change the password of
     */
    findByIdWithAuth(id: string): Promise<IUser | null>;

    /**
     * Fetches a user with their email (Used for logging in)
     * @param {string} email - Email of the user to fetch
     */
    findByEmailWithAuth(email: string): Promise<IUser | null>
}
