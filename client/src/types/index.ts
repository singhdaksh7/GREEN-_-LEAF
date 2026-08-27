export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent: string | null;
  order: number;
  isActive: boolean;
  children?: Category[];
}

export interface ProductVariant {
  _id?: string;
  sku: string;
  attributes: Record<string, string>;
  mrp: number;
  salePrice: number;
  stock: number;
  images: string[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  howToUse?: string;
  sku: string;
  brand: string;
  category: Category | string;
  subcategory?: Category | string | null;
  images: string[];
  variants: ProductVariant[];
  mrp: number;
  salePrice: number;
  stock: number;
  tags: string[];
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  averageRating: number;
  reviewCount: number;
  isActive: boolean;
}

export interface PaginatedResult<T> {
  page: number;
  limit: number;
  totalProducts: number;
  totalPages: number;
  products: T[];
}

export interface CartLine {
  productId: string;
  slug: string;
  variantSku: string | null;
  name: string;
  image: string;
  variant: Record<string, string> | null;
  quantity: number;
  unitPrice: number;
  mrp: number;
  totalPrice: number;
  stock: number;
  inStock: boolean;
}

export interface PricedCart {
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  freeShippingThreshold: number;
  amountToFreeShipping: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
}

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'SHIPPED'
  | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'COD';

export interface OrderItem {
  product: string;
  productName: string;
  productImage: string;
  sku: string;
  variant: Record<string, string> | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user?: string | { _id: string; name: string; email: string };
  items: OrderItem[];
  shippingAddress: {
    fullName: string; phone: string; email: string; addressLine: string;
    locality: string; city: string; state: string; pincode: string;
  };
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  couponCode: string | null;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  orderStatus: OrderStatus;
  statusHistory: { status: OrderStatus; changedAt: string; note?: string }[];
  createdAt: string;
}

export interface Review {
  _id: string;
  product: string;
  user: { _id: string; name: string } | string;
  rating: number;
  title: string;
  description: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface SiteSettings {
  announcementText: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  whatsappNumber: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  workingHours: string;
  socialLinks: { instagram?: string; facebook?: string; youtube?: string; linkedin?: string };
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string;
  publishedAt: string;
}
