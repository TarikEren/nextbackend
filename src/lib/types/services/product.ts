import { NotFoundError } from "@/lib/errors";
import { IProduct } from "../models/product";
import { PaginatedData } from "../repositories/global";
import { CreateProductDTO, ProductFilters, UpdateProductDTO } from "../repositories/product";
import { ActingUser } from "./global";

export interface IProductService {
    /**
     * Finds a product by name
     * @param {string} name - Product name
     * @param {ActingUser} actingUser - User making the request
     * @returns {IProduct | null} The product
     * @throws {NotFoundError}
     */
    findProductByName(name: string, actingUser: ActingUser): Promise<IProduct | null>;

    /**
     * Finds all products using filters
     * @param {ProductFilters} filters - Filters to be applied
     * @param {ActingUser} actingUser - User making the request
     * @returns {PaginatedData<IProduct>} Paginated product data
     */
    findAllProducts(filters: ProductFilters, actingUser: ActingUser): Promise<PaginatedData<IProduct>>;

    /**
     * Finds a product using its slug
     * @param {string} slug - The slug of the searched product
     * @param {ActingUser} actingUser - The user making the request
     * @returns {IProduct | null} The product
     * @throws {NotFoundError}
     */
    findProductBySlug(slug: string, actingUser: ActingUser): Promise<IProduct | null>

    /**
     * Finds a product using an id
     * @param {string} id - Id of the product to find
     * @param {ActingUser} actingUser - The user making the request
     * @returns {IProduct | null} The product
     * @throws {NotFoundError}
     */
    findProductById(id: string, actingUser: ActingUser): Promise<IProduct | null>;

    /**
     * Creates a product with the given data
     * @param {CreateProductDTO} data - Data to create the product with
     * @param {ActingUser} actingUser - The user making the request
     * @returns {IProduct | null} Created product
     */
    createProduct(data: CreateProductDTO, actingUser: ActingUser): Promise<IProduct | null>;

    /**
     * Updates a product with the given data
     * @param {string} id - ID of the product to be updated
     * @param {UpdateProductDTO} data - Update data
     * @param {ActingUser} actingUser - The user making the request
     * @returns {IProduct | null} Updated product
     */
    updateProduct(id: string, data: UpdateProductDTO, actingUser: ActingUser): Promise<IProduct | null>;

    /**
     * Deletes a product with the given ID
     * @param {string} id - ID of the product to delete
     * @param {ActingUser} actingUser - The user making the request
     * @returns {IProduct | null} Deleted product
     */
    deleteProduct(id: string, actingUser: ActingUser): Promise<IProduct | null>;

    /**
     * Restores a deleted product
     * @param {id} id - ID of the product to be restored
     * @param {ActingUser} actingUser - The user making the request
     * @returns {IProduct | null} Restored product
     */
    restoreProduct(id: string, actingUser: ActingUser): Promise<IProduct | null>
}