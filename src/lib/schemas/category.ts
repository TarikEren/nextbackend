import z from "zod";

/**
 * Category validation schema
 */
export const zCategorySchema = z.object({
    name: z.string().nonempty({ error: "Kategori adı alanı boş bırakılamaz" }).trim(),
    slug: z.string().trim(),
    description: z.string().nonempty({ error: "Kategori açıklaması alanı boş bırakılamaz" }).trim(),
    isActive: z.boolean().default(true),
    image: z.string().nonempty({ error: "Kategori görseli alanı boş bırakılamaz" }).trim(),
    parent: z.string().trim().optional().nullable().transform(val => val === "" ? null : val),
    deletedAt: z.date().nullable()
});

/**
 * Category creation schema
 */
export const zCreateCategorySchema = zCategorySchema.omit({
    isActive: true
});

/**
 * Update category validation schema
 */
export const zUpdateCategorySchema = zCategorySchema.partial()