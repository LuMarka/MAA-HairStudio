export interface AddressInterface {
  success: boolean;
  message: string;
  data:    Datum[];
  meta:    Meta;
}

export interface Datum {
  id:                     string;
  recipientName:          string;
  phone:                  string;
  alternativePhone:       string;
  email:                  string;
  country:                string;
  province:               string;
  city:                   string;
  postalCode:             string;
  streetAddress:          string;
  addressLine2:           string;
  neighborhood:           string;
  landmark:               string;
  deliveryInstructions:   string;
  deliveryTimePreference: string;
  label:                  string;
  isDefault:              boolean;
  isActive:               boolean;
  isValidated:            boolean;
  validationStatus:       string;
  fullAddress:            string;
  isComplete:             boolean;
  createdAt:              Date;
  updatedAt:              Date;
}

export interface Meta {
  total:                 number;
  defaultAddressId:      string;
  hasValidatedAddresses: boolean;
}

/**
 * DTO para crear una dirección
 */
export interface CreateAddressDto {
  recipientName: string;
  phone: string;
  alternativePhone?: string;
  email?: string;
  province: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  addressLine2?: string;
  neighborhood?: string;
  landmark?: string;
  deliveryInstructions?: string;
  deliveryTimePreference?: string;
  label?: string;
  isDefault?: boolean;
}

/**
 * DTO para actualizar una dirección
 */
export interface UpdateAddressDto {
  recipientName?: string;
  phone?: string;
  alternativePhone?: string;
  email?: string;
  province?: string;
  city?: string;
  postalCode?: string;
  streetAddress?: string;
  addressLine2?: string;
  neighborhood?: string;
  landmark?: string;
  deliveryInstructions?: string;
  deliveryTimePreference?: string;
  label?: string;
}

/**
 * Respuesta de validación de dirección
 */
export interface AddressValidationResponse {
  success: boolean;
  message: string;
  data: {
    addressId: string;
    isValid: boolean;
    validationStatus: 'validated' | 'invalid' | 'pending';
    suggestions?: {
      province?: string;
      city?: string;
    };
    validationNotes?: string;
  };
}

/**
 * Respuesta de provincias
 */
export interface ProvincesResponse {
  success: boolean;
  message: string;
  data: string[];
}

/**
 * Respuesta de ciudades
 */
export interface CitiesResponse {
  success: boolean;
  message: string;
  data: {
    province: string;
    cities: string[];
  };
}

/**
 * Respuesta de operación simple
 */
export interface AddressOperationResponse {
  success: boolean;
  message: string;
  action: 'created' | 'updated' | 'deleted' | 'set_default';
  data: Datum;
}

/**
 * Respuesta de dirección por defecto
 */
export interface DefaultAddressResponse {
  success: boolean;
  message: string;
  action?: string;
  data: Datum | null;
}
