export interface DataWishlist {
  success: boolean;
  message: string;
  data:    DatumWishlist[];
  summary: SummaryWishlist;
  meta:    MetaWishlist;
}

export interface DatumWishlist {
  id:             string;
  product:        ProductWishlist;
  note:           string;
  priceWhenAdded: string;
  priceChange:    PriceChange;
  availability:   Availability;
  addedAt:        Date;
  lastViewedAt:   null;
  viewCount:      number;
}

export interface Availability {
  isAvailable: boolean;
  stock:       number;
  message:     string;
}

export interface PriceChange {
  hasChanged:       boolean;
  currentPrice:     number;
  originalPrice:    string;
  changeType:       string;
  changeAmount:     number;
  changePercentage: number;
}

export interface ProductWishlist {
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
  rating:             number;
  reviewCount:        number;
}

export interface MetaWishlist {
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SummaryWishlist {
  totalItems:       number;
  totalValue:       number;
  totalDiscount:    number;
  availableItems:   number;
  unavailableItems: number;
  itemsOnSale:      number;
  averagePrice:     number;
}
