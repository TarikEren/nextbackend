import { acceptedCardBrands, IAddress, IPaymentMethod, IUserModel } from '@/lib/types/models/user';
import mongoose from 'mongoose';

export const addressSchema = new mongoose.Schema<IAddress>({
    name: { type: String, required: true },     // Name of the address (Home, work etc.)
    line1: { type: String, required: true },    // Address line 1
    line2: { type: String, required: true },    // Address line 2
    zipCode: { type: String, required: true },  // Zip code
    city: { type: String, required: true }      // City (NOTE: May opt for an enum to limit the available cities because the app is Turkish only for now.)
}, { _id: false });

export const paymentMethodSchema = new mongoose.Schema<IPaymentMethod>({
    gatewayCustomerId: { type: String, required: true },                // ID given from the gateway
    paymentMethodId: { type: String, required: true },                  // The token from the gateway
    brand: { type: String, required: true, enum: acceptedCardBrands },  // The brand of the card
    last4: { type: String, required: true },                            // The last 4 digits of the card
    isDefault: { type: Boolean, default: false }                        // Whether said method is the default option
}, { _id: false, autoIndex: false });

const userSchema = new mongoose.Schema<IUserModel>({
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    password: { type: String, select: false, required: false },      // Not "required" as there's also OAuth login / register option
    isAdmin: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    phoneNumber: {
        type: String,
        unique: true
    },
    phoneVerified: { type: Boolean, default: false },
    savedCards: [paymentMethodSchema],
    savedAddresses: [addressSchema],
    savedProducts: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], default: [] },
    visitedProducts: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], default: [] },
    pastOrders: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }], default: [] },
    userCart: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },
    messages: { type: [{ type: String }], default: [] },
    provider: { type: String, enum: ["credentials", "oauth"], default: "credentials" },
    deletedAt: { type: Date, default: null, index: true },
    isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

userSchema.index(
    { email: 1, deletedAt: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

export default UserModel;