export interface Product {
  id: number;
  name: string;
  brand: 'Loreal' | 'Kerastase';
  collection: string; // en lugar de familia
  type: string;       // shampoo, conditioner, etc.
  description: string;
  price: number;
  image: string;
}
export interface Data {
  success: boolean;
  message: string;
  data:    Datum[];
  meta:    Meta;
  filters: Filters;
}

export interface Datum {
  id:                 string;
  name:               string;
  slug:               string;
  description:        string;
  shortDescription:   string;
  type_hair:          string;
  desired_result:     string;
  price:              number;
  originalPrice:      number;
  discountPercentage: string;
  stock:              number;
  minStock:           number;
  trackInventory:     boolean;
  subcategory:        Category;
  subcategoryId:      string;
  image:              string;
  images:             string[];
  videoUrl:           null;
  brand:              string;
  volume:             string;
  sku:                string;
  barcode:            null;
  rating:             number;
  reviewCount:        number;
  isActive:           boolean;
  isFeatured:         boolean;
  isAvailable:        boolean;
  isDiscontinued:     boolean;
  metaDescription:    null;
  tags:               string[];
  viewCount:          number;
  purchaseCount:      number;
  lastPurchaseAt:     null;
  createdAt:          Date;
  updatedAt:          Date;
}

export interface Category {
  id:           string;
  name:         string;
  slug:         string;
  description:  string;
  displayOrder: number;
  color:        string;
  icon:         string;
  category?:    Category;
  categoryId?:  string;
  isActive?:    boolean;
  createdAt:    Date;
  updatedAt:    Date;
  image?:       string;
}

export interface Filters {
  applied:     number;
  search:      null;
  category:    null;
  subcategory: null;
  priceRange:  null;
}

export interface Meta {
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
