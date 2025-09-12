import z from "zod";

export const zProductSchema = z.object({
    name: z.string().nonempty({ error: "Ürün adı alanı boş bırakılamaz" }).trim(),
    slug: z.string().trim().optional(),
    description: z.string().nonempty({ error: "Ürün açıklaması alanı boş bırakılamaz" }).trim(),
    stock: z.number().int().positive({ error: "Ürün stok adetinden birişim daha yüksek olmalı" }),
    isActive: z.boolean().default(true),
    price: z.number().positive({ error: "Ürün fiyatı 0'dan büyük olmalı" }),
    reviewsCount: z.number().int().optional(),
    reviewsSum: z.number().optional(),
    salePrice: z.number().optional(),
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

export const zCreateProductSchema = zProductSchema.omit({
    isActive: true,
    reviewsCount: true,
    reviewsSum: true,
    salePrice: true
});

/**
 * Update product validation schema
 */
export const zUpdateProductSchema = zProductSchema.partial();