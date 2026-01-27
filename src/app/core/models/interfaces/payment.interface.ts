/**
 * DTO para crear preferencia de pago
 */
export interface CreatePreferenceDto {
  orderId: string;
  returnUrl?: string;  // ❌ Opcional
  notes?: string;      // ❌ Opcional
}

/**
 * 1️⃣ Interfaz para la respuesta de crear preferencia de Mercado Pago
 * POST /payments/create-preference
 */
export interface CreatePreferenceResponse {
  success: boolean;
  message: string;
  data: {
    paymentId: string;
    preferenceId: string;
    initPoint: string;
    sandboxInitPoint: string;
    orderId: string;
    amount: number;
    currency: string;
    expiresAt: string;
  };
}

/**
 * Información de la orden dentro de respuestas de pago
 */
export interface OrderPaymentInfo {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentStatus?: string;
}

/**
 * Información de transacción de pago
 */
export interface PaymentTransaction {
  id: string;
  type: 'charge' | 'refund' | 'adjustment';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  createdAt: string;
}

/**
 * 2️⃣ Interfaz para el estado del pago (usado en múltiples respuestas)
 */
export interface PaymentStatus {
  id: string;
  status: 'approved' | 'pending' | 'rejected' | 'in_process' | 'cancelled';
  statusDetail: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  mercadoPagoPaymentId?: string | null;
  paymentId?: string | null;
  merchantOrderId?: string | null;
  externalReference?: string;
  paymentType?: string | null;
  paymentMethodId?: string | null;
  transactionAmount?: number | null;
  dateApproved?: string | null;
  dateCreated?: string;
  createdAt?: string;
  updatedAt?: string;
  webhookProcessed: boolean;
  // Campos adicionales para pagos rechazados
  failureReason?: string;
  retryCount?: number;
  // Campos adicionales para detalles completos
  idempotencyKey?: string;
  approvedAt?: string;
  order?: OrderPaymentInfo;
  transactions?: PaymentTransaction[];
}

/**
 * 5️⃣ Interfaz para la respuesta de obtener pago por orden
 * GET /payments/order/:orderId
 */
export interface GetPaymentByOrderResponse {
  success: boolean;
  message: string;
  data: PaymentStatus | null;
}

/**
 * 2️⃣ Interfaz para la respuesta de verificación de pago
 * GET /payments/verify/:orderId
 */
export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  status: 'approved' | 'pending' | 'rejected' | 'in_process' | 'cancelled' | null;
  order?: OrderPaymentInfo;
  data?: PaymentStatus;
}

/**
 * 3️⃣ Interfaz para el historial de pagos
 * GET /payments/history?page=1&limit=10
 */
export interface PaymentHistoryResponse {
  data: PaymentStatus[];
  page: number;
  limit: number;
  total: number;
}

/**
 * 4️⃣ Interfaz para detalles completos de un pago específico
 * GET /payments/:paymentId
 * Nota: Respuesta directa sin wrapper success/message/data
 */
export interface PaymentDetailsResponse extends PaymentStatus {
  order?: OrderPaymentInfo;
  transactions?: PaymentTransaction[];
}

/**
 * 6️⃣ Interfaz para la respuesta de sincronización
 * PATCH /payments/:paymentId/sync
 */
export interface SyncPaymentResponse {
  success: boolean;
  message: string;
  data: PaymentStatus;
}

/**
 * 7️⃣ Interfaz para la respuesta de cancelación
 * PATCH /payments/:paymentId/cancel
 */
export interface CancelPaymentResponse {
  success: boolean;
  message: string;
  data: PaymentStatus;
}

/**
 * 8️⃣ Interfaz para búsqueda de pagos en Mercado Pago (Admin)
 * GET /payments/admin/search/:orderId
 */
export interface MercadoPagoSearchResult {
  id: number;
  status: string;
  transaction_amount: number;
  external_reference: string;
  payment_method_id: string;
  date_created: string;
  date_approved?: string;
}

/**
 * 8️⃣ Interfaz para la respuesta de búsqueda en Mercado Pago
 */
export interface AdminSearchPaymentsResponse {
  success: boolean;
  message: string;
  data: MercadoPagoSearchResult[];
  count: number;
}

/**
 * Estados posibles de un pago
 */
export type PaymentStatusType =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'in_process'
  | 'cancelled';

/**
 * Métodos de pago posibles
 */
export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'wallet'
  | 'cash'
  | 'ticket';

/**
 * Tipos de transacciones
 */
export type TransactionType = 'charge' | 'refund' | 'adjustment';

/**
 * Estados de transacción
 */
export type TransactionStatus = 'completed' | 'pending' | 'failed';
