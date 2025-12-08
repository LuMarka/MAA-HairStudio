import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { UserProfile, UpdateUserDto } from '../../../core/models/interfaces/users.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-template',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-template.html',
  styleUrl: './profile-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'profile-template-host' }
})
export class ProfileTemplate {
 /*  user = {
    name: 'Nombre Apellido',
    email: 'usuario@email.com',
    phone: '1234567890',
    address: 'Calle Falsa 123, Villa María, Córdoba, Argentina',
  };
  isEditing = false;

  toggleEdit() {
    this.isEditing = !this.isEditing;
  } */
 private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

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
    this.loadProfile();
  }
  private readonly router = inject(Router);

  loadProfile() {
    this.usersService.getMyProfile().subscribe({
      next: (profile) => {
        this.userProfile.set(profile);
        this.form().patchValue({
          name: profile.user.name ?? '',
          email: profile.user.email ?? '',
          phone: profile.user.phone ?? '',
          address: profile.user.address ?? '',
          address2: profile.user.address2 ?? ''
        });
      }
    });
  }

  verPedidos() {
    this.router.navigate(['/profile/orders']);
  }
  toggleEdit() {
    this.isEditing.update(editing => !editing);
    if (this.isEditing()) {
      const user = this.userProfile()?.user;
      if (user) {
        this.form().patchValue({
          name: user.name ?? '',
          email: user.email ?? '',
          phone: user.phone ?? '',
          address: user.address ?? '',
          address2: user.address2 ?? ''
        });
      }
    }
  }

  saveChanges() {
    if (!this.form().valid || !this.userProfile()) return;
    const userId = this.userProfile()!.user.id;
    const dto: UpdateUserDto = this.form().value;
    this.usersService.updateUser(userId, dto).subscribe({
      next: () => {
        this.isEditing.set(false);
        this.loadProfile();
      }
    });
  }

  deleteAccount() {
    this.usersService.deleteMyAccount().subscribe({
      next: () => {
        // Redirige o muestra mensaje de éxito
      }
    });
  }
}
