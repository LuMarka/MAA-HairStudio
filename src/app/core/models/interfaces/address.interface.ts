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
