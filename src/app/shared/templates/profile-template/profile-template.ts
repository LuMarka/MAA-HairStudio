import { Component, ChangeDetectionStrategy, signal, computed, inject, effect, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { UserProfile, UpdateUserDto } from '../../../core/models/interfaces/users.interface';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isEditing = signal(false);
  readonly isLoading = computed(() => this.usersService.isLoading());
  readonly errorMessage = computed(() => this.usersService.errorMessage());
  readonly userProfile = signal<UserProfile | null>(null);

  readonly form = signal<FormGroup>(
    this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      address2: ['']
    })
  );

  constructor() {
    effect(() => {
      this.loadProfile();
    });
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
          // Por defecto: formulario deshabilitado
          this.form().disable();
        }
      });
  }

  toggleEdit(): void {
    const editing = !this.isEditing();
    this.isEditing.set(editing);

    if (editing) {
      // Habilitar solo name y email para edición
      this.form().get('name')?.enable();
      this.form().get('email')?.enable();
      // Mantener deshabilitados los otros campos
      this.form().get('phone')?.disable();
      this.form().get('address')?.disable();
      this.form().get('address2')?.disable();
    } else {
      // Deshabilitar todo al cancelar
      this.form().disable();
    }
  }

  saveChanges(): void {
    const nameControl = this.form().get('name');
    const emailControl = this.form().get('email');

    if (!nameControl?.valid || !emailControl?.valid || !this.userProfile()) return;

    const userId = this.userProfile()!.user.id;
    const dto: UpdateUserDto = {
      name: nameControl.value,
      email: emailControl.value
    };

    this.usersService.updateUser(userId, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isEditing.set(false);
          this.loadProfile();
        }
      });
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
    this.router.navigate(['/profile/orders']);
  }
}
