# Product images

These 11 optimized local product visuals are intentionally stored in the repository so the menu works immediately without waiting for a Storage request.

The Supabase `products.image_url` column points to `/images/products/*.jpg` for each matching product.

If you later move the images into the `product-images` Supabase Storage bucket, replace those database paths with Storage paths/URLs; `src/lib/productImages.ts` already supports both local assets and Supabase Storage.
