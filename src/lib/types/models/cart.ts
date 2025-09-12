import mongoose from "mongoose";
import { IProductModel } from "./product";

export interface ICartItem {
    product: IProductModel;
    count: number;
}

export interface ICartModel extends mongoose.Document {
    user: mongoose.Schema.Types.ObjectId;
    items: ICartItem[];
    subtotal: number;
}
