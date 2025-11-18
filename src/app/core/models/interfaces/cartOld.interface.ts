export interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  description?: string;
  inStock: boolean;
  maxQuantity: number;
}
