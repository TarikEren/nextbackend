import z from "zod";
import { FindByIdentifierOptions, PaginatedData } from "./global";
import { IProduct } from "../models/product";
import { zCreateProductSchema, zUpdateProductSchema } from "@/lib/schemas/product";
import { ConflictError, InternalServerError } from "@/lib/errors";

/**
 * Interface for user query
 */
export interface ProductQuery {
    name?: RegExp | null;
    categoryId?: string;
    stock?: { $gt: number };
    price?: { $gte?: number; $lte?: number };
    deletedAt?: object | null;
}

/**
 * Interface for product filters
 */
export interface ProductFilters {
    pageNumber: number;
    entryPerPage: 10 | 25 | 50 | 100;
    name?: string;
    categoryId?: string;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    includeDeleted?: boolean;
}
// Data Transfer Object for creating a new product
export type CreateProductDTO = z.infer<typeof zCreateProductSchema>;

// Data Transfer Object for updating a product
export type UpdateProductDTO = z.infer<typeof zUpdateProductSchema>;

/**
 * Interface for the product repository to conform to
 */
export interface IProductRepository {
    /**
     * Creates a new product in the database
     * @param {CreateProductDTO} data - Data to create the product with
     * @returns {IProduct} The created product
     * @throws {InternalServerError}
     */
    create(data: CreateProductDTO): Promise<IProduct>;

    /**
     * Updates a product in the database
     * @param {string} id - ID of the product to update
     * @param {UpdateProductDTO} data - Data to update the product with
     * @returns {IProduct} The updated product
     * @throws {InternalServerError}
     * @throws {ConflictError}
     */
    update(id: string, data: UpdateProductDTO): Promise<IProduct | null>;

    /**
     * Finds a product by its ID
     * @param {string} id - ID of the product to find
     * @param {FindByIdentifierOptions} options - Options to apply
     * @returns {IProduct} The found product
     * @throws {InternalServerError}
     */
    findById(id: string, options: FindByIdentifierOptions): Promise<IProduct | null>;

    /**
     * Finds all products
     * @param {ProductFilters} filters - Filters for filtering
     * @returns {PaginatedData} Paginated, filtered and sorted products
     * @throws {InternalServerError}
     */
    findAll(filters: ProductFilters): Promise<PaginatedData<IProduct>>;

    /**
     * Finds a product by its slug
     * @param {string} slug - Slug of the product to find
     * @param {FindByIdentifierOptions} options - Options to apply
     * @returns {IProduct} The found product
     * @throws {InternalServerError}
     */
    findBySlug(slug: string, options: FindByIdentifierOptions): Promise<IProduct | null>;

    /**
     * Finds a product by its name
     * @param {string} name - Name of the product to find
     * @param {FindByIdentifierOptions} options - Options to apply
     * @returns {IProduct} The found product
     * @throws {InternalServerError}
     */
    findByName(name: string, options: FindByIdentifierOptions): Promise<IProduct | null>;

    /**
     * Deletes a product by its ID
     * @param {string} id - ID of the product to delete
     * @returns {IProduct} - The deleted product
     * @throws {InternalServerError}
     */
    delete(id: string): Promise<IProduct | null>;

    /**
     * Restores a deleted product
     * @param {string} id - ID of the product to restore
     * @returns {IProduct} The restored product
     * @throws {InternalServerError}
     * @throws {ConflictError}
     */
    restore(id: string): Promise<IProduct | null>;
}