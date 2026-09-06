export type CustomizationOption = {
  id: string
  label: string
  price_delta: number
}

export type CustomizationGroup = {
  id: string
  name: string
  is_required: boolean
  allow_multiple: boolean
  customization_options: CustomizationOption[]
}

export type Product = {
  id: string
  name: string
  description: string | null
  base_price: number
  image_url: string | null
  is_available: boolean
  out_of_stock: boolean
  is_recommended: boolean
  category_id: string
  customization_groups: CustomizationGroup[]
}

export type ProductCategory = {
  id: string
  name: string
  display_order: number
}

// A single line in the cart: one product + the specific options chosen for it
export type CartLine = {
  lineId: string // client-generated id so identical products with different customizations can coexist
  product: Product
  quantity: number
  selectedOptions: CustomizationOption[]
  unitPrice: number // base_price + sum of selectedOptions price_delta
}

export type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded'

export type OrderItemRow = {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  selected_options: { label: string; price_delta: number }[]
  line_total: number
  products?: { name: string }
}

export type OrderRow = {
  id: string
  order_number: string
  status: OrderStatus
  payment_status: PaymentStatus
  subtotal: number
  tax: number
  total: number
  loyalty_points_earned: number
  pickup_time: string | null
  created_at: string
  order_items?: OrderItemRow[]
}

export type VerificationStatus = 'pending' | 'verified' | 'rejected'

export type IdentityVerification = {
  id: string
  customer_id: string
  document_type: string
  file_path: string
  status: VerificationStatus
  verified_at: string | null
  rejection_reason: string | null
  created_at: string
  profiles?: { full_name: string | null; member_id: string | null }
}

export type Notification = {
  id: string
  type: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

export type Ingredient = {
  id: string
  name: string
  unit: string
  current_quantity: number
  minimum_quantity: number
  supplier: string | null
  cost: number | null
  expiry_date: string | null
}
