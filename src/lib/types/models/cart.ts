import mongoose from "mongoose";
import { IProductModel } from "./product";

export interface ICartItem {
    product: IProductModel;
    count: Number;
    priceAtTimeOfAddition: Number;
    name: String,
    image: String,
    slug: String
}

export interface ICartModel extends mongoose.Document {
    user: mongoose.Schema.Types.ObjectId;
    items: ICartItem[];
}
