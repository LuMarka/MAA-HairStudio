import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShippingService } from '../../../core/services/shipping.service';
import type { ShippingOption, SelectedShippingOption } from '../../../core/models/interfaces/shipping.interface';

/**
 * Componente para mostrar y seleccionar opciones de envío
 *
 * @responsibility
 * - Mostrar opciones de envío disponibles con detalles completos
 * - Permitir selección de opción con validación
 * - Manejar selección de puntos de retiro si aplica
 * - Emitir opción seleccionada al componente padre
 *
 * @features
 * - Vista de tarjetas con información detallada de cada opción
 * - Badges de "Más económico" y "Más rápido"
 * - Soporte para puntos de retiro (pickup)
 * - Preselección de opción más económica
 * - Validación de selección completa (incluyendo punto de retiro)
 *
 * @example
 * ```typescript
 * // En el componente padre
 * shippingOptions = input<ShippingOption[]>([]);
 * onShippingSelected = output<SelectedShippingOption>();
 *
 * <app-shipping-options
 *   [shippingOptions]="shippingOptions()"
 *   (onShippingSelected)="handleShippingSelect($event)" />
 * ```
 */
@Component({
  selector: 'app-shipping-options',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './shipping-options.html',
  styleUrl: './shipping-options.scss',
})
export class ShippingOptionsComponent {
  private readonly shippingService = inject(ShippingService);

  // ========== INPUTS ==========

  /**
   * Opciones de envío disponibles para mostrar
   */
  readonly shippingOptions = input<ShippingOption[]>([]);

  // ========== OUTPUTS ==========

  /**
   * Emite cuando el usuario selecciona una opción de envío
   */
  readonly onShippingSelected = output<SelectedShippingOption>();

  // ========== SIGNALS ==========

  /**
   * Índice de la opción actualmente seleccionada
   */
  readonly selectedIndex = signal<number | null>(null);

  /**
   * ID del punto de retiro seleccionado (para pickup_point)
   */
  readonly selectedPickupPointId = signal<number | null>(null);

  /**
   * Índice de la opción más económica
   */
  readonly cheapestIndex = computed(() => {
    const options = this.shippingOptions();
    if (!options || options.length === 0) return null;

    let minPrice = Infinity;
    let minIndex = 0;

    options.forEach((opt, idx) => {
      if (opt.price < minPrice) {
        minPrice = opt.price;
        minIndex = idx;
      }
    });

    return minIndex;
  });

  /**
   * Índice de la opción más rápida
   */
  readonly fastestIndex = computed(() => {
    const options = this.shippingOptions();
    if (!options || options.length === 0) return null;

    let minDays = Infinity;
    let minIndex = 0;

    options.forEach((opt, idx) => {
      if (opt.estimatedDays < minDays) {
        minDays = opt.estimatedDays;
        minIndex = idx;
      }
    });

    return minIndex;
  });

  /**
   * Opción actualmente seleccionada
   */
  readonly selectedOption = computed(() => {
    const idx = this.selectedIndex();
    if (idx === null) return null;
    return this.shippingOptions()[idx] || null;
  });

  /**
   * Punto de retiro seleccionado (si aplica)
   */
  readonly selectedPickupPoint = computed(() => {
    const option = this.selectedOption();
    if (!option || option.serviceType !== 'pickup_point')
      return null;

    const pointId = this.selectedPickupPointId();
    return (
      option.pickupPoints.find((p) => p.pointId === pointId) || null
    );
  });

  /**
   * Indica si la selección es válida (completa)
   */
  readonly isSelectionValid = computed(() => {
    const option = this.selectedOption();
    if (!option) return false;

    // Para pickup_point, debe haber un punto seleccionado
    if (option.serviceType === 'pickup_point') {
      return this.selectedPickupPointId() !== null;
    }

    // Para otros tipos, solo necesita opción seleccionada
    return true;
  });

  // ========== EFFECTS ==========

  constructor() {
    // Auto-seleccionar la opción más económica al cargar
    effect(() => {
      const idx = this.cheapestIndex();
      if (idx !== null && this.selectedIndex() === null) {
        this.selectedIndex.set(idx);
        console.log('✅ Opción más económica preseleccionada:', idx);
      }
    });
  }

  // ========== PUBLIC METHODS ==========

  /**
   * Selecciona una opción de envío
   *
   * @param index - Índice de la opción a seleccionar
   * @example
   * ```typescript
   * selectOption(0); // Selecciona la primera opción
   * ```
   */
  selectOption(index: number): void {
    this.selectedIndex.set(index);
    // Limpiar punto de retiro seleccionado al cambiar de opción
    this.selectedPickupPointId.set(null);
    console.log('📦 Opción de envío seleccionada:', index);
  }

  /**
   * Selecciona un punto de retiro
   *
   * @param pointId - ID del punto de retiro
   * @example
   * ```typescript
   * selectPickupPoint(5423);
   * ```
   */
  selectPickupPoint(pointId: number): void {
    this.selectedPickupPointId.set(pointId);
    console.log('📍 Punto de retiro seleccionado:', pointId);
  }

  /**
   * Confirma la selección y emite la opción al componente padre
   *
   * @example
   * ```typescript
   * confirmSelection(); // Emite la opción seleccionada
   * ```
   */
  confirmSelection(): void {
    if (!this.isSelectionValid()) {
      console.warn('⚠️ Selección incompleta');
      return;
    }

    const option = this.selectedOption();
    if (!option) return;

    const selectedData: SelectedShippingOption = {
      carrierId: option.carrierId,
      serviceType: option.serviceType,
      logisticType: option.logisticType,
      price: option.price,
      carrier: option.carrier,
      estimatedDelivery: option.estimatedDelivery,
    };

    // Agregar ID de punto de retiro si aplica
    if (option.serviceType === 'pickup_point') {
      selectedData.pointId = this.selectedPickupPointId() || undefined;
    }

    this.onShippingSelected.emit(selectedData);
    this.shippingService.selectShippingOption(selectedData);

    console.log('✅ Opción de envío confirmada:', selectedData);
  }

  /**
   * Limpia la selección
   */
  clearSelection(): void {
    this.selectedIndex.set(null);
    this.selectedPickupPointId.set(null);
    this.shippingService.clearSelectedOption();
    console.log('🧹 Selección limpiada');
  }

  /**
   * Formatea el precio para mostrar con dos decimales
   *
   * @param price - Precio a formatear
   * @returns Precio formateado como string
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price);
  }

  /**
   * Obtiene el texto de días estimados
   *
   * @param days - Días estimados
   * @returns Texto descriptivo
   */
  getEstimatedDaysText(days: number): string {
    if (days === 1) return 'Entrega mañana';
    if (days <= 3) return `${days} días`;
    return `${days} días hábiles`;
  }

  /**
   * Verifica si una opción tiene una etiqueta específica
   *
   * @param option - Opción a verificar
   * @param tag - Etiqueta a buscar
   * @returns true si tiene la etiqueta
   */
  hasTag(option: ShippingOption, tag: string): boolean {
    return option.tags.includes(tag);
  }

  /**
   * Genera descripción breve del servicio
   *
   * @param serviceType - Tipo de servicio
   * @returns Descripción
   */
  getServiceDescription(serviceType: string): string {
    const descriptions: Record<string, string> = {
      standard_delivery: 'Entrega a domicilio',
      express_delivery: 'Entrega express',
      pickup_point: 'Retiro en punto',
      same_day: 'Mismo día',
    };
    return descriptions[serviceType] || serviceType;
  }
}
