import { AuthenticationError, ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { Logger } from "pino";
import * as bcrypt from "bcrypt";
import z from "zod";
import { IUserService } from "@/lib/types/services/user";
import { IUserRepository, ProviderUserDTO, RegisterUserDTO, UpdateUserDTO, UserFilters } from "@/lib/types/repositories/user";
import { IUser } from "@/lib/types/models/user";
import { ActingUser, ProtectedActions } from "@/lib/types/services/global";
import { PaginatedData } from "@/lib/types/repositories/global";
import { zChangePasswordSchema, zLoginSchema, zRegisterSchema, zUpdateUserSchema } from "@/lib/schemas/user";
import { ServiceUtils } from "./global";

export class UserService implements IUserService {
    constructor(private readonly userRepository: IUserRepository, private readonly logger: Logger) { }

    public async registerUser(data: RegisterUserDTO): Promise<Omit<IUser, "password">> {
        // Parse the data
        const validationResult = zRegisterSchema.safeParse(data);

        // Throw error if validation was unsuccessful
        if (!validationResult.success) {
            const errorTree = z.treeifyError(validationResult.error);
            this.logger.warn({ errors: errorTree.errors }, "Failed registrating user");
            throw new ValidationError("Geçersiz e-posta adresi veya şifre", errorTree);
        }
        try {
            // Omit the confirm password
            const { confirmPassword, ...createData } = validationResult.data;

            if (validationResult.data.password) {
                // Hash the password
                const hashedPassword = await bcrypt.hash(validationResult.data.password, 10);
                createData.password = hashedPassword;
            }

            // Create the new user
            const newUser = await this.userRepository.create(createData);

            // Log it 
            this.logger.info({ userId: newUser.id }, "User created successfully");

            // Strip the password and return it
            const { password: _, ...userToReturn } = newUser;
            return userToReturn;

        } catch (error) {
            this.logger.warn({ email: validationResult.data.email, error }, "User registration failed");
            throw error;
        }
    }

    public async updateUser(id: string, data: UpdateUserDTO, actingUser: ActingUser): Promise<Omit<IUser, "password"> | null> {
        if (actingUser.id !== id && !actingUser.isAdmin) {
            this.logger.warn({ actingUserId: actingUser.id, targetUserId: id }, "Unauthorized user update attempt");
            throw new UnauthorizedError("Bu işlem için yetkiniz yok");
        }
        // Parse the data
        const validationResult = zUpdateUserSchema.safeParse(data);

        // If the validation wasn't successful throw error
        if (!validationResult.success) {
            const errorTree = z.treeifyError(validationResult.error);
            this.logger.warn({ errors: errorTree.errors }, "Failed updating user");
            throw new ValidationError("Geçersiz güncelleme verisi");
        }

        // Update the user
        const updatedUser = await this.userRepository.update(id, validationResult.data);
        // If no user is found, throw not found error
        if (!updatedUser) {
            throw new NotFoundError("Kullanıcı bulunamadı");
        }

        // Log the process
        this.logger.info({ userId: updatedUser.id }, "User updated");

        // Omit the password and return the rest
        const { password: _, ...userToReturn } = updatedUser;
        return userToReturn;
    }

    public async changePassword(id: string, data: { oldPassword: string, newPassword: string, confirmPassword: string }, actingUser: ActingUser): Promise<void> {
        // If the acting user is not the user whos password is being changed (Users can only change their own passwords)
        if (id !== actingUser.id) {
            // Log it and throw unauthorized error
            this.logger.warn({ userId: id, actingUserId: actingUser.id }, "Unauthorized password change attempt");
            throw new UnauthorizedError("Bu işlemi yapmak için yetkiniz yok");
        }

        // Validate the provided data
        const validationResult = zChangePasswordSchema.safeParse(data);
        // If failed log and throw error
        if (!validationResult.success) {
            const errorTree = z.treeifyError(validationResult.error);
            this.logger.warn({ userId: id, actingUserId: actingUser.id, errors: errorTree.errors }, "Invalid data provided for password change");
            throw new ValidationError("Geçersiz veri");
        }

        // Fetch the user with their password hash 
        const user = await this.userRepository.findByIdWithAuth(id, { includeDeleted: false });

        // If somehow, we've failed to fetch the user or their password
        if (!user || !user.password) {
            this.logger.warn({ userId: id, actingUserId: actingUser.id }, "User not found");
            throw new NotFoundError("Kullanıcı bulunamadı");
        }

        // Check if the oldPassword matches the existing password
        const oldPasswordMatches = await bcrypt.compare(validationResult.data.oldPassword, user.password);
        if (!oldPasswordMatches) {
            this.logger.warn({ userId: id, actingUserId: actingUser.id }, "Incorrect password provided for password change");
            throw new UnauthorizedError("Yanlış şifre");
        }

        const newPasswordHash = await bcrypt.hash(validationResult.data.newPassword, 10);
        await this.userRepository.changePassword(id, newPasswordHash);

        this.logger.info({ userId: id }, "Password successfully changed");

    }

    public async findUserByEmail(email: string, actingUser: ActingUser): Promise<Omit<IUser, "password"> | null> {
        // Check if the acting user is an admin, if not log and throw error
        if (!actingUser.isAdmin) {
            this.logger.warn({ actingUserId: actingUser.id, targetUserEmail: email }, "Unauthorized find user by email attempt");
            throw new UnauthorizedError("Bu işlemi yapmak için yetkiniz yok");
        }

        // Fetch the user
        const user = await this.userRepository.findByEmail(email, { includeDeleted: true });
        // Throw error if not found
        if (!user) {
            throw new NotFoundError("Kullanıcı bulunamadı");
        }
        // Return the user
        return user;
    }

    public async deleteUser(id: string, actingUser: ActingUser): Promise<void> {
        // Check if the acting user is an admin, if not log and throw error
        if (!actingUser.isAdmin && actingUser.id !== id) {
            this.logger.warn({ actingUserId: actingUser.id, targetUserId: id }, "Unauthorized user delete attempt");
            throw new UnauthorizedError("Bu işlemi yapmak için yetkiniz yok");
        }
        // Delete the user
        const userToDelete = await this.userRepository.delete(id);

        // If no user found, log and throw error
        if (!userToDelete) {
            this.logger.warn({ userId: id, actingUserId: actingUser.id }, "User not found");
            throw new NotFoundError("Kullanıcı bulunamadı");
        }
    }

    public async findUserById(id: string, actingUser: ActingUser): Promise<Omit<IUser, "password"> | null> {
        // Check for authorization, log and throw error if failed.
        if (actingUser.id !== id && !actingUser.isAdmin) {
            this.logger.warn({ userId: id, actingUserId: actingUser.id }, "Unauthorized user fetch attempt")
            throw new UnauthorizedError("Bu işlemi yapmak için yetkiniz yok");
        }

        // Fetch the user.
        const user = await this.userRepository.findById(id, { includeDeleted: true });

        // Throw error if not found
        if (!user) {
            throw new NotFoundError("Kullanıcı bulunamadı");
        }

        return user;
    }

    public async findAllUsers(filters: UserFilters, actingUser: ActingUser): Promise<PaginatedData<Omit<IUser, "password">>> {
        // Check for authorization, throw error if failed
        ServiceUtils.ensureAdmin(this.logger, actingUser, ProtectedActions.FetchAllUsers);

        if (filters.includeDeleted === undefined) {
            filters.includeDeleted = true;
        }

        // Fetch users with filters and return (No null check as the repo function already handles that situation)
        return await this.userRepository.findAll(filters);
    }

    public async authenticateUser(credentials: z.infer<typeof zLoginSchema>): Promise<Omit<IUser, "password">> {
        // Fetch user using their email with their password
        const user = await this.userRepository.findByEmailWithAuth(credentials.email, { includeDeleted: false });
        if (!user || !user.password) {
            this.logger.warn({ email: credentials.email }, "Authentication failed, user not found or has no password");
            throw new AuthenticationError("Geçersiz e-posta veya şifre");
        }

        if (user.provider === "oauth") {
            this.logger.warn({ email: credentials.email }, "Authentication failed, oauth user tried to login with email");
            throw new ValidationError("Geçersiz e-posta veya şifre");
        }

        // Check if the passwords match
        const passwordsMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordsMatch) {
            // If not, log and throw an error
            this.logger.warn({ email: credentials.email, password: credentials.password }, "Authentication failed, invalid password");
            throw new AuthenticationError("Geçersiz e-posta veya şifre");
        }

        // Log and return the user after omitting their password
        this.logger.info({ email: credentials.email }, `User has successfully authenticated`);
        const { password: _, ...userToReturn } = user;
        return userToReturn;
    }

    public async findOrCreateUserFromProvider(data: ProviderUserDTO): Promise<Omit<IUser, "password">> {
        // Fetch the user
        const existingUser = await this.userRepository.findByEmail(data.email, { includeDeleted: false });

        // If not found, create it
        if (!existingUser) {
            return await this.userRepository.create({
                email: data.email,
                password: "",
                confirmPassword: "",
                emailVerified: true,
                provider: "oauth"
            });
        } else {
            return existingUser;
        }
    }
}