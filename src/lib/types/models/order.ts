import mongoose from "mongoose";
import { IAddress } from "./user";

// Sub-schema for items within the order. This is a SNAPSHOT.
export interface IOrderItem {
    product: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    quantity: number;
};

export enum OrderStatus {
    pending,
    processing,
    shipped,
    delivered,
    cancelled
}

export enum OrderPaymentStatus {
    paid,
    refunded
}

export interface IOrderModel {
    orderNumber: string;
    user: typeof mongoose.Schema.ObjectId;
    items: [IOrderItem];

    // Stored, calculated totals from the time of checkout
    subtotal: Number;
    shippingCost: Number;
    taxes: Number;
    total: Number;
    shippingAddress: IAddress;

    // Status of the order, using an enum for type safety
    status: OrderStatus;

    paymentDetails: {
        paymentMethod: String;
        transactionId: String;
        status: OrderPaymentStatus
    },

    // Tracking information, added when the order is shipped
    trackingNumber: { type: String },
    carrier: { type: String },
}