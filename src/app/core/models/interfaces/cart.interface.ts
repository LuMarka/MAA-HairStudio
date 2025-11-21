export interface CartInterface {
  success: boolean;
  message: string;
  data:    Datum[];
  summary: Summary;
  meta:    Meta;
  cart:    Cart;
}

export interface Cart {
  id:             string;
  status:         string;
  createdAt:      Date;
  updatedAt:      Date;
  lastActivityAt: Date;
}

export interface Datum {
  id:             string;
  product:        Product;
  quantity:       number;
  unitPrice:      string;
  originalPrice:  string;
  subtotal:       number;
  totalDiscount:  number;
  isOnSale:       boolean;
  note:           string;
  addedAt:        Date;
  lastModifiedAt: Date;
}

export interface Product {
  id:                 string;
  name:               string;
  slug:               string;
  image:              string;
  images:             string[];
  price:              number;
  originalPrice:      number;
  finalPrice:         number;
  discountPercentage: string;
  subcategory:        string;
  brand:              string;
  volume:             string;
  isActive:           boolean;
  isAvailable:        boolean;
  stock:              number;
  stockStatus:        string;
}

export interface Meta {
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Summary {
  totalItems:        number;
  totalQuantity:     number;
  subtotal:          number;
  totalDiscount:     number;
  totalAmount:       number;
  estimatedTax:      number;
  estimatedShipping: number;
  estimatedTotal:    number;
}

// ========== INTERFACES DE REQUEST ==========

export interface AddToCartRequest {
  readonly productId: string;
  readonly quantity: number;
  readonly note?: string;
}

export interface UpdateCartRequest {
  readonly productId: string;
  readonly quantity: number;
  readonly action: 'set' | 'increment' | 'decrement';
  readonly note?: string;
}

export interface CartQueryParams {
  readonly page?: number;
  readonly limit?: number;
}

// ========== INTERFACES DE RESPONSE ==========

export interface CartActionResponse {
  readonly success: boolean;
  readonly message: string;
  readonly action: 'added' | 'updated' | 'removed' | 'cleared';
  readonly affectedItem?: {
    readonly productId: string;
    readonly productName: string;
    readonly previousQuantity?: number;
    readonly newQuantity: number;
  };
  readonly cart: CartInterface;
}

export interface CartSummaryResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data: Summary;
}

export interface CartCountResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data: {
    readonly totalItems: number;
    readonly totalQuantity: number;
    readonly totalAmount: number;
  };
}

export interface CartValidationResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data: {
    readonly totalItems: number;
    readonly availableItems: number;
    readonly unavailableItems: number;
    readonly details: readonly CartValidationDetail[];
    readonly hasUnavailableItems: boolean;
  };
}

export interface CartValidationDetail {
  readonly itemId: string;
  readonly productId: string;
  readonly productName: string;
  readonly requestedQuantity: number;
  readonly available: boolean;
  readonly availableStock: number;
  readonly message: string;
}

export interface AbandonedCartsResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data: {
    readonly note: string;
  };
}
