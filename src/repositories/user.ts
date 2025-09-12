/**
 * @file /src/repositories/userRepository.ts
 * @description Contains database operations pertaining to users
 */
import { ConflictError, InternalServerError } from "@/lib/errors";
import { IUser } from "@/lib/types/models/user";
import { FindByIdentifierOptions, PaginatedData } from "@/lib/types/repositories/global";
import { IUserRepository, RegisterUserDTO, UpdateUserDTO, UserFilters, UserQuery } from "@/lib/types/repositories/user";
import UserModel from "@/models/user";
import { SortOrder } from "mongoose";
import { Logger } from "pino";

/**
 * Generates a query from the given filters
 * @param {UserFilters} filters - Filters to use
 * @returns {UserQuery} Query to use in user fetching
 */
function generateQuery(filters: UserFilters): UserQuery {
    let query: UserQuery = {};

    if (filters.firstName) {
        query.firstName = new RegExp(filters.firstName, 'i');
    }

    if (filters.lastName) {
        query.lastName = new RegExp(filters.lastName, 'i');
    }

    if (filters.email) {
        query.email = new RegExp(filters.email, 'i');
    }

    if (filters.includeDeleted !== true) {
        // includeDeleted can be false, null or undefined as well
        query.deletedAt = null;
    }


    return query;
}

/**
 * The user repository class
 */
export class UserRepository implements IUserRepository {
    constructor(private readonly logger: Logger) { }

    async findByEmail(email: string, options: FindByIdentifierOptions): Promise<IUser | null> {
        try {
            // Building a query
            const query: any = { email: email };
            if (!options.includeDeleted) {
                query.deletedAt = null;
            }
            return await UserModel.findOne(query).lean<IUser>();
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
            throw new InternalServerError("Kullanıcı oluşturulamadı");
        }
    }

    async delete(id: string): Promise<IUser | null> {
        try {
            // Find, delete and return the user. Will return null if failed to find said user
            return await UserModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true }).lean<IUser>();
        } catch (error) {
            // Log the error and throw an error
            this.logger.error({ error, id }, `Failed deleting user with the ID ${id}: ${error}`);
            throw new InternalServerError("Kullanıcı silinemedi");
        }
    }

    async update(id: string, data: UpdateUserDTO): Promise<IUser | null> {
        try {
            // Update user
            return await UserModel.findByIdAndUpdate(id, data, { new: true }).lean<IUser>();
        } catch (error: any) {
            if (error.code === 11000) {
                this.logger.warn({ email: data.email }, "Conflicting emails");
                throw new ConflictError("Kullanıcı çakışmadan ötürü düzenlenemedi, başka bir email deneyin");
            }
            // Log the error and throw an error
            this.logger.error({ error, id }, `Failed updating the user with ID ${id}: ${error}`);
            throw new InternalServerError("Kullanıcı güncellenemedi, lütfen daha sonra tekrar deneyin");
        }
    }

    async changePassword(id: string, data: string): Promise<void> {
        try {
            await UserModel.findByIdAndUpdate(id, { password: data }).lean<IUser>();
        } catch (error: any) {
            this.logger.error({ error, id }, `Failed updating the user (${id}) password: ${error}`);
            throw new InternalServerError("Şifre değiştirilemedi, lütfen daha sonra tekrar deneyin");
        }
    }

    async findById(id: string, options: FindByIdentifierOptions): Promise<IUser | null> {
        try {
            // Building a query
            const query: any = { _id: id };
            if (!options.includeDeleted) {
                query.deletedAt = null;
            }

            // Fetch the user
            return await UserModel.findOne(query).lean<IUser>();
        } catch (error) {
            // Log the error and throw an error
            this.logger.error({ error }, `Failed to fetch user with ID ${id}: ${error}`);
            throw new InternalServerError("Kullanıcı getirilemedi, lütfen daha sonra tekrar deneyin");
        }
    }

    async findAll(filters: UserFilters): Promise<PaginatedData<IUser>> {
        try {
            const offset = (filters.pageNumber - 1) * filters.entryPerPage;
            const query = generateQuery(filters);
            const sortBy = filters.sortBy || 'createdAt';
            const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
            const sortOptions: Record<string, SortOrder> = { [sortBy]: sortOrder };

            // Fetch total count and users in parallel
            const [totalUsers, users] = await Promise.all([
                UserModel.countDocuments(query),
                UserModel.find(query)
                    .sort(sortOptions)
                    .limit(filters.entryPerPage)
                    .skip(offset)
                    .lean<IUser[]>(),
            ]);

            return {
                data: users,
                hasNext: offset + users.length < totalUsers,
                hasPrev: filters.pageNumber > 1,
                shownEntryCount: users.length,
            };
        } catch (error) {
            this.logger.error({ error, filters }, "Failed to fetch users");
            throw new InternalServerError("Kullanıcılar getirilemedi, lütfen daha sonra tekrar deneyin");
        }
    }

    async findByIdWithAuth(id: string, options: FindByIdentifierOptions): Promise<IUser | null> {
        try {
            // Building a query
            const query: any = { _id: id };
            if (!options.includeDeleted) {
                query.deletedAt = null;
            }
            // Fetch the user
            return await UserModel.findOne(query).select("+password").lean<IUser>();

        } catch (error) {
            this.logger.error({ error }, `Failed to fetch user with ID ${id}: ${error}`);
            throw new InternalServerError("Failed to fetch password");
        }
    }

    async findByEmailWithAuth(email: string, options: FindByIdentifierOptions): Promise<IUser | null> {
        try {
            // Building a query
            const query: any = { email: email };
            if (!options.includeDeleted) {
                query.deletedAt = null;
            }
            // Fetch the user
            const user = await UserModel.findOne(query).select("+password").lean<IUser>();

            // If the user isn't found return null
            if (!user) {
                return null;
            }

            // Return the user
            return user;
        } catch (error) {
            this.logger.error({ error }, `Failed to fetch user with email: ${email}: ${error}`);
            throw new InternalServerError("Lütfen daha sonra tekrar deneyin");
        }
    }

    async restore(id: string): Promise<IUser | null> {
        try {
            // Check if the user to be restored is deleted in the first place
            const userToRestore = await UserModel.findOne({ _id: id, deletedAt: { $ne: null } }).lean<IUser>();
            if (!userToRestore) return null;

            const conflictExists = await UserModel.findOne({
                _id: { $ne: id },
                deletedAt: null,
                email: userToRestore.email
            }).lean<IUser>();

            if (conflictExists) {
                this.logger.warn({ email: userToRestore.email }, "Failed restoring user due to email conflict");
                throw new ConflictError("Bu e-posta adresine sahip başka bir kullanıcı var, kullanıcı yeniden aktifleştirilemiyor");
            }

            return await UserModel.findByIdAndUpdate(id, { deletedAt: null }, { new: true }).lean<IUser>();

        } catch (error: any) {
            if (error instanceof ConflictError) throw error; // Re-throw known errors
            this.logger.error({ error, id }, `Failed to restore user: ${error}`);
            throw new InternalServerError("Kullanıcı geri yüklenemedi");
        }
    }
}