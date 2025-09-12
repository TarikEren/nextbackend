import { NotFoundError, UnauthorizedError } from "@/lib/errors";
import { IProduct } from "@/lib/types/models/product";
import { PaginatedData } from "@/lib/types/repositories/global";
import { CreateProductDTO, ProductFilters, UpdateProductDTO } from "@/lib/types/repositories/product";
import { ActingUser } from "@/lib/types/services/global";
import { IProductService } from "@/lib/types/services/product";
import { ProductRepository } from "@/repositories/product";
import { Logger } from "pino";
import slugify from "slugify";

enum ProductActions {
    Create = "create",
    Update = "update",
    Delete = "delete",
    Restore = "restore"
}

export class ProductService implements IProductService {
    constructor(
        private productRepository: ProductRepository,
        private logger: Logger
    ) { }

    /**
     * Checks whether the provided user is an admin and throws error if not
     * @param actingUser - The user making the request
     * @param action - The performed action
     */
    private ensureAdmin(actingUser: ActingUser, action: ProductActions) {
        if (!actingUser.isAdmin) {
            this.logger.warn({ actingUserId: actingUser.id }, `Unauthorized ${action} product attempt`);
            throw new UnauthorizedError("Bu işlem için gerekli yetkilere sahip değilsiniz");
        }
    }

    private generateSlug(name: string) {
        return slugify(name, { lower: true, strict: true });
    }

    async findProductByName(name: string, actingUser: ActingUser): Promise<IProduct | null> {
        const product = await this.productRepository.findByName(name, { includeDeleted: actingUser.isAdmin });

        if (!product) {
            throw new NotFoundError("Ürün bulunamadı");
        }

        return product;
    }

    async findAllProducts(filters: ProductFilters, actingUser: ActingUser): Promise<PaginatedData<IProduct>> {
        if (actingUser.isAdmin && filters.includeDeleted === undefined) {
            filters.includeDeleted = true;
        }
        return await this.productRepository.findAll(filters);
    }

    async findProductById(id: string, actingUser: ActingUser): Promise<IProduct | null> {
        const product = await this.productRepository.findById(id, { includeDeleted: actingUser.isAdmin });
        if (!product) {
            throw new NotFoundError("Ürün bulunamadı");
        }
        return product;
    }

    async findProductBySlug(slug: string, actingUser: ActingUser): Promise<IProduct | null> {
        const product = await this.productRepository.findBySlug(slug, { includeDeleted: actingUser.isAdmin });
        if (!product) {
            throw new NotFoundError("Ürün bulunamadı");
        }
        return product;
    }

    async restoreProduct(id: string, actingUser: ActingUser): Promise<IProduct | null> {
        this.ensureAdmin(actingUser, ProductActions.Restore);
        return await this.productRepository.restore(id);
    }

    async createProduct(data: CreateProductDTO, actingUser: ActingUser): Promise<IProduct | null> {
        this.ensureAdmin(actingUser, ProductActions.Create);
        const slug = this.generateSlug(data.name);
        return await this.productRepository.create({ ...data, slug: slug });
    }

    async updateProduct(id: string, data: UpdateProductDTO, actingUser: ActingUser): Promise<IProduct | null> {
        this.ensureAdmin(actingUser, ProductActions.Update);
        if (data.name) {
            data.slug = this.generateSlug(data.name);
        }
        return await this.productRepository.update(id, data);
    }

    async deleteProduct(id: string, actingUser: ActingUser): Promise<IProduct | null> {
        this.ensureAdmin(actingUser, ProductActions.Delete);
        return await this.productRepository.delete(id);
    }

}