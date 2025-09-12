import { ConflictError, InternalServerError } from "@/lib/errors";
import { ICategory } from "@/lib/types/models/category";
import { CategoryFilters, CategoryQuery, CreateCategoryDTO, ICategoryRepository, UpdateCategoryDTO } from "@/lib/types/repositories/category";
import { FindByIdentifierOptions, PaginatedData } from "@/lib/types/repositories/global";
import CategoryModel from "@/models/category";
import { SortOrder } from "mongoose";
import { Logger } from "pino";

/**
 * Generates a query from the given filters
 * @param {CategoryFilters} filters - Filters to use
 * @returns {CategoryQuery} Query to use in category fetching
 */
function generateQuery(filters: CategoryFilters): CategoryQuery {
    let query: CategoryQuery = {};

    if (filters.name) {
        query.name = new RegExp(filters.name, 'i');
    }

    if (filters.parent) {
        query.parent = filters.parent;
    } else if (filters.parent === null) {
        query.parent = null;
    }

    if (filters.includeDeleted !== true) {
        // includeDeleted can be false, null or undefined as well
        query.deletedAt = null;
    }

    return query;
}

export class CategoryRepository implements ICategoryRepository {
    constructor(private readonly logger: Logger) { }

    async create(data: CreateCategoryDTO): Promise<ICategory | null> {
        try {
            return await CategoryModel.create(data);
        } catch (error: any) {
            if (error.code === 11000) {
                this.logger.warn({ name: data.name }, "Conflicting category names");
                throw new ConflictError("Kategori çakışmadan ötürü oluşturulamadı, başka bir isim deneyin");
            }
            this.logger.error({ error }, `Failed creating a category: ${error}`);
            throw new InternalServerError("Kategori oluşturulamadı");
        }
    }

    async update(id: string, data: UpdateCategoryDTO): Promise<ICategory | null> {
        try {
            return await CategoryModel.findByIdAndUpdate(id, data, { new: true }).lean<ICategory>();
        } catch (error: any) {
            if (error.code === 11000) {
                this.logger.warn({ name: data.name }, "Conflicting category names");
                throw new ConflictError("Kategori çakışmadan ötürü düzenlenemedi, başka bir isim deneyin");
            }
            this.logger.error({ error }, `Failed updating a category: ${error}`);
            throw new InternalServerError("Kategori güncellenemedi");
        }
    }

    async delete(id: string): Promise<ICategory | null> {
        try {
            return await CategoryModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true }).lean<ICategory>();
        } catch (error: any) {
            this.logger.error({ error }, `Failed deleting a category: ${error}`);
            throw new InternalServerError("Kategori silinemedi");
        }
    }

    async findById(id: string, options: FindByIdentifierOptions): Promise<ICategory | null> {
        try {
            // Building a query
            const query: any = { _id: id };
            if (!options.includeDeleted) {
                query.deletedAt = null;
            }
            return await CategoryModel.findOne(query).lean<ICategory>();
        } catch (error: any) {
            this.logger.error({ error }, `Failed fetching a category: ${error}`);
            throw new InternalServerError("Kategori alınamadı, lütfen daha sonra tekrar deneyin");
        }
    }

    async findAll(filters: CategoryFilters): Promise<PaginatedData<ICategory>> {
        try {
            const offset = (filters.pageNumber - 1) * filters.entryPerPage;
            const query = generateQuery(filters);

            const sortBy = filters.sortBy || "createdAt";
            const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
            const sortOptions: Record<string, SortOrder> = { [sortBy]: sortOrder };

            const [totalCategories, categories] = await Promise.all([
                CategoryModel.countDocuments(query),
                CategoryModel.find(query)
                    .limit(filters.entryPerPage)
                    .sort(sortOptions)
                    .skip(offset)
                    .lean<ICategory[]>()
            ]);

            return {
                data: categories,
                hasNext: offset + categories.length < totalCategories,
                hasPrev: filters.pageNumber > 1,
                shownEntryCount: categories.length
            }
        } catch (error: any) {
            this.logger.error({ error, filters }, "Failed to fetch categories");
            throw new InternalServerError("Kategoriler getirilemedi, lütfen daha sonra tekrar deneyin");
        }
    }

    async restore(id: string): Promise<ICategory | null> {
        try {
            // Check if the provided category is deleted
            const categoryToRestore = await CategoryModel.findOne({ _id: id, deletedAt: { $ne: null } });
            // If not, return null
            if (!categoryToRestore) return null;

            // Find a category which satisfies the provided prerequisites
            const conflictExists = await CategoryModel.findOne(
                {
                    _id: { $ne: id },   // A different entry than the provided one
                    deletedAt: null,    // Which isn't deleted
                    or: [               // The name or the slug has to be equal to the category to restore
                        { name: categoryToRestore.name },
                        { slug: categoryToRestore.slug }
                    ]
                }
            );

            // If conflict exists, log and throw error
            if (conflictExists) {
                this.logger.warn({name: categoryToRestore.name}, "Failed to restore category due to conflict");
                throw new ConflictError("Aktif kategoriler arasında bu kategorinin slug'ına veya isimine sahip başka bir kategori var");
            }

            // Restore and return
            return await CategoryModel.findByIdAndUpdate(id, { deletedAt: null }, { new: true }).lean<ICategory>();

        } catch (error: any) {
            this.logger.error({ error }, `Failed to restore category: ${error}`);
            throw new InternalServerError("Kategori geri getirilemedi, lütfen daha sonra tekrar deneyin");
        }
    }
}