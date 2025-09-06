import z from "zod";
import { zLoginSchema } from "../zodSchemas";
import { IUser } from "./models";
import { PaginatedUsers, ProviderUserDTO, RegisterUserDTO, UpdateUserDTO, UserFilters } from "./repositories";

export interface ActingUser {
    id: string;
    isAdmin: boolean;
}

export interface IUserService {
    /**
     * Finds a user by their email address.
     * @returns {IUser | null} The user object or null if not found.
     */
    findUserByEmail(email: string, actingUser: ActingUser): Promise<Omit<IUser, "password"> | null>;

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
     * Finds a user with the given ID
     * @param id - ID of the user to find
     * @returns {IUser | null} The user
     */
    findUserById(id: string, actingUser: ActingUser): Promise<Omit<IUser, "password"> | null>;


    /**
     * Fetches all users
     * @param {UserFilters} filters - Filters for filtering
     * @returns {PaginatedUsers} All users
     * @throws {NotFoundError}
     */
    findAllUsers(filters: UserFilters, actingUser: ActingUser): Promise<PaginatedUsers<Omit<IUser, "password">>>;

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

    /**
     * Fetch user from the database using their email, create if it doesn't exist
     * @param {ProviderUserDTO} data - Data fetched from the provider
     */
    findOrCreateUserFromProvider(data: ProviderUserDTO): Promise<Omit<IUser, "password">>;
}
