import { ICartItem, ICartModel } from "@/lib/types/models/cart";
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema<ICartItem>({
    product: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
    count: { type: Number, default: 1, min: 1 },
    priceAtTimeOfAddition: { type: Number, required: true, min: 1 },
    name: { type: String, required: true },
    image: { type: String, required: true },
    slug: { type: String, required: true }
});

const cartSchema = new mongoose.Schema<ICartModel>({
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    items: [cartItemSchema],
}, { timestamps: true });

// Delete abandoned carts after 30 days
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); 

const CartModel = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
export default CartModel;