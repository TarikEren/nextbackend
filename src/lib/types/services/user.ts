import { PaginatedData } from "../repositories/global";
import { ProviderUserDTO, RegisterUserDTO, UpdateUserDTO, UserFilters } from "../repositories/user";
import { ActingUser } from "./global";
import z from "zod";
import { IUser } from "../models/user";
import { zLoginSchema } from "@/lib/schemas/user";
import { NotFoundError } from "@/lib/errors";

export interface IUserService {
    /**
     * Finds a user by their email address.
     * @param {string} email - Email of the user to find
     * @param {ActingUser} actingUser - User making the request
     * @returns {IUser | null} The user object or null if not found.
     * @throws {NotFoundError}
     */
    findUserByEmail(email: string, actingUser: ActingUser): Promise<Omit<IUser, "password"> | null>;

    /**
     * Fetch user from the database using their email, create if it doesn't exist
     * @param {ProviderUserDTO} data - Data fetched from the provider
     * @returns {Omit<IUser, "password">} The existing or newly created user
     */
    findOrCreateUserFromProvider(data: ProviderUserDTO): Promise<Omit<IUser, "password">>;

    /**
     * Finds a user with the given ID
     * @param {string} id - ID of the user to find
     * @param {ActingUser} actingUser - The user making the request
     * @returns {IUser | null} The user
     * @throws {NotFoundError}
     */
    findUserById(id: string, actingUser: ActingUser): Promise<Omit<IUser, "password"> | null>;

    /**
     * Fetches all users
     * @param {UserFilters} filters - Filters for filtering
     * @returns {PaginatedData} All users
     * @throws {NotFoundError}
     */
    findAllUsers(filters: UserFilters, actingUser: ActingUser): Promise<PaginatedData<Omit<IUser, "password">>>;

    /**
     * Creates a user on the database
     * @param data - Data to use whilst registering the user
     * @returns {IUser | null} Created user
     */
    registerUser(data: RegisterUserDTO): Promise<Omit<IUser, "password">>;

    /**
     * Deletes the user with the given id
     * @param id - ID of the user
     * @returns {IUser | null} The deleted user
     */
    deleteUser(id: string, actingUser: ActingUser): Promise<void>;

    /**
     * Updates a user with the given data
     * @param id - ID of the user to update
     * @param data - Update data
     * @param actingUser - The session data of the user performing the action
     * @returns {Omit<IUser, "password">} User object without the password field
     */
    updateUser(id: string, data: UpdateUserDTO, actingUser: ActingUser): Promise<Omit<IUser, "password"> | null>;

    /**
     * Changes the password of a user
     * @param id - ID of the user to change the password of
     * @param data - Data to use in the operation
     * @param actingUser - Session data of the user
     */
    changePassword(id: string, data: { oldPassword: string, newPassword: string, confirmPassword: string }, actingUser: ActingUser): Promise<void>;

    /**
     * Authenticates user if they provide the correct credentials
     * @param credentials - Credential data
     */
    authenticateUser(credentials: z.infer<typeof zLoginSchema>): Promise<Omit<IUser, "password">>;
}
