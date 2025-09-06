/**
 * @file /src/repositories/userRepository.ts
 * @description Contains database operations pertaining to users
 */
import { ConflictError, InternalServerError } from "@/lib/errors";
import UserModel from "@/models/userModel";
import { IUser, IUserRepository, PaginatedUsers, RegisterUserDTO, UpdateUserDTO, UserFilters, UserQuery } from "@/lib/types";
import { Logger } from "pino";

/**
 * Generates a query from the given filters
 * @param {UserFilters} filters - Filters to use
 * @returns {UserQuery} Query to use in user fetching
 */
function generateQuery(filters: UserFilters): UserQuery {
    let query: UserQuery = {
        firstName: null,
        lastName: null,
        email: null
    };

    filters.firstName ? query.firstName = new RegExp(filters.firstName, 'i') : null;
    filters.lastName ? query.lastName = new RegExp(filters.lastName, 'i') : null;
    filters.email ? query.email = new RegExp(filters.email, 'i') : null;

    return query;
}

/**
 * The user repository class
 */
export class UserRepository implements IUserRepository {
    // Add a logger
    constructor(private readonly logger: Logger) { }

    async findByEmail(email: string): Promise<IUser | null> {
        try {
            // Try and find by email
            const user = await UserModel.findOne({ email: email }).lean<IUser>();
            // If no user is found, return null
            if (!user) {
                return null;
            }
            // Else return the user
            return user;
        } catch (error) {
            // Log the error and throw an error
            this.logger.error({ error, email }, `Failed to fetch user by email: ${error}`);
            throw new InternalServerError("Failed to fetch user by email");
        }
    }

    async create(data: RegisterUserDTO): Promise<IUser> {
        try {
            return await UserModel.create(data);
        } catch (error: any) {
            if (error.code === 11000) { // MongoDB conflict error
                this.logger.warn({ email: data.email }, `Conflict: User with email already exists`);
                throw new ConflictError("A user with this email already exists");
            }
            // Log the error and throw an error
            this.logger.error({ error }, `Failed creating a user: ${error}`);
            throw new InternalServerError("Failed creating a user");
        }
    }

    async delete(id: string): Promise<IUser | null> {
        try {
            // Find, delete and return the user. Will return null if failed to find said user
            return await UserModel.findByIdAndDelete(id);
        } catch (error) {
            // Log the error and throw an error
            this.logger.error({ error, id }, `Failed deleting user with the ID ${id}: ${error}`);
            throw new InternalServerError("Failed deleting user");
        }
    }

    async update(id: string, data: UpdateUserDTO): Promise<IUser | null> {
        try {
            // Update user
            return await UserModel.findByIdAndUpdate(id, data).lean<IUser>();
        } catch (error) {
            // Log the error and throw an error
            this.logger.error({ error, id }, `Failed updating the user with ID ${id}: ${error}`);
            throw new InternalServerError("Failed updating user");
        }
    }

    async findById(id: string): Promise<IUser | null> {
        try {
            // Fetch the user
            const user = await UserModel.findById(id).select("-password").lean<IUser>();

            // If the user isn't found return null
            if (!user) {
                return null;
            }

            // Return the user
            return user;
        } catch (error) {
            // Log the error and throw an error
            this.logger.error({ error }, `Failed to fetch user with ID ${id}: ${error}`);
            throw new InternalServerError("Failed to fetch user");
        }
    }

    async findAll(filters: UserFilters): Promise<PaginatedUsers<IUser>> {
        try {
            const offset = (filters.pageNumber - 1) * filters.entryPerPage;
            const query = generateQuery(filters);

            // Fetch total count and users in parallel
            const [totalUsers, users] = await Promise.all([
                UserModel.countDocuments(query),
                UserModel.find(query)
                    .sort({
                        createdAt: filters.sortByCreated === "oldest" ? 1 : -1,
                        updatedAt: filters.sortByUpdated === "oldest" ? 1 : -1,
                    })
                    .limit(filters.entryPerPage)
                    .skip(offset)
                    .lean<IUser[]>(),
            ]);

            return {
                users: users,
                hasNext: offset + users.length < totalUsers,
                hasPrev: filters.pageNumber > 1,
                shownEntryCount: users.length,
            };
        } catch (error) {
            this.logger.error({ error, filters }, "Failed to fetch users");
            throw new InternalServerError("Failed to fetch users");
        }
    }

    async findByIdWithAuth(id: string): Promise<IUser | null> {
        try {
            // Fetch the user
            const user = await UserModel.findById(id).lean<IUser>();

            // If the user isn't found return null
            if (!user) {
                return null;
            }

            // Return the user
            return user;
        } catch (error) {
            this.logger.error({ error }, `Failed to fetch user with ID ${id}: ${error}`);
            throw new InternalServerError("Failed to fetch password");
        }
    }
}