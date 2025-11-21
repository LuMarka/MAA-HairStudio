export interface OrderTienda {
  success: boolean;
  message: string;
  data:    Data;
  meta:    Meta;
}

export interface Data {
  id:                   string;
  orderNumber:          string;
  user:                 User;
  items:                Item[];
  deliveryType:         string;
  shippingAddress:      null;
  shippingSnapshot:     null;
  subtotal:             string;
  shippingCost:         string;
  isShippingCostSet:    boolean;
  tax:                  string;
  total:                string;
  status:               string;
  paymentStatus:        string;
  shippingCostSetBy:    null;
  shippingCostSetAt:    null;
  shippingNotes:        null;
  customerNotifiedAt:   null;
  customerConfirmedAt:  null;
  mercadoPagoId:        null;
  mercadoPagoPaymentId: null;
  paymentMethod:        null;
  notes:                string;
  createdAt:            Date;
  updatedAt:            Date;
}

export interface Item {
  id:                   string;
  product:              Product;
  quantity:             number;
  unitPrice:            string;
  totalPrice:           string;
  productName:          string;
  productBrand:         string;
  productTypeHair:      string;
  productDesiredResult: string;
  productImage:         string;
  productVolume:        string;
}

export interface Product {
  id:                 string;
  name:               string;
  slug:               string;
  description:        string;
  shortDescription:   string;
  type_hair:          string;
  desired_result:     string;
  type_product:       null;
  price:              number;
  originalPrice:      number;
  discountPercentage: string;
  stock:              number;
  minStock:           number;
  trackInventory:     boolean;
  subcategory:        Subcategory;
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

export interface Subcategory {
  id:           string;
  name:         string;
  slug:         string;
  description:  string;
  displayOrder: number;
  color:        string;
  icon:         string;
  categoryId:   string;
  isActive:     boolean;
  createdAt:    Date;
  updatedAt:    Date;
}

export interface User {
  id:        string;
  name:      string;
  email:     string;
  role:      string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meta {
  deliveryType:         string;
  requiresShippingCost: boolean;
  isReadyForPayment:    boolean;
  statusDescription:    string;
}
