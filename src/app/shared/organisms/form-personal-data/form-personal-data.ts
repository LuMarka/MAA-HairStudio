import { Component, ChangeDetectionStrategy, input, output, computed, signal, effect, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { AddressService } from '../../../core/services/address.service';
import { OrderService } from '../../../core/services/order.service';
import { CartSummary } from '../../molecules/cart-summary/cart-summary';
import type { Datum as AddressData, CreateAddressDto } from '../../../core/models/interfaces/address.interface';

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
  email: string;
  phone: string;
  addressId?: string;
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
 * - Guardado de dirección seleccionada en CheckoutState del OrderService
 * - Validación dinámica según tipo de entrega (pickup/delivery)
 * - Prellenado automático con datos del usuario autenticado
 * - Resumen del carrito en tiempo real
 * - Cálculos de totales con IVA
 */
@Component({
  selector: 'app-form-personal-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CartSummary],
  templateUrl: './form-personal-data.html',
  styleUrl: './form-personal-data.scss'
})
export class FormPersonalData {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly addressService = inject(AddressService);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);

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
  readonly saveNewAddress = signal(false);
  readonly isSavingAddress = signal(false);

  // ========== COMPUTED - DELIVERY OPTIONS ==========
  readonly isDelivery = computed(() => this.deliveryOption() === 'delivery');
  readonly isPickup = computed(() => this.deliveryOption() === 'pickup');

  readonly deliveryOptionText = computed(() =>
    this.isDelivery() ? 'Envío a domicilio' : 'Retiro en tienda'
  );

  readonly deliveryBadgeText = computed(() =>
    this.isDelivery() ? '🚚 ' : '🏪 '
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

  readonly showSaveAddressOption = computed(() => {
    return this.isDelivery() &&
           this.isAuthenticated() &&
           !this.selectedAddressId();
  });

  readonly isManualAddressComplete = computed(() => {
    const form = this.orderForm;
    return !!(
      form.get('address')?.value &&
      form.get('city')?.value &&
      form.get('province')?.value &&
      form.get('postalCode')?.value
    );
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

  readonly selectedDeliveryOption = computed<'pickup' | 'delivery'>(() => {
    return this.deliveryOption();
  });

  // ========== COMPUTED - VALIDATION ==========
  readonly validationMessage = computed(() => {
    if (this.formValid()) return 'Información completa';

    return this.isDelivery()
      ? 'Completa nombre, email, teléfono, dirección y ciudad'
      : 'Completa nombre, email y teléfono';
  });

  // ========== FORM ==========
  readonly orderForm: FormGroup = this.createForm();

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: [this.authService.currentUser()?.name || '', [Validators.required, Validators.minLength(2)]],
      email: [this.authService.currentUser()?.email || '', [Validators.required, Validators.email]],
      // ✅ Patrón actualizado para aceptar: +, espacios, guiones, paréntesis y dígitos
      phone: ['', [
        Validators.required,
        Validators.pattern(/^(\+\d{1,3})?[\s\-()]*\d{6,15}[\s\-()]*\d*$/),
        Validators.minLength(8)
      ]],
      province: [''],
      address: [''],
      city: [''],
      postalCode: ['', [Validators.pattern(/^\d+$/)]],
      deliveryInstructions: ['']
    });
  }

  // ========== CONSTRUCTOR ==========
  constructor() {
    // Effect: Cargar addressId desde CheckoutState al iniciar
    effect(() => {
      const checkoutState = this.orderService.checkoutState();
      if (checkoutState?.selectedAddressId && this.isDelivery()) {
        this.selectedAddressId.set(checkoutState.selectedAddressId);
      }
    });

    // Effect: Cargar direcciones cuando es delivery y usuario autenticado
    effect(() => {
      if (this.isDelivery() && this.isAuthenticated()) {
        this.addressService.getAddresses()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              console.log('✅ [FormPersonalData] Direcciones cargadas exitosamente:', {
                total: response.meta.total,
                addresses: response.data
              });
            },
            error: (error) => {
              console.error('❌ [FormPersonalData] Error cargando direcciones:', error);
            }
          });
      }
    });

    // Effect: Prellenar formulario con dirección seleccionada
    effect(() => {
      const selectedAddr = this.selectedAddress();
      if (selectedAddr) {
        setTimeout(() => {
          this.orderForm.patchValue({
            phone: selectedAddr.phone || '',
            province: selectedAddr.province || '',
            address: selectedAddr.streetAddress || '',
            city: selectedAddr.city || '',
            postalCode: selectedAddr.postalCode || '',
            deliveryInstructions: selectedAddr.deliveryInstructions || ''
          }, { emitEvent: false });

          // Actualizar validez de cada control
          const phoneControl = this.orderForm.get('phone');
          if (phoneControl) {
            phoneControl.markAsTouched();
            phoneControl.updateValueAndValidity({ emitEvent: false });
          }

          // Actualizar todos los controles de dirección
          ['address', 'city', 'province', 'postalCode'].forEach(controlName => {
            const control = this.orderForm.get(controlName);
            if (control) {
              control.markAsTouched();
              control.updateValueAndValidity({ emitEvent: false });
            }
          });

          this.checkFormValidity();
        }, 0);
      } else {
        if (this.isDelivery()) {
          this.clearAddressFields();
        }
      }
    });

    // Effect: Actualizar validadores según tipo de entrega
    effect(() => {
      const deliveryOption = this.deliveryOption();
      this.updateFormValidators(deliveryOption);

      if (deliveryOption === 'pickup') {
        this.clearAddressFields();
        this.selectedAddressId.set(null);
        this.saveNewAddress.set(false);
      }
    });

    // Effect: Cargar datos iniciales
    effect(() => {
      const data = this.initialData();
      if (data && Object.keys(data).length > 0) {
        this.orderForm.patchValue(data, { emitEvent: false });

        if (data.addressId) {
          this.selectedAddressId.set(data.addressId);
        }
      }
    });

    // Subscribe: Cambios del formulario con cleanup automático
    this.orderForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.checkFormValidity();
        this.emitFormData();
      });

    this.orderForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.checkFormValidity();
      });

    // Effect: DEBUG - Monitorear cambios en direcciones
    effect(() => {
      const addresses = this.savedAddresses();
      const isLoading = this.isLoadingAddresses();
      const shouldShow = !isLoading && addresses.length > 0;
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
      this.selectedAddressId.set(null);
      this.clearAddressFields();
      this.saveNewAddress.set(false);

      if (this.isDelivery()) {
        this.orderService.updateCheckoutAddress('');
      }
    } else {
      this.selectedAddressId.set(addressId);
      this.saveNewAddress.set(false);

      if (this.isDelivery()) {
        this.orderService.updateCheckoutAddress(addressId);
      }
    }

    this.checkFormValidity();
  }

  onSaveAddressChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.saveNewAddress.set(checkbox.checked);
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
    const validators = {
      delivery: {
        address: [Validators.required, Validators.minLength(5)],
        province: [Validators.required, Validators.minLength(2)],
        city: [Validators.required, Validators.minLength(2)],
        postalCode: [Validators.required, Validators.minLength(4)]
      },
      pickup: {
        address: [],
        province: [],
        city: [],
        postalCode: []
      }
    };

    const controlValidators = validators[deliveryOption];

    ['address', 'province', 'city', 'postalCode'].forEach(controlName => {
      const control = this.orderForm.get(controlName);
      control?.setValidators(controlValidators[controlName as keyof typeof controlValidators] || []);
      control?.updateValueAndValidity({ emitEvent: false });
    });
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
    const emailValid = form.get('email')?.valid ?? false;
    const phoneValid = form.get('phone')?.valid ?? false;

    let isValid = firstNameValid && emailValid && phoneValid;

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
      const selectedAddr = this.selectedAddress();

      const data: FormData = {
        firstName: formValue.firstName || '',
        email: formValue.email || '',
        phone: formValue.phone || '',
        deliveryInstructions: formValue.deliveryInstructions || undefined
      };

      if (this.isDelivery()) {
        if (selectedAddr) {
          // ✅ Si hay dirección seleccionada, emitir addressId Y los datos de dirección del formulario
          data.addressId = selectedAddr.id;
          data.address = formValue.address || selectedAddr.streetAddress || undefined;
          data.city = formValue.city || selectedAddr.city || undefined;
          data.province = formValue.province || selectedAddr.province || undefined;
          data.postalCode = formValue.postalCode || selectedAddr.postalCode || undefined;

        } else {
          // Si NO hay dirección seleccionada, emitir campos manuales
          data.address = formValue.address || undefined;
          data.city = formValue.city || undefined;
          data.province = formValue.province || undefined;
          data.postalCode = formValue.postalCode || undefined;
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

    if (this.saveNewAddress() && this.isManualAddressComplete() && !this.selectedAddressId()) {
      this.saveAddressAndContinue();
    } else {
      this.emitFormData();
      this.continue.emit();
    }
  }

  private saveAddressAndContinue(): void {
    const formValue = this.orderForm.value;
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      console.error('No hay usuario autenticado');
      this.emitFormData();
      this.continue.emit();
      return;
    }

    this.isSavingAddress.set(true);

    const createAddressDto: CreateAddressDto = {
      recipientName: `${formValue.firstName}`.trim(),
      phone: formValue.phone || '',
      province: formValue.province || '',
      city: formValue.city || '',
      postalCode: formValue.postalCode || '',
      streetAddress: formValue.address || '',
      deliveryInstructions: formValue.deliveryInstructions || undefined,
      isDefault: !this.hasAddresses()
    };

    this.addressService.createAddress(createAddressDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const newAddressId = response.data.id;
          this.selectedAddressId.set(newAddressId);

          if (this.isDelivery()) {
            this.orderService.updateCheckoutAddress(newAddressId);
          }
          this.emitFormData();
          this.continue.emit();
        },
        error: (error) => {
          const continueAnyway = confirm(
            'No se pudo guardar la dirección. ¿Deseas continuar de todos modos?'
          );
          if (continueAnyway) {
            this.continue.emit();
          }
        },
        complete: () => {
          this.isSavingAddress.set(false);
        }
      });
  }

  // ========== MÉTODOS PÚBLICOS - API ==========
  reset(): void {
    this.orderForm.reset();
    this.formValid.set(false);
    this.selectedAddressId.set(null);
    this.saveNewAddress.set(false);
    this.isSavingAddress.set(false);
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
