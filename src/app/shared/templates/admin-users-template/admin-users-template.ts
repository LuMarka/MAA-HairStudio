import { Component, computed, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersTable } from '../../organisms/users-table/users-table';
import { UsersService } from '../../../core/services/users.service';
import type { User, UsersResponse } from '../../../core/models/interfaces/users.interface';

@Component({
  selector: 'app-admin-users-template',
  standalone: true,
  imports: [CommonModule, UsersTable],
  templateUrl: './admin-users-template.html',
  styleUrl: './admin-users-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersTemplate implements OnInit {
  private readonly usersService = inject(UsersService);

  // State signals
  protected readonly isLoadingUsers = signal(false);
  protected readonly users = signal<User[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly selectedUser = signal<User | null>(null);
  protected readonly showUserModal = signal(false);
  protected readonly editingUser = signal<User | null>(null);

  // Computed
  protected readonly hasUsers = computed(() => this.users().length > 0);
  protected readonly pageInfo = computed(() => {
    const page = this.currentPage();
    const total = this.totalPages();
    return `Página ${page} de ${total}`;
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoadingUsers.set(true);

    try {
      this.usersService.getAllUsers(this.currentPage(), 10).subscribe({
        next: (response: any) => {
          console.log('Response:', response);
          // La respuesta es directamente UsersResponse sin wrapper success
          if (response && response.data && Array.isArray(response.data)) {
            this.users.set(response.data);
            this.totalPages.set(response.totalPages || 1);
          }
        },
        error: (error: any) => {
          console.error('Error loading users:', error);
          this.users.set([]);
        },
        complete: () => {
          this.isLoadingUsers.set(false);
        }
      });
    } catch (error) {
      console.error('Error loading users:', error);
      this.isLoadingUsers.set(false);
    }
  }

  protected onUserSelected(user: User): void {
    this.selectedUser.set(user);
  }

  protected onUserEdit(user: User): void {
    this.editingUser.set(user);
    this.showUserModal.set(true);
  }

  protected onUserDelete(user: User): void {
    if (confirm(`¿Está seguro de que desea eliminar el usuario ${user.name}?`)) {
      try {
        this.usersService.deleteUser(user.id).subscribe({
          next: () => {
            this.loadUsers();
          },
          error: (error: any) => {
            console.error('Error deleting user:', error);
          }
        });
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  }

  protected onUserRoleChange(data: { user: User; newRole: string }): void {
    try {
      this.usersService.updateUserRole(data.user.id, { role: data.newRole as any }).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error: any) => {
          console.error('Error updating role:', error);
        }
      });
    } catch (error) {
      console.error('Error updating role:', error);
    }
  }

  protected onCloseModal(): void {
    this.showUserModal.set(false);
    this.editingUser.set(null);
  }

  protected onSaveUser(): void {
    const user = this.editingUser();
    if (!user) return;

    try {
      this.usersService.updateUser(user.id, {
        name: user.name,
        email: user.email,
        phone: user.phone,
/*         address: user.address,
        address2: user.address2 */
      }).subscribe({
        next: () => {
          this.loadUsers();
          this.onCloseModal();
        },
        error: (error: any) => {
          console.error('Error updating user:', error);
        }
      });
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  protected onPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadUsers();
    }
  }

  protected onNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadUsers();
    }
  }
}
