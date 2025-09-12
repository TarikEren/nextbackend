import z from "zod";
import { FindByIdentifierOptions, PaginatedData } from "./global";
import { IUser } from "../models/user";
import { zChangePasswordSchema, zRegisterSchema, zUpdateUserSchema } from "@/lib/schemas/user";
import { ConflictError, InternalServerError } from "@/lib/errors";

/**
 * Interface for user query
 */
export interface UserQuery {
    firstName?: RegExp | null;
    lastName?: RegExp | null;
    email?: RegExp | null;
    deletedAt?: object | null;
}

/**
 * Interface for user filters
 */
export interface UserFilters {
    firstName: string;
    lastName: string;
    email: string;
    sortBy: "createdAt" | "updatedAt" | "firstName";
    sortOrder: "asc" | "desc";
    pageNumber: number;
    entryPerPage: 10 | 25 | 50 | 100;
    includeDeleted?: boolean;
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
     * @param {string} email - Email of the user to find
     * @param {FindByIdentifierOptions} options - Options to apply
     * @returns {IUser | null} The user object or null if not found.
     * @throws {InternalServerError}
     */
    findByEmail(email: string, options: FindByIdentifierOptions): Promise<IUser | null>;

    /**
     * Creates a new user in the database.
     * @param {RegisterUserDTO} data - The user data to save.
     * @returns {IUser} The newly created user.
     * @throws {InternalServerError}
     */
    create(data: RegisterUserDTO): Promise<IUser>;

    /**
     * Deletes the user with the given id
     * @param {string} id - ID of the user
     * @returns {IUser | null} The deleted user
     * @throws {InternalServerError}
     */
    delete(id: string): Promise<IUser | null>;

    /**
     * Updates the user with the provided ID
     * @param {string} id - ID of the user to find
     * @param {UpdateUserDTO} data - Data to update with
     * @returns {IUser | null} The updated user
     * @throws {InternalServerError}
     * @throws {ConflictError}
     */
    update(id: string, data: UpdateUserDTO): Promise<IUser | null>;

    /**
     * Finds a user with the given ID
     * @param {string} id - ID of the user to find
     * @param {FindByIdentifierOptions} options - Options to apply
     * @returns {IUser | null} The user
     */
    findById(id: string, options: FindByIdentifierOptions): Promise<IUser | null>;


    /**
     * Fetches all users
     * @param {UserFilters} filters - Filters for filtering
     * @returns {PaginatedData<IUser>} Paginated, filtered and sorted users
     * @throws {InternalServerError}
     */
    findAll(filters: UserFilters): Promise<PaginatedData<IUser>>;

    /**
     * Fetches a user with their password (Used for password changing; verifying whether their old password is the same as the provided one )
     * @param {string} id - ID of the user to change the password of
     * @param {FindByIdentifierOptions} options - Options to apply
     * @returns {IUser} The found user
     * @throws {InternalServerError}
     */
    findByIdWithAuth(id: string, options: FindByIdentifierOptions): Promise<IUser | null>;

    /**
     * Fetches a user with their email (Used for logging in)
     * @param {string} email - Email of the user to fetch
     * @param {FindByIdentifierOptions} options - Options to apply
     * @returns {IUser} The found user
     * @throws {InternalServerError}
     */
    findByEmailWithAuth(email: string, options: FindByIdentifierOptions): Promise<IUser | null>;

    /**
     * Changes the password of a given user
     * @param {string} id - ID of the user 
     * @param {string} data - The password data
     * @throws {InternalServerError}
     */
    changePassword(id: string, data: string): Promise<void>;
}
