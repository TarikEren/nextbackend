import { ConflictError, InternalServerError } from "@/lib/errors";
import { IProduct } from "@/lib/types/models/product";
import { FindByIdentifierOptions, PaginatedData } from "@/lib/types/repositories/global";
import { CreateProductDTO, IProductRepository, ProductFilters, ProductQuery, UpdateProductDTO } from "@/lib/types/repositories/product";
import ProductModel from "@/models/product";
import mongoose from "mongoose";
import { Logger } from "pino";

/**
 * Generates a query from the given filters
 * @param {ProductFilters} filters - Filters to use
 * @returns {ProductQuery} Query to use in product fetching
 */
function generateQuery(filters: ProductFilters): ProductQuery {
    // Start with an empty query object
    const query: ProductQuery = {};

    // Only add properties to the query if the filter is provided
    if (filters.name) {
        query.name = new RegExp(filters.name, 'i');
    }
    if (filters.categoryId) {
        query.categoryId = filters.categoryId;
    }
    if (filters.inStock === true) {
        query.stock = { $gt: 0 };
    }
    if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) {
            query.price.$gte = filters.minPrice;
        }
        if (filters.maxPrice) {
            query.price.$lte = filters.maxPrice;
        }
    }

    if (filters.includeDeleted !== true) {
        // includeDeleted can be false, null or undefined as well
        query.deletedAt = null;
    }

    return query;
}

export class ProductRepository implements IProductRepository {
    constructor(private readonly logger: Logger) { };

    async create(data: CreateProductDTO): Promise<IProduct> {
        try {
            return await ProductModel.create(data);
        } catch (error: any) {
            if (error.code === 11000) { // MongoDB conflict error
                this.logger.warn({ error }, "Failed creating product due to duplicate key");
            }
            this.logger.error({ error }, `Failed creating a product: ${error}`);
            throw new InternalServerError("Ürün oluşturulamadı");
        }
    }

    async update(id: string, data: UpdateProductDTO): Promise<IProduct | null> {
        try {
            return await ProductModel.findByIdAndUpdate(id, data, { new: true });
        } catch (error: any) {
            if (error.code === 11000) {
                this.logger.warn({ name: data.name }, "Conflicting product names");
                throw new ConflictError("Ürün çakışmadan ötürü düzenlenemedi, başka bir isim deneyin");
            }
            this.logger.error({ error }, `Failed updating product: ${error}`);
            throw new InternalServerError("Ürün güncelleme başarısız");
        }
    }

    async findById(id: string, options: FindByIdentifierOptions): Promise<IProduct | null> {
        try {
            // Building a query
            const query: any = { _id: id };
            if (!options.includeDeleted) {
                query.deletedAt = null;
            }
            return await ProductModel.findOne(query).lean<IProduct>();
        } catch (error: any) {
            this.logger.error({ error }, `Failed fetching a product: ${error}`);
            throw new InternalServerError("Ürün alınamadı, lütfen daha sonra tekrar deneyin");
        }
    }

    async findAll(filters: ProductFilters): Promise<PaginatedData<IProduct>> {
        try {
            // Generate the query object for finding documents
            const query = generateQuery(filters);

            // Prepare the sorting options
            // Set default values if not provided
            const sortBy = filters.sortBy || 'createdAt';
            const sortOrder = filters.sortOrder === 'asc' ? 1 : -1; // Mongoose uses 1 for 'asc', -1 for 'desc'

            // Create the dynamic sort object. e.g., { createdAt: -1 } or { price: 1 }
            const sortOptions: Record<string, mongoose.SortOrder> = { [sortBy]: sortOrder };

            // Calculate the offset
            const offset = (filters.pageNumber - 1) * filters.entryPerPage;

            // Execute count and find in parallel
            const [totalProducts, products] = await Promise.all([
                ProductModel.countDocuments(query),
                ProductModel.find(query) // Use the clean query object
                    .sort(sortOptions) // Apply the dynamic sorting
                    .limit(filters.entryPerPage)
                    .skip(offset)
                    .lean<IProduct[]>(),
            ]);

            return {
                data: products,
                hasNext: offset + products.length < totalProducts,
                hasPrev: filters.pageNumber > 1,
                shownEntryCount: products.length
            }
        } catch (error) {
            this.logger.error({ error }, `Failed fetching products: ${error}`);
            throw new InternalServerError("Ürünler bulunamadı, lütfen tekrar deneyin.");
        }
    }

    async findBySlug(slug: string, options: FindByIdentifierOptions): Promise<IProduct | null> {
        try {
            const query: any = { slug: slug };
            if (!options.includeDeleted) {
                query.deletedAt = null;
            }
            return await ProductModel.findOne(query).lean<IProduct>();
        } catch (error: any) {
            this.logger.error({ error }, `Failed fetching product by slug: ${error}`);
            throw new InternalServerError("Slug ile arama yapılamadı");
        }
    }

    async findByName(name: string, options: FindByIdentifierOptions): Promise<IProduct | null> {
        try {
            const query: any = { name: name };
            if (!options.includeDeleted) {
                query.deletedAt = null;
            }
            return await ProductModel.findOne(query).lean<IProduct>();
        } catch (error: any) {
            this.logger.error({ error }, `Failed finding product by name: ${error}`);
            throw new InternalServerError("İsim ile ürün bulunamadı");
        }
    }

    async delete(id: string): Promise<IProduct | null> {
        try {
            return await ProductModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true }).lean<IProduct>();
        } catch (error: any) {
            this.logger.error({ error }, `Failed deleting a product: ${error}`);
            throw new InternalServerError("Ürün silinemedi");
        }
    }

    async restore(id: string): Promise<IProduct | null> {
        try {
            // Check if the provided product is deleted
            const productToRestore = await ProductModel.findOne({ _id: id, deletedAt: { $ne: null } });
            // If not, return null
            if (!productToRestore) return null;

            // Find a product which satisfies the provided prerequisites
            const conflictExists = await ProductModel.findOne(
                {
                    _id: { $ne: id },   // A different entry than the provided one
                    deletedAt: null,    // Which isn't deleted
                    $or: [               // The name or the slug has to be equal to the product to restore
                        { name: productToRestore.name },
                        { slug: productToRestore.slug }
                    ]
                }
            );

            // If conflict exists, log and throw error
            if (conflictExists) {
                this.logger.warn({ name: productToRestore.name }, "Failed to restore product due to conflict");
                throw new ConflictError("Aktif ürünler arasında bu ürünün slug'ına veya isimine sahip başka bir ürün var");
            }

            // Restore and return
            return await ProductModel.findByIdAndUpdate(id, { deletedAt: null }, { new: true }).lean<IProduct>();

        } catch (error: any) {
            this.logger.error({ error }, `Failed to restore product: ${error}`);
            throw new InternalServerError("Ürün geri getirilemedi, lütfen daha sonra tekrar deneyin");
        }
    }
}