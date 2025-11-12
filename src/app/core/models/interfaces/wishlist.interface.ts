// ========== INTERFACES EXISTENTES ==========
export interface DataWishlist {
  success: boolean;
  message: string;
  data: DatumWishlist[];
  summary: SummaryWishlist;
  meta: MetaWishlist;
}

export interface DatumWishlist {
  id: string;
  product: ProductWishlist;
  note: string;
  priceWhenAdded: string;
  priceChange: PriceChange;
  availability: Availability;
  addedAt: Date;
  lastViewedAt: Date | null;
  viewCount: number;
}

export interface Availability {
  isAvailable: boolean;
  stock: number;
  message: string;
}

export interface PriceChange {
  hasChanged: boolean;
  currentPrice: number;
  originalPrice: string;
  changeType: string;
  changeAmount: number;
  changePercentage: number;
}

export interface ProductWishlist {
  id: string;
  name: string;
  slug: string;
  image: string;
  images: string[];
  price: number;
  originalPrice: number;
  finalPrice: number;
  discountPercentage: string;
  subcategory: string;
  brand: string;
  volume: string;
  isActive: boolean;
  isAvailable: boolean;
  stock: number;
  stockStatus: string;
  rating: number;
  reviewCount: number;
}

export interface MetaWishlist {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SummaryWishlist {
  totalItems: number;
  totalValue: number;
  totalDiscount: number;
  availableItems: number;
  unavailableItems: number;
  itemsOnSale: number;
  averagePrice: number;
}

// ========== NUEVAS INTERFACES PARA REQUESTS ==========
export interface AddToWishlistRequest {
  productId: string;
  note?: string;
  visibility?: 'private' | 'public';
}

export interface MoveToCartRequest {
  productId: string;
  quantity: number;
  removeFromWishlist?: boolean;
  note?: string;
}

export interface WishlistQueryParams {
  page?: number;
  limit?: number;
}

// ========== INTERFACES PARA RESPONSES ==========
export interface WishlistActionResponse {
  success: boolean;
  message: string;
  action: 'added' | 'removed' | 'moved_to_cart';
  affectedItem: {
    productId: string;
    productName: string;
  };
  wishlist: DataWishlist;
}

export interface WishlistCheckResponse {
  success: boolean;
  message: string;
  data: {
    inWishlist: boolean;
    itemId?: string;
  };
}

export interface WishlistCountResponse {
  success: boolean;
  message: string;
  data: {
    totalItems: number;
    totalValue: number;
    availableItems: number;
    unavailableItems: number;
  };
}

export interface PriceChangesResponse {
  success: boolean;
  message: string;
  data: {
    totalItems: number;
    itemsWithChanges: number;
    priceIncreases: number;
    priceDecreases: number;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      originalPrice: number;
      currentPrice: number;
      changeAmount: number;
      changePercentage: number;
      changeType: 'increased' | 'decreased';
      addedAt: string;
    }>;
  };
}

export interface ViewProductResponse {
  success: boolean;
  message: string;
  data: {
    productId: string;
    timestamp: string;
  };
}

export interface WishlistDebugResponse {
  success: boolean;
  message: string;
  data: {
    activeItems: Array<{
      id: string;
      productId: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
    inactiveItems: Array<{
      id: string;
      productId: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
    totalActiveCount: number;
    totalInactiveCount: number;
  };
}

export interface WishlistAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    note: string;
  };
}

export interface WishlistClearResponse {
  success: boolean;
  message: string;
  action: 'removed';
  wishlist: DataWishlist;
}
