/**
 * Interfaces para gestión de envíos con Zipnova
 */

// ========== TIPOS BASE ==========

export type ShippingStatus =
  | 'pending'      // Pendiente de cotización
  | 'quoted'       // Cotización obtenida
  | 'confirmed'    // Confirmado, listo para retirar
  | 'in_transit'   // En tránsito
  | 'delivered'    // Entregado
  | 'failed'       // Falló
  | 'cancelled';   // Cancelado

export type ServiceType = 'standard_delivery' | 'pickup_point';
export type LogisticType = 'crossdock' | 'carrier_dropoff' | string;

// ========== REQUEST DTOS ==========

/**
 * DTO para cotizar un envío
 */
export interface ShippingQuoteRequestDto {
  orderId: string;
  destinationAddressId: string;
}

/**
 * DTO para crear un envío (a domicilio)
 */
export interface CreateShippingRequestDto {
  orderId: string;
  destinationAddressId: string;
  zipnovaQuoteId: string;
  shippingCost: number;
  serviceType: ServiceType;
  logisticType: LogisticType;
  carrierId: string;
  pointId?: number; // Solo para pickup_point
}

// ========== RESPONSE INTERFACES ==========

/**
 * Punto de retiro para envíos
 */
export interface PickupPoint {
  pointId: number;
  description: string;
  address: string;
  city: string;
  zipcode: string;
  phone: string;
}

/**
 * Ubicación (origen o destino)
 */
export interface Location {
  city: string;
  state: string;
  zipcode: string;
}

/**
 * Opción de envío disponible
 */
export interface ShippingOption {
  carrier: string;
  carrierId: string;
  carrierLogo: string;
  serviceType: ServiceType;
  serviceName: string;
  logisticType: LogisticType;
  price: number;
  priceWithoutTax: number;
  priceShipment: number;
  priceInsurance: number;
  estimatedDays: number;
  estimatedDeliveryMin: number;
  estimatedDelivery: string;
  tags: string[];
  pickupPoints: PickupPoint[];
}

/**
 * Respuesta de cotización de envío
 */
export interface ShippingQuoteResponse {
  success: boolean;
  message: string;
  data: {
    origin: Location;
    destination: Location;
    options: ShippingOption[];
  };
}

/**
 * Datos de un envío creado/confirmado
 */
export interface Shipment {
  id: string;
  status: ShippingStatus;
  trackingNumber: string;
  carrier: string;
  service: string;
  shippingCost: number;
  estimatedDeliveryDate?: string;
  deliveredAt?: string | null;
  labelUrl?: string | null;
}

/**
 * Respuesta al crear un envío
 */
export interface CreateShippingResponse {
  success: boolean;
  message: string;
  data: Shipment;
}

/**
 * Evento de seguimiento del envío
 */
export interface ShippingEvent {
  date: string;
  status: string;
  description: string;
}

/**
 * Datos detallados del seguimiento
 */
export interface ShippingTracking {
  id: string;
  status: ShippingStatus;
  trackingNumber: string;
  carrier: string;
  estimatedDeliveryDate: string;
  deliveredAt: string | null;
  events: ShippingEvent[];
}

/**
 * Respuesta al obtener estado del envío
 */
export interface GetShippingResponse {
  success: boolean;
  data: ShippingTracking;
}

/**
 * Respuesta al obtener envío de una orden
 */
export interface GetShippingByOrderResponse {
  success: boolean;
  message?: string;
  data: Shipment | null;
}

// ========== TYPES PARA COMPONENTES ==========

/**
 * Información seleccionada de envío para guardar
 */
export interface SelectedShippingOption {
  carrierId: string;
  serviceType: ServiceType;
  logisticType: LogisticType;
  price: number;
  pointId?: number; // Solo si es pickup_point
  carrier: string;
  estimatedDelivery: string;
}
