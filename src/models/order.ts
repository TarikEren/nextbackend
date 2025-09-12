import { IOrderModel, OrderPaymentStatus, OrderStatus } from "@/lib/types/models/order";
import mongoose from "mongoose";
import { addressSchema } from "./user";

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema<IOrderModel>({
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true, default: 0 },
    taxes: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    shippingAddress: { type: addressSchema, required: true },
    status: {
        type: Number,
        enum: Object.values(OrderStatus),
        default: OrderStatus.pending,
    },
    paymentDetails: {
        paymentMethod: { type: String, required: true },
        transactionId: { type: String, required: true },
        status: {
            type: Number,
            enum: Object.values(OrderPaymentStatus),
            default: OrderPaymentStatus.paid
        }
    },
    trackingNumber: { type: String },
    carrier: { type: String },

}, { timestamps: true });

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default OrderModel;