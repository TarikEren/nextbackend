import { zCreateCategorySchema, zUpdateCategorySchema } from "@/lib/schemas/category";
import z from "zod";
import { ICategory } from "../models/category";
import { FindByIdentifierOptions, PaginatedData } from "./global";
import { ConflictError, InternalServerError } from "@/lib/errors";

/**
 * Category queries
 */
export interface CategoryQuery {
    name?: RegExp;
    parent?: string | null;
    deletedAt?: object | null;
}

/**
 * Available filters
 */
export interface CategoryFilters {
    name?: string;
    parent?: string | null;
    sortBy?: "name" | "createdAt";
    sortOrder?: "asc" | "desc";
    pageNumber: number;
    entryPerPage: 10 | 20 | 50;
    includeDeleted?: boolean;
}

export type CreateCategoryDTO = z.infer<typeof zCreateCategorySchema>;

export type UpdateCategoryDTO = z.infer<typeof zUpdateCategorySchema>;

export interface ICategoryRepository {
    /**
     * Creates a category
     * @param {CreateCategoryDTO} data - Data to create the category with
     * @returns {ICategory} The created category
     * @throws {InternalServerError}
     */
    create(data: CreateCategoryDTO): Promise<ICategory | null>;

    /**
     * Updates a category
     * @param {UpdateCategoryDTO} data - Update data
     * @returns {ICategory} The updated category
     * @throws {InternalServerError}
     */
    update(id: string, data: UpdateCategoryDTO): Promise<ICategory | null>;

    /**
     * Deletes a category
     * @param {string} id - ID of the category to delete
     * @returns {ICategory} The deleted category
     * @throws {InternalServerError}
     */
    delete(id: string): Promise<ICategory | null>;

    /**
     * Restores a deleted category
     * @param {string} id - ID of the category to restore
     * @returns {ICategory} The restored category
     * @throws {InternalServerError}
     * @throws {ConflictError}
     */
    restore(id: string): Promise<ICategory | null>;

    /**
     * Finds a category by ID
     * @param {string} id - ID of the category to find
     * @param {FindByIdentifierOptions} options - Finding options
     * @returns {ICategory} The found category
     * @throws {InternalServerError}
     */
    findById(id: string, options: FindByIdentifierOptions): Promise<ICategory | null>;

    /**
     * Finds all categories with the filters
     * @param {CategoryFilters} filters - Filters to apply
     * @returns {PaginatedData<ICategory>} Paginated, filtered and sorted categories
     * @throws {InternalServerError}
     */
    findAll(filters: CategoryFilters): Promise<PaginatedData<ICategory>>;
}