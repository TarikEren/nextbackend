import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { ActingUser, IUser, IUserRepository, IUserService, PaginatedUsers, RegisterUserDTO, UpdateUserDTO, UserFilters } from "@/lib/types";
import { zChangePasswordSchema, zRegisterSchema, zUpdateUserSchema } from "@/lib/zodSchemas";
import { Logger } from "pino";
import * as bcrypt from "bcrypt";

export class UserService implements IUserService {
    constructor(private readonly userRepository: IUserRepository, private readonly logger: Logger) { }

    public async registerUser(data: RegisterUserDTO): Promise<Omit<IUser, "password">> {
        // Parse the data
        const validationResult = zRegisterSchema.safeParse(data);

        // Throw error if validation was unsuccessful
        if (!validationResult.success) {
            this.logger.warn({ error: validationResult.error.flatten().fieldErrors }, "Failed registrating user");
            throw new ValidationError("Invalid registration data provided")
        }

        // Check if email exists
        const emailExists = await this.userRepository.findByEmail(validationResult.data.email);

        // If so, throw error
        if (emailExists) {
            this.logger.warn({ email: validationResult.data.email }, "User registration error, existing email");
            throw new ConflictError("A user with this email already exists");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(validationResult.data.password, 10);

        // Create the new user
        const newUser = await this.userRepository.create({
            password: hashedPassword,
            email: validationResult.data.email,
            confirmPassword: data.confirmPassword,
            firstName: validationResult.data.firstName,
            lastName: validationResult.data.lastName,
            phoneNumber: validationResult.data.phoneNumber
        });

        // Log it 
        this.logger.info({ userId: newUser.id }, "User created successfully");

        // Strip the password and return it
        const { password: _, ...userToReturn } = newUser;
        return userToReturn;
    }

    public async updateUser(id: string, data: UpdateUserDTO, actingUser: ActingUser): Promise<Omit<IUser, "password"> | null> {
        if (actingUser.id !== id && !actingUser.isAdmin) {
            this.logger.warn({ actingUserId: actingUser.id, targetUserId: id }, "Unauthorized user update attempt");
            throw new UnauthorizedError("You are not authorized for this operation");
        }
        // Parse the data
        const validationResult = zUpdateUserSchema.safeParse(data);

        // If the validation wasn't successful throw error
        if (!validationResult.success) {
            this.logger.warn({ error: validationResult.error.flatten().fieldErrors }, "Failed updating user");
            throw new ValidationError("Invalid update data provided");
        }

        // Update the user
        const updatedUser = await this.userRepository.update(id, validationResult.data);
        // If no user is found, throw not found error
        if (!updatedUser) {
            throw new NotFoundError("User not found");
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
            throw new UnauthorizedError("You are not authorized to perform this operation");
        }

        // Validate the provided data
        const validationResult = zChangePasswordSchema.safeParse(data);
        // If failed log and throw error
        if (!validationResult.success) {
            this.logger.warn({ userId: id, actingUserId: actingUser.id, errors: validationResult.error.flatten().fieldErrors }, "Invalid data provided for password change");
            throw new ValidationError("Invalid password change data provided");
        }

        // Fetch the user with their password hash
        const user = await this.userRepository.findByIdWithAuth(id);

        // If somehow, we've failed to fetch the user or their password
        if (!user || !user.password) {
            this.logger.warn({ userId: id, actingUserId: actingUser.id }, "User not found");
            throw new NotFoundError("User not found");
        }

        // Check if the oldPassword matches the existing password
        const oldPasswordMatches = await bcrypt.compare(validationResult.data.oldPassword, user.password);
        if (!oldPasswordMatches) {
            this.logger.warn({ userId: id, actingUserId: actingUser.id }, "Incorrect password provided for password change");
            throw new UnauthorizedError("Passwords do not match");
        }

        const newPasswordHash = await bcrypt.hash(validationResult.data.newPassword, 10);
        await this.userRepository.update(id, { password: newPasswordHash });

        this.logger.info({ userId: id }, "Password successfully changed");

    }

    public async findUserByEmail(email: string, actingUser: ActingUser): Promise<Omit<IUser, "password"> | null> {
        // Check if the acting user is an admin, if not log and throw error
        if (!actingUser.isAdmin) {
            this.logger.warn({ actingUserId: actingUser.id, targetUserEmail: email }, "Unauthorized find user by email attempt");
            throw new UnauthorizedError("You are not authorized for this operation");
        }

        // Fetch the user
        const user = await this.userRepository.findByEmail(email);

        // Return the user
        return user;
    }

    public async deleteUser(id: string, actingUser: ActingUser): Promise<void> {
        // Check if the acting user is an admin, if not log and throw error
        if (!actingUser.isAdmin && actingUser.id !== id) {
            this.logger.warn({ actingUserId: actingUser.id, targetUserId: id }, "Unauthorized user delete attempt");
            throw new UnauthorizedError("You are not authorized for this operation");
        }
        // Delete the user
        const userToDelete = await this.userRepository.delete(id);

        // If no user found, log and throw error
        if (!userToDelete) {
            this.logger.warn({ userId: id, actingUserId: actingUser.id }, "User not found");
            throw new NotFoundError("User not found");
        }
    }

    public async findUserById(id: string, actingUser: ActingUser): Promise<Omit<IUser, "password"> | null> {
        // Check for authorization, log and throw error if failed.
        if (actingUser.id !== id && !actingUser.isAdmin) {
            this.logger.warn({ userId: id, actingUserId: actingUser.id }, "Unauthorized user fetch attempt")
            throw new UnauthorizedError("You are not authorized for this operation");
        }

        // Fetch the user
        const user = await this.userRepository.findById(id);

        // Return the user.
        return user;
    }

    public async findAllUsers(filters: UserFilters, actingUser: ActingUser): Promise<PaginatedUsers<Omit<IUser, "password">>> {
        // Check for authorization, throw error if failed
        if (!actingUser.isAdmin) {
            this.logger.warn({ actingUserId: actingUser.id }, "Unauthorized fetch all users attempt");
            throw new UnauthorizedError("You are not authorized for this operation");
        }

        // Fetch users with filters (No null check as the repo function already handles that situation)
        const users = await this.userRepository.findAll(filters);

        // Return the users
        return users;
    }
}