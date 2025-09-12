import { zCategorySchema } from "@/lib/schemas/category";
import mongoose from "mongoose";
import z from "zod";

export type ICategory = z.infer<typeof zCategorySchema>;

export interface ICategoryModel extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    isActive: boolean;
    image: string;
    parent: mongoose.Schema.Types.ObjectId;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
