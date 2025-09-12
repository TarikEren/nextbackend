import { ICategoryModel } from "@/lib/types/models/category";
import mongoose from "mongoose";

export const categorySchema = new mongoose.Schema<ICategoryModel>({
    name: { type: String, required: true, },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    image: { type: String, required: true },
    parent: { type: mongoose.Types.ObjectId, required: false, ref: "Category" },
    slug: { type: String, required: true },
    deletedAt: { type: Date, default: null }
}, { timestamps: true });

categorySchema.index(
    { name: 1, deletedAt: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

categorySchema.index(
    { slug: 1, deletedAt: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

const CategoryModel = mongoose.models.Category || mongoose.model("Category", categorySchema);

export default CategoryModel;