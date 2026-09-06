# Final Supabase changes

Applied to the connected `coffee-shop-platform` project:

- Created/updated the public `product-images` bucket for future staff-managed product uploads.
- Added staff-only write policies for product images.
- Seeded all 11 `products.image_url` values to the local optimized assets in `public/images/products/`.
- Added an `auth.users` profile-creation trigger so signup works even when email confirmation is enabled.
- Added useful indexes for product/category and identity-verification lookups.
- Kept the existing private `avatars` and `id-documents` security model.
- Kept customer QR regeneration and staff QR lookup security-definer functions.

## Important

The product photos are bundled with the frontend, so they load immediately and do not depend on Supabase Storage. The `product-images` bucket is provisioned for a later admin upload workflow.

## Staff email routing (September 2026)
- Emails matching `name.coffeehouse@gmail.com` are assigned the `staff` role by the auth profile trigger.
- Staff login now uses Supabase Auth only. No staff password is hard-coded in the client. After authentication, the app reads the user's `profiles.role` and routes `staff`, `manager`, and `admin` users to the staff dashboard.
- Staff accounts should be provisioned in Supabase Auth; public signup blocks the `.coffeehouse@gmail.com` pattern so customers cannot self-register as staff.
- Staff login redirects to `/staff/dashboard`.
- Staff dashboard is a separate UI from the customer dashboard.
- QR verification now renders a customer card in the browser and does not expose the raw QR token as the result.

## Secure Staff Authentication

Staff credentials must be created as normal Supabase Auth users. Give each staff member their own Supabase Auth password (the application never stores or hard-codes it). Set the corresponding `profiles.role` to `staff`, `manager`, or `admin`. Public signup blocks the `*.coffeehouse@gmail.com` staff email pattern, so staff accounts should be provisioned by an authorized administrator in Supabase.
