import { ICategory } from "@/lib/types/models/category";
import { CreateCategoryDTO, UpdateCategoryDTO, CategoryFilters } from "@/lib/types/repositories/category";
import { FindByIdentifierOptions, PaginatedData } from "@/lib/types/repositories/global";
import { ICategoryService } from "@/lib/types/services/category";
import { ActingUser, ProtectedActions } from "@/lib/types/services/global";
import { CategoryRepository } from "@/repositories/category";
import { Logger } from "pino";
import { ServiceUtils } from "./global";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { ProductRepository } from "@/repositories/product";

export class CategoryService implements ICategoryService {
    constructor(
        private categoryRepository: CategoryRepository,
        private productRepository: ProductRepository,
        private logger: Logger
    ) { }

    async createCategory(data: CreateCategoryDTO, actingUser: ActingUser): Promise<ICategory | null> {
        // Ensure that the user is admin
        ServiceUtils.ensureAdmin(this.logger, actingUser, ProtectedActions.Create);

        // Generate the slug
        data.slug = ServiceUtils.generateSlug(data.name);

        // Create and return the result
        return await this.categoryRepository.create(data);
    }

    async updateCategory(id: string, data: UpdateCategoryDTO, actingUser: ActingUser): Promise<ICategory | null> {
        // Ensure that the user is admin
        ServiceUtils.ensureAdmin(this.logger, actingUser, ProtectedActions.Update);

        // If a name is provided, generate a slug
        if (data.name) {
            data.slug = ServiceUtils.generateSlug(data.name);
        }

        // Update the category
        const category = await this.categoryRepository.update(id, data);

        // If not found throw error
        if (!category) {
            throw new NotFoundError("Kategori bulunamadı");
        }

        return category;
    }

    async deleteCategory(id: string, actingUser: ActingUser): Promise<ICategory | null> {
        // Ensure that the user is admin
        ServiceUtils.ensureAdmin(this.logger, actingUser, ProtectedActions.Delete);

        // Look for all products (including marked as deleted) that belongs to the selected category
        const productsInCategory = await this.productRepository.findAll({
            categoryId: id,
            pageNumber: 1,
            entryPerPage: 10,
            includeDeleted: true
        });

        if (productsInCategory.data.length > 0) {
            this.logger.warn({ categoryId: id, actingUserId: actingUser.id }, "Attempted to delete a category with assigned products.");
            throw new ConflictError("Bu kategoriye atanmış ürünler olduğu için silinemez. Lütfen önce ürünleri başka bir kategoriye taşıyın.");
        }

        // Delete the deleted category
        const category = await this.categoryRepository.delete(id);

        // If not found throw error
        if (!category) {
            throw new NotFoundError("Kategori bulunamadı");
        }

        // Return the category
        return category;
    }
    
    async restoreCategory(id: string, actingUser: ActingUser): Promise<ICategory | null> {
        // Ensure that the user is admin
        ServiceUtils.ensureAdmin(this.logger, actingUser, ProtectedActions.Restore);

        // Restore the restored category
        const category = await this.categoryRepository.restore(id);

        // If not found throw error
        if (!category) {
            throw new NotFoundError("Kategori bulunamadı");
        }

        // Return the category
        return category;
    }

    async findCategoryById(id: string, options: FindByIdentifierOptions, actingUser: ActingUser): Promise<ICategory | null> {
        // Fetch the category
        const category = await this.categoryRepository.findById(id, { ...options, includeDeleted: actingUser.isAdmin });

        // If not found throw NotFoundError
        if (!category) {
            throw new NotFoundError("Kategori bulunamadı");
        }

        // Return the category
        return category;
    }

    async findCategoryBySlug(slug: string, options: FindByIdentifierOptions, actingUser: ActingUser): Promise<ICategory | null> {
        // Fetch the category
        const category = await this.categoryRepository.findBySlug(slug, { ...options, includeDeleted: actingUser.isAdmin });

        // If not found throw NotFoundError
        if (!category) {
            throw new NotFoundError("Kategori bulunamadı");
        }

        // Return the category
        return category;
    }

    async findAllCategories(filters: CategoryFilters, actingUser: ActingUser): Promise<PaginatedData<ICategory>> {
        // Force the non-admin users into seeing only the non-deleted categories
        if (!actingUser.isAdmin) {
            filters.includeDeleted = false;
        }

        // If the user is an admin and the includeDeleted is undefined set it to true by default
        if (actingUser.isAdmin && filters.includeDeleted === undefined) {
            filters.includeDeleted = true;
        }

        // Return the filtered categories
        return await this.categoryRepository.findAll(filters);
    }

}