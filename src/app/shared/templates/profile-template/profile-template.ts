import { Component, ChangeDetectionStrategy, signal, computed, inject, effect, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { UserProfile, UpdateUserDto } from '../../../core/models/interfaces/users.interface';
import { AddressService } from '../../../core/services/address.service';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Datum as AddressData } from '../../../core/models/interfaces/address.interface';

@Component({
  selector: 'app-profile-template',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-template.html',
  styleUrl: './profile-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'profile-template-host' }
})
export class ProfileTemplate {
  private readonly usersService = inject(UsersService);
  private readonly addressService = inject(AddressService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isEditing = signal(false);
  readonly isLoadingProfile = computed(() => this.usersService.isLoading());
  readonly isLoadingAddress = computed(() => this.addressService.isLoading());
  readonly isLoading = computed(() => this.isLoadingProfile() || this.isLoadingAddress());
  readonly errorMessage = computed(() => this.usersService.errorMessage() || this.addressService.errorMessage());
  readonly userProfile = signal<UserProfile | null>(null);
  readonly addresses = computed(() => this.addressService.addresses());
  readonly selectedAddress = signal<AddressData | null>(null);

  readonly form = signal<FormGroup>(
    this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      address2: [''],
      addressSelect: ['']
    })
  );

  constructor() {
    effect(() => {
      this.loadProfile();
    });

    // Cargar direcciones al inicializar
    this.loadAddresses();
  }

  private loadProfile(): void {
    this.usersService.getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.userProfile.set(profile);
          this.form().patchValue({
            name: profile.user.name ?? '',
            email: profile.user.email ?? '',
            phone: profile.user.phone ?? '',
            address: profile.user.address ?? '',
            address2: profile.user.address2 ?? ''
          });
          this.form().disable();
        },
        error: (error) => {
          console.error('❌ Error cargando perfil:', error);
        }
      });
  }

  private loadAddresses(): void {
    this.addressService.getAddresses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {},
        error: (error) => {
          console.error('❌ Error cargando direcciones:', error);
        }
      });
  }

  onAddressSelected(addressId: string): void {
    if (!addressId) {
      this.selectedAddress.set(null);
      this.form().patchValue({
        phone: '',
        address: '',
        address2: ''
      });
      // Deshabilitar inputs de dirección
      this.form().get('phone')?.disable();
      this.form().get('address')?.disable();
      return;
    }

    const selected = this.addresses().find(addr => addr.id === addressId);

    if (selected) {
      this.selectedAddress.set(selected);
      this.form().patchValue({
        phone: selected.phone ?? '',
        address: selected.streetAddress ?? '',
        address2: selected.addressLine2 ?? ''
      });

      // Habilitar inputs de dirección si estamos en modo edición
      if (this.isEditing()) {
        this.form().get('phone')?.enable();
        this.form().get('address')?.enable();
      }
    }
  }

  toggleEdit(): void {
    const editing = !this.isEditing();
    this.isEditing.set(editing);

    if (editing) {
      // Habilitar nombre, email y select de dirección
      this.form().get('name')?.enable();
      this.form().get('email')?.enable();
      this.form().get('addressSelect')?.enable();

      // Si hay dirección seleccionada, habilitar phone y address
      if (this.selectedAddress()) {
        this.form().get('phone')?.enable();
        this.form().get('address')?.enable();
      } else {
        this.form().get('phone')?.disable();
        this.form().get('address')?.disable();
      }

      this.form().get('address2')?.disable();
    } else {
      // Deshabilitar todo al cancelar
      this.form().disable();
      this.selectedAddress.set(null);
      this.form().get('addressSelect')?.setValue('');
    }
  }

  saveChanges(): void {
    const nameControl = this.form().get('name');
    const emailControl = this.form().get('email');

    if (!nameControl?.valid || !emailControl?.valid || !this.userProfile()) return;

    const userId = this.userProfile()!.user.id;

    // Guardar cambios de nombre y email en users
    const userDto: UpdateUserDto = {
      name: nameControl.value,
      email: emailControl.value
    };

    this.usersService.updateUser(userId, userDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Si hay dirección seleccionada, guardar cambios de dirección
          if (this.selectedAddress()) {
            this.saveAddressChanges();
          } else {
            this.isEditing.set(false);
            this.loadProfile();
          }
        },
        error: (error) => {
          console.error('❌ Error al actualizar perfil:', error);
        }
      });
  }

  private saveAddressChanges(): void {
    const selected = this.selectedAddress();
    if (!selected) return;

    const phoneControl = this.form().get('phone');
    const addressControl = this.form().get('address');

    const addressUpdateDto = {
      phone: phoneControl?.value ?? '',
      streetAddress: addressControl?.value ?? ''
    };

    this.addressService.updateAddress(selected.id, addressUpdateDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log('✅ Dirección actualizada exitosamente');
          this.isEditing.set(false);
          this.selectedAddress.set(null);
          this.form().get('addressSelect')?.setValue('');
          this.loadProfile();
          this.loadAddresses();
          this.finalizeSave();
        },
        error: (error) => {
          console.error('❌ Error al actualizar dirección:', error);
        }
      });
  }

  private finalizeSave(): void {
    console.log('✅ Cambios guardados, recargando página...');
    // Recargar la página después de 1 segundo para mostrar los cambios
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  deleteAccount(): void {
    if (!confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      return;
    }

    this.usersService.deleteMyAccount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        }
      });
  }

  verPedidos(): void {
    this.router.navigate(['order-me']);
  }
}
