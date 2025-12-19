/**
 * Interfaz para la respuesta de crear preferencia de Mercado Pago
 */
export interface CreatePreferenceResponse {
  success: boolean;
  message: string;
  data: {
    preferenceId: string;
    initPoint: string;
    sandboxInitPoint: string;
  };
}

/**
 * Interfaz para el estado del pago
 */
export interface PaymentStatus {
  id: string;
  status: 'approved' | 'pending' | 'rejected' | 'in_process' | 'cancelled';
  statusDetail: string;
  paymentId: string | null;
  merchantOrderId: string | null;
  externalReference: string;
  paymentType: string | null;
  paymentMethodId: string | null;
  transactionAmount: number | null;
  dateApproved: string | null;
  dateCreated: string;
}

/**
 * Interfaz para la respuesta de obtener pago por orden
 */
export interface GetPaymentByOrderResponse {
  success: boolean;
  message: string;
  data: PaymentStatus | null;
}

/**
 * DTO para crear preferencia de pago
 */
export interface CreatePreferenceDto {
  orderId: string;
}
