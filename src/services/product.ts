import { NotFoundError, UnauthorizedError } from "@/lib/errors";
import { IProduct } from "@/lib/types/models/product";
import { PaginatedData } from "@/lib/types/repositories/global";
import { CreateProductDTO, ProductFilters, UpdateProductDTO } from "@/lib/types/repositories/product";
import { ActingUser, ProtectedActions } from "@/lib/types/services/global";
import { IProductService } from "@/lib/types/services/product";
import { ProductRepository } from "@/repositories/product";
import { Logger } from "pino";
import { ServiceUtils } from "./global";

export class ProductService implements IProductService {
    constructor(
        private productRepository: ProductRepository,
        private logger: Logger
    ) { }

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
        ServiceUtils.ensureAdmin(this.logger, actingUser, ProtectedActions.Restore);
        return await this.productRepository.restore(id);
    }

    async createProduct(data: CreateProductDTO, actingUser: ActingUser): Promise<IProduct | null> {
        ServiceUtils.ensureAdmin(this.logger, actingUser, ProtectedActions.Create);
        const slug = ServiceUtils.generateSlug(data.name);
        return await this.productRepository.create({ ...data, slug: slug });
    }

    async updateProduct(id: string, data: UpdateProductDTO, actingUser: ActingUser): Promise<IProduct | null> {
        ServiceUtils.ensureAdmin(this.logger, actingUser, ProtectedActions.Update);
        if (data.name) {
            data.slug = ServiceUtils.generateSlug(data.name);
        }
        return await this.productRepository.update(id, data);
    }

    async deleteProduct(id: string, actingUser: ActingUser): Promise<IProduct | null> {
        ServiceUtils.ensureAdmin(this.logger, actingUser, ProtectedActions.Delete);
        return await this.productRepository.delete(id);
    }

}