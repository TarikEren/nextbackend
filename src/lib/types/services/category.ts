import { ConflictError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { ICategory } from "../models/category";
import { CategoryFilters, CreateCategoryDTO, UpdateCategoryDTO } from "../repositories/category";
import { ActingUser } from "./global";
import { FindByIdentifierOptions, PaginatedData } from "../repositories/global";

export interface ICategoryService {
    /**
     * Creates a category with the given data
     * @param {CreateCategoryDTO} data - Data to create the category with
     * @param {ActingUser} actingUser - The user making the request
     * @returns {ICategory | null} - The created category
     * @throws {UnauthorizedError}
     * @throws {ConflictError}
     */
    createCategory(data: CreateCategoryDTO, actingUser: ActingUser): Promise<ICategory | null>;

    /**
     * Updates a category with the given data
     * @param {string} id - ID of the category to update
     * @param {UpdateCategoryDTO} data - Data to update the category with
     * @param {ActingUser} actingUser - The user making the request
     * @throws {UnauthorizedError}
     * @throws {ConflictError}
     * @throws {NotFoundError}
     */
    updateCategory(id: string, data: UpdateCategoryDTO, actingUser: ActingUser): Promise<ICategory | null>;

    /**
     * Deletes a category with the given ID
     * @param {string} id - ID of the category to delete
     * @param {ActingUser} actingUser - The user making the request
     * @returns {ICategory | null} - The deleted category
     * @throws {UnauthorizedError}
     * @throws {NotFoundError}
     * @throws {ConflictError}
     */
    deleteCategory(id: string, actingUser: ActingUser): Promise<ICategory | null>;

    /**
     * Restores the category with the given ID
     * @param {string} id - ID of the category to restore
     * @param {ActingUser} actingUser - The user who made the request
     * @returns {ICategory | null} The restored category
     * @throws {UnauthorizedError}
     * @throws {ConflictError}
     * @throws {NotFoundError}
     */
    restoreCategory(id: string, actingUser: ActingUser): Promise<ICategory | null>;

    /**
     * Finds a category by id
     * @param {string} id - ID of the category to find
     * @param {FindByIdentifierOptions} options - Options to apply
     * @param {ActingUser} actingUser - The user making the request
     * @returns {ICategory | null} The found category
     * @throws {NotFoundError}
     */
    findCategoryById(id: string, options: FindByIdentifierOptions, actingUser: ActingUser): Promise<ICategory | null>;

    /**
     * Finds a category by slug
     * @param {string} slug - Slug of the category to find
     * @param {FindByIdentifierOptions} options - Options to apply
     * @param {ActingUser} actingUser - The user making the request
     * @returns {ICategory | null} The found category
     * @throws {NotFoundError}
     */
    findCategoryBySlug(slug: string, options: FindByIdentifierOptions, actingUser: ActingUser): Promise<ICategory | null>;

    /**
     * Finds all categories based on the filters
     * @param {CategoryFilters} filters - Filters to be applied
     * @param {ActingUser} actingUser - The user making the request
     * @returns {PaginatedData<ICategory>} Paginated category data
     */
    findAllCategories(filters: CategoryFilters, actingUser: ActingUser): Promise<PaginatedData<ICategory>>;
}