/**
 * Respuesta principal de una orden (tienda o casa)
 */
export interface OrderInterface {
  success: boolean;
  message: string;
  data: OrderData;
  meta: OrderMeta;
}

/**
 * Datos principales de una orden
 */
export interface OrderData {
  id: string;
  orderNumber: string;
  user: OrderUser;
  items: OrderItem[];
  deliveryType: DeliveryType;
  shippingAddress: OrderShippingAddress | null;
  shippingSnapshot: OrderShippingSnapshot | null;
  subtotal: string;
  shippingCost: string;
  isShippingCostSet: boolean;
  tax: string;
  total: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingCostSetBy: string | null;
  shippingCostSetAt: Date | null;
  shippingNotes: string | null;
  customerNotifiedAt: Date | null;
  customerConfirmedAt: Date | null;
  mercadoPagoId: string | null;
  mercadoPagoPaymentId: string | null;
  paymentMethod: string | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Item de una orden
 */
export interface OrderItem {
  id: string;
  product: OrderProduct;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  productName: string;
  productBrand: string;
  productTypeHair: string;
  productDesiredResult: string;
  productImage: string;
  productVolume: string;
}

/**
 * Producto dentro de una orden
 */
export interface OrderProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  type_hair: string;
  desired_result: string;
  type_product: string | null;
  price: number;
  originalPrice: number;
  discountPercentage: string;
  stock: number;
  minStock: number;
  trackInventory: boolean;
  subcategory: OrderSubcategory;
  subcategoryId: string;
  image: string;
  images: string[];
  videoUrl: string | null;
  brand: string;
  collection: string;
  volume: string;
  sku: string;
  barcode: string | null;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  isDiscontinued: boolean;
  metaDescription: string | null;
  tags: string[];
  viewCount: number;
  purchaseCount: number;
  lastPurchaseAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subcategoría de un producto
 */
export interface OrderSubcategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  color: string;
  icon: string;
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dirección de envío completa (solo para deliveryType: 'casa')
 */
export interface OrderShippingAddress {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  alternativePhone: string;
  email: string;
  country: string;
  province: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  addressLine2: string;
  neighborhood: string;
  landmark: string;
  deliveryInstructions: string;
  deliveryTimePreference: string;
  label: string;
  isDefault: boolean;
  isActive: boolean;
  isValidated: boolean;
  validationStatus: string;
  validationNotes: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Snapshot de dirección de envío (datos capturados al momento de la orden)
 */
export interface OrderShippingSnapshot {
  recipientName: string;
  phone: string;
  fullAddress: string;
  province: string;
  city: string;
  postalCode: string;
  deliveryInstructions: string;
}

/**
 * Usuario de la orden
 */
export interface OrderUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Metadata de la orden
 */
export interface OrderMeta {
  deliveryType: DeliveryType;
  requiresShippingCost: boolean;
  isReadyForPayment: boolean;
  statusDescription: string;
}

/**
 * Tipos de entrega
 */
export type DeliveryType = 'pickup' | 'delivery';

/**
 * Estados de la orden
 */
export type OrderStatus =
  | 'pending'           // Pendiente
  | 'confirmed'         // Confirmada
  | 'processing'        // En preparación
  | 'ready_pickup'      // Lista para retiro (tienda)
  | 'shipped'           // Enviada (casa)
  | 'in_transit'        // En tránsito (casa)
  | 'delivered'         // Entregada
  | 'completed'         // Completada
  | 'cancelled'         // Cancelada
  | 'refunded';         // Reembolsada

/**
 * Estados de pago
 */
export type PaymentStatus =
  | 'pending'           // Pendiente
  | 'payment_pending'   // Esperando confirmación
  | 'approved'          // Aprobado
  | 'rejected'          // Rechazado
  | 'refunded'          // Reembolsado
  | 'cancelled';        // Cancelado

/**
 * DTO para crear una orden
 */
export interface CreateOrderDto {
  deliveryType: DeliveryType;
  shippingAddressId?: string; // Solo para deliveryType: 'casa'
  notes?: string;
}

/**
 * Respuesta de creación de orden
 */
export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    orderNumber: string;
    deliveryType: DeliveryType;
    status: OrderStatus;
    total: string;
    requiresShippingCost: boolean;
    isReadyForPayment: boolean;
  };
}

/**
 * Type guards para verificar tipo de orden
 */
export function isHomeDeliveryOrder(order: OrderData): order is OrderData & {
  shippingAddress: OrderShippingAddress;
  shippingSnapshot: OrderShippingSnapshot;
} {
  return order.deliveryType === 'delivery' && order.shippingAddress !== null;
}

export function isStorePickupOrder(order: OrderData): order is OrderData & {
  shippingAddress: null;
  shippingSnapshot: null;
} {
  return order.deliveryType === 'pickup';
}

/**
 * Respuesta de lista de órdenes
 */
export interface OrderListResponse {
  success: boolean;
  message: string;
  data: OrderData[];
  meta: OrderListMeta;
}

/**
 * Metadata de lista de órdenes
 */
export interface OrderListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters?: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    userId?: string;
    startDate?: string;
    endDate?: string;
  };
}

/**
 * Parámetros de consulta para órdenes
 */
export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * DTO para establecer costo de envío
 */
export interface SetShippingCostDto {
  shippingCost: number;
  shippingNotes?: string;
}

/**
 * DTO para confirmar orden
 */
export interface ConfirmOrderDto {
  confirm: boolean;
}

/**
 * DTO para actualizar estado de orden
 */
export interface UpdateOrderStatusDto {
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

/**
 * Respuesta de estadísticas
 */
export interface OrderStatisticsResponse {
  success: boolean;
  message: string;
  data: {
    totalOrders: number;
    ordersByStatus: Record<string, number>;
    revenue: {
      total: number;
      currency: string;
    };
    periods: {
      today: number;
      thisMonth: number;
    };
  };
}
