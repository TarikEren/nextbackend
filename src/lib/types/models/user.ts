import { zUserSchema } from "@/lib/schemas/user";
import mongoose from "mongoose";
import z from "zod";

export type IUser = z.infer<typeof zUserSchema>;

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
    deletedAt: Date,
    isActive: Boolean,
    provider: string
}