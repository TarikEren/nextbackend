import { IDimensions, IProductModel, IWeight } from "@/lib/types/models/product";
import mongoose from "mongoose";

const dimensionsSchema = new mongoose.Schema<IDimensions>({
    height: { type: Number, required: true },
    width: { type: Number, required: true },
    depth: { type: Number, required: true },
    unit: { type: String, required: true },
});

const weightSchema = new mongoose.Schema<IWeight>({
    value: { type: Number, required: true },
    unit: { type: String, required: true },
});

const productSchema = new mongoose.Schema<IProductModel>({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, required: true },
    stock: { type: Number, required: true },
    isActive: { type: Boolean, default: true, index: true },
    price: { type: Number, required: true },
    reviewsCount: { type: Number, required: false },
    reviewsSum: { type: Number, required: false },
    salePrice: { type: Number, required: false },
    dimensions: dimensionsSchema,
    weight: weightSchema,
    metaTitle: { type: String, required: true },
    metaDescription: { type: String, required: true },
    images: { type: [String], required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Category" },
    deletedAt: { type: Date, default: null, index: true }
});

productSchema.index(
    { name: 1, deletedAt: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

productSchema.index(
    { slug: 1, deletedAt: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema);

export default ProductModel;