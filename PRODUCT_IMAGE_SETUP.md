# Product image setup

The frontend image pipeline is fixed, but the connected Supabase project currently has no product image data.

## Current database/storage state

- `public.products`: 11 products
- `products.image_url`: currently NULL for all 11 products
- Storage buckets: `avatars` (private) and `id-documents` (private)
- There is currently no `product-images` bucket

## Recommended setup

1. Create a Supabase Storage bucket named `product-images`.
2. Make it public if product images are intended to be public catalog assets.
3. Upload one image per product, preferably JPG/WebP/AVIF and roughly 100–300 KB each.
4. Put either the complete public URL in `products.image_url`, or store the object path such as `americano.webp` and keep `VITE_PRODUCT_IMAGE_BUCKET=product-images`.
5. Refresh the menu.

The code supports both public URLs and private Storage paths. Private paths are resolved with a short-lived signed URL.

Do not put product images in the private `avatars` or `id-documents` buckets.
