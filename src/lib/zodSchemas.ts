import * as z from "zod";

/**
 * Password validation schema
 */
export const zPasswordSchema = z.string({ error: "Cannot leave password field empty" })
    .superRefine((password, ctx) => {
        if (password.length < 8 || password.length > 20) {
            ctx.addIssue({
                code: "custom",
                message: "Password needs to be between 8 and 20 characters long",
                continue: false
            });
        }
        if (!/[A-Z]/.test(password)) {
            ctx.addIssue({
                code: "custom",
                message: "Password needs to contain at least one uppercase letter",
                continue: false
            });
        }
        if (!/[a-z]/.test(password)) {
            ctx.addIssue({
                code: "custom",
                message: "Password needs to contain at least one lowercase letter",
                continue: false
            });
        }
        if (!/\d/.test(password)) {
            ctx.addIssue({
                code: "custom",
                message: "Password needs to contain at least one digit",
                continue: false
            });
        }
        if (!/[!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>/?`~]/.test(password)) {
            ctx.addIssue({
                code: "custom",
                message: "Şifreniz en az 1 özel karakter içermeli",
                continue: false
            });
        }
    });

export const zChangePasswordSchema = z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: zPasswordSchema,
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
}).refine(data => data.oldPassword !== data.newPassword, {
    message: "New password cannot be the same as the old password",
    path: ["newPassword"],
});

/**
 * Login validation schema
 */
export const zLoginSchema = z.object({
    email: z.email({ error: "Geçersiz e-posta adresi" }).trim(),
    password: zPasswordSchema,
});

/**
 * Register validation schema
 */
export const zRegisterSchema = z.object({
    email: z.email({ message: "Geçersiz e-posta adresi" }).trim(),
    password: zPasswordSchema,
    firstName: z.string().regex(/^[a-zA-Z]{4,10}$/, { error: "Geçersiz ad" }).trim(),
    lastName: z.string().regex(/^[a-zA-Z]{4,20}$/, { error: "Geçersiz soyad" }).trim(),
    phoneNumber: z.string().regex(/^(\+\d{1,2}\s?)?1?\.?\s?\(?\d{3}\)?\d{3}\d{4}$/, { error: "Geçersiz telefon numarası" }).trim(), //TODO: Add proper validation
    confirmPassword: z.string().nonempty({ error: "Şifre onayla alanı boş bırakılamaz" }).trim(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Şifreler birbiriyle aynı olmalı",
    path: ["confirmPassword"]
});

/**
 * Update user validation schema
 */

export const zPaymentMethodSchema = z.object({
    gatewayCustomerId: z.string(),
    paymentMethodId: z.string(),
    brand: z.string(),
    last4: z.string(),
    isDefault: z.boolean().default(false), // Make it required, with a default value
});

export const zAddressSchema = z.object({
    name: z.string().nonempty({ error: "Ad alanı boş bırakılamaz" }).trim(),
    line1: z.string().nonempty({ error: "Adres alanı boş bırakılamaz" }).trim(),
    line2: z.string().trim().optional(),
    zipCode: z.string().nonempty({ error: "Posta kodu alanı boş bırakılamaz" }).trim(),
    city: z.string().nonempty({ error: "Şehir alanı boş bırakılamaz" }).trim(),
    isDefault: z.boolean().default(false)
});

export const zUserSchema = z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.email(),
    password: z.string(), // This is the hash
    phoneNumber: z.string(),
    savedCards: z.array(zPaymentMethodSchema).default([]),
    savedProductIds: z.array(z.string()).default([]),
    visitedProductIds: z.array(z.string()).default([]),
    pastOrderIds: z.array(z.string()).default([]),
    userCartId: z.string().default(""),
    messages: z.array(z.string()).default([]),
    savedAddresses: z.array(zAddressSchema).default([]),
    isAdmin: z.boolean().default(false),
    emailVerified: z.boolean().default(false),
    createdAt: z.date(),
    updatedAt: z.date(),
});


export const zUpdateUserSchema = z.object({
    firstName: z.string().regex(/^[a-zA-Z]{4,10}$/, { error: "Geçersiz ad" }).trim().optional(),
    lastName: z.string().regex(/^[a-zA-Z]{4,20}$/, { error: "Geçersiz soyad" }).trim().optional(),
    phoneNumber: z.string().regex(/^(\+\d{1,2}\s?)?1?\.?\s?\(?\d{3}\)?\d{3}\d{4}$/, { error: "Geçersiz telefon numarası" }).trim().optional(), //TODO: Add proper validation
    email: z.email({ message: "Geçersiz e-posta adresi" }).trim().optional(),
    savedAddresses: z.array(zAddressSchema).optional(),
    savedCards: z.array(zPaymentMethodSchema).optional(),
});

/**
 * Category validation schema
 */
export const zCategorySchema = z.object({
    name: z.string().nonempty({ error: "Kategori adı alanı boş bırakılamaz" }).trim(),
    description: z.string().nonempty({ error: "Kategori açıklaması alanı boş bırakılamaz" }).trim(),
    isActive: z.boolean().default(true),
    image: z.string().nonempty({ error: "Kategori görseli alanı boş bırakılamaz" }).trim(),
    parent: z.string().trim().optional().nullable().transform(val => val === "" ? null : val),
});

/**
 * Update category validation schema
 */
export const zUpdateCategorySchema = z.object({
    name: z.string().nonempty({ error: "Kategori adı alanı boş bırakılamaz" }).trim().optional(),
    description: z.string().nonempty({ error: "Kategori açıklaması alanı boş bırakılamaz" }).trim().optional(),
    isActive: z.boolean().optional(),
    image: z.string().nonempty({ error: "Kategori görseli alanı boş bırakılamaz" }).trim().optional(),
    parent: z.string().trim().optional().nullable(),
});

/**
 * Product validation schema
 */
export const zCreateProductSchema = z.object({
    name: z.string().nonempty({ error: "Ürün adı alanı boş bırakılamaz" }).trim(),
    description: z.string().nonempty({ error: "Ürün açıklaması alanı boş bırakılamaz" }).trim(),
    stock: z.number().int().positive({ error: "Ürün stok adetinden birişim daha yüksek olmalı" }),
    isActive: z.boolean().default(true),
    price: z.number().positive({ error: "Ürün fiyatı 0'dan büyük olmalı" }),
    reviewsCount: z.number().int().positive({ error: "Ürün puan sayısı 0'dan büyük olmalı" }),
    reviewsSum: z.number().positive({ error: "Ürün puan toplamı 0'dan büyük olmalı" }),
    salePrice: z.number().positive({ error: "Ürün satış fiyatı 0'dan büyük olmalı" }),
    dimensions: z.object({
        height: z.number().positive({ error: "Ürün yüksekliği 0'dan büyük olmalı" }),
        width: z.number().positive({ error: "Ürün genişliği 0'dan büyük olmalı" }),
        depth: z.number().positive({ error: "Ürün derinliği 0'dan büyük olmalı" }),
        unit: z.string().nonempty({ error: "Ürün birimi alanı boş bırakılamaz" }),
    }),
    weight: z.object({
        value: z.number().positive({ error: "Ürün ağırlığı 0'dan büyük olmalı" }),
        unit: z.string().nonempty({ error: "Ürün ağırlık birimi alanı boş bırakılamaz" }),
    }),
    metaTitle: z.string().nonempty({ error: "Ürün meta başlığı alanı boş bırakılamaz" }).trim(),
    metaDescription: z.string().nonempty({ error: "Ürün meta açıklaması alanı boş bırakılamaz" }).trim(),
    images: z.array(z.string().nonempty({ error: "Ürün görseli alanı boş bırakılamaz" }).trim()),
    categoryId: z.string().nonempty({ error: "Ürün kategori ID alanı boş bırakılamaz" }),
});

/**
 * Update product validation schema
 */

export const zUpdateProductSchema = z.object({
    name: z.string().nonempty({ error: "Ürün adı alanı boş bırakılamaz" }).trim().optional(),
    description: z.string().nonempty({ error: "Ürün açıklaması alanı boş bırakılamaz" }).trim().optional(),
    isActive: z.boolean().optional(),
    price: z.number().positive({ error: "Ürün fiyatı 0'dan büyük olmalı" }).optional(),
    salePrice: z.number().positive({ error: "Ürün satış fiyatı 0'dan büyük olmalı" }).optional(),
    dimensions: z.object({
        height: z.number().positive({ error: "Ürün yüksekliği 0'dan büyük olmalı" }).optional(),
        width: z.number().positive({ error: "Ürün genişliği 0'dan büyük olmalı" }).optional(),
        depth: z.number().positive({ error: "Ürün derinliği 0'dan büyük olmalı" }).optional(),
        unit: z.string().nonempty({ error: "Ürün birimi alanı boş bırakılamaz" }).optional(),
    }),
    weight: z.object({
        value: z.number().positive({ error: "Ürün ağırlığı 0'dan büyük olmalı" }).optional(),
        unit: z.string().nonempty({ error: "Ürün ağırlık birimi alanı boş bırakılamaz" }).optional(),
    }),
    metaTitle: z.string().nonempty({ error: "Ürün meta başlığı alanı boş bırakılamaz" }).trim().optional(),
    metaDescription: z.string().nonempty({ error: "Ürün meta açıklaması alanı boş bırakılamaz" }).trim().optional(),
    images: z.array(z.string().nonempty({ error: "Ürün görseli alanı boş bırakılamaz" }).trim()).optional(),
    categoryId: z.string().nonempty({ error: "Ürün kategori ID alanı boş bırakılamaz" }).optional(),
});