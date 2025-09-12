import z from "zod";

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
    password: zPasswordSchema.optional(),
    confirmPassword: z.string().nonempty({ error: "Şifre onayla alanı boş bırakılamaz" }).trim().optional(),
    emailVerified: z.boolean().default(false),
    provider: z.enum(["credentials", "oauth"]).default("credentials")
}).superRefine((data, ctx) => {
    if (data.provider === "credentials") {
        // Check if password exists
        if (!data.password) {
            ctx.addIssue({
                code: "custom",
                message: "Şifre boş bırakılamaz",
                path: ["password"],
            });
        }

        // Check if passwords match
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                message: "Şifreler birbiriyle aynı olmalı",
                path: ["confirmPassword"],
            });
        }
    }
})

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
    provider: z.enum(["credentials", "oauth"]),
    deletedAt: z.date().nullable(),
    isActive: z.boolean().default(true)
});

export const zUpdateUserSchema = z.object({
    firstName: z.string().regex(/^[a-zA-Z]{4,10}$/, { error: "Geçersiz ad" }).trim().optional(),
    lastName: z.string().regex(/^[a-zA-Z]{4,20}$/, { error: "Geçersiz soyad" }).trim().optional(),
    phoneNumber: z.string().regex(/^(\+\d{1,2}\s?)?1?\.?\s?\(?\d{3}\)?\d{3}\d{4}$/, { error: "Geçersiz telefon numarası" }).trim().optional(),
    email: z.email({ message: "Geçersiz e-posta adresi" }).trim().optional(),
    savedAddresses: z.array(zAddressSchema).optional(),
    savedCards: z.array(zPaymentMethodSchema).optional(),
});
