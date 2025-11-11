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
  Description:   string;
  shortDescription:   string;//lalalala
  type_hair:          string;
  desired_result:     string;
  type_product:       null;
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
  collection:         string;
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
  applied:      number;
  search:       null;
  category:     null;
  subcategory:  null;
  brand:        null;
  collection:   null;
  type_product: null;
  priceRange:   null;
  sorting:      Sorting;
}

export interface Sorting {
  sortBy:    string;
  sortOrder: string;
}

export interface Meta {
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
