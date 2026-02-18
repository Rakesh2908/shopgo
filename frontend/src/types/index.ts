export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface ProductRating {
  rate: number;
  count: number;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: ProductRating;
}

export interface CartItem {
  id: string;
  productId: number;
  title: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CartItemRequest {
  productId: number;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: number;
  title: string;
  priceCents: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
}

export interface WishlistItem {
  id: string;
  productId: number;
  product?: Product;
}

export interface Review {
  id: string;
  userId: string;
  productId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  avgRating: number;
  totalCount: number;
  page: number;
  limit: number;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: unknown;
  error?: ApiError;
}

export interface AuthTokens {
  accessToken: string;
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

