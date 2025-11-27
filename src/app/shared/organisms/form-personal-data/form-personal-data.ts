import { Component, ChangeDetectionStrategy, input, output, computed, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { AddressService } from '../../../core/services/address.service';
import type { Datum as AddressData } from '../../../core/models/interfaces/address.interface';

type DeliveryType = 'pickup' | 'delivery';

interface CartItem {
  id: string;
  name: string;
  brand?: string;
  quantity: number;
  price: number;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressId?: string; // ID de dirección guardada seleccionada
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  deliveryInstructions?: string;
}

/**
 * Organismo para el formulario de datos personales y dirección de entrega
 *
 * @responsibility Capturar información del cliente y dirección según tipo de entrega
 * @features
 * - Carga automática de direcciones guardadas para usuarios autenticados
 * - Selector de direcciones guardadas con prellenado automático
 * - Validación dinámica según tipo de entrega (pickup/delivery)
 * - Prellenado automático con datos del usuario autenticado
 * - Resumen del carrito en tiempo real
 * - Cálculos de totales con IVA
 */
@Component({
  selector: 'app-form-personal-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-personal-data.html',
  styleUrl: './form-personal-data.scss'
})
export class FormPersonalData {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly addressService = inject(AddressService);

  // ========== INPUTS ==========
  readonly deliveryOption = input.required<DeliveryType>();
  readonly initialData = input<Partial<FormData>>({});

  // ========== OUTPUTS ==========
  readonly formDataChange = output<FormData>();
  readonly formValidChange = output<boolean>();
  readonly editCart = output<void>();
  readonly continue = output<void>();

  // ========== SIGNALS ==========
  readonly formValid = signal(false);
  readonly selectedAddressId = signal<string | null>(null);

  // ========== COMPUTED - DELIVERY OPTIONS ==========
  readonly isDelivery = computed(() => this.deliveryOption() === 'delivery');
  readonly isPickup = computed(() => this.deliveryOption() === 'pickup');

  readonly deliveryOptionText = computed(() =>
    this.isDelivery() ? 'Envío a domicilio' : 'Retiro en tienda'
  );

  readonly deliveryBadgeText = computed(() =>
    this.isDelivery() ? '🚚 Envío' : '🏪 Retiro'
  );

  // ========== COMPUTED - ADDRESSES ==========
  readonly savedAddresses = computed(() => this.addressService.addresses());
  readonly hasAddresses = computed(() => this.addressService.hasAddresses());
  readonly isLoadingAddresses = computed(() => this.addressService.isLoading());
  readonly addressesError = computed(() => this.addressService.errorMessage());

  readonly selectedAddress = computed(() => {
    const addressId = this.selectedAddressId();
    if (!addressId) return null;
    return this.savedAddresses().find(addr => addr.id === addressId) ?? null;
  });

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  readonly showAddressSelector = computed(() => {
    return this.isDelivery() && this.isAuthenticated() && this.hasAddresses();
  });

  // ========== COMPUTED - CART DATA ==========
  readonly cartItems = computed<CartItem[]>(() => {
    const cart = this.cartService.cart();
    if (!cart?.data) return [];

    return cart.data.map(item => ({
      id: item.product.id,
      name: item.product.name,
      brand: item.product.brand,
      quantity: item.quantity,
      price: item.product.finalPrice
    }));
  });

  readonly hasCartItems = computed(() => this.cartItems().length > 0);
  readonly cartItemsCount = computed(() => this.cartItems().length);

  // ========== COMPUTED - TOTALS ==========
  readonly subtotal = computed(() => this.cartService.subtotal());
  readonly ivaAmount = computed(() => this.subtotal() * 0.21);
  readonly totalWithIva = computed(() => this.cartService.totalAmount());
  readonly shippingText = computed(() => this.isDelivery() ? 'A convenir' : 'Gratis');
  readonly deliveryTimeText = computed(() => this.isDelivery() ? '3-5 días hábiles' : 'Lunes a Viernes');
  readonly deliveryTimeLabel = computed(() => this.isDelivery() ? 'Tiempo estimado:' : 'Disponible:');

  // ========== COMPUTED - VALIDATION ==========
  readonly validationMessage = computed(() => {
    if (this.formValid()) return 'Información completa';

    return this.isDelivery()
      ? 'Completa nombre, email, teléfono, dirección y ciudad'
      : 'Completa nombre, email y teléfono';
  });

  // ========== FORM ==========
  readonly orderForm: FormGroup = this.fb.group({
    firstName: [this.authService.currentUser()?.name || '', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: [this.authService.currentUser()?.email || '', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[\d\s\+\-\(\)]+$/)]],
    province: [''],
    address: [''],
    city: [''],
    postalCode: [''],
    deliveryInstructions: ['']
  });

  // ========== CONSTRUCTOR ==========
  constructor() {
    // Effect: Cargar direcciones cuando es delivery y usuario autenticado
    effect(() => {
      if (this.isDelivery() && this.isAuthenticated()) {
        console.log('📍 Cargando direcciones guardadas...');
        this.addressService.getAddresses().subscribe({
          next: () => {
            const defaultAddr = this.addressService.defaultAddress();
            if (defaultAddr) {
              this.selectedAddressId.set(defaultAddr.id);
              console.log('✅ Dirección predeterminada seleccionada:', defaultAddr.id);
            }
          },
          error: (error) => {
            console.error('❌ Error cargando direcciones:', error);
          }
        });
      }
    });

    // Effect: Prellenar formulario con dirección seleccionada
    effect(() => {
      const selectedAddr = this.selectedAddress();
      if (selectedAddr) {
        this.orderForm.patchValue({
          phone: selectedAddr.phone || '',
          province: selectedAddr.province,
          address: selectedAddr.streetAddress,
          city: selectedAddr.city,
          postalCode: selectedAddr.postalCode,
          deliveryInstructions: selectedAddr.deliveryInstructions || ''
        }, { emitEvent: false });
        console.log('📝 Formulario prellenado con dirección:', selectedAddr.id);
      }
    });

    // Effect: Actualizar validadores según tipo de entrega
    effect(() => {
      const deliveryOption = this.deliveryOption();
      this.updateFormValidators(deliveryOption);

      if (deliveryOption === 'pickup') {
        this.clearAddressFields();
        this.selectedAddressId.set(null);
      }
    });

    // Effect: Cargar datos iniciales
    effect(() => {
      const data = this.initialData();
      if (data && Object.keys(data).length > 0) {
        this.orderForm.patchValue(data, { emitEvent: false });
      }
    });

    // Subscribe: Cambios del formulario
    this.orderForm.valueChanges.subscribe(() => {
      this.checkFormValidity();
      this.emitFormData();
    });

    this.orderForm.statusChanges.subscribe(() => {
      this.checkFormValidity();
    });
  }

  // ========== MÉTODOS PÚBLICOS - GESTIÓN DE DIRECCIONES ==========

  /**
   * Maneja el cambio de dirección seleccionada
   */
  onAddressChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const addressId = selectElement.value;

    if (addressId === '') {
      // Sin dirección seleccionada
      this.selectedAddressId.set(null);
      this.clearAddressFields();
      console.log('📍 Sin dirección seleccionada');
    } else {
      // Dirección seleccionada
      this.selectedAddressId.set(addressId);
      console.log('📍 Dirección seleccionada:', addressId);
    }

    this.checkFormValidity();
  }

  /**
   * Formatea una dirección para mostrar en el selector
   */
  formatAddressForSelect(address: AddressData): string {
    const parts = [
      address.streetAddress,
      address.city,
      address.province
    ].filter(Boolean);

    return parts.join(', ');
  }

  // ========== MÉTODOS PRIVADOS - VALIDACIÓN ==========
  private updateFormValidators(deliveryOption: DeliveryType): void {
    const addressControl = this.orderForm.get('address');
    const provinceControl = this.orderForm.get('province');
    const cityControl = this.orderForm.get('city');
    const postalCodeControl = this.orderForm.get('postalCode');

    if (deliveryOption === 'delivery') {
      addressControl?.setValidators([Validators.required, Validators.minLength(5)]);
      provinceControl?.setValidators([Validators.required, Validators.minLength(2)]);
      cityControl?.setValidators([Validators.required, Validators.minLength(2)]);
      postalCodeControl?.setValidators([Validators.required, Validators.minLength(4)]);
    } else {
      addressControl?.clearValidators();
      provinceControl?.clearValidators();
      cityControl?.clearValidators();
      postalCodeControl?.clearValidators();
    }

    addressControl?.updateValueAndValidity({ emitEvent: false });
    provinceControl?.updateValueAndValidity({ emitEvent: false });
    cityControl?.updateValueAndValidity({ emitEvent: false });
    postalCodeControl?.updateValueAndValidity({ emitEvent: false });
  }

  private clearAddressFields(): void {
    this.orderForm.patchValue({
      address: '',
      province: '',
      city: '',
      postalCode: '',
      deliveryInstructions: ''
    }, { emitEvent: false });
  }

  private checkFormValidity(): void {
    const form = this.orderForm;
    const deliveryOption = this.deliveryOption();

    const firstNameValid = form.get('firstName')?.valid ?? false;
    const lastNameValid = form.get('lastName')?.valid ?? false;
    const emailValid = form.get('email')?.valid ?? false;
    const phoneValid = form.get('phone')?.valid ?? false;

    let isValid = firstNameValid && lastNameValid && emailValid && phoneValid;

    if (deliveryOption === 'delivery') {
      const addressValid = form.get('address')?.valid ?? false;
      const provinceValid = form.get('province')?.valid ?? false;
      const cityValid = form.get('city')?.valid ?? false;
      const postalCodeValid = form.get('postalCode')?.valid ?? false;

      isValid = isValid && addressValid && provinceValid && cityValid && postalCodeValid;
    }

    const previousValid = this.formValid();
    this.formValid.set(isValid);

    if (previousValid !== isValid) {
      this.formValidChange.emit(isValid);
    }
  }

  private emitFormData(): void {
    if (this.formValid()) {
      const formValue = this.orderForm.value;
      const data: FormData = {
        firstName: formValue.firstName || '',
        lastName: formValue.lastName || '',
        email: formValue.email || '',
        phone: formValue.phone || '',
        deliveryInstructions: formValue.deliveryInstructions || undefined
      };

      if (this.isDelivery()) {
        const selectedAddr = this.selectedAddress();

        // Si hay dirección guardada seleccionada, enviar solo el ID
        if (selectedAddr) {
          data.addressId = selectedAddr.id;
        } else {
          // Si no hay dirección seleccionada, enviar campos manuales
          data.address = formValue.address || undefined;
          data.city = formValue.city || undefined;
          data.postalCode = formValue.postalCode || undefined;
          data.province = formValue.province || undefined;
        }
      }

      this.formDataChange.emit(data);
    }
  }

  // ========== MÉTODOS PÚBLICOS - VALIDACIÓN ==========
  isFieldInvalid(fieldName: string): boolean {
    const field = this.orderForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.orderForm.get(fieldName);

    if (!field?.errors || (!field.dirty && !field.touched)) {
      return '';
    }

    const fieldLabels: Record<string, string> = {
      firstName: 'El nombre',
      lastName: 'El apellido',
      email: 'El email',
      province: 'La provincia',
      phone: 'El teléfono',
      address: 'La dirección',
      city: 'La ciudad',
      postalCode: 'El código postal'
    };

    const fieldLabel = fieldLabels[fieldName] || 'Este campo';

    if (field.errors['required']) {
      return `${fieldLabel} es requerido`;
    }

    if (field.errors['email']) {
      return 'Ingresa un email válido';
    }

    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `${fieldLabel} debe tener al menos ${minLength} caracteres`;
    }

    if (field.errors['pattern']) {
      return 'Formato de teléfono inválido';
    }

    return 'Campo inválido';
  }

  // ========== MÉTODOS PÚBLICOS - EVENTOS ==========
  onEditCart(): void {
    this.editCart.emit();
  }

  onNextStep(): void {
    this.orderForm.markAllAsTouched();
    this.checkFormValidity();

    if (!this.formValid()) {
      return;
    }

    this.continue.emit();
  }

  // ========== MÉTODOS PÚBLICOS - API ==========
  reset(): void {
    this.orderForm.reset();
    this.formValid.set(false);
    this.selectedAddressId.set(null);
  }

  markAllAsTouched(): void {
    this.orderForm.markAllAsTouched();
    this.checkFormValidity();
  }

  getFormValue(): FormData {
    return this.orderForm.value;
  }

  setFormValue(data: Partial<FormData>): void {
    this.orderForm.patchValue(data);
  }
}
