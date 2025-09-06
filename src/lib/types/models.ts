import mongoose from "mongoose";
import { zUserSchema } from "../zodSchemas";
import z from "zod";

export type IUser = z.infer<typeof zUserSchema>

export enum acceptedCardBrands {
    Visa = "visa",
    MasterCard = "mastercard"
}

export interface IPaymentMethod {
    gatewayCustomerId: string;
    paymentMethodId: string;
    brand: string;
    last4: string;
    isDefault: boolean;
}

export interface IAddress {
    name: string;
    line1: string;
    line2: string;
    zipCode: string;
    city: string;
}

export interface IUserModel extends mongoose.Document {
    _id: mongoose.Types.ObjectId,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phoneNumber: string,
    phoneVerified: boolean,
    savedCards: IPaymentMethod[];
    savedAddresses: IAddress[];
    savedProducts: mongoose.Schema.Types.ObjectId[];
    visitedProducts: mongoose.Schema.Types.ObjectId[];
    pastOrders: mongoose.Schema.Types.ObjectId[];
    userCart: mongoose.Schema.Types.ObjectId;
    messages: string[];
    isAdmin: boolean,
    emailVerified: boolean,
    createdAt: Date,
    updatedAt: Date,
    provider: string
}

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
}

export interface IProductModel extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;           // For easier access or whatever
    sku: string;            // Stock keeping unit (OAK-DINING-TABLE)
    description: string;
    stock: number;          // Stock count
    isActive: Boolean;
    price: Number;
    reviewsCount: Number;
    reviewsSum: Number;
    salePrice: Number;
    dimensions: {
        height: Number;
        width: Number;
        depth: Number;
        unit: string;
    };
    weight: {
        value: Number;
        unit: string;
    };
    metaTitle: string,              // Fancy title (Ask AI for help) Use: "const pageTitle = product.metaTitle || `${product.name} | Woody's Wonders`;" to render the page title in /products/[slug]/
    metaDescription: string,        // Fancy description (Ask AI for help and how to utilise)
    images: [string],               // URL to the CDN which stores the image
    categoryId: mongoose.Schema.Types.ObjectId;
}

export interface ICartItem {
    product: IProductModel;
    count: number;
}

export interface ICartModel extends mongoose.Document {
    user: mongoose.Schema.Types.ObjectId;
    items: ICartItem[];
    subtotal: number;
}
