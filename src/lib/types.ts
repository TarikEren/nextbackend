// TODO: Create /src/lib/types and split the types into multiple files in said directory
import mongoose from "mongoose";
import z from "zod";
import { zChangePasswordSchema, zRegisterSchema, zUpdateUserSchema, zUserSchema } from "./zodSchemas";

/**
 * ############### Model Related Interfaces ###############
 */
export enum acceptedCardBrands {
    Visa = "visa",
    MasterCard = "mastercard"
}

export interface IPaymentMethod {
    gatewayCustomerId: string;
    paymentMethodId: string;
    brand: string;
    last4: string;
    isDefault: boolean;
}

export interface IAddress {
    name: string;
    line1: string;
    line2: string;
    zipCode: string;
    city: string;
}

export interface IUserModel extends mongoose.Document {
    _id: mongoose.Types.ObjectId,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phoneNumber: string,
    savedCards: IPaymentMethod[];
    savedAddresses: IAddress[];
    savedProducts: mongoose.Schema.Types.ObjectId[];
    visitedProducts: mongoose.Schema.Types.ObjectId[];
    pastOrders: mongoose.Schema.Types.ObjectId[];
    userCart: mongoose.Schema.Types.ObjectId;
    messages: string[];
    isAdmin: boolean,
    emailVerified: boolean,
    createdAt: Date,
    updatedAt: Date
}

export interface ICategoryModel extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    isActive: boolean;
    image: string;
    parent: mongoose.Schema.Types.ObjectId;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IProductModel extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;           // For easier access or whatever
    sku: string;            // Stock keeping unit (OAK-DINING-TABLE)
    description: string;
    stock: number;          // Stock count
    isActive: Boolean;
    price: Number;
    reviewsCount: Number;
    reviewsSum: Number;
    salePrice: Number;
    dimensions: {
        height: Number;
        width: Number;
        depth: Number;
        unit: string;
    };
    weight: {
        value: Number;
        unit: string;
    };
    metaTitle: string,              // Fancy title (Ask AI for help) Use: "const pageTitle = product.metaTitle || `${product.name} | Woody's Wonders`;" to render the page title in /products/[slug]/
    metaDescription: string,        // Fancy description (Ask AI for help and how to utilise)
    images: [string],               // URL to the CDN which stores the image
    categoryId: mongoose.Schema.Types.ObjectId;
}

export interface ICartItem {
    product: IProductModel;
    count: number;
}

export interface ICartModel extends mongoose.Document {
    user: mongoose.Schema.Types.ObjectId;
    items: ICartItem[];
    subtotal: number;
}


/**
 * ############### Repository Related Interfaces ###############
 */

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

/**
 * Generic user interface
 */
export type IUser = z.infer<typeof zUserSchema>

// Data Transfer Object for registering a new user.
export type RegisterUserDTO = z.infer<typeof zRegisterSchema>;

// Data Transfer Object for updating a user
export type UpdateUserDTO = z.infer<typeof zUpdateUserSchema>;

// Data Transfer Object for changing a password
export type PasswordChangeDTO = z.infer<typeof zChangePasswordSchema>;

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
}

/**
 * ############### Service Related Interfaces ###############
*/

export interface ActingUser {
    id: string;
    isAdmin: boolean;
}

/**
 * @description Interface for the user repository to conform to
 */
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
}
