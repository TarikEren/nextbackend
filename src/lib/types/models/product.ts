import { zProductSchema } from "@/lib/schemas/product";
import mongoose from "mongoose";
import z from "zod";

export type IProduct = z.infer<typeof zProductSchema>;

export interface IProductModel extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;           // For easier access or whatever
    description: string;
    stock: number;          // Stock count
    isActive: Boolean;
    price: Number;
    reviewsCount: Number;
    reviewsSum: Number;
    salePrice: Number;
    dimensions: IDimensions;
    weight: IWeight;
    metaTitle: string,              // Fancy title (Ask AI for help) Use: "const pageTitle = product.metaTitle || `${product.name} | Woody's Wonders`;" to render the page title in /products/[slug]/
    metaDescription: string,        // Fancy description (Ask AI for help and how to utilise)
    images: [string],               // URL to the CDN which stores the image
    categoryId: mongoose.Schema.Types.ObjectId;
    deletedAt: Date;
}

export interface IDimensions {
    height: number;
    width: number;
    depth: number;
    unit: string;
}

export interface IWeight {
    value: number;
    unit: string;
}
