// src/types.ts

// The structure required by Bolt's UI components (ProductCard, Cart)
export interface Product {
  id: number; // Converted ID for internal cart functions
  name: string;
  price: number;
  image: string; // Mapped from image_url
  category: string;
  rating: number;
  reviews: number; // Assuming reviews means rating count (number)
  inStock: boolean;
  description: string;
  stock_quantity: number; // Required for stock checks
  product_id_string: string; // <-- Original UUID for database inserts
}

// The item structure stored in the cart state
export interface CartItem extends Product {
  quantity: number;
}

// The direct structure fetched from Supabase (used in Home/Details logic)
export type FetchedProduct = {
  id: string; // Original string UUID
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  category?: string;
  rating?: number;
};